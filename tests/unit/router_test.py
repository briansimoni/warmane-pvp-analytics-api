
from src.router import Router
import unittest

class TestRouter(unittest.TestCase):

    def test_get(self):
        router = Router()
        router.get("/person", lambda event, context: { 'body': 'hello world'})
        result = router.serve({
            'httpMethod': 'GET',
            'path': '/person'
        }, None)
        self.assertEqual(result['body'], 'hello world')

    def test_path_params(self):
        router = Router()
        router.get("/person/:id", lambda event, context: { 'body': event['path_params']['id']})
        result = router.serve({
            'httpMethod': 'GET',
            'path': '/person/bob'
        }, None)
        self.assertEqual(result['body'], 'bob')

    def test_cors(self):
        router = Router()
        result = router.serve({
            'httpMethod': 'OPTIONS',
            'path': '/person/bob',
            'headers': {
                'origin': 'https://warmane.dog'
            }
        }, None)
        self.assertEqual(result['headers']['Access-Control-Allow-Origin'], 'https://warmane.dog')