import { APIGatewayEvent, Context, SQSEvent } from "aws-lambda";
import createError from "http-errors";
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
export const apiGatewayMiddleware = (
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
  } catch (error: unknown) {
    if (error instanceof createError.HttpError) {
      ctx.status = error.statusCode;
      ctx.body = {
        error: {
          status: error.status,
          message: error.message || "Internal Server Error",
        },
      };
    } else {
      ctx.log.error(error);
      throw error;
    }
  }
};

type SQSHandlerFunction = (event: SQSEvent, context: Context) => Promise<void>;

export interface SqsContext extends DefaultContext {
  sqs: {
    event: SQSEvent;
    context?: Context;
  };
}

/**
 * I made this to be more consistent with the API gateway
 * middleware.
 */
export const SqsMiddleware = (): Koa.Middleware<
  Koa.DefaultState,
  SqsContext
> => {
  return async (ctx: SqsContext, next) => {
    if (ctx.headers["x-apigateway-event"]) {
      ctx.sqs = {
        event: JSON.parse(
          decodeURIComponent(ctx.headers["x-apigateway-context"])
        ),
        context: JSON.parse(
          decodeURIComponent(ctx.headers["x-apigateway-context"])
        ),
      };
    } else {
      // not running in lambda context, use request body
      const record = {
        body: ctx.request.body as string,
      } as unknown as SQSEvent;

      const event: SQSEvent = {
        Records: [record],
      } as unknown as SQSEvent;

      ctx.sqs = {
        event,
      };
    }
    await next();
  };
};
