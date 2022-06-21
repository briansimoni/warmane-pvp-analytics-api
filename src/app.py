import scrapy
from scrapy.crawler import CrawlerProcess
from warmane_spider.spiders.spider import WarmaneSpider
from scrapy.utils.project import get_project_settings
import json

settings = get_project_settings()
settings.set('CHAR', 'Marvinx')
settings.set('LOG_ENABLED', False)

# process = CrawlerProcess(settings={
#     # "FEEDS": {
#     #     "items.json": {"format": "json"},
#     # },
#     "CHAR": "Dumpster"
# })

process = CrawlerProcess(settings=settings)

process.crawl(WarmaneSpider)
process.start() # the script will block here until the crawling is finished


# def warlock_filter(match):
#     if len(match['character_details']) == 6:
#         return False
#     enemies = list(filter(lambda chars: chars['charname'] != 'Dumpster' and chars['charname'] != 'Horrface', match['character_details']))
#     for c in enemies:
#         if 'class' in c and c['class'] == '5':
#             return True


# with open('items.json') as f:
#     matches = json.load(f)
#     warlock_matches = list(filter(warlock_filter, matches))
#     print(len(warlock_matches))
#     print(len(matches))
#     print(len(warlock_matches) / len(matches))