/**
 * This file contains all of the handlers that the lambda
 * functions directly refer to by name. You can see this
 * in the terraform code.
 */
import serverless from "aws-serverless-koa";
import { api } from "./api";
import { crawler } from "./crawlerManager";

export const apiHandler = serverless(api);
export const crawlerHandler = serverless(crawler);
