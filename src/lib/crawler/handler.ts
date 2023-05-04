import { Context, SQSEvent } from "aws-lambda";
import { WarmaneCrawler } from "./crawler";
import DynamoService from "../../dynamoService";
// import bodyParser from "koa-bodyparser";

const dynamoService = new DynamoService("MatchData");

export async function crawlerHandler(
  event: SQSEvent,
  context: Context,
  warmaneCrawler: WarmaneCrawler
) {
  console.log("sqsHandler");
  console.log(event);
  console.log(context);

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
      await dynamoService.createItem(matchDetails);
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
