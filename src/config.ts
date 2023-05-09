import * as dotenv from "dotenv";
import Joi from "joi";
import { logger } from "./lib/util/logger";

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
if (validationResult.error) {
  logger.error("config error:", validationResult.error.message);
}

if (!validationResult.value) {
  logger.error("unable to provide configuration data");
}
export const config = validationResult.value;
