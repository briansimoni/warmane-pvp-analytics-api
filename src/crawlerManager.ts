import Koa from "koa";
import {
  SqsContext,
  sqsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import bodyParser from "koa-bodyparser";
import { crawlerInputSchema } from "./api/validators";
import {
  CrawlerState,
  characterMetaStore,
  crawlerStateStore,
  matchDetailsStore,
} from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import { CharacterId, CrawlerInput, MatchDetails, Realm } from "./lib/types";
import { isLessThan180DaysAgo } from "./lib/util/util";
import { requestCrawl } from "./lib/sqs/sqs_producer";
import { checkCharacterExists } from "./lib/warmane_client/client";

/**
 * this Set acts as a cache for characters that have already been
 * crawled for as part of massCrawl(). It sometimes saves us from having to make
 * an extra read to Dynamo to see if it's already there.
 */
const alreadyCrawled = new Set<CharacterId>();

/**
 * This is the Koa object used by the crawler lambda
 * Since it's responding to SQS Lambda events instead
 * of API Gateway, the middleware requirements are
 * somewhat different
 */
const crawler = new Koa<Koa.DefaultState, SqsContext>();
crawler.use(errorHandlingMiddleware);
crawler.use(koaBunyanLogger(logger));
crawler.use(koaBunyanLogger.requestIdContext());
crawler.use(bodyParser());
crawler.use(sqsMiddleware());

crawler.use(async (_, next) => {
  if (alreadyCrawled.size === 0) {
    logger.info("no characters in cache");
  }
  await next();
});

/**
 * This is where we want to actually invoke the crawler. This code
 * will run in response to receiving a message on the SQS queue.
 * In other words the API has requested that the crawler be invoked.
 */
crawler.use(async (ctx) => {
  const validatedRequests: CrawlerInput[] = [];
  for (const record of ctx.sqs.event.Records) {
    const validationResult = crawlerInputSchema.validate(
      JSON.parse(record.body)
    );
    if (validationResult.error) {
      logger.error(
        `crawler received a bad request ${validationResult.error.message}. continuing anyways`,
        record.body
      );
      continue;
    }
    validatedRequests.push(validationResult.value);
  }

  await handleCrawlerRequests(validatedRequests);
  ctx.status = 200;
});

export async function handleCrawlerRequests(requests: CrawlerInput[]) {
  const handleRequest = async function (req: CrawlerInput) {
    const { name, realm, root } = req;
    const characterId: CharacterId = `${name}@${realm}`;

    if (!root && alreadyCrawled.has(characterId)) {
      logger.info(`${characterId} found in cache. Skipping`);
      return;
    }

    const exists = await checkCharacterExists({ name, realm });
    if (!exists) {
      logger.debug(`${name}@${realm} does not exist`);
      return;
    }

    const beginningCrawlerState = await crawlerStateStore.get({
      id: characterId,
    });

    if (
      !root &&
      (beginningCrawlerState?.state === "running" ||
        beginningCrawlerState?.state === "pending")
    ) {
      logger.debug("crawler already running or pending");
      return;
    }

    // This is an important base case. If this condition doesn't work
    // I might put the crawler into an infinite loop.
    if (
      !root &&
      beginningCrawlerState?.crawler_last_started &&
      isLessThan180DaysAgo(new Date(beginningCrawlerState.crawler_last_started))
    ) {
      alreadyCrawled.add(characterId);
      logger.info(
        `crawler ran for ${req.name}@${req.realm} less than 30 days ago. Skipping`
      );
      return;
    }

    try {
      const crawler = new WarmaneCrawler({});

      await crawlerStateStore.upsertMerge({
        id: characterId,
        state: "running",
        crawler_last_started: new Date().toISOString(),
      });
      logger.info(`crawling started for ${req.name} on ${req.realm}`);

      const matchDetails = await crawler.crawl({
        character: req.name,
        realm: req.realm,
      });

      logger.info(
        `crawling completed for ${req.name}@${req.realm}. ${matchDetails.length} games found`
      );
      await matchDetailsStore.batchWrite(matchDetails);
      logger.info(
        `crawler results saved successfully for ${req.name} on ${req.realm}`
      );

      alreadyCrawled.add(characterId);

      await Promise.all([
        crawlerStateStore.upsertMerge({
          id: characterId,
          state: "idle",
          crawler_last_finished: new Date().toISOString(),
        }),

        characterMetaStore.upsert({
          id: characterId,
          games_played: matchDetails.length,
          name,
          realm,
        }),
      ]);

      // let it rip
      logger.info(
        `staring mass crawl based on ${matchDetails.length} games played by ${req.name}@${req.realm}`
      );
      await massCrawl(matchDetails);
    } catch (error) {
      const stateUpdate: CrawlerState = {
        id: characterId,
        state: "errored",
      };

      if (error instanceof Error) {
        stateUpdate.crawler_errors = [error.message];
      }

      await crawlerStateStore.upsertMerge(stateUpdate);
    }
  };

  await Promise.all(requests.map(handleRequest));
}

/**
 * Given a list of match details for a given user, recursively invoke the crawler
 * for all of the teammates and opponents that the given player may have played against
 */
async function massCrawl(matchDetails: MatchDetails[]) {
  // get all the characters from all the matches that someone has played
  const characters: CharacterId[] = matchDetails.reduce<CharacterId[]>(
    (acc, current) => {
      const chars = current.character_details.map(
        (c) => `${c.charname}@${c.realm}` as CharacterId
      );
      acc = acc.concat(chars);
      return acc;
    },
    []
  );

  let cacheHits = 0;
  // get all unique characters that have not been crawled yet
  const uniqueCharacters = [...new Set(characters)].filter((c) => {
    if (alreadyCrawled.has(c)) {
      cacheHits++;
      return false;
    }
    return true;
  });

  logger.info(
    `massCrawl cache hits: ${cacheHits}. Think of the money you're saving!`
  );

  let dynamoHits = 0;
  const requests: CrawlerInput[] = [];
  for (const character of uniqueCharacters) {
    const crawlerState = await crawlerStateStore.get({ id: character });
    if (
      crawlerState?.crawler_last_started &&
      isLessThan180DaysAgo(new Date(crawlerState.crawler_last_started))
    ) {
      alreadyCrawled.add(character);
      dynamoHits++;
      continue;
    }
    const split = character.split("@");
    const name = split[0];
    const realm = split[1] as Realm;
    requests.push({
      name,
      realm,
      root: false,
    });
  }

  logger.info(`Found ${dynamoHits} characters already crawled in Dynamo`);
  logger.info(`Submitting ${requests.length} crawler requests`);

  await Promise.all(
    requests.map((r) => {
      return requestCrawl(r);
    })
  );
}
export { crawler };
