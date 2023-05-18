import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";
import { logger } from "../util/logger";

interface CrawlerRequest {
  character: string;
  realm: string;
}

/**
 * reads request from the SQS queue. It will return
 * a list of requests that have been made for the crawler
 * to collect character data
 */
export async function readCrawlerRequests(): Promise<CrawlerRequest[]> {
  return [];
}

export async function receiveSqsMessage(): Promise<CrawlerRequest[]> {
  const client = new SQSClient({});
  const command = new ReceiveMessageCommand({
    QueueUrl: config.crawlerSqsUrl,
  });
  const result = await client.send(command);
  if (result.Messages) {
    return result.Messages.map((m) => {
      if (!m.Body) {
        logger.warn("message with empty body");
        return;
      }
      return JSON.parse(m.Body);
    }).filter(Boolean);
  }
  return [];
}

// async function receiveLocalMessage() {}
