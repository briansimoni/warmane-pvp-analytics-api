import json
import asyncio
from warmane_spider.dynamo import instantiate_table
from warmane_spider.arenas_collector import ArenasCollector

table = instantiate_table()

def lambda_handler(event, context):
    print(event)
    try:
        char = event['char']
        realm = event['realm']
        id = "{0}@{1}".format(char, realm)

        recent_crawl = table.check_recently_crawled(id)
        if recent_crawl:
            raise Exception(id + " has already been crawled in the last 24 hours")

        collector = ArenasCollector(character=char, realm=realm)
        asyncio.get_event_loop().run_until_complete(collector.run())
        # asyncio.run(collector.run())

        for match in collector.matches:
            table.put_characther_match(collector.matches[match])

        match_keys = collector.get_dynamo_key_list()
        table.put_charachter_matches(id, match_keys)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Crawl completed for " + char,
                }
            ),
        }
    except Exception as err:
        print(err)
        return {
            "statusCode": 500,
            "body": json.dumps({'message': str(err)})
        }
