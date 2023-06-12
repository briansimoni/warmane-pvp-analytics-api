import Bottleneck from "bottleneck";
import { CharacterId, CharacterName, Realm } from "../types";
import { CharacterDetail, MatchDetails, MatchSummary } from "./crawler";
import axios from "axios";
import { randomUserAgent } from "../random_user_agent";
import * as cheerio from "cheerio";
import { logger } from "../util/logger";

export class WarmaneCrawlerV2 {
  private rateLimiter: Bottleneck;
  private characterMap: Record<CharacterId, MatchDetails[]>;

  constructor() {
    this.rateLimiter = new Bottleneck({
      maxConcurrent: 10,
    });
    this.characterMap = {};
  }

  public async crawl(params: { character: CharacterName; realm: Realm }) {
    const id: CharacterId = `${params.character}@${params.realm}`;
    const matchSummaryHtml = await this.getMatchList(params);
    this.parseMatchSummaryResponse(params, matchSummaryHtml);
    await this.getCharacterDetails(params);
    this.characterMap[id].forEach((detail) =>
      this.parseCharacterDetailsResponse(
        detail.character_details,
        detail.matchId,
        id
      )
    );
    return this.characterMap[id];
  }

  private async getMatchList(params: {
    character: CharacterName;
    realm: Realm;
  }) {
    const response = await axios.get(
      `https://armory.warmane.com/character/${params.character}/${params.realm}/match-history`,
      {
        headers: {
          "User-Agent": randomUserAgent(),
        },
      }
    );

    return response.data;
  }

  private async getCharacterDetails(params: {
    character: CharacterName;
    realm: Realm;
  }) {
    const { character, realm } = params;
    const id: CharacterId = `${character}@${realm}`;

    const fetchMatchData = async function (
      matchId: string
    ): Promise<CharacterDetail[]> {
      const { character, realm } = params;
      // await sleep(5000);
      const userAgent = randomUserAgent();
      try {
        logger.info(`getting matchId ${matchId} for ${character} on ${realm}`);
        // if (matchId === "26819547") {
        //   throw new Error("something stupid happened");
        // }
        const response = await axios.post<CharacterDetail[]>(
          `https://armory.warmane.com/character/${character}/${realm}/match-history`,
          `matchinfo=${matchId}`,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "User-Agent": randomUserAgent(),
            },
          }
        );
        this.characterMap[id].find((match) => match.matchId === matchId);
        return response.data;
      } catch (error) {
        if (error instanceof Error) {
          logger.error({
            msg: `error getting ${matchId} for ${character} on ${realm}`,
            matchId: matchId,
            userAgent,
            error,
          });
        }
        throw error;
      }
    };
    const promises = this.characterMap[id].map((summary) =>
      this.rateLimiter.schedule(() => fetchMatchData(summary.matchId))
    );

    // should we use allSettled???
    await Promise.all(promises);
  }

  private parseMatchSummaryResponse(
    params: { character: CharacterName; realm: Realm },
    html: string
  ) {
    const id: CharacterId = `${params.character}@${params.realm}`;
    const $ = cheerio.load(html);
    const matchSummaries: (MatchSummary & {
      id: CharacterId;
      character_details: CharacterDetail[];
    })[] = [];

    $("table#data-table-history tbody tr").each((_index, element) => {
      const matchId = $(element).find("td:nth-child(1)").text().trim();
      const outcome = $(element).find("td:nth-child(3)").text().trim();
      const points_change = $(element).find("td:nth-child(4)").text().trim();
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

      const matchSummary: MatchSummary & {
        id: CharacterId;
        character_details: CharacterDetail[];
      } = {
        matchId,
        team_name,
        date,
        bracket,
        arena,
        points_change,
        outcome,
        duration,
        id,
        character_details: [],
      };

      matchSummaries.push(matchSummary);
    });

    this.characterMap[id] = matchSummaries;
  }

  private parseCharacterDetailsResponse(
    characterDetails: CharacterDetail[],
    matchId: string,
    id: CharacterId
  ) {
    characterDetails.forEach((characterDetail: CharacterDetail) => {
      characterDetail.teamnamerich = characterDetail.teamnamerich.replace(
        /<[^>]+>/g,
        ""
      );

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

      // finds corresponding 'matchSummary' object
      // const matchSummary = this.characterMap[id].find(
      //   (summary) => summary.matchId === matchId
      // );

      // if (matchSummary?.character_details) {
      //   matchSummary.character_details = characterDetails;
      // }

      // combines fetched match data w/ corresponding 'matchSummary' object
      // if (matchSummary) {
      //   const matchDetails: MatchDetails = {
      //     ...matchSummary,
      //     id, //TODO make a util function for this
      //     character_details: characterDetails,
      //   };

      // }
    });
  }
}
