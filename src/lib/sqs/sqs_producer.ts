import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";
import axios, { AxiosError } from "axios";
import { logger } from "../util/logger";

interface CrawlerInput {
  name: string;
  realm: string;
}

/**
 * sends a message to the SQS queue used by the crawler lambda
 * to collect character data from warmane asynchronously
 */
export async function requestCrawl(input: CrawlerInput) {
  if (process.env.AWS_EXECUTION_ENV !== undefined) {
    await sendSqsMessage(input);
  } else {
    await sendLocalMessage(input);
  }
}

async function sendSqsMessage(message: object) {
  const client = new SQSClient({ region: config.region });
  const m = new SendMessageCommand({
    QueueUrl: config.crawlerSqsUrl,
    MessageBody: JSON.stringify(message),
  });
  await client.send(m);
}

async function sendLocalMessage(message: object) {
  axios.post(config.crawlerSqsUrl, message).catch((error) => {
    if (error instanceof AxiosError) {
      logger.debug("message probably sent successfully", error.message);
    } else {
      throw error;
    }
  });
}
