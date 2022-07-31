import os
import boto3
import time


class KeyNotFoundError(Exception):
    pass

class MatchesTable:
    def __init__(self, table):
        self.table = table

    def get_charachter_matches(self, id) -> list[dict]:
        """
        pass the id for a character in e.g. Dumpster@Blackrock
        and get back a list of match IDs
        """
        response = self.table.get_item(Key={
            'id': id,
            'date': 'null'
        }, ConsistentRead=True)

        if 'Item' in response:
            return response['Item']['matches']
        else:
            raise KeyNotFoundError()

    def put_charachter_matches(self, id, matches):
        """
        This function stores something like Dumpster@Blackrock for the primary key
        and then stores a giant list of keys with it for later retrieval
        """
        response = self.table.put_item(
            Item={
                'id': id,
                'date': 'null',
                'crawl_last_completed': str(time.time()),
                'matches': matches
            }
        )
        return response

    def put_characther_match(self, match: dict):
        """
        given a dict that comes out of the ArenaCollector class,
        transform data as needed and place in the table
        """

        response = self.table.put_item(
            Item=match
        )
        return response

    def delete_matches(self, id):
        self.table.delete_item(Key={
            'id': id,
            'date': 'null'
        })

    def get_sets_of_100(self, matches):
        """
        given a list of matches, it will return a 2-dimensional list
        with each element a list of max 100 elements
        """
        subset = []
        result = []
        for match in matches:
            if len(subset) == 100:
                result.append(subset)
                subset = []
            subset.append(match)

        if len(subset) > 0:
            result.append(subset)
        return result

    def get_full_matches(self, id):
        # need a function to split matches up to sets of 100 at a time
        # need to run batch_get_item and ideally handle UnprocessedKeys
        """
        get all of the matches including the charachter details json
        this is a fairly large amount of data to move across the network
        """
        matches = self.get_charachter_matches(id)
        results = []
        paginated_matches = self.get_sets_of_100(matches)
        for set in paginated_matches:
            dynamodb = boto3.resource('dynamodb')
            result = dynamodb.batch_get_item(
                RequestItems={
                    os.getenv('TABLE_NAME'): {
                        'Keys': set
                    }
                }
            )
            results = results + result['Responses'][os.getenv('TABLE_NAME')]
        return results

    def check_recently_crawled(self, id: str) -> bool:
        """
        given an id, this function will check if it has
        been crawled already in the last 24 hours. If so,
        it will return True. False otherwise.
        """
        result = self.table.get_item(Key={
            'id': id,
            'date': 'null'
        })
        if 'Item' not in result:
            return False
        one_day = 1000 * 60 * 60 * 24
        if float(result['Item']['crawl_last_completed']) - time.time() < one_day:
            return True
        else:
            return False

def instantiate_table() -> MatchesTable:
    table_name = os.getenv('TABLE_NAME')
    print("this is the table name", table_name)
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(table_name)
    return MatchesTable(table)
    