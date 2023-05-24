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
      bracket: "2s",
      outcome: "W",
      points_change: "+5",
      date: "sometime",
      duration: "897",
      arena: "Nagrand",
      character_details: [],
      id,
    };

    await matchDetailsStore.upsert(matchDetails);
    await matchDetailsStore.upsert(matchDetails2);

    const thing = await matchDetailsStore.list({ id });
    console.log(thing);

    const match = await matchDetailsStore.get({
      id: matchDetails.id,
      documentKey: matchDetails.matchId,
    });
    expect(match).toMatchObject(matchDetails);
    expect(match).toHaveProperty("created_at");

    // await matchDetailsStore.deletePermanently(id);
  });
});
