import axios from "axios";

export interface Crawler {
  getMatchIds(params: { character: string; realm: string }): Promise<string[]>;
  getMatchDetails(params: { matchIds: string[] }): Promise<any[]>;
}

export class WarmaneCrawler implements Crawler {
  async getMatchIds(params: {
    character: string;
    realm: string;
  }): Promise<string[]> {
    // throw new Error("Method not implemented.");
    return ["1", "2", "3"];
  }

  async getMatchDetails(params: { matchIds: string[] }): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}
