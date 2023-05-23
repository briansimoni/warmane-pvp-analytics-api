import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { MatchDetails } from "../lib/crawler/crawler";
import { config } from "../config";

type DocumentType = "match_details" | "character_meta" | "crawler_state";

interface DocumentStoreParams<T> {
  tableName: string;
  documentType: DocumentType;
  documentTypeSortKey: keyof T;
}

interface DocumentMeta {
  id: string;
  document_type: DocumentType;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface RequiredWriteProperties {
  id: string;
}

export class DocumentStore<T> {
  private tableName: string;
  private documentType: DocumentType;
  private client: DynamoDBDocument;

  constructor(params: DocumentStoreParams<T>) {
    //TODO: add region
    const client = new DynamoDBClient({});
    const ddbDocClient = DynamoDBDocument.from(client);
    this.tableName = params.tableName;
    this.documentType = params.documentType;
    this.client = ddbDocClient;
  }

  public async get(id: string): Promise<(T & DocumentMeta) | undefined> {
    const result = await this.client.get({
      TableName: this.tableName,
      Key: {
        id,
        document_type: this.documentType,
      },
    });
    return result.Item as (T & DocumentMeta) | undefined;
  }

  public async put<Item extends T & RequiredWriteProperties>(
    item: Item
  ): Promise<void> {
    await this.client.put({
      TableName: this.tableName,
      Item: {
        ...item,
        document_type: this.documentType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * WIP
   * @param id
   * @returns
   */
  public async list(
    id: string
  ): Promise<{ items: (T & DocumentMeta)[]; continuationToken?: string }> {
    const result = await this.client.query({
      TableName: this.tableName,
      KeyConditionExpression:
        "#id = :id and begins_with(#document_type, :document_type)",
      ExpressionAttributeValues: {
        ":id": id,
        ":document_type": this.documentType,
      },
    });
    return {
      items: result.Items as (T & DocumentMeta)[],
      continuationToken: JSON.stringify(result.LastEvaluatedKey),
    };
  }

  public async query() {
    throw new Error("not implemented");
  }

  public async delete(id: string): Promise<void> {
    await this.client.delete({
      TableName: this.tableName,
      Key: {
        id,
        document_type: this.documentType,
      },
    });
  }
}

// partition key: character#realm
// document_type: match_details/123456
export const matchDetailsStore = new DocumentStore<MatchDetails>({
  tableName: config.characterTableName,
  documentType: "match_details",
  documentTypeSortKey: "matchId",
});
