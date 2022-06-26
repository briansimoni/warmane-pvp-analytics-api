# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import boto3
from dotenv import load_dotenv
import os

load_dotenv()

dynamodb = boto3.resource('dynamodb')
table_name = os.getenv('TABLE_NAME')
table = dynamodb.Table(table_name)


class WarmaneSpiderPipeline:
    def process_item(self, item, spider):
        try:
            Item = {
                    'id': item['id'],
                    'outcome': item['outcome'],
                    'points_change': item['points_change'],
                    'start_time': item['start_time'],
                    'duration': item['duration'],
                    'map': item['map'],
                    'character_details': item['character_details']
                }
            result = table.put_item(
                Item=Item
            )
            return item
        except Exception as err:
            print(err)
