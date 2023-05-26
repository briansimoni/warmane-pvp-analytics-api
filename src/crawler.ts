import Koa from "koa";
import {
  SqsContext,
  sqsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import bodyParser from "koa-bodyparser";
import { GetCharacterRequestParams } from "./api/validators";
import { matchDetailsStore } from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";

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
  logger.info(ctx);
  logger.info(ctx.headers);
  logger.info(ctx.body);
  // TODO: change this to Promise.all and map
  ctx.sqs.event.Records.forEach(async (record) => {
    logger.info("this is the event!", record.body); // delete this line
    // TODO: use JOI to validate incoming parameters

    // TODO: use the output from JOI as input to this:
    await handleCrawlerRequests(JSON.parse(record.body));
  });
});

export async function handleCrawlerRequests(
  requests: GetCharacterRequestParams[]
) {
  const handleRequest = async function (req: GetCharacterRequestParams) {
    const crawler = new WarmaneCrawler();
    const matchDetails = await crawler.fetchAllMatchDetails({
      character: req.name,
      realm: req.realm,
    });
    const databaseWrites = matchDetails.map((match) =>
      matchDetailsStore.upsert(match)
    );
    await Promise.all(databaseWrites);
  };

  await Promise.all(requests.map(handleRequest));
}
export { crawler };
