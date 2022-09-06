def capitalize_id(id: str) -> str:
    components = id.split("@")
    char = components[0]
    realm = components[1]
    return char.capitalize() + "@" + realm.capitalize()
