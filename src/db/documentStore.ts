import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { MatchDetails } from "../lib/crawler/crawler";

const dynamoDBClient = new DynamoDB({ region: "us-east-1" });
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

type DocumentType = "match_details" | "character_meta" | "crawler_state";

class DocumentStore<T extends MatchDetails> {
  private name: string;
  private documentType: DocumentType;

  constructor(tableName: string, documentType: DocumentType) {
    this.name = tableName;
    this.documentType = documentType;
  }

  // Create
  async update(item: T): Promise<T> {
    const params = {
      TableName: this.name,
      Item: item,
    };
    await dynamoDBDocClient.send(new PutCommand(params));
    return item;
  }

  // Read
  async get(key: Record<string, unknown>): Promise<T | undefined> {
    const params = {
      TableName: this.name,
      Key: key,
    };

    const response = await dynamoDBDocClient.send(new GetCommand(params));
    return response.Item as T | undefined;
  }

  // Delete
  async delete(key: Record<string, unknown>): Promise<void> {
    const params = {
      TableName: this.name,
      Key: key,
    };

    await dynamoDBDocClient.send(new DeleteCommand(params));
  }

  // Query (with pagination)
  async list(
    query: Record<string, unknown>,
    paginationToken?: Record<string, unknown>
  ): Promise<{
    items: T[];
    lastEvaluatedKey?: Record<string, unknown>;
  }> {
    const params = {
      TableName: this.name,
      ...query,
      ExclusiveStartKey: paginationToken,
    };

    const response = await dynamoDBDocClient.send(new QueryCommand(params));
    return {
      items: response.Items as T[],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  }
}

export const characterMatchesTable = new DocumentStore<MatchDetails>(
  "character_data",
  "match_details"
);
