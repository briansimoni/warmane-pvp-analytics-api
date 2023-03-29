import axios from "axios";
import * as cheerio from "cheerio";

export interface MatchDetails {
  team_name: string;
  date: string;
  bracket: string;
  arena: string;
  points_change: string;
  character_details: CharacterDetail[]; // | undefined[]; I don't think it can be undefined
  id: string;
  outcome: string;
  duration: string;
  team?: string;
}

export interface CharacterDetail {
  matchmaking_change?: string;
  healingDone: string;
  race?: string;
  gender?: string;
  killingBlows: string;
  teamnamerich: string;
  realm: string;
  damageDone: string;
  charname: string;
  class?: string;
  deaths: string;
  personal_change: string;
  teamname: string;
}

// defining Crawler interface
export interface Crawler {
  getMatchIds(params: { character: string; realm: string }): Promise<string[]>;
  getMatchDetails(params: { matchIds: string[] }): Promise<MatchDetails[]>;
}

// implementing the Crawler interface in the WarmaneCrawler class
export class WarmaneCrawler implements Crawler {
  async getMatchIds(params: {
    character: string;
    realm: string;
  }): Promise<string[]> {
    // Fetching the HTML using axios
    const response = await axios.get(
      `https://armory.warmane.com/character/${params.character}/${params.realm}/match-history`
    );
    const html: string = response.data;

    // loading fetched HTML into Cheerio object
    const $ = cheerio.load(html);
    const matchIds: string[] = [];

    $("table#data-table-history tbody tr").each((_index, element) => {
      const matchId = $(element).find("td:first-child").text().trim();
      matchIds.push(matchId);
    });

    return matchIds;
  }

  async getMatchDetails(params: {
    matchIds: string[];
  }): Promise<MatchDetails[]> {
    throw new Error("Method not implemented.");
  }
}
