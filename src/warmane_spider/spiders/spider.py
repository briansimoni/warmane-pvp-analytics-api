import scrapy
import json
from scrapy.loader import ItemLoader

class WarmaneSpider(scrapy.Spider):
    name = "warmane"
    # character_name = 'Dumpster'
    match_history = {}

    # def __init__(self):
    #     self.character_name = self.settings['CHAR']

    def start_requests(self):
        urls = [
            'https://armory.warmane.com/character/{0}/Blackrock/match-history'.format(self.settings['CHAR']),
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # print(f"Existing settings: {self.settings.attributes.keys()}")
        matches = response.css('tr')
        response.css('tr')[1].css('td')[2].css('::text').get()
        matches = matches[1:] # removes the table header row
        
        for match in matches:
            id = match.css('td')[0].css('::text').get()
            # self.logger.info(id)
            data = {
                'id': id,
                'outcome': match.css('td')[1].css('::text').get(),
                'outcome': match.css('td')[2].css('::text').get(),
                'points_change': match.css('td')[3].css('::text').get(),
                'start_time' : match.css('td')[4].css('::text').get(),
                'duration': match.css('td')[5].css('::text').get(),
                'map': match.css('td')[6].css('::text').get(),
            }
            self.match_history[id] = data

            url = 'https://armory.warmane.com/character/{0}/Blackrock/match-history'.format(self.settings['CHAR'])
            body = {'matchinfo': data['id']}
            yield scrapy.FormRequest(method='POST', url=url, callback=self.parse_details, formdata=body)

        # next_page = response.css('li.next a::attr(href)').get()
        # if next_page is not None:
        #     next_page = response.urljoin(next_page)
        #     yield scrapy.Request(next_page, callback=self.parse)

    def parse_details(self, response):
        # from scrapy.shell import inspect_response
        # inspect_response(response, self)
        id = response.request.body.decode().split('=')[1]
        json_resposne = json.loads(response.text)
        self.match_history[id]['character_details'] = json_resposne
        # self.logger.info(self.match_history[id])
        yield self.match_history[id]