import axios from "axios";
import * as cheerio from "cheerio";

// defining Crawler interface
export interface Crawler {
  getMatchIds(params: { character: string; realm: string }): Promise<string[]>;
  getMatchDetails(params: { matchIds: string[] }): Promise<any[]>; //
}
// implementing the Crawler interface in the WarmaneCrawler class
export class WarmaneCrawler implements Crawler {
  // defining 'getMatchIds' method with optional paramater for testing (html)
  async getMatchIds(params: {
    character: string;
    realm: string;
    // added optional paramater (HTML passed as string) for testing
    html?: string;
  }): Promise<string[]> {
    // getMatchId will use optional parameter if present, will only use URL in its absence
    const html =
      params.html ??
      (await axios
        .get(
          `https://armory.warmane.com/character/${params.character}/${params.realm}/match-history`
        )
        .then((response) => response.data));

    // loading fetched HTML into Cheerio object
    const $ = cheerio.load(html);
    // initializing empty array (matchIds) to store match IDs
    const matchIds: string[] = [];

    // iterating through each table row with an ID of 'data-table-history'
    //  - _index not used in callback, but needed as argument (index of current element, current element)
    $("table#data-table-history tbody tr").each((_index, element) => {
      // extracting 1st table cell's text, trimming whitespace, adding to 'matchIds' array
      const matchId = $(element).find("td:first-child").text().trim();
      // adding extracted ID to array
      matchIds.push(matchId);
    });
    // returning updated array
    return matchIds;
  }

  // todo: implement 'getMatchDetails' method
  async getMatchDetails(params: { matchIds: string[] }): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}
