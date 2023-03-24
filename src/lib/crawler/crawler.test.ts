import { WarmaneCrawler } from "./crawler";
import * as fs from "fs";
import * as path from "path";

describe("crawler tests", () => {
  // creating test case
  test("when an html document is returned with matches, it can return a list of match IDs", async () => {
    // storing content of 'test.html' as string in testHtml
    const testHtml = fs.readFileSync(
      path.resolve(__dirname, "test.html"),
      "utf-8"
    );

    // creating new instance of WarmaneCrawler
    const crawler = new WarmaneCrawler();
    // calling 'getMatchIds' on 'crawler' with testHtml as a paramater
    const matchIds = await crawler.getMatchIds({
      character: "SomeCharacter",
      realm: "Blackrock",
      html: testHtml,
    });

    // length of 'matchIds' array must be 453 to pass test
    expect(matchIds.length).toBe(453);

    expect(matchIds).toEqual(
      // 'matchIds' array must contain specified IDs to pass
      expect.arrayContaining(["25309337", "25309969", "25314478"])
    );
  });
});
