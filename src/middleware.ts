import { APIGatewayEvent, Context } from "aws-lambda";
import Koa, { DefaultContext } from "koa";

interface AwsMiddlewareOptions {
  deleteHeaders?: boolean;
}

export interface ApiGatewayContext extends DefaultContext {
  apiGateway?: {
    event: APIGatewayEvent;
    context: Context;
  };
}

// modified from https://github.com/compwright/aws-serverless-koa/blob/master/middleware.js
export const AwsMiddleware = (
  options: AwsMiddlewareOptions
): Koa.Middleware<Koa.DefaultState, ApiGatewayContext> => {
  return async (ctx, next) => {
    ctx.request;
    const deleteHeaders =
      options.deleteHeaders === undefined ? true : options.deleteHeaders;

    if (
      !ctx.headers["x-apigateway-event"] ||
      !ctx.headers["x-apigateway-context"]
    ) {
      return await next();
    }

    ctx.apiGateway = {
      event: JSON.parse(
        decodeURIComponent(ctx.headers["x-apigateway-event"] as string)
      ),
      context: JSON.parse(
        decodeURIComponent(ctx.headers["x-apigateway-context"] as string)
      ),
    };

    if (deleteHeaders) {
      delete ctx.headers["x-apigateway-event"];
      delete ctx.headers["x-apigateway-context"];
    }

    await next();
  };
};

export const errorHandlingMiddleware: Koa.Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.log(typeof error);
    if (error instanceof Error) {
      ctx.body = {
        error: {
          message: error.message || "Internal Server Error",
        },
      };
    } else {
      throw error;
    }
  }
};
