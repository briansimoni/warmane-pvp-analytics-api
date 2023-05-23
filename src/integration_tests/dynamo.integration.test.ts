import { matchDetailsStore } from "../db/documentStoreV2";

describe("dynamo integration tests", () => {
  test("create", async () => {
    await matchDetailsStore.put({
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
    });
  });

  test("delete", async () => {
    await matchDetailsStore.delete("1");
  });
});
