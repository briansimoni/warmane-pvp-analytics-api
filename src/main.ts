import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";

import Koa from "koa";
import serverless from "aws-serverless-koa";
import { ApiGatewayContext, AwsMiddleware } from "./middleware";
import { router } from "./routes";

const app = new Koa<Koa.DefaultState, ApiGatewayContext>();

app.use(AwsMiddleware({}));

app.use(router.routes());

// app.use(async (ctx, next) => {
//   console.log(ctx.apiGateway);
//   ctx.body = "hello world";
// });

export const handler = serverless(app);

async function getCharacter(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const response = await axios.get(
    `http://armory.warmane.com/api/character/Dumpster/blackrock/profile`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify(response.data),
  };
}
