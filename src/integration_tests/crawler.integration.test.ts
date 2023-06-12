import { WarmaneCrawler } from "../lib/crawler/crawler";
import { WarmaneCrawlerV2 } from "../lib/crawler/crawlerV2";

describe("crawler integration tests", () => {
  const character = "Dumpster";
  const realm = "Blackrock";

  // increasing timeout to allow requests to complete
  jest.setTimeout(3000000);

  test("The crawler can fetch all match details given 'character' and 'realm' as input", async () => {
    const crawler = new WarmaneCrawler();
    const v2 = new WarmaneCrawlerV2();
    // const matchDetailsList = await crawler.fetchAllMatchDetails({
    //   character,
    //   realm,
    // });

    const matchDetailsList = await v2.crawl({
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
