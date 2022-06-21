# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


# currently not using this as dict types are also considered items
class WarmaneSpiderItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    id = scrapy.Field()
    outcome = scrapy.Field()
    points_change = scrapy.Field()
    start_time = scrapy.Field()
    duration = scrapy.Field()
    map = scrapy.Field()
