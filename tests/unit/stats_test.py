from get_char_global_stats import get_data_from_warmane, parse_data
import unittest


class TestStats(unittest.TestCase):

    def test_get_request(self):
        result = get_data_from_warmane("Dumpster", "Blackrock")
        self.assertEquals("<tr>" in result, True)

    def test_get_request_404(self):
        result = get_data_from_warmane("chingchongbingbonger", "Blackrock")
        self.assertEquals(result["statusCode"], 404)

    def test_parse_data(self):
        content = get_data_from_warmane("Dumpster", "Blackrock")
        result = parse_data(content)
        self.assertEquals(result['highest_5_man_team_rating'], "2356")
