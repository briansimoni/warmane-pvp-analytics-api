/**
 * This file contains all of the handlers that the lambda
 * functions directly refer to by name. You can see this
 * in the terraform code.
 */
export { apiHandler } from "./main";
export { crawlerHandler } from "./lib/crawler/handler";
