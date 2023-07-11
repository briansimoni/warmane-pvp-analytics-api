import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";
import axios from "axios";
import { logger } from "../util/logger";
import { CrawlerInput } from "../types";
// import { EventEmitter } from "events";

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
  setInterval(async () => {
    if (queue[0] && done) {
      const message = queue.shift();
      done = false;
      try {
        await axios.post(config.crawlerSqsUrl, message);
        done = true;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.message);
        } else {
          throw error;
        }
      }
    }
  }, 100);
}

async function sendLocalMessage(message: object) {
  logger.debug("queueing message", message);
  queue.push(message);
}
