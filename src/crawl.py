import json
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings


def lambda_handler(event, context):
    print(event['body'])
    body = json.loads(event['body'])
    settings = get_project_settings()
    settings.set('LOG_ENABLED', False)
    settings.set('CHAR', body['char'])
    process = CrawlerProcess(settings=settings)
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
