from scrapy.crawler import CrawlerProcess
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.utils.project import get_project_settings
import json


def lambda_handler(event, context):
    try:
        # print(event)
        # body = event['body']
        char = event['char']

        WarmaneSpider.custom_settings={'LOG_ENABLED': False, 'CHAR': char, 'ITEM_PIPELINES': {
            'warmane_spider.pipelines.WarmaneSpiderPipeline': 300
        }}
        # settings = get_project_settings()
        # settings.set('CHAR', body['char'])
        # settings.set('LOG_ENABLED', False)
        process = CrawlerProcess(settings={
            'LOG_ENABLED': False
        })

        process.crawl(WarmaneSpider)
        process.start() # the script will block here until the crawling is finished
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Crawl started for someone " + char,
                }
            ),
        }
    except Exception as err:
        print(err)
        return {
            "statusCode": 500,
            "body": str(err)
        }
