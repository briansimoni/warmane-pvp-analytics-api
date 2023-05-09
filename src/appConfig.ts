import Koa from "koa";
import cors, { Options } from "@koa/cors";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import {
  ApiGatewayContext,
  AwsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import { router } from "./routes";

export const allowedOrigins = ["https://warmane.dog", "http://localhost:3000"];

export function configureApp() {
  const corsOptions: Options = {
    origin: (ctx: Koa.Context) => {
      const requestOrigin = ctx.request.header.origin;
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }
      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  };

  const app = new Koa<Koa.DefaultState, ApiGatewayContext>();

  app.use(errorHandlingMiddleware);
  app.use(cors(corsOptions));
  app.use(koaBunyanLogger(logger));
  app.use(koaBunyanLogger.requestIdContext());
  app.use(koaBunyanLogger.requestLogger());
  app.use(AwsMiddleware({}));
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
