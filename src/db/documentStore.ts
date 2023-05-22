import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  DeleteCommand,
  QueryCommand,
  DynamoDBDocument,
} from "@aws-sdk/lib-dynamodb";
import { MatchDetails } from "../lib/crawler/crawler";
import { config } from "../config";

type DocumentType = "match_details" | "character_meta" | "crawler_state";

/**
 * All table Items must have an id and document_type at minimum
 */
type Item = Record<string, any>;

interface DocStoreParams<T> {
  tableName: string;
  partitionKey: string;
  documentType: DocumentType;
  partitionKeyMapper?: (item: T) => string;
}

class DocumentStore<T extends Record<string, any>> {
  private tableName: string;
  private documentType: DocumentType;
  private partitionKey: string;
  private docClient: DynamoDBDocument;
  private partitionKeyMapper: (item: T) => string;

  constructor(params: DocStoreParams<T>) {
    this.tableName = params.tableName;
    this.partitionKey = params.partitionKey;
    this.documentType = params.documentType;

    if (params.partitionKeyMapper) {
      this.partitionKeyMapper = params.partitionKeyMapper;
    } else {
      this.partitionKeyMapper = (item) => item[params.partitionKey];
    }

    const dynamoDBClient = new DynamoDB({ region: "us-east-1" });
    this.docClient = DynamoDBDocument.from(dynamoDBClient);
  }

  private mapKeys(item: T) {
    return {
      [this.partitionKey]: this.partitionKeyMapper(item),
      document_type: this.documentType,
      ...item,
    };
  }

  private removeKeys(item: T) {
    const result = {
      ...item,
    };
    delete result[this.partitionKey];
    delete result[this.documentType];
    return result;
  }

  // Create
  async create(item: T): Promise<T> {
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
  id: string;
  document_type;
  name: string;
  realm: string;
  total_games_played: number;
}

export const characterMetadataTable = new DocumentStore<DynamoCharacterMeta>(
  config.characterTableName,
  "character_meta"
);
