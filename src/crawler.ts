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
import createError from "http-errors";
import { CharacterId, CrawlerInput, MatchDetails, Realm } from "./lib/types";
import { isLessThan30DaysAgo } from "./lib/util/util";
import { requestCrawl } from "./lib/sqs/sqs_producer";
import { checkCharacterExists } from "./lib/warmane_client/client";

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

/**
 * This is where we want to actually invoke the crawler. This code
 * will run in response to receiving a message on the SQS queue.
 * In other words the API has requested that the crawler be invoked.
 */
crawler.use(async (ctx) => {
  const validatedRequests = ctx.sqs.event.Records.map((r) => {
    const validationResult = crawlerInputSchema.validate(JSON.parse(r.body));
    if (validationResult.error) {
      logger.error(
        `crawler received a bad request ${validationResult.error.message}`
      );
      throw createError.BadRequest(validationResult.error.message);
    }
    return validationResult.value;
  });
  await handleCrawlerRequests(validatedRequests);
  ctx.status = 200;
});

export async function handleCrawlerRequests(requests: CrawlerInput[]) {
  const handleRequest = async function (req: CrawlerInput) {
    const { name, realm, root } = req;
    const characterId: CharacterId = `${name}@${realm}`;

    const exists = await checkCharacterExists({ name, realm });
    if (!exists) {
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
      isLessThan30DaysAgo(new Date(beginningCrawlerState.crawler_last_started))
    ) {
      logger.info(
        `crawler already started for ${req.name} on ${req.realm}. Skipping`
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
        `crawling completed for ${req.name} on ${req.realm}. ${matchDetails.length} games found`
      );
      await matchDetailsStore.batchWrite(matchDetails);
      logger.info(
        `crawler results saved successfully for ${req.name} on ${req.realm}`
      );

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
  const characters = matchDetails.reduce<CharacterId[]>((acc, current) => {
    const chars = current.character_details.map(
      (c) => `${c.charname}@${c.realm}` as CharacterId
    );
    acc = acc.concat(chars);
    return acc;
  }, []);

  const uniqueCharacters = [...new Set(characters)];

  const requests: CrawlerInput[] = uniqueCharacters.map((c) => {
    const split = c.split("@");
    const name = split[0];
    const realm = split[1] as Realm;
    return {
      name,
      realm,
      root: false,
    };
  });

  await Promise.all(requests.map((r) => requestCrawl(r)));
}
export { crawler };
