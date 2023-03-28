import { WarmaneCrawler } from "./crawler";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("crawler tests", () => {
  test("when an html document is returned with matches, it can return a list of match IDs", async () => {
    // storing data from test.html file as string
    const testHtml = fs.readFileSync(
      path.resolve(__dirname, "test.html"),
      "utf-8"
    );

    mockedAxios.get.mockImplementation(async () => ({
      data: testHtml,
    }));

    const crawler = new WarmaneCrawler();
    const matchIds = await crawler.getMatchIds({
      character: "SomeCharacter",
      realm: "Blackrock",
    });

    expect(matchIds.length).toBe(453);
    expect(matchIds).toEqual(
      expect.arrayContaining(["25309337", "25309969", "25314478"])
    );
  });
});
