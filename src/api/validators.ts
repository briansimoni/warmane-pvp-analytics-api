import Joi from "joi";
import { CharacterId, CharacterName, CrawlerInput, Realm } from "../lib/types";
// import { CharacterId, CharacterName, Realm } from "../lib/types";
import { Realms } from "../lib/types";

export interface GetCharacterRequestParams {
  name: CharacterName;
  realm: Realm;
}

export const getCharacterSchema = Joi.object<GetCharacterRequestParams>({
  name: Joi.string().valid().required(),
  realm: Joi.string()
    .valid(...Realms)
    .required(),
}).required();

export const crawlerInputSchema = Joi.object<CrawlerInput>({
  name: Joi.string().valid().required(),
  realm: Joi.string()
    .valid(...Realms)
    .required(),
  root: Joi.boolean().required(),
});

export const characterIdSchema = Joi.string<CharacterId>()
  .trim()
  .regex(/[a-zA-Z]+@(Blackrock|Icecrown|Lordaeron|Frostmourne)/)
  .required();

export const queryCharacterSchema = Joi.object<GetCharacterRequestParams>({
  name: Joi.string().valid().required(),
}).required();

export interface getMatchesParams {
  name: CharacterName;
  realm: Realm;
  continuation_token: string;
}

export const getMatchesSchema = Joi.object<getMatchesParams>({
  name: Joi.string().valid().required(),
  realm: Joi.string()
    .valid(...Realms)
    .required(),
  continuation_token: Joi.string().optional(),
}).required();
