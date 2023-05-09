import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../../config";

export async function requestCrawl() {
  const client = new SQSClient({});
  const body = JSON.stringify({
    character: "",
    realm: "",
  });
  const message = new SendMessageCommand({
    QueueUrl: config.crawlerSqsEndpoint,
    MessageBody: body,
  });
  await client.send(message);
}
