import Koa from "koa";
import serverless from "aws-serverless-koa";
import koaBunyanLogger from "koa-bunyan-logger";
import bunyan from "bunyan";
import {
  ApiGatewayContext,
  AwsMiddleware,
  errorHandlingMiddleware,
  makeSqsHandlerMiddleware,
} from "./middleware";
import { router } from "./routes";
import { crawlerHandler } from "./lib/crawler/handler";

const appLogger = bunyan.createLogger({
  name: "warmane-pvp-analytics-api",
  level: "debug",
  serializers: bunyan.stdSerializers,
});

export const api = new Koa<Koa.DefaultState, ApiGatewayContext>();

api.use(errorHandlingMiddleware);
api.use(koaBunyanLogger(appLogger));
api.use(koaBunyanLogger.requestIdContext());
api.use(koaBunyanLogger.requestLogger());
api.use(AwsMiddleware({}));
api.use(router.routes());

const sqs = new Koa<Koa.DefaultState, Koa.DefaultContext>();
sqs.use(makeSqsHandlerMiddleware(crawlerHandler));

if (process.env.AWS_EXECUTION_ENV === undefined) {
  api.listen(3000, () => {
    appLogger.info("server listening on 3000");
  });

  sqs.listen(3001, () => {
    appLogger.info("server running on 3001");
  });
}

export const apiHandler = serverless(api);
