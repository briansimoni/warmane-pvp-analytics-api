import Bottleneck from "bottleneck";
import {
  CharacterDetail,
  CharacterId,
  CharacterName,
  MatchDetails,
  MatchSummary,
  Realm,
} from "../types";
import axios from "axios";
import { randomUserAgent } from "../random_user_agent";
import * as cheerio from "cheerio";
import { logger } from "../util/logger";

/**
 * WarmaneCrawlerV2 provides a slightly simpler API, supports partial results
 * in the event of errors, allows the caller to specify concurrency options
 */
export class WarmaneCrawler {
  private rateLimiter: Bottleneck;

  constructor(params: { maxConcurrent?: number; minTime?: number }) {
    // constructs the rate limited with default values if not specified
    const { maxConcurrent = 16, minTime = 0 } = params;
    this.rateLimiter = new Bottleneck({
      maxConcurrent,
      minTime,
    });
  }

  public async crawl(params: {
    character: CharacterName;
    realm: Realm;
  }): Promise<MatchDetails[]> {
    const matchSummaryHtml = await this.getMatchSummaryHtml(params);
    const matchSummaries = this.parseMatchSummaryResponse(
      params,
      matchSummaryHtml
    );
    return await this.getMatchDetailsConcurrently({
      ...params,
      matchSummaries: matchSummaries,
    });
  }

  private async getMatchDetailsConcurrently(params: {
    character: CharacterName;
    realm: Realm;
    matchSummaries: MatchSummary[];
  }): Promise<MatchDetails[]> {
    const matchDetailsPromises = params.matchSummaries.map((summary) =>
      this.rateLimiter.schedule(() =>
        this.getMatchDetails({
          character: params.character,
          realm: params.realm,
          summary,
        })
      )
    );

    const matchDetails = await Promise.all([
      ...matchDetailsPromises,
      this.logConcurrencyStats(),
    ]);

    return matchDetails.filter(
      (detail) => detail !== undefined
    ) as MatchDetails[];
  }

  private async getMatchDetails(params: {
    character: CharacterName;
    realm: Realm;
    summary: MatchSummary;
  }): Promise<MatchDetails | undefined> {
    const { character, realm, summary } = params;
    const matchId = summary.matchId;
    const characterDetails = await this.getCharacterDetails({
      character,
      realm,
      matchId,
    });

    if (!characterDetails) {
      return;
    }

    const matchDetails: MatchDetails = {
      id: `${character}@${realm}`,
      ...summary,
      character_details: characterDetails,
    };
    return matchDetails;
  }

  /**
   * Downloads the HTML document from the warmane armory that lists all of the games that
   * a given character has played in the current arena season
   */
  private async getMatchSummaryHtml(params: {
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

  /**
   * Given a character name, realm, and matchId, get the details for each character for that match.
   * If there is some error, it will return undefined
   */
  private async getCharacterDetails(params: {
    character: CharacterName;
    realm: Realm;
    matchId: string;
  }): Promise<CharacterDetail[] | undefined> {
    const { character, realm, matchId } = params;
    const userAgent = randomUserAgent();
    try {
      logger.info(`getting matchId ${matchId} for ${character} on ${realm}`);
      const response = await axios.post<CharacterDetail[]>(
        `https://armory.warmane.com/character/${character}/${realm}/match-history`,
        `matchinfo=${matchId}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": randomUserAgent(),
          },
        }
      );
      const characterDetails = response.data;
      this.parseCharacterDetailsResponse(characterDetails);
      return characterDetails;
    } catch (error) {
      if (error instanceof Error) {
        logger.error({
          msg: `error getting ${matchId} for ${character} on ${realm}`,
          matchId: matchId,
          userAgent,
          error,
        });
      } else {
        throw error;
      }
    }
  }

  private parseMatchSummaryResponse(
    params: { character: CharacterName; realm: Realm },
    html: string
  ): MatchSummary[] {
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

    return matchSummaries;
  }

  /**
   * logConcurrencyStats will emit logs that show the current job counts.
   * This function will continue to log the counts at the specified interval (default 100 ms)
   * until all of the jobs have completed
   *
   * example log emitted:
   * "crawler rate limiter counts: { RECEIVED: 0, QUEUED: 6, RUNNING: 8, EXECUTING: 0 }"
   */
  private async logConcurrencyStats(time = 100) {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const counts = this.rateLimiter.counts();
        logger.info(`crawler rate limiter counts:`, counts);
        const done = this.rateLimiter.empty();
        if (done) {
          logger.info("rate limiter finished processing requests");
          clearInterval(interval);
          resolve(undefined);
        }
      }, time);
    });
  }

  private parseCharacterDetailsResponse(characterDetails: CharacterDetail[]) {
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
    });
  }
}
