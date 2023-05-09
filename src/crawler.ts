import Koa from "koa";
import { errorHandlingMiddleware } from "./middleware";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";

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
