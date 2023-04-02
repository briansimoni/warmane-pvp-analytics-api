import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import express from "express";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const app = express();
  console.log(app);

  if (
    event.httpMethod.toLocaleLowerCase() === "get" &&
    event.path.includes("character")
  ) {
    return await getCharacter(event, context);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World",
    }),
  };
};

async function getCharacter(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "bad request",
      }),
    };
  }

  const character = event.pathParameters["character"];
  const realm = event.pathParameters["realm"];
  if (!character || !realm) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "bad request",
      }),
    };
  }
  const response = await axios.get(
    `http://armory.warmane.com/api/character/${character}/${realm}/profile`
  );

  return {
    statusCode: 200,
    body: response.data,
  };
}
