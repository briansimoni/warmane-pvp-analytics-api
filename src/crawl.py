import json
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.crawler import CrawlerProcess


def lambda_handler(event, context):
    # process = CrawlerProcess(settings={
    #     "FEEDS": {
    #         "items.json": {"format": "json"},
    #     },
    # })
    process = CrawlerProcess()
    process.crawl(WarmaneSpider)
    process.start() # the script will block here until the crawling is finished
    {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "crawling complete",
                # "location": ip.text.replace("\n", "")
            }
        ),
    }
