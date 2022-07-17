import json
import unittest
from src.warmane_spider.arenas_collector import ArenasCollector
from unittest import IsolatedAsyncioTestCase
import os

class TestCollector(IsolatedAsyncioTestCase):
    async def test_async_collector(self):
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        result = await collector.run()
        self.assertGreater(len(result), 7)
        self.assertEquals(len(result['19706695']['character_details']), 4)

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
            self.assertEquals(collector.matches['19706695']['bracket'], '2v2')
            self.assertEquals(collector.matches['19706695']['id'], '19706695')

    def test_get_dynamo_key_list(self):
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        path = os.path.join(os.path.dirname(__file__), 'test_data.html')
        with open(path, 'r') as file:
            html = file.read()
            collector.parse_matches(html)
            keys = collector.get_dynamo_key_list()
            self.assertEquals(len(keys), 8)

    def test_parse_character_details(self):

        details = {
            "personal_change": '0 (<span class=\"history-loss\">0</span>)',
            "matchmaking_change": '1479 (<span class=\"history-loss\">-10</span>)'
        }
        collector = ArenasCollector('HorseMeat', 'Blackrock')
        ArenasCollector.parse_character_details(details)
        self.assertEquals(details['personal_change'], "0")
        self.assertEquals(details['matchmaking_change'], "-10")