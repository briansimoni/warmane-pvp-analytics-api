import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";
import axios from "axios";

interface CrawlerInput {
  character: string;
  realm: string;
}

export async function requestCrawl(input: CrawlerInput) {
  if (process.env.AWS_EXECUTION_ENV !== undefined) {
    await sendSqsMessage(input);
  } else {
    await sendLocalMessage(input);
  }
}

async function sendSqsMessage(message: object) {
  const client = new SQSClient({});
  const m = new SendMessageCommand({
    QueueUrl: config.crawlerSqsEndpoint,
    MessageBody: JSON.stringify(message),
  });
  await client.send(m);
}

async function sendLocalMessage(message: object) {
  axios.post(config.crawlerSqsEndpoint, message);
}
