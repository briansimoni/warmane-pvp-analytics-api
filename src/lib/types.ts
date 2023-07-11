export type CharacterName = string;

export const Realms = [
  "Blackrock",
  "Icecrown",
  "Lordaeron",
  "Frostmourne",
] as const;

export type Realm = (typeof Realms)[number];

export type CharacterId = `${CharacterName}@${Realm}`;

export interface MatchSummary {
  matchId: string;
  team_name: string;
  bracket: string;
  outcome: string;
  points_change: string;
  date: string;
  duration: string;
  arena: string;
}

export interface CharacterDetail {
  realm: Realm;
  charname: CharacterName;
  class?: string;
  race?: string;
  gender?: string;
  teamname: string;
  teamnamerich: string;
  damageDone: string;
  deaths: string;
  healingDone: string;
  killingBlows: string;
  matchmaking_change?: string;
  personal_change: string;
}

/*
 * MatchDetails is an aggregate of all data that the crawler collects
 * for a given matchId. These objects are intended to be stored
 * long-term in some kind of database for further use and analysis.
 */
export interface MatchDetails {
  id: CharacterId;
  matchId: string;
  team_name: string;
  bracket: string;
  outcome: string;
  points_change: string;
  date: string;
  duration: string;
  arena: string;
  character_details: CharacterDetail[];
}

export interface CrawlerInput {
  name: string;
  realm: Realm;
  /** root should indicate that this is coming from the API and not a recursive call */
  root: boolean;
}
export interface ArenaStats {
  "Arenas won"?: number;
  "Arenas played"?: number;
  "5v5 matches"?: number;
  "5v5 victories"?: number;
  "3v3 matches"?: number;
  "3v3 victories"?: number;
  "2v2 matches"?: number;
  "2v2 victories"?: number;
  "Circle of Blood matches"?: number;
  "Circle of Blood victories"?: number;
  "Dalaran Sewers matches"?: number;
  "Dalaran Sewers victories"?: number;
  "Ring of Trials matches"?: number;
  "Ring of Trials victories"?: number;
  "Ring of Valor matches"?: number;
  "Ring of Valor victories"?: number;
  "Ruins of Lordaeron matches"?: number;
  "Ruins of Lordaeron victories"?: number;
  "Highest 5 man personal rating"?: number;
  "Highest 3 man personal rating"?: number;
  "Highest 2 man personal rating"?: number;
  "Highest 5 man team rating"?: number;
  "Highest 3 man team rating"?: number;
  "Highest 2 man team rating"?: number;
}
