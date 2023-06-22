export type CharacterName = string;

export const Realms = ["Blackrock", "Icecrown", "Lordaeron"] as const;

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
