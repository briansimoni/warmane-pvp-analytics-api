import { matchDetailsStore } from "../db/documentStoreV2";
import { MatchDetails } from "../lib/crawler/crawler";

describe("dynamo integration tests", () => {
  test("CRUD", async () => {
    const id = "testguythatdoesnotexist@Blackrock";

    const matchDetails: MatchDetails = {
      matchId: "1",
      team_name: "teamName",
      bracket: "2s",
      outcome: "W",
      points_change: "+4",
      date: "sometime",
      duration: "897",
      arena: "Dalaran",
      character_details: [],
      id,
    };

    const matchDetails2: MatchDetails = {
      matchId: "2",
      team_name: "teamName",
      bracket: "3s",
      outcome: "L",
      points_change: "-5",
      date: "sometime",
      duration: "420",
      arena: "Nagrand",
      character_details: [],
      id,
    };

    // create
    await Promise.all([
      matchDetailsStore.upsert(matchDetails),
      matchDetailsStore.upsert(matchDetails2),
    ]);

    // read a list
    const list = await matchDetailsStore.list({ id });

    const match = await matchDetailsStore.get({
      id: matchDetails.id,
      documentKey: matchDetails.matchId,
    });
    expect(match).toMatchObject(matchDetails);
    expect(match).toHaveProperty("created_at");

    // delete
    await Promise.all(
      list.items.map((match) =>
        matchDetailsStore.deletePermanently({
          id: match.id,
          documentKey: match.matchId,
        })
      )
    );
  });
});
