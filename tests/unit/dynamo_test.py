from src.warmane_spider import dynamo
import unittest
import json
import boto3
import os

dynamo.MatchesTable

class TestTable(unittest.TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        # if you're using the vs code test runner, cwd is the root of the project
        with open('.env.json') as f:
            env = json.load(f)
            table_name = env['CrawlerFunction']['TABLE_NAME']
            dynamodb = boto3.resource('dynamodb')
            cls._table = dynamodb.Table(table_name)

    @classmethod
    def tearDownClass(cls) -> None:
        matches = dynamo.MatchesTable(cls._table)
        matches.delete_matches('TestPerson@NowhereServer')

    def test_readwrite_matches(self):
        matches = dynamo.MatchesTable(self._table)
        result = matches.put_charachter_matches('TestPerson@NowhereServer', ['999','999','999'])
        self.assertEquals(result['ResponseMetadata']['HTTPStatusCode'], 200)

        result = matches.get_charachter_matches('TestPerson@NowhereServer')
        print(result)

    def test_get_sets_of_100(self):
        x = ["test"] * 120
        result = dynamo.MatchesTable.get_sets_of_100(x)
        self.assertEquals(len(result), 2)
        self.assertEquals(len(result[0]), 100)
        self.assertEquals(len(result[1]), 20) 


    