import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import { WarmaneCrawler } from "./lib/crawler/crawler";

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

router.get("/character", async (ctx) => {
  const { character, realm } = ctx.query;
  if (!realm || !character) {
    throw new Error("missing params");
  }
  const crawler = new WarmaneCrawler();
  const ids = await crawler.getMatchIds({
    character: character as string,
    realm: realm as string,
  });
  ctx.body = ids;
});
