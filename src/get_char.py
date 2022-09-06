import json
from warmane_spider.dynamo import get_table


table = get_table()


def get_char(event, context):
    print('getting char')
    try:
        id = event['pathParameters']['id'].lower()
        print("got the id:", id)
        metadata = table.get_charachter_metadata(id)
        return {
            "statusCode": 200,
            "body": json.dumps(metadata),
        }
    except Exception as err:
        return {
            "statusCode": 500,
            "body": json.dumps({'message': 'there was some kind of error ' + str(err)})
        }
