from cmath import exp
import json
from warmane_spider.dynamo import get_table


table = get_table()


def get_char(event, context):
    try:
        id = event['pathParameters']['id']
        metadata = table.get_charachter_metadata(id)
        return {
            "headers": {
                "Content-Type": "application/json",
            },
            "statusCode": 200,
            "body": json.dumps(metadata),
        }
    except Exception as err:
        return {
            "statusCode": 500,
            "body": json.dumps({'message': 'there was some kind of error ' + str(err)})
        }
