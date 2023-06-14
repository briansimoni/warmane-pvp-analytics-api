import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { WarmaneCrawler } from "./crawler";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const testHtml = fs.readFileSync(path.resolve(__dirname, "test.html"), "utf-8");

const testJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "test.json"), "utf-8")
);

describe("crawler v2 tests", () => {
  test("It can return a list of matchDetails even when warmane occasionally errors", async () => {
    mockedAxios.get.mockImplementation(async () => ({
      data: testHtml,
    }));

    mockedAxios.post.mockImplementation(async () => {
      if (Math.random() < 0.5) {
        return {
          data: testJson,
        };
      }
      throw new Error(
        "404 you are actually detected as a bot and warmane is just going to send 404 to throw you off"
      );
    });

    const character = "Dumpster";
    const realm = "Blackrock";
    const crawler = new WarmaneCrawler({});
    const matchDetails = await crawler.crawl({
      character,
      realm,
    });

    const expected = expect.arrayContaining([
      expect.objectContaining({
        id: "Dumpster@Blackrock",
        team_name: "Solo Queue",

        character_details: expect.arrayContaining([
          expect.objectContaining({
            realm: "Blackrock",
            charname: "Dumpster",
          }),
          expect.objectContaining({
            realm: "Icecrown",
            charname: "Hotnutz",
          }),
        ]),
      }),
    ]);
    expect(matchDetails.length).toBeGreaterThan(0);
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(matchDetails).toEqual(expected);
  });
});
