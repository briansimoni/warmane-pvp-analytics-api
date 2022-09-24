from util import capitalize_id
import unittest


class TestUtil(unittest.TestCase):

    def test_capitalize_id(self):
        id = "dumpster@Blackrock"
        result = capitalize_id(id)
        self.assertEquals(result, "Dumpster@Blackrock")

        id = "Dumpster@Blackrock"
        result = capitalize_id(id)
        self.assertEquals(result, "Dumpster@Blackrock")

        id = "Dumpster@blackrock"
        result = capitalize_id(id)
        self.assertEquals(result, "Dumpster@Blackrock")

        id = "dumpster@blackrock"
        result = capitalize_id(id)
        self.assertEquals(result, "Dumpster@Blackrock")
