import { configureApp } from "./appConfig";
import { crawlerHandler } from "./lib/crawler/handler";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import { SQSEvent, Context } from "aws-lambda";

import Koa from "koa";

interface KoaLambdaContext extends Koa.Context, Context {}

function makeSqsHandlerMiddleware(
  crawlerHandler: (
    event: SQSEvent,
    context: Context,
    warmaneCrawler: WarmaneCrawler
  ) => Promise<void>
) {
  return async function (
    ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext>,
    next: Koa.Next
  ) {
    const event: SQSEvent = ctx.request.body as SQSEvent;
    const context: KoaLambdaContext = ctx as KoaLambdaContext;
    const warmaneCrawler = new WarmaneCrawler();

    await crawlerHandler(event, context, warmaneCrawler);

    ctx.status = 200;
    await next();
  };
}

const app = configureApp();

app.use(makeSqsHandlerMiddleware(crawlerHandler));

export default app;
