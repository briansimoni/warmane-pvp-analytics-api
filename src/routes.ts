import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import Joi from "joi";
import createError from "http-errors";
import getCharacterMetadata from "./api/getCharacterMetadata";
import { getCharacterSchema } from "./api/validators";
import { requestCrawl } from "./lib/sqs/sqs_producer";

/**
 * ApiContext can be used to type a ctx argument for a function
 * designed to operate as a router handler
 * @example async function getCharacterData(ctx: Context)
 */
export type ApiContext = Koa.ParameterizedContext<
  Koa.DefaultState,
  ApiGatewayContext &
    Router.RouterParamContext<Koa.DefaultState, ApiGatewayContext>,
  unknown
>;

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

async function crawl(ctx: ApiContext) {
  const result = await getCharacterSchema.validate(ctx.request.body);
  if (result.error) {
    throw createError(400, result.error.message);
  }
  await requestCrawl(result.value);
  ctx.body = {
    status: "pending",
  };
}

router.get("/character", getCharacterMetadata);
router.post("/crawl", crawl);
