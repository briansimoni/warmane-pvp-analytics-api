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
import { matchDetailsStore } from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import createError from "http-errors";

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
  console.log(ctx.sqs.event.Records);
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
    const crawler = new WarmaneCrawler();
    logger.info(`crawling started for ${req.name} on ${req.realm}`);
    const matchDetails = await crawler.fetchAllMatchDetails({
      character: req.name,
      realm: req.realm,
    });
    const databaseWrites = matchDetails.map((match) =>
      matchDetailsStore.upsert(match)
    );
    logger.info(`crawling completed for ${req.name} on ${req.realm}`);
    await Promise.all(databaseWrites);
    logger.info(
      `crawler results saved successfully for ${req.name} on ${req.realm}`
    );
  };

  await Promise.all(requests.map(handleRequest));
}
export { crawler };
