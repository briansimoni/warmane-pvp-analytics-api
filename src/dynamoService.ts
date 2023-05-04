import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDB({ region: "your-region" });
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

class DynamoService {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Create
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createItem<T extends Record<string, any>>(item: T): Promise<T> {
    const params = {
      TableName: this.tableName,
      Item: item,
    };

    try {
      await dynamoDBDocClient.send(new PutCommand(params));
      return item;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  // Read
  async getItem(
    key: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    const params = {
      TableName: this.tableName,
      Key: key,
    };

    try {
      const response = await dynamoDBDocClient.send(new GetCommand(params));
      return response.Item as Record<string, unknown> | undefined;
    } catch (error) {
      console.error("Error getting item:", error);
      throw error;
    }
  }

  // Update
  async updateItem(
    key: Record<string, unknown>,
    updateExpression: string,
    expressionAttributeValues: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const params = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    try {
      const response = await dynamoDBDocClient.send(new UpdateCommand(params));
      return response.Attributes as Record<string, unknown>;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  // Delete
  async deleteItem(
    key: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const params = {
      TableName: this.tableName,
      Key: key,
    };

    try {
      await dynamoDBDocClient.send(new DeleteCommand(params));
      return key;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  // Query (with pagination)
  async queryItems(
    query: Record<string, unknown>,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{
    items: Record<string, unknown>[];
    lastEvaluatedKey?: Record<string, unknown>;
  }> {
    const params = {
      TableName: this.tableName,
      ...query,
      ExclusiveStartKey: exclusiveStartKey,
    };

    try {
      const response = await dynamoDBDocClient.send(new QueryCommand(params));
      return {
        items: response.Items as Record<string, unknown>[],
        lastEvaluatedKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      console.error("Error querying items:", error);
      throw error;
    }
  }
}

export default DynamoService;
