import * as dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

interface Config {
  crawlerSqsUrl: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  serviceName: string;
}

const configSchmea = Joi.object<Config>({
  crawlerSqsUrl: Joi.string().required(),
  logLevel: Joi.string().default("info").required(),
  serviceName: Joi.string().required(),
});

const vars = {
  crawlerSqsUrl: process.env.CRAWLER_SQS_URL,
  logLevel: process.env.LOG_LEVEL || "info",
  serviceName: process.env.SERVICE_NAME,
};

const validationResult = configSchmea.validate(vars);
console.log(validationResult.value);
if (validationResult.error) {
  console.log("config error:", validationResult.error.message);
  process.exit(1);
}

if (!validationResult.value) {
  console.log("unable to provide configuration data");
  process.exit(1);
}
export const config = validationResult.value;
console.log(config);
