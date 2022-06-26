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
table = dynamodb.Table('table_name')


class WarmaneSpiderPipeline:
    def process_item(self, item, spider):
        print('WTF IS THIS PROCESSING? PLEASE WTF')
        # print(item)
        return item
