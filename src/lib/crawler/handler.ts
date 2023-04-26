import { Context, SQSEvent } from "aws-lambda";
// import bodyParser from "koa-bodyparser";

export async function crawlerHandler(event: SQSEvent, context: Context) {
  console.log("sqsHandler");
  console.log(event);
  console.log(context);
}
