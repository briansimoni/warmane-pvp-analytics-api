import unittest
from src.warmane_spider.arenas_collector import ArenasCollector
from unittest import IsolatedAsyncioTestCase
import os

class TestCollector(IsolatedAsyncioTestCase):
    async def test_async_collector(self):
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        result = await collector.run()
        self.assertGreater(len(result), 7)

class TestParser(unittest.TestCase):
    def test_parser(self):
        # not actually making network calls here. just injecting some html
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        path = os.path.join(os.path.dirname(__file__), 'test_data.html')
        with open(path, 'r') as file:
            html = file.read()
            collector.parse_matches(html)
            self.assertEquals(collector.matches['19706695']['arena'], "Blade's Edge Arena")
            self.assertEquals(collector.matches['19706695']['team_name'], 'WendysResturant')
            self.assertEquals(collector.matches['19706695']['bracket'], '(2v2)')
            self.assertEquals(collector.matches['19706695']['id'], '19706695')

    def test_get_dynamo_key_list(self):
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        path = os.path.join(os.path.dirname(__file__), 'test_data.html')
        with open(path, 'r') as file:
            html = file.read()
            collector.parse_matches(html)
            keys = collector.get_dynamo_key_list()
            print(keys)
            self.assertEquals(len(keys), 8)