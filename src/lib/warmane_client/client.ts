import axios from "axios";
import { randomUserAgent } from "../random_user_agent";

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
