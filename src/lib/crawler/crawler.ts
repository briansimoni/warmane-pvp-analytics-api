import axios from "axios";
import * as cheerio from "cheerio";

// defining Crawler interface
export interface Crawler {
  getMatchIds(params: { character: string; realm: string }): Promise<string[]>;
  getMatchDetails(params: { matchIds: string[] }): Promise<any[]>;
}

// implementing the Crawler interface in the WarmaneCrawler class
export class WarmaneCrawler implements Crawler {
  async getMatchIds(params: {
    character: string;
    realm: string;
  }): Promise<string[]> {
    // Fetching the HTML using axios
    const response = await axios.get(
      `https://armory.warmane.com/character/${params.character}/${params.realm}/match-history`
    );
    const html: string = response.data;

    // loading fetched HTML into Cheerio object
    const $ = cheerio.load(html);
    const matchIds: string[] = [];

    $("table#data-table-history tbody tr").each((_index, element) => {
      const matchId = $(element).find("td:first-child").text().trim();
      matchIds.push(matchId);
    });

    return matchIds;
  }

  async getMatchDetails(params: { matchIds: string[] }): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}

