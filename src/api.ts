import Koa from "koa";
import cors, { Options } from "@koa/cors";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import {
  ApiGatewayContext,
  apiGatewayMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import { router } from "./routes";

export const allowedOrigins = ["https://warmane.dog", "http://localhost:3000"];

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

const api = new Koa<Koa.DefaultState, ApiGatewayContext>();

api.use(errorHandlingMiddleware);
api.use(cors(corsOptions));
api.use(koaBunyanLogger(logger));
api.use(koaBunyanLogger.requestIdContext());
api.use(koaBunyanLogger.requestLogger());
api.use(apiGatewayMiddleware({}));
api.use(cors(corsOptions));
api.use(router.routes());
api.use(router.allowedMethods());

export { api };
