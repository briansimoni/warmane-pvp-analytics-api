import Koa from "koa";
import cors from "@koa/cors";
import serverless from "aws-serverless-koa";
import koaBunyanLogger from "koa-bunyan-logger";
import bunyan from "bunyan";
import {
  ApiGatewayContext,
  AwsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import { router } from "./routes";

const allowedOrigins = ["https://warmane.dog", "http://localhost:3000"];

const corsOptions = {
  origin: (ctx: Koa.Context) => {
    const requestOrigin = ctx.request.header.origin;
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return false;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};

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
