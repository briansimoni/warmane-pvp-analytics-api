import { handleCrawlerRequests } from "./crawlerManager";
import {
  characterMetaStore,
  crawlerStateStore,
  matchDetailsStore,
} from "./db/documentStoreV2";
import { WarmaneCrawler } from "./lib/crawler/crawler";
import { CrawlerInput, MatchDetails, Realm } from "./lib/types";

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

    // I would prefer to dependency inject these. Refactor crawler manager to do that soon
    crawlerStateStore.get = jest.fn();
    crawlerStateStore.upsertMerge = jest.fn();
    matchDetailsStore.batchWrite = jest.fn();
    characterMetaStore.upsert = jest.fn();

    const requests: CrawlerInput[] = [
      {
        name: "Dumpster",
        realm: "Blackrock",
        root: false,
      },
      {
        name: "Markevyn",
        realm: "Blackrock",
        root: false,
      },
    ];
    await handleCrawlerRequests(requests);
    expect(crawlerStateStore.get).toHaveBeenCalled();
    expect(matchDetailsStore.batchWrite).toHaveBeenCalled();
  });
});
