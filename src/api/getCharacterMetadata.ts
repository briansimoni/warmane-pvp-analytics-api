import { ApiContext } from "../routes";
import createError from "http-errors";
import { getCharacterSchema } from "./validators";
// import { getCharacterProfile } from "../lib/warmane_client/client";
import { characterMetadataTable } from "../db/documentStore";

export default async function getCharacterMetadata(ctx: ApiContext) {
  const params = getCharacterSchema.validate(ctx.query);
  if (params.error) {
    throw createError.BadRequest(params.error.message);
  }
  const { name, realm } = params.value;
  await Promise.all([
    // getCharacterProfile({
    //   name,
    //   realm,
    // }),
    characterMetadataTable.update({
      character: `${name}#${realm}`,
      name,
      realm,
      total_games_played: 0,
    }),
  ]);
}
