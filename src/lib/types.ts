export type CharacterName = string;

export const Realms = ["Blackrock", "Icecrown", "Lordaeron"] as const;

export type Realm = (typeof Realms)[number];

export type CharacterId = `${CharacterName}@${Realm}`;
