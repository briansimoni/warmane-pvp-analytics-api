import * as dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

interface Config {
  crawlerSqsEndpoint: string;
}

const configSchmea = Joi.object<Config>({
  crawlerSqsEndpoint: Joi.string().required(),
});

const vars = {
  crawlerSqsEndpoint: process.env.CRAWLER_SQS_ENDPOINT,
};

const validationResult = configSchmea.validate(vars);
if (validationResult.error) {
  console.log("config error:", validationResult.error.message);
  process.exit(1);
}

if (!validationResult.value) {
  console.log("unable to provide configuration data");
  process.exit(1);
}

export const config = validationResult.value;
