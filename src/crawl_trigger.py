import json
import os
import boto3
import requests
from user_agents import user_agent_rotator

def check_player_exists(realm:str, charachter: str):
    url = "https://armory.warmane.com/character/{0}/{1}/summary".format(charachter, realm)
    user_agent = user_agent_rotator.get_random_user_agent()
    headers = {
        'User-Agent': user_agent
    }
    response = requests.get(url, headers=headers)
    if 'Page not found' in response.text:
        raise Exception("{0} on {1} was not found on warmane armory".format(charachter, realm))

def lambda_handler(event, context):
    try:
        client = boto3.client('lambda')
        target_lambda = os.environ['TARGET_FUNCTION']
        body = json.loads(event['body'])
        char = body['char']
        realm = body['realm']
        check_player_exists(realm, char)
        payload = json.dumps(body).encode()
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
