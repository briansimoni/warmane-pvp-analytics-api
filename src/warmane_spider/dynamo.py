import os
import boto3

class MatchesTable():
    def __init__(self):
        dynamodb = boto3.resource('dynamodb')
        table_name = os.getenv('TABLE_NAME')
        table = dynamodb.Table(table_name)