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
  sqs?: {
    event: SQSEvent;
    context: Context;
  };
}

/**
 * makeSqsHandlerMiddleware gives you the ability to use an sqs/lambda handler
 * function locally with a Koa server. It returns a Koa.Middleware
 *
 * @example app.use(sqs)
 */
export const SqsMiddleware = (
  handler: SQSHandlerFunction
): Koa.Middleware<Koa.DefaultState, SqsContext> => {
  return async (ctx: Koa.ParameterizedContext) => {
    const record = {
      body: ctx.request.body as string,
    } as unknown as SQSEvent;

    const event: SQSEvent = {
      Records: [record],
    } as unknown as SQSEvent;
    const result = await handler(event, {} as Context);
    ctx.body = result;
  };
};

/**
 *  * I'm also starting to think that running literally the whole stack
 * locally becomes more and more unreasonable as the system gets more
 * distributed. Creating a mock SQS queue or running a bunch of docker
 * containers that run fake SQS queues, dynamo, API gateway etc...
 * is a ton of work to set up and maintain. And at the end of the day
 * it probably is pretty different than what actually runs in the cloud.
 * More and more I think it actually is smarter to start moving away
 * from local development to fully "cloud native". Isolation is hard though.
 * More time invested in multi-account AWS strategies might be wise.
 */
