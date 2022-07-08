import aiohttp
import asyncio
import json
from bs4 import BeautifulSoup
import re

class ArenasCollector():
    def __init__(self, character: str, realm: str) -> None:
        self.url = 'https://armory.warmane.com/character/{0}/{1}/match-history'.format(character, realm)
        self.matches = {}

    def parse_matches(self, html: str):
        soup = BeautifulSoup(html, 'html.parser')
        rows = soup.find_all('tr')
        rows = rows[1:]
        for row in rows:
            table_data = row.find_all('td')
            id = table_data[0].text
            team = table_data[1].find('a').text
            bracket = re.findall("\(.*\)", team)[0].strip()
            team_name = re.findall("\w+", team)[0].strip()

            self.matches[id] = {
                'id': id,
                'team': table_data[1].find('a').text,
                'team_name': team_name,
                'bracket': bracket,
                'outcome': table_data[2].text,
                'points_change': table_data[3].text,
                'date': table_data[4].text,
                'duration': table_data[5].text,
                'arena': table_data[6].text
            }

    async def get_match_ids(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(self.url) as response:
                html = await response.text()
                self.parse_matches(html)
                    

    async def get_match_data(self, session: aiohttp.ClientSession, match_id: str):
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36'
            }
            data = {
                'matchinfo': match_id
            }
            async with session.post(url=self.url, headers=headers, data=data) as response:
                # warmane incorrectly sends text/html as the mime type. The content is really JSON
                # an exception will be encountered if you try to "await response.json()"
                text =  await response.text()
                j = json.loads(text)
                self.matches[match_id]['character_details'] = j

    async def get_all_matches(self, session: aiohttp.ClientSession) -> list[dict]:
        tasks = []
        for match in self.matches.keys():
            task = asyncio.create_task(self.get_match_data(session, match))
            tasks.append(task)
        results = await asyncio.gather(*tasks)
        return self.matches

    def get_dynamo_key_list(self) -> list[dict]:
        keys = []
        for match in self.matches:
            key = {
                'id': match,
                'date':  self.matches[match]['date']
            }
            keys.append(key)
        return keys

    async def run(self):
        await self.get_match_ids()
        async with aiohttp.ClientSession() as session:
            data = await self.get_all_matches(session)
            return data
