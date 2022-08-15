import json
from warmane_spider.dynamo import KeyNotFoundError
from warmane_spider.dynamo import get_table

table = get_table()

# there is a known issue where some people have played so many games
# we hit the 10mb limit when sending the JSON blob back (compressorx for example)
# need to implement pagination to fix this


def get_matches(event, context):
    try:
        id = event['pathParameters']['id']

        full_matches = table.get_full_matches(id)

        return {
            # "headers": {
            #     "Access-Control-Allow-Origin": "*",
            # },
            "statusCode": 200,
            "body": json.dumps(full_matches),
        }
    except KeyNotFoundError as err:
        return {
            "statusCode": 404,
            "body": json.dumps({'message': 'no match history found for {0}'.format(id)})
        }
    except Exception as err:
        return {
            "statusCode": 500,
            "body": json.dumps({'message': 'there was some kind of error ' + str(err)})
        }
