import serverless from "aws-serverless-koa";
import { configureApp } from "./appConfig";
import { makeSqsHandlerMiddleware } from "./middleware";
import { crawlerHandler } from "./lib/crawler/handler";

import Koa from "koa";

const app = configureApp();
const appLogger = app.context.log;

const sqs = new Koa<Koa.DefaultState, Koa.DefaultContext>();
sqs.use(makeSqsHandlerMiddleware(crawlerHandler));

if (process.env.AWS_EXECUTION_ENV === undefined) {
  app.listen(3000, () => {
    appLogger.info("server listening on 3000");
  });

  sqs.listen(3001, () => {
    appLogger.info("server running on 3001");
  });
}

export const apiHandler = serverless(app);
