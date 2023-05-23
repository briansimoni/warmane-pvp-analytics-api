import Koa from "koa";
import {
  SqsContext,
  sqsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import bodyParser from "koa-bodyparser";

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
crawler.use((ctx) => {
  logger.info(ctx);
  logger.info(ctx.headers);
  logger.info(ctx.body);
  ctx.sqs.event.Records.forEach((record) => {
    logger.info("this is the event!", record.body); // delete this line
    // TODO: use JOI to validate incoming parameters
  });
});

export { crawler };
