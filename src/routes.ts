import Router from "@koa/router";
import Koa from "koa";
import { ApiGatewayContext } from "./middleware";
import Joi from "joi";
import createError from "http-errors";
import getCharacterMetadata from "./api/getCharacterMetadata";

interface GetCharacterRequestParams {
  character: string;
  realm: string;
}

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

const schema = Joi.object<GetCharacterRequestParams>({
  character: Joi.string().required(),
  realm: Joi.string().required(),
});

export const router = new Router<Koa.DefaultState, ApiGatewayContext>();

router.get("/character", getCharacterMetadata);
