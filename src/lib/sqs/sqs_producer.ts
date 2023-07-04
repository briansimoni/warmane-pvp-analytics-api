import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";
import axios, { AxiosError } from "axios";
import { logger } from "../util/logger";
import { CrawlerInput } from "../types";

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

/**
 * In a local dev environment this simulates how Lambda polls SQS for messages.
 * This particular implementation will make it so that only one message will be
 * processed by Lambda at a time. It will wait for the "lambda" handler to finish
 * execution and then dequeue the next message for processing. This is nice for testing
 * because I don't want my computer to be processing potentially thousands of web crawl
 * requests all at once.
 */
const queue: object[] = [];
if (process.env.AWS_EXECUTION_ENV === undefined) {
  let done = true;
  setInterval(() => {
    if (queue[0] && done) {
      const message = queue.shift();
      done = false;
      axios
        .post(config.crawlerSqsUrl, message)
        .then(() => {
          done = true;
        })
        .catch((error) => {
          if (error instanceof AxiosError) {
            logger.info("message probably sent successfully", error.message);
          } else {
            throw error;
          }
        });
    }
  }, 100);
}

async function sendLocalMessage(message: object) {
  logger.info("queueing message", message);
  queue.push(message);
}
