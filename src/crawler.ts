import Koa from "koa";
import {
  SqsContext,
  sqsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import bodyParser from "koa-bodyparser";
import {
  GetCharacterRequestParams,
  getCharacterSchema,
} from "./api/validators";
import {
  CrawlerState,
  crawlerStateStore,
  matchDetailsStore,
} from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import createError from "http-errors";
import { CharacterId } from "./lib/types";

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
    const validationResult = getCharacterSchema.validate(JSON.parse(r.body));
    if (validationResult.error) {
      logger.error(
        `crawler recieved a bad request ${validationResult.error.message}`
      );
      throw createError.BadRequest(validationResult.error.message);
    }
    return validationResult.value;
  });
  await handleCrawlerRequests(validatedRequests);
});

export async function handleCrawlerRequests(
  requests: GetCharacterRequestParams[]
) {
  const handleRequest = async function (req: GetCharacterRequestParams) {
    const { name, realm } = req;
    const characterId: CharacterId = `${name}@${realm}`;

    try {
      const crawler = new WarmaneCrawler({});

      await crawlerStateStore.upsert({
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

      await crawlerStateStore.upsert({
        id: characterId,
        state: "idle",
        crawler_last_finished: new Date().toISOString(),
      });
    } catch (error) {
      const stateUpdate: CrawlerState = {
        id: characterId,
        state: "errored",
      };

      if (error instanceof Error) {
        stateUpdate.crawler_errors = [error.message];
      }

      await crawlerStateStore.upsert(stateUpdate);
    }
  };

  await Promise.all(requests.map(handleRequest));
}
export { crawler };
