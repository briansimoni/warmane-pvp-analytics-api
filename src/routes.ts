import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import Joi from "joi";
import createError from "http-errors";

interface GetCharacterRequestParams {
  character: string;
  realm: string;
}

const schema = Joi.object<GetCharacterRequestParams>({
  character: Joi.string().required(),
  realm: Joi.string().required(),
});

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

router.get("/character", async (ctx) => {
  ctx.log.info("this is an example of logging");

  const params = schema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { character, realm } = params.value;

  ctx.body = {
    character,
    realm,
    hello: "world",
  };
});
