import json
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.crawler import CrawlerProcess


def lambda_handler(event, context):
    body = event['body']
    process = CrawlerProcess(settings={
        # "FEEDS": {
        #     "items.json": {"format": "json"},
        # },
        "CHAR": body['char']
    })
    print(body)
    process = CrawlerProcess()
    process.crawl(WarmaneSpider)
    process.start() # the script will block here until the crawling is finished
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "Crawl started for someone " + body['char'],
                # "location": ip.text.replace("\n", "")
            }
        ),
    }
