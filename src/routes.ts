import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import createError from "http-errors";
import {
  characterIdSchema,
  getCharacterSchema,
  getMatchesSchema,
  queryCharacterSchema,
} from "./api/validators";
import { requestCrawl } from "./lib/sqs/sqs_producer";
import {
  checkCharacterExists,
  getArenaStats,
  getCharacterProfile,
} from "./lib/warmane_client/client";
import {
  characterMetaStore,
  crawlerStateStore,
  matchDetailsStore,
} from "./db/documentStoreV2";
import { Realm } from "./lib/types";

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

  await crawlerStateStore.upsertMerge({
    id: `${name}@${realm}`,
    state: "pending",
  });

  await requestCrawl({
    name,
    realm,
    root: true,
  });

  ctx.status = 204;
}

async function queryCharacterMetadata(ctx: ApiContext) {
  const params = queryCharacterSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  // const { name } = params.value;
  // const results = await characterMetaStore.scan(name);

  ctx.status = 501;
  ctx.body = {
    message:
      "This endpoint has been temporarily disabled to prevent expensive database scans.",
  };
}

async function getCharacterMetadata(ctx: ApiContext) {
  // id from path parameter
  const params = characterIdSchema.validate(ctx.params.id);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const id = params.value;
  const [name, realm] = id.split("@");

  const [exists, metadata] = await Promise.all([
    checkCharacterExists({
      name,
      realm,
    }),
    characterMetaStore.get({
      id,
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
    id,
    name,
    realm: realm as Realm,
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

  const result = await matchDetailsStore.list({
    id: `${name}@${realm}`,
    continuationToken: params.value.continuation_token,
  });

  ctx.body = {
    matches: result.items,
    continuation_token: result.continuationToken,
  };
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

async function getCharacterStats(ctx: ApiContext) {
  const params = getCharacterSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;
  const characterStats = await getArenaStats({
    name,
    realm,
  });
  ctx.body = characterStats;
}
/**
 * return some nice-looking API documentation. Note that this endpoint is hard-coded
 * to github.com/briansimoni/warmane-pvp-analytics-api default branch.
 */
async function getDocs(ctx: ApiContext) {
  const html = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <title>Elements in HTML</title>

      <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
    </head>
    <body>

      <elements-api
        apiDescriptionUrl="https://raw.githubusercontent.com/briansimoni/warmane-pvp-analytics-api/v2/docs/openapi.yaml"
        router="hash"
      />

    </body>
  </html>
`;
  ctx.body = html;
}

router.get("/character", queryCharacterMetadata);
router.get("/character/profile", getCharacterProfileData);
router.get("/character/stats", getCharacterStats);
router.get("/character/matches", getMatches);
router.get("/character/crawl-state", getCrawlerState);
router.get("/character/:id", getCharacterMetadata);
router.post("/crawl", crawl);
router.get("/docs", getDocs);

export { router };
