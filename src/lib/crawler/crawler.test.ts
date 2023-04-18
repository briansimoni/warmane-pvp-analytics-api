import {
  WarmaneCrawler,
  MatchSummary,
  MatchDetails,
  CharacterDetail,
} from "./crawler";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import Bottleneck from "bottleneck";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("crawler tests", () => {
  test("The crawler can return a list of match summaries (which contain match IDs) when provided an HTML document containing a given player's match information.", async () => {
    const testHtml = fs.readFileSync(
      path.resolve(__dirname, "test.html"),
      "utf-8"
    );

    mockedAxios.get.mockImplementation(async () => ({
      data: testHtml,
    }));

    const crawler = new WarmaneCrawler();
    const matchSummaries = await crawler.getMatchSummaries({
      character: "SomeCharacter",
      realm: "Blackrock",
    });

    expect(matchSummaries.length).toBe(22);
    expect(matchSummaries.map((summary) => summary.matchId)).toEqual(
      expect.arrayContaining(["24671286", "25750028"])
    );
  });

  test("WarmaneCrawler does not exceed 32 concurrent operations", async () => {
    const originalFetchMatchData = WarmaneCrawler.prototype.fetchMatchData;

    const testLimiter = new Bottleneck({ maxConcurrent: 32 });

    WarmaneCrawler.prototype.fetchMatchData = jest.fn(
      testLimiter.wrap(async (matchId: string) => {
        return [] as CharacterDetail[];
      })
    );

    const matchSummaries = Array.from({ length: 10 }, (_, i) => ({
      matchId: String(i),
      team_name: "",
      date: "",
      bracket: "",
      arena: "",
      points_change: "",
      outcome: "",
      duration: "",
    }));

    const crawler = new WarmaneCrawler();
    const matchDetailsPromises = crawler.getMatchDetails({
      character: "SomeCharacter",
      realm: "Blackrock",
      matchSummaries,
    });

    // tracking ongoing requests
    let ongoingRequests = 0;
    let maxOngoingRequests = 0;

    WarmaneCrawler.prototype.fetchMatchData = jest.fn(
      async (matchId: string) => {
        ongoingRequests++;
        maxOngoingRequests = Math.max(maxOngoingRequests, ongoingRequests);
        const result = await originalFetchMatchData.call(crawler, matchId);
        ongoingRequests--;
        return result;
      }
    );

    await matchDetailsPromises;

    expect(maxOngoingRequests).toBeLessThanOrEqual(32);

    // restoring  original fetchMatchData method
    WarmaneCrawler.prototype.fetchMatchData = originalFetchMatchData;
  });

  test("The crawler can return a user-readable & database-ready list of match summaries and character details when provided an HTML document and JSON data", async () => {
    const testHtml = fs.readFileSync(
      path.resolve(__dirname, "test.html"),
      "utf-8"
    );
    const testJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "test.json"), "utf-8")
    );

    mockedAxios.get.mockImplementation(async () => ({
      data: testHtml,
    }));

    mockedAxios.post.mockImplementation(async () => ({
      data: testJson,
    }));

    const crawler = new WarmaneCrawler();
    const matchSummaries = await crawler.getMatchSummaries({
      character: "SomeCharacter",
      realm: "Blackrock",
    });

    const matchDetailsList = await crawler.getMatchDetails({
      character: "SomeCharacter",
      realm: "Blackrock",
      matchSummaries,
    });

    expect(matchDetailsList.length).toBeGreaterThan(0);
    expect(matchDetailsList[0]).toHaveProperty("character_details");
    expect(matchDetailsList[0].character_details.length).toBeGreaterThan(0);
    const firstMatchDetails = matchDetailsList[0];
    if (firstMatchDetails && firstMatchDetails.character_details.length > 0) {
      expect(firstMatchDetails.character_details[0]).toHaveProperty("charname");
      expect(firstMatchDetails.character_details[0]).toHaveProperty("realm");
    } else {
      fail("No character_details found in the first matchDetails item");
    }
  });
});
