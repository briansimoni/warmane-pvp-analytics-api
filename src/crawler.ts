import Koa from "koa";
import { errorHandlingMiddleware } from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";

/**
 * This is the Koa object used by the crawler lambda
 * Since it's responding to SQS Lambda events instead
 * of API Gateway, the middleware requirements are
 * somewhat different
 */
const crawler = new Koa();
crawler.use(errorHandlingMiddleware);
crawler.use(koaBunyanLogger(logger));
crawler.use(koaBunyanLogger.requestIdContext());
crawler.use(koaBunyanLogger.requestLogger());

crawler.use((ctx) => {
  logger.info(ctx);
  logger.info(ctx.headers);
  logger.info(ctx.body);
});

// crawler.use(makeSqsHandlerMiddleware(crawlerHandler));

export { crawler };
