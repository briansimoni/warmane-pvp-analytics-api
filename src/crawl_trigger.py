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
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "crawling for " + body['char'],
                }
            ),
        }
    except Exception as err:
        return {
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "statusCode": 500,
            "body": {
                "message": str(err)
            }
        }
