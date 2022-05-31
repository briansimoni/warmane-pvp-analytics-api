import json
from multiprocessing import Event
from warmane_spider.spiders.spider import WarmaneSpider
import os
import boto3
# from scrapy.crawler import CrawlerProcess


def lambda_handler(event, context):
    client = boto3.client('lambda')
    target_lambda = os.environ['TARGET_FUNCTION']
    body = json.loads(event['body'])
    payload = json.dumps(body).encode()
    client.invoke(FunctionName=target_lambda, Payload=payload, InvocationType="Event")
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "crawling for " + body['char'],
                # "location": ip.text.replace("\n", "")
            }
        ),
    }
