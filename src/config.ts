/**
 * This file provides a standardized way to inject
 * environment configuration into the application in a
 * type-safe way. Locally, configuration can come from
 * the .env file or system environment variables. In
 * a lambda environment, it should generally always be
 * environment variables.
 */
import * as dotenv from "dotenv";
import Joi from "joi";
import { logger } from "./lib/util/logger";

dotenv.config();

interface Config {
  crawlerSqsUrl: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  serviceName: string;
  characterTableName: string;
}

const configSchmea = Joi.object<Config>({
  crawlerSqsUrl: Joi.string().required(),
  logLevel: Joi.string().default("info").required(),
  serviceName: Joi.string().required(),
  characterTableName: Joi.string().required(),
});

const vars = {
  crawlerSqsUrl: process.env.CRAWLER_SQS_URL,
  logLevel: process.env.LOG_LEVEL || "info",
  serviceName: process.env.SERVICE_NAME,
  characterTableName: process.env.CHARACTER_TABLE_NAME,
};

const validationResult = configSchmea.validate(vars);
if (validationResult.error) {
  logger.error("config error:", validationResult.error.message);
  process.exit(1);
}

if (!validationResult.value) {
  logger.error("unable to provide configuration data");
  process.exit(1);
}
export const config = validationResult.value;
