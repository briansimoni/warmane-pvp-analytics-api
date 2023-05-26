import Joi from "joi";
import { CharacterName, Realm } from "../lib/types";

export interface GetCharacterRequestParams {
  name: CharacterName;
  realm: Realm;
}

export const getCharacterSchema = Joi.object<GetCharacterRequestParams>({
  name: Joi.string().valid().required(),
  realm: Joi.string().valid("Blackrock", "Icecrown").required(),
});
