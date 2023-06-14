import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import createError from "http-errors";
import { getCharacterSchema, getMatchesSchema } from "./api/validators";
import { requestCrawl } from "./lib/sqs/sqs_producer";
import {
  checkCharacterExists,
  getCharacterProfile,
} from "./lib/warmane_client/client";
import {
  characterMetaStore,
  crawlerStateStore,
  matchDetailsStore,
} from "./db/documentStoreV2";

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

const router = new Router<Koa.DefaultState, ApiGatewayContext>();

/**
 * handles an API request to invoke the crawler. This will set the crawler state
 * to pending and send a message to SQS to request the crawler to run.
 */
async function crawl(ctx: ApiContext) {
  const result = getCharacterSchema.validate(ctx.request.body);
  if (result.error) {
    throw createError(400, result.error.message);
  }

  const { name, realm } = result.value;
  const characterExists = await checkCharacterExists({
    name,
    realm,
  });

  if (!characterExists) {
    throw createError(404, "Character not found");
  }

  await crawlerStateStore.upsert({
    id: `${name}@${realm}`,
    state: "pending",
  });

  await requestCrawl({
    name,
    realm,
  });

  ctx.status = 204;
}

async function getCharacterMetadata(ctx: ApiContext) {
  const params = getCharacterSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;

  const [exists, metadata] = await Promise.all([
    checkCharacterExists({
      name,
      realm,
    }),
    characterMetaStore.get({
      id: `${name}@${realm}`,
    }),
  ]);

  if (metadata && !exists) {
    characterMetaStore.deletePermanently({
      id: `${name}@${realm}`,
    });
    throw createError.NotFound("Character not found");
  }

  if (!exists) {
    throw createError.NotFound("Character not found");
  }

  const updatedMetadata = await characterMetaStore.upsert({
    id: `${name}@${realm}`,
    name,
    realm,
  });

  ctx.body = updatedMetadata;
}

async function getCharacterProfileData(ctx: ApiContext) {
  const params = getCharacterSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;

  const profile = await getCharacterProfile({
    name,
    realm,
  });

  ctx.body = profile;
}

async function getMatches(ctx: ApiContext) {
  const params = getMatchesSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;

  const matches = await matchDetailsStore.list({
    id: `${name}@${realm}`,
    continuationToken: params.value.continuation_token,
  });

  ctx.body = matches;
}

async function getCrawlerState(ctx: ApiContext) {
  const params = getMatchesSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;
  const crawlerState = await crawlerStateStore.get({ id: `${name}@${realm}` });
  if (!crawlerState) {
    throw createError.NotFound("Crawler state not found");
  }
  ctx.body = crawlerState;
}

router.get("/character", getCharacterMetadata);
router.get("/character/profile", getCharacterProfileData);
router.get("/character/matches", getMatches);
router.get("/character/crawl-state", getCrawlerState);
router.post("/crawl", crawl);

export { router };
