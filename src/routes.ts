import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import { WarmaneCrawler } from "./lib/crawler/crawler";

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

router.get("/character", async (ctx) => {
  console.log(ctx.path);
  console.log(ctx.query);
  console.log(ctx.querystring);
  const crawler = new WarmaneCrawler();
  const ids = await crawler.getMatchIds({
    character: "Dumpster",
    realm: "Blackrock",
  });
  ctx.body = ids;
});
