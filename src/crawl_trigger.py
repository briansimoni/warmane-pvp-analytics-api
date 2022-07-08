import json
import os
import boto3

def lambda_handler(event, context):
    client = boto3.client('lambda')
    target_lambda = os.environ['TARGET_FUNCTION']
    body = json.loads(event['body'])
    payload = json.dumps(body).encode()
    try:
        client.invoke(FunctionName=target_lambda, Payload=payload, InvocationType="Event")
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "crawling for " + body['char'],
                }
            ),
        }
    except Exception as err:
        return {
            "statusCode": 500,
            "body": {
                json.dumps(
                    {
                        "message": err
                    }
                )
            }
        }
