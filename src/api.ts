import Koa from "koa";
import koaBunyanLogger from "koa-bunyan-logger";
import { logger } from "./lib/util/logger";
import {
  ApiGatewayContext,
  apiGatewayMiddleware,
  corsMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import { router } from "./routes";

const api = new Koa<Koa.DefaultState, ApiGatewayContext>();

api.use(errorHandlingMiddleware);
api.use(corsMiddleware);
api.use(koaBunyanLogger(logger));
api.use(koaBunyanLogger.requestIdContext());
api.use(koaBunyanLogger.requestLogger());
api.use(apiGatewayMiddleware({}));
api.use(router.routes());
api.use(router.allowedMethods());

export { api };
