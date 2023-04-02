import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import express from "express";

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("invoking the handler!");
  console.log(event);
  if (
    event.httpMethod.toLocaleLowerCase() === "get" &&
    event.path.includes("character")
  ) {
    try {
      return await getCharacter(event, context);
    } catch (err) {
      console.log(err);
      throw err;
    }
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
  // if (!event.queryStringParameters) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       message: "bad request",
  //     }),
  //   };
  // }

  // const character = event.queryStringParameters["character"];
  // const realm = event.queryStringParameters["realm"];
  // if (!character || !realm) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       message: "bad request",
  //     }),
  //   };
  // }
  const response = await axios.get(
    `http://armory.warmane.com/api/character/Dumpster/blackrock/profile`
  );

  return {
    statusCode: 200,
    body: JSON.stringify(response.data),
  };
}
