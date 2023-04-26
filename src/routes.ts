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
  ctx.log.info("this is an example of logging");

  const params = schema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { character, realm } = params.value;

  try {
    const warmaneCrawler = new WarmaneCrawler();

    //* fetching all match details
    const matchDetailsList = await warmaneCrawler.fetchAllMatchDetails({
      character,
      realm,
    });

    ctx.body = matchDetailsList;
    ctx.status = 200;
  } catch (error) {
    ctx.log.error("An error occurred while fetching data: ", error);

    throw createError.InternalServerError(
      "An error occurred while fetching data"
    );
  }
});

/*
router.get('/character', async (ctx, next) => {
  const character = ctx.query.character;
  const realm = ctx.query.realm;

  if (!character || !realm) {
    ctx.status = 400;
    ctx.body = { error: 'Missing required query parameters: character and realm' };
    return;
  }

  try {
    const warmaneCrawler = new WarmaneCrawler();
    const data = await warmaneCrawler.getCharacterMatchHistory(character, realm);
    ctx.body = data;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'An error occurred while fetching data' };
  }
});

*/
