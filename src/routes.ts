import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import { WarmaneCrawler } from "./lib/crawler/crawler";
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
  const params = schema.validate(ctx.query);
  if (params.error) {
    throw createError(400, params.error);
  }
  const { character, realm } = params.value;

  const crawler = new WarmaneCrawler();
  const ids = await crawler.getMatchIds({
    character,
    realm: "Blackrock",
  });
  ctx.body = {
    ids,
    character,
    realm,
  };
});
