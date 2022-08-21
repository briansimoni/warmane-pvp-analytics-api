import json


class NotFoundResponse(dict):
    def __init__(self, message="resource not found", *args, **kwargs):
        super(NotFoundResponse, self).__init__(*args, **kwargs)
        self["statusCode"] = 404
        self["body"] = {
            "message": message
        }


class MethodNotAllowed(dict):
    def __init__(self, message="method not allowed", *args, **kwargs):
        super(MethodNotAllowed, self).__init__(*args, **kwargs)
        self["statusCode"] = 405
        self["body"] = {
            "message": message
        }


class InternalServerError(dict):
    def __init__(self, message="internal server error", *args, **kwargs):
        super(InternalServerError, self).__init__(*args, **kwargs)
        self["statusCode"] = 500
        self["body"] = {
            "message": message
        }


class NoContent(dict):
    def __init__(self, message="no content", *args, **kwargs):
        super(NoContent, self).__init__(*args, **kwargs)
        self["statusCode"] = 200
        self["body"] = {
            "message": message
        }


class JsonResponse(dict):
    def __init__(self, body={}, *args, **kwargs):
        super(JsonResponse, self).__init__(*args, **kwargs)
        self["statusCode"] = 200
        self["body"] = body


class CorsHeadersResponse(dict):
    def __init__(self, origin: str, *args, **kwargs):
        super(CorsHeadersResponse, self).__init__(*args, **kwargs)
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:4000",
            "https://warmane.dog"
        ]
        print("generatoring cors response")
        if origin in allowed_origins:
            self["headers"] = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
                "Access-Control-Allow-Headers": "Content-Type,content-type"
            }
        self["statusCode"] = 200
