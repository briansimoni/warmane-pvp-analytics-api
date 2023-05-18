import { Context, SQSEvent } from "aws-lambda";
import { logger } from "../util/logger";
import { WarmaneCrawler } from "./crawler";
import { characterMatchesTable } from "../../db/documentStore";
// import bodyParser from "koa-bodyparser";

export async function crawlerHandler(event: SQSEvent, context: Context) {
  const warmaneCrawler = new WarmaneCrawler();
  logger.info("sqsHandler");
  logger.info(event);
  logger.info(context);

  const character =
    event.Records[0].messageAttributes.character.stringValue || "";
  const realm = event.Records[0].messageAttributes.realm.stringValue || "";

  const matchSummaries = await warmaneCrawler.getMatchSummaries({
    character,
    realm,
  });

  const matchDetailsList = await warmaneCrawler.getMatchDetails({
    character,
    realm,
    matchSummaries,
  });

  for (const matchDetails of matchDetailsList) {
    try {
      await characterMatchesTable.update(matchDetails);
      console.log(
        `Successfully stored match details for ${character} on ${realm}`
      );
    } catch (error) {
      console.error(
        `Error storing match details for ${character} on ${realm}:`,
        error
      );
    }
  }
}
