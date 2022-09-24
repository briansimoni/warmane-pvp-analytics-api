import json
import os
import boto3
import requests
from get_char import get_char
from get_char_global_stats import get_global_char_stats
from router import Router
from get_matches import get_matches
from user_agents import user_agent_rotator


def check_player_exists(realm: str, charachter: str):
    url = "https://armory.warmane.com/character/{0}/{1}/summary".format(
        charachter, realm)
    user_agent = user_agent_rotator.get_random_user_agent()
    headers = {
        'User-Agent': user_agent
    }
    response = requests.get(url, headers=headers)
    if 'Page not found' in response.text:
        raise Exception(
            "{0} on {1} was not found on warmane armory".format(charachter, realm))


def trigger(event, context):
    client = boto3.client('lambda')
    target_lambda = os.environ['TARGET_FUNCTION']
    body = json.loads(event['body'])
    char = body['char']
    realm = body['realm']
    check_player_exists(realm, char)
    payload = json.dumps(body).encode()
    client.invoke(FunctionName=target_lambda,
                  Payload=payload, InvocationType="Event")
    message = "crawling for " + body['char']
    b = json.dumps(
        {
            "message": message,
        }
    )
    return {
        "statusCode": 200,
        "body": b
    }


router = Router()
router.post('/crawl', trigger)
router.get('/charachter/:id', get_char)
router.get('/matches/:id', get_matches)
router.get("/stats/:id", get_global_char_stats)


def lambda_handler(event, context):
    return router.serve(event, context)
