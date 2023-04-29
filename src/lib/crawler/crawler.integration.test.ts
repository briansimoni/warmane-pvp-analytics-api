import { WarmaneCrawler } from "./crawler";

describe("crawler integration tests", () => {
  const character = "Dumpster";
  const realm = "Blackrock";

  // increasing timeout to allow requests to complete
  jest.setTimeout(30000);

  test("The crawler can return a list of match summaries with requests", async () => {
    const crawler = new WarmaneCrawler();
    const matchSummaries = await crawler.getMatchSummaries({
      character,
      realm,
    });

    expect(matchSummaries.length).toBeGreaterThan(0);
    expect(matchSummaries[0]).toHaveProperty("matchId");
  });

  test("The crawler can return match details with requests", async () => {
    const crawler = new WarmaneCrawler();
    const matchSummaries = await crawler.getMatchSummaries({
      character,
      realm,
    });

    const matchDetailsList = await crawler.getMatchDetails({
      character,
      realm,
      matchSummaries,
    });

    expect(matchDetailsList.length).toBeGreaterThan(0);
    expect(matchDetailsList[0]).toHaveProperty("character_details");
    expect(matchDetailsList[0].character_details.length).toBeGreaterThan(0);
    expect(matchDetailsList[0].character_details[0]).toHaveProperty("charname");
    expect(matchDetailsList[0].character_details[0]).toHaveProperty("realm");
  });

  test("The crawler can fetch all match details given 'character' and 'realm' as input", async () => {
    const crawler = new WarmaneCrawler();
    const matchDetailsList = await crawler.fetchAllMatchDetails({
      character,
      realm,
    });

    expect(matchDetailsList.length).toBeGreaterThan(0);
    expect(matchDetailsList[0]).toHaveProperty("matchId");
    expect(matchDetailsList[0]).toHaveProperty("character_details");
    expect(matchDetailsList[0].character_details.length).toBeGreaterThan(0);
    expect(matchDetailsList[0].character_details[0]).toHaveProperty("charname");
    expect(matchDetailsList[0].character_details[0]).toHaveProperty("realm");
  });
});
