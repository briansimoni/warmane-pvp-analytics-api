import Joi from "joi";

export interface GetCharacterRequestParams {
  name: string;
  realm: string;
}

export const getCharacterSchema = Joi.object<GetCharacterRequestParams>({
  name: Joi.string().required(),
  realm: Joi.string().required(),
});
