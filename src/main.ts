import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import express from "express";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const app = express();
  console.log(app);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  };
};
