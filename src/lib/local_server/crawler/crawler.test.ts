import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { WarmaneCrawler } from "./crawler";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("crawler tests", () => {
  const testFile = path.join(__dirname, "test.html");
  const html = String(fs.readFileSync(testFile));

  test("when an html document is returned with matches, it can return a list of match IDs", async () => {
    mockedAxios.get.mockImplementation(async () => html);
    const crawler = new WarmaneCrawler();
    const matchIds = await crawler.getMatchIds({
      character: "Dumpster",
      realm: "Blackrock",
    });
    expect(matchIds.length).toBe(453);
  });
});
