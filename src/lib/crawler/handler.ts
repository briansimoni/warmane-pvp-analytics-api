import { Context, SQSEvent } from "aws-lambda";
import { logger } from "../util/logger";
//* import { WarmaneCrawler } from "./crawler";
// import bodyParser from "koa-bodyparser";

export async function crawlerHandler(
  event: SQSEvent,
  context: Context
  //* warmaneCrawler: WarmaneCrawler
) {
  logger.info("sqsHandler");
  logger.info(event);
  logger.info(context);

  //*   const character = event.Records[0].messageAttributes.character.stringValue || "";
  //*   const realm = event.Records[0].messageAttributes.realm.stringValue || "";
  //
  //*   const matchSummaries = await warmaneCrawler.getMatchSummaries({
  //*     character,
  //*     realm,
  //*   });
  //
  //*  const matchDetailsList = await warmaneCrawler.getMatchDetails({
  //*    character,
  //*    realm,
  //*    matchSummaries,
  //*  });
}

//* = commented-out to pass PR checks, as `matchDetailsList` won't be used until DB implementation
