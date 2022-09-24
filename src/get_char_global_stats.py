import json
from util import capitalize_id
import requests
from user_agents import user_agent_rotator
from bs4 import BeautifulSoup
from responses import NotFoundResponse


def get_global_char_stats(event, context):
    pass
    print('getting char global stats')
    try:
        id = capitalize_id(event['pathParameters']['id'])
        split = id.split("@")
        char = split[0]
        realm = split[1]

        content = get_data_from_warmane(char, realm)
        if (type(content) == NotFoundResponse):
            return content
        stats = parse_data(content)
        return {
            "statusCode": 200,
            "body": json.dumps(stats),
        }
    except Exception as err:
        return {
            "statusCode": 500,
            "body": json.dumps({'message': 'there was some kind of error ' + str(err)})
        }


def get_data_from_warmane(charachter: str, realm: str):
    url = "http://armory.warmane.com/character/{0}/{1}/statistics".format(
        charachter, realm)
    user_agent = user_agent_rotator.get_random_user_agent()
    headers = {
        'User-Agent': user_agent
    }
    data = {
        "category": 152
    }
    response = requests.post(headers=headers, url=url, data=data)

    if "Page not found" in str(response.content):
        return NotFoundResponse()

    j = json.loads(response.content)
    content = j['content']
    content = content.replace("\n", "")
    content = content.replace("\\", "")
    return content


def parse_data(content: str):
    soup = BeautifulSoup(content, 'html.parser')
    rows = soup.find_all('tr')
    result = {}
    for row in rows:
        tableDatas = row.find_all('td')
        if len(tableDatas) == 2:
            key = str(tableDatas[0].text).lower().strip().replace(" ", "_")
            result[key] = tableDatas[1].text
    return result
