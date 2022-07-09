import json
from warmane_spider.dynamo import KeyNotFoundError
from warmane_spider.dynamo import instantiate_table

table = instantiate_table()

def lambda_handler(event, context):
    try:
        id = event['pathParameters']['id']
        print(id)

        full_matches = table.get_full_matches(id)

        return {
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
