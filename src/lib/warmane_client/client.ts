import axios from "axios";
import { randomUserAgent } from "../random_user_agent";
import * as cheerio from "cheerio";
import { ArenaStats } from "../types";

interface Talents {
  tree: string;
  points: number[];
}

interface Profession {
  name: string;
  skill: string;
}

interface Equipment {
  name: string;
  item: string;
  transmog: string;
}

interface WarmaneCharacterProfile {
  /** online indicates what you think it does. If this character is logged into the game, it is true */
  online: boolean;
  class:
    | "Druid"
    | "Hunter"
    | "Mage"
    | "Paladin"
    | "Priest"
    | "Rogue"
    | "Shaman"
    | "Warlock"
    | "Warrior";
  race:
    | "Dwarf"
    | "Night Elf"
    | "Gnome"
    | "Human"
    | "Orc"
    | "Undead"
    | "Tauren"
    | "Troll"
    | "BloodElf"
    | "Draenei";
  gender: "Male" | "Female";
  talents: Talents[];
  professions: Profession[];
  equipment: Equipment[];
}

export async function getCharacterProfile(params: {
  name: string;
  realm: string;
}) {
  const { name, realm } = params;
  const userAgent = randomUserAgent();
  const response = await axios.get<WarmaneCharacterProfile>(
    `http://armory.warmane.com/api/character/${name}/${realm}/profile`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    }
  );
  return response.data;
}

export async function checkCharacterExists(params: {
  name: string;
  realm: string;
}): Promise<boolean> {
  const { name, realm } = params;
  const userAgent = randomUserAgent();
  const response = await axios.get<string>(
    `http://armory.warmane.com/character/${name}/${realm}/summary`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    }
  );
  if (
    response.data.includes("The character you are looking for does not exist")
  ) {
    return false;
  }
  return true;
}

/**
 * warmane.com statistics page will return a ton of great details that mirror
 * the in game achievements -> statistics page. You have to make a request to
 * get a particular sub section of the statistics page. For instance Rated Arenas
 * comes back in its own page when you request category 152. This function will take
 * a category and return the html of that page. You will need other functions to parse
 * the results into something more useful.
 */
async function getCharacterStatistics(params: {
  name: string;
  realm: string;
  category: string;
}) {
  const { name, realm, category } = params;
  const formData = new URLSearchParams();
  formData.set("category", category);
  const statsResponse = await axios.post<Record<string, any>>(
    `http://armory.warmane.com/character/${name}/${realm}/statistics`,
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": randomUserAgent(),
      },
    }
  );

  return statsResponse.data.content;
}

export async function getArenaStats(params: { name: string; realm: string }) {
  const html = await getCharacterStatistics({ ...params, category: "152" });
  return parseArenaStatistics(html);
}

export function parseArenaStatistics(html: string): ArenaStats {
  const $ = cheerio.load(html);
  const rows = $("#data-table-list tr");
  const stats: { [key: string]: number | undefined } = {};
  rows.each((_, row) => {
    const key = $(row).find("td:first-child").text();
    const value = $(row).find("td:last-child").text();
    stats[key] = parseInt(value) || undefined;
  });
  return stats as unknown as ArenaStats;
}
