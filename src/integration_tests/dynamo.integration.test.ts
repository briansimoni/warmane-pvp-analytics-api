import { matchDetailsStore } from "../db/documentStoreV2";
import { MatchDetails } from "../lib/crawler/crawler";

describe("dynamo integration tests", () => {
  test("CRUD", async () => {
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
      id: "testguy#testrealm",
    };

    await matchDetailsStore.put(matchDetails);

    const match = await matchDetailsStore.get(matchDetails.id);
    expect(match).toMatchObject(matchDetails);
    expect(match).toHaveProperty("created_at");

    await matchDetailsStore.delete("1");
  });
});
