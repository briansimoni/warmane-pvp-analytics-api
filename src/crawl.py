from scrapy.crawler import CrawlerProcess
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.utils.project import get_project_settings
import json


def lambda_handler(event, context):
    body = event['body']

    WarmaneSpider.custom_settings={'LOG_ENABLED': False, 'CHAR': body['char'], 'ITEM_PIPELINES': {
        'warmane_spider.pipelines.WarmaneSpiderPipeline': 300
    }}
    # settings = get_project_settings()
    # settings.set('CHAR', body['char'])
    # settings.set('LOG_ENABLED', False)
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
