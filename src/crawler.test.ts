import { GetCharacterRequestParams } from "./api/validators";
import { handleCrawlerRequests } from "./crawler";
import { crawlerStateStore, matchDetailsStore } from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import { MatchDetails, Realm } from "./lib/types";

describe("crawler lambda handler tests", () => {
  /**
   * SQS operates in batches by default. We should make the code resilient by assuming
   * that this is indeed the behavior. In other words, we should assume it's possible
   * to get two requests to invoke the crawler in one lambda invocation
   */
  test("it should perform a crawl for all of the requests in the batch", async () => {
    const crawlerMock = jest.fn(
      async (params: {
        character: string;
        realm: Realm;
      }): Promise<MatchDetails[]> => [
        {
          id: `${params.character}@${params.realm}`,
          character_details: [],
          matchId: "123",
          team_name: "asdf",
          bracket: "2s",
          outcome: "W",
          arena: "Nagrand",
          points_change: "123",
          duration: "5432",
          date: "sometime",
        },
        {
          id: `${params.character}@${params.realm}`,
          character_details: [],
          matchId: "123",
          team_name: "asdf",
          bracket: "2s",
          outcome: "W",
          arena: "Nagrand",
          points_change: "123",
          duration: "5432",
          date: "sometime",
        },
      ]
    );
    WarmaneCrawler.prototype.crawl = crawlerMock;

    const databaseMock = jest.fn();
    const crawlerStateStoreMock = jest.fn();
    matchDetailsStore.upsert = databaseMock;
    crawlerStateStore.upsert = crawlerStateStoreMock;

    const requests: GetCharacterRequestParams[] = [
      {
        name: "Dumpster",
        realm: "Blackrock",
      },
      {
        name: "Markevyn",
        realm: "Blackrock",
      },
    ];
    await handleCrawlerRequests(requests);
    expect(crawlerMock).toHaveBeenCalledTimes(2);
    expect(databaseMock).toHaveBeenCalledTimes(4);
  });
});
