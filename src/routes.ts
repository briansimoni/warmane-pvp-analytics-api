import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import { WarmaneCrawler } from "./lib/crawler/crawler";

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

router.get("/character", async (ctx) => {
  // console.log(ctx);
  console.log(process.env);
  console.log("query", ctx.query);
  console.log("querystring", ctx.querystring);
  // const { character, realm } = ctx.query;
  // if (!realm || !character) {
  //   throw new Error("missing params");
  // }
  const crawler = new WarmaneCrawler();
  const ids = await crawler.getMatchIds({
    character: "Dumpster",
    realm: "Blackrock",
  });
  ctx.body = ids;
});
