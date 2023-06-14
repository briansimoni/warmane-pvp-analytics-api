import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { config } from "../config";
import { CharacterId, CharacterName, MatchDetails, Realm } from "../lib/types";

type DocumentType = "match_details" | "character_meta" | "crawler_state";

interface DocumentStoreParams<T> {
  /**
   * Must be the exact table name in Dynamo
   */
  tableName: string;
  /**
   * documentType makes up the first part of the sort key. A full sort key might look like
   * match_details/456987
   */
  documentType: DocumentType;
  /**
   * documentTypeSortKey corresponds to the second part of sort key attribute in dynamo.
   * In other words, this is the range key or sort key.
   * You may specify one of the properties of T to be the sort key. This should be
   * a unique property per item. For instance: "matchId". If it is not provided, it defaults
   * to the id property of T. which will result in sort key values of "document_type/T[id]"
   */
  documentTypeSortKey?: keyof T;
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

/**
 * DocumentStore provides a generic class for handling items in Dynamo.
 * Given a type parameter, the methods become conveniently type-safe.
 * For instance a DocumentStore<MatchDetails> instance will return instances
 * of MatchDetails objects when you perform the various read actions. Likewise,
 * it will only accept MatchDetails objects for write operations.
 */
export class DocumentStore<T extends RequiredWriteProperties> {
  private tableName: string;
  private documentType: DocumentType;
  private documentTypeSortKey: keyof T;
  private client: DynamoDBDocument;

  constructor(params: DocumentStoreParams<T>) {
    const dynamoClient = new DynamoDBClient({ region: config.region });
    const ddbDocClient = DynamoDBDocument.from(dynamoClient);
    this.tableName = params.tableName;
    this.documentType = params.documentType;
    this.documentTypeSortKey = params.documentTypeSortKey
      ? params.documentTypeSortKey
      : "id";
    this.client = ddbDocClient;
  }

  /**
   * get will retrieve a specific item from the table.
   * You must pass in both the id and the documentKey.
   * This is because items are unique in Dynamo based on the composite key.
   *
   * // note the following example where documentKey is the value of the matchId property
   * @example await matchDetailsTable.get({ id: "Dumpster@Blackrock", documentKey: "737123"})
   */
  public async get(params: {
    id: string;
    documentKey?: string;
  }): Promise<(T & DocumentMeta) | undefined> {
    const { id, documentKey = id } = params;
    const result = await this.client.get({
      TableName: this.tableName,
      Key: {
        id,
        document_key: `${this.documentType}/${documentKey}`,
      },
    });
    return result.Item as (T & DocumentMeta) | undefined;
  }

  /**
   * put will insert an item into Dynamo. Note that this
   * will overwrite an item if the primary key matches an item
   * that already exists.
   */
  private async put(item: T): Promise<T> {
    const now = new Date().toISOString();
    const Item = {
      ...item,
      document_key: `${this.documentType}/${item[this.documentTypeSortKey]}`,
      created_at: now,
      updated_at: now,
    };
    await this.client.put({
      TableName: this.tableName,
      Item,
    });
    return Item;
  }

  /**
   * upsert will create a new object if it does not already exist.
   * Otherwise, it will overwrite the object and update the updated_at timestamp.
   */
  public async upsert(item: T): Promise<T> {
    const documentKey = item[this.documentTypeSortKey] as string;
    const existingItem = await this.get({
      id: item.id,
      documentKey,
    });
    if (existingItem) {
      const Item = {
        ...item,
        document_key: `${this.documentType}/${documentKey}`,
        updated_at: new Date().toISOString(),
        created_at: existingItem.created_at,
      };
      await this.client.put({
        TableName: this.tableName,
        Item,
      });
      return Item;
    }
    return await this.put(item);
  }

  /**
   * list will query for a page of results that match the given id.
   * For instance, if you want a page of match history, you might call
   * @example await list({ id: "Dumpster@Blackrock" }).
   *
   * The default limit of items returned is 100.
   * If there are more than 100 items, there will be a continuationToken
   * in the response. You can get the next set of items by passing the
   * continuationToken in the method call. When there are no more results,
   * the continuationToken property will be undefined.
   */
  public async list(params: {
    id: string;
    continuationToken?: string;
    limit?: number;
  }): Promise<{ items: (T & DocumentMeta)[]; continuationToken?: string }> {
    const { id, continuationToken, limit = 100 } = params;
    const result = await this.client.query({
      TableName: this.tableName,
      KeyConditionExpression:
        "id = :id and begins_with(document_key, :document_type)",
      ExpressionAttributeValues: {
        ":id": id,
        ":document_type": this.documentType,
      },
      ExclusiveStartKey: this.fromContinuationToken(continuationToken),
      Limit: limit,
    });

    return {
      items: result.Items as (T & DocumentMeta)[],
      continuationToken: this.toContinuationToken(result.LastEvaluatedKey),
    };
  }

  // TODO: implement
  // We may want to allow the caller to ask for more granular queries than what list does
  public async query() {
    throw new Error("not implemented");
  }

  public async deletePermanently(params: {
    id: string;
    documentKey?: string;
  }): Promise<void> {
    const { id, documentKey = id } = params;
    await this.client.delete({
      TableName: this.tableName,
      Key: {
        id,
        document_key: `${this.documentType}/${documentKey}`,
      },
    });
  }

  // TODO: implement soft delete
  // or maybe we just don't need this
  public async delete(id: string) {
    throw new Error("not implemented " + id);
  }

  private toContinuationToken(lastEvaluatedKey?: Record<string, any>) {
    if (!lastEvaluatedKey) {
      return undefined;
    }
    return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64");
  }

  private fromContinuationToken(token?: string) {
    if (!token) {
      return undefined;
    }
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  }
}

/**
 * The partition key for this table is id.
 * It must be in the format Character@Realm
 * The document_type is match_details. This is the sort key.
 *
 * Example id: Dumpster@Blackrock
 * Example sort key: match_details/123456
 */
export const matchDetailsStore = new DocumentStore<MatchDetails>({
  tableName: config.characterTableName,
  documentType: "match_details",
  documentTypeSortKey: "matchId",
});

export type CharacterMeta = {
  id: CharacterId;
  name: CharacterName;
  realm: Realm;
  games_played?: number;
};

/**
 * persist character meta information.
 * Partition key example: Dumpster@Blackrock
 * sort key example: character_meta/Dumpster@Blackrock
 */
export const characterMetaStore = new DocumentStore<CharacterMeta>({
  tableName: config.characterTableName,
  documentType: "character_meta",
});

export type CrawlerState = {
  id: CharacterId;
  state: "pending" | "running" | "idle" | "errored";
  crawler_last_started?: string;
  crawler_last_finished?: string;
  crawler_errors?: string[];
};

export const crawlerStateStore = new DocumentStore<CrawlerState>({
  tableName: config.characterTableName,
  documentType: "crawler_state",
});
