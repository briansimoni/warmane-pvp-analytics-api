
import re

from responses import CorsHeadersResponse, InternalServerError, MethodNotAllowed, NotFoundResponse


class Router:
    def __init__(self):
        self.routes = {
            "GET": {},
            "POST": {},
            "PUT": {},
            "DELETE": {}
        }

    def get(self, path: str, func):
        self.routes["GET"][path] = func

    def post(self, path: str, func):
        self.routes["POST"][path] = func

    def put(self, path: str, func):
        self.routes["PUT"][path] = func
    
    def delete(self, path: str, func):
        self.routes["DELETE"][path] = func

    def __get_path_params(self, registered_path: str, path: str) -> dict:
        keys = {}
        params = {}
        registered_path_split = registered_path.split('/')
        for i in range(len(registered_path_split)):
            # checking for a thing like /person/:id
            match = re.search(':([a-zA-Z0-9]+)', registered_path_split[i])
            if match:
                keys[i] = match.groups()[0] # this will probably break if multiple path params

        path_split = path.split('/')
        for i in range(len(path_split)):
            if i in keys:
                params[keys[i]] = path_split[i]

        return params

    # should return the registered path, not the request path
    def __check_path_registered(self, method: str, path: str) -> str:
        try:
            for registered_path in self.routes[method]:
                registered_path_split = registered_path.split('/')
                path_split = path.split('/')
                l = min(len(registered_path_split), len(path_split))
                match = True
                for i in range(l):
                    path_param = re.search(':([a-zA-Z0-9]+)', registered_path_split[i])
                    if path_param or registered_path_split[i] == path_split[i]:
                        continue
                    elif registered_path_split[i] != path_split[i]:
                        match = False
                if match:
                    return registered_path
            return ""
        except Exception as e:
            print("there was something wrong while path matching", e)
            return ""


    def serve(self, event, context):
        try:
            method = event['httpMethod']
            path = event['path']

            if method == 'OPTIONS':
                return CorsHeadersResponse(origin=event['headers']['origin'])

            if method not in self.routes:
                return MethodNotAllowed()
            
            registered_path_match = self.__check_path_registered(method, path)
            if registered_path_match:
                path_params = self.__get_path_params(registered_path_match, path)
                event['pathParameters'] = path_params
                return self.routes[method][registered_path_match](event, context)
            else:
                return NotFoundResponse()
        except Exception as e:
            print(e)
            return InternalServerError

