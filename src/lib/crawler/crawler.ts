import axios from "axios";
import * as cheerio from "cheerio";
import Bottleneck from "bottleneck";

// provided by initial GET call w/ character name & realm
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

// provided by secondary POST call w/ match ID
export interface CharacterDetail {
  realm: string;
  charname: string;
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

// MatchSummary & CharacterDetail merged
export interface MatchDetails {
  matchId: string;
  team_name: string;
  bracket: string;
  outcome: string;
  points_change: string;
  date: string;
  duration: string;
  arena: string;
  character_details: CharacterDetail[];
  // team?: string; // does team_name make this superfluous?
}

// defining Crawler interface
export interface Crawler {
  getMatchSummaries(params: {
    character: string;
    realm: string;
  }): Promise<MatchSummary[]>;
  getMatchDetails(params: {
    character: string;
    realm: string;
    matchSummaries: MatchSummary[];
  }): Promise<MatchDetails[]>;
}

// exporting crawler
export class WarmaneCrawler implements Crawler {
  // fetches match history HTML w/ GET request, returns HTML as string
  async fetchMatchHistoryHTML(params: {
    character: string;
    realm: string;
  }): Promise<string> {
    const response = await axios.get(
      `https://armory.warmane.com/character/${params.character}/${params.realm}/match-history`
    );
    return response.data;
  }

  // parses fetched HTML w/ Cheerio, makes array of MatchSummary objects with extracted info
  extractMatchSummaries(html: string): MatchSummary[] {
    const $ = cheerio.load(html);
    const matchSummaries: MatchSummary[] = [];

    $("table#data-table-history tbody tr").each((_index, element) => {
      const matchId = $(element).find("td:nth-child(1)").text().trim();
      const outcome = $(element).find("td:nth-child(3)").text().trim();
      const points_change = $(element).find("td:nth-child(4)").text().trim(); //? todo?
      const date = $(element).find("td:nth-child(5)").text().trim();
      const duration = $(element).find("td:nth-child(6)").text().trim();
      const arena = $(element).find("td:nth-child(7)").text().trim();
      const teamBracketText = $(element)
        .find("td:nth-child(2) a")
        .text()
        .trim();
      const teamBracketRegex = /(.*?)\s*\((\d+v\d+)\)/;
      let team_name = "";
      let bracket = "";

      if (teamBracketText) {
        const teamBracketMatch = teamBracketText.match(teamBracketRegex);

        if (teamBracketMatch) {
          team_name = teamBracketMatch[1];
          bracket = teamBracketMatch[2];
        }
      }
      // creates object with extracted match data
      const matchSummary: MatchSummary = {
        matchId,
        team_name,
        date,
        bracket,
        arena,
        points_change,
        outcome,
        duration,
      };
      // pushes each match's object to array
      matchSummaries.push(matchSummary);
    });

    return matchSummaries;
  }

  // calls fetchMatchHistoryHTML() & extractMatchSummaries()
  async getMatchSummaries(params: {
    character: string;
    realm: string;
  }): Promise<MatchSummary[]> {
    const html = await this.fetchMatchHistoryHTML(params);
    const matchSummaries = this.extractMatchSummaries(html);
    return matchSummaries;
  }

  // fetches match data for a given match ID, returns data as object
  async fetchMatchData(matchId: string): Promise<CharacterDetail[]> {
    const response = await axios.post(
      "https://armory.warmane.com/character/Dumpster/Blackrock/match-history",
      `matchinfo=${matchId}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36",
        },
      }
    );

    return response.data;
  }

  // responsible for fetching match details using the match IDs of each given matchSummaries array, combining the details to create a single object, and restricting concurrent operations to 32
  async getMatchDetails(params: {
    character: string;
    realm: string;
    matchSummaries: MatchSummary[];
  }): Promise<MatchDetails[]> {
    // extracts match IDs from 'matchSummaries' array
    const matchIds = params.matchSummaries.map((summary) => summary.matchId);
    // creates empty array for 'matchDetails' objects
    const matchDetailsList: MatchDetails[] = [];

    // initializes new Bottleneck instance to control concurrency
    const limiter = new Bottleneck({ maxConcurrent: 32 });

    // creates limited 'fetchMatchData()' by wrapping original with limiter
    const limitedFetchMatchData = limiter.wrap(this.fetchMatchData.bind(this));

    // iterates through each match ID, calling 'limitedFetchMatchData()' on each
    for (const matchId of matchIds) {
      const characterDetails = await limitedFetchMatchData(matchId);

      // formats JSON response (removing HTML, organizing)
      characterDetails.forEach((characterDetail: CharacterDetail) => {
        // formats teamnamerich
        characterDetail.teamnamerich = characterDetail.teamnamerich.replace(
          /<[^>]+>/g,
          ""
        );

        // RegEx: matchmaking_change & personal_change
        const overallRegex = /(-?\d{1,})(?=\s*\(<span)/;
        const changeRegex = /((\+|-)\d+)(?=<\/span)/;

        // formats matchmaking_change
        if (characterDetail.matchmaking_change) {
          const mmChangeMatch =
            characterDetail.matchmaking_change.match(changeRegex);
          const mmOverallMatch =
            characterDetail.matchmaking_change.match(overallRegex);
          if (mmChangeMatch && mmOverallMatch) {
            characterDetail.matchmaking_change = `${mmChangeMatch[0]} (${mmOverallMatch[0]})`;
          }
        }

        // formats personal_change
        if (characterDetail.personal_change) {
          const personalChangeMatch =
            characterDetail.personal_change.match(changeRegex);
          const personalOverallMatch =
            characterDetail.personal_change.match(overallRegex);
          if (personalChangeMatch && personalOverallMatch) {
            characterDetail.personal_change = `${personalChangeMatch[0]} (${personalOverallMatch[0]})`;
          }
        }
      });

      // finds corresponding 'matchSummary' object
      const matchSummary = params.matchSummaries.find(
        (summary) => summary.matchId === matchId
      );

      // combines fetched match data with corresponding 'matchSummary' object to create 'matchDetails' object
      if (matchSummary) {
        const matchDetails: MatchDetails = {
          ...matchSummary,
          character_details: characterDetails,
        };

        console.log(matchDetailsList, characterDetails); //*dev use
        // creates array of 'matchDetails' objects
        matchDetailsList.push(matchDetails);
      }
    }
    return matchDetailsList;
  }
}
