import Koa from "koa";
import serverless from "aws-serverless-koa";
import koaBunyanLogger from "koa-bunyan-logger";
import bunyan from "bunyan";
import {
  ApiGatewayContext,
  AwsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import { router } from "./routes";
import { Context, SQSEvent } from "aws-lambda";

const appLogger = bunyan.createLogger({
  name: "warmane-pvp-analytics-api",
  level: "debug",
  serializers: bunyan.stdSerializers,
});

const app = new Koa<Koa.DefaultState, ApiGatewayContext>();

app.use(errorHandlingMiddleware);
app.use(koaBunyanLogger(appLogger));
app.use(koaBunyanLogger.requestIdContext());
app.use(koaBunyanLogger.requestLogger());
app.use(AwsMiddleware({}));
app.use(router.routes());

if (process.env.AWS_EXECUTION_ENV === undefined) {
  app.listen(3000, () => {
    appLogger.info("server listening on 3000");
  });
}

export const handler = serverless(app);

export function sqsHandler(event: SQSEvent, context: Context) {
  console.log("sqsHandler");
  console.log(event);
  console.log(context);
}
