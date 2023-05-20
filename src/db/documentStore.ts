import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  DynamoDBDocument,
} from "@aws-sdk/lib-dynamodb";
import { MatchDetails } from "../lib/crawler/crawler";
import { config } from "../config";

type DocumentType = "match_details" | "character_meta" | "crawler_state";

class DocumentStore<T extends Record<string, any>> {
  private tableName: string;
  private documentType: DocumentType;
  private docClient: DynamoDBDocument;

  constructor(tableName: string, documentType: DocumentType) {
    this.tableName = tableName;
    this.documentType = documentType;

    const dynamoDBClient = new DynamoDB({ region: "us-east-1" });
    this.docClient = DynamoDBDocument.from(dynamoDBClient);
  }

  // Create
  async update(item: T): Promise<T> {
    this.docClient.put({
      TableName: this.tableName,
      Item: {
        character: "testguy123@blackrock",
        document_key: "character_meta",
      },
    });
    return item;
  }

  // Read
  async get(key: { primary: string }): Promise<T | undefined> {
    const params = {
      TableName: this.tableName,
      Key: key,
    };

    const response = await this.docClient.send(new GetCommand(params));
    return response.Item as T | undefined;
  }

  // Delete
  async delete(key: Record<string, unknown>): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: key,
    };

    await this.docClient.send(new DeleteCommand(params));
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
      TableName: this.tableName,
      ...query,
      ExclusiveStartKey: paginationToken,
    };

    const response = await this.docClient.send(new QueryCommand(params));
    return {
      items: response.Items as T[],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  }
}

export const characterMatchesTable = new DocumentStore<MatchDetails>(
  config.characterTableName,
  "match_details"
);

interface DynamoCharacterMeta {
  character: string;
  name: string;
  realm: string;
  total_games_played: number;
}

export const characterMetadataTable = new DocumentStore<DynamoCharacterMeta>(
  config.characterTableName,
  "character_meta"
);
