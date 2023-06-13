/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  clearMocks: true,
  collectCoverage: true,
  rootDir: "./src",
  coverageDirectory: "../coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "integration"],
  testEnvironmentOptions: {
    env: {
      LOG_LEVEL: "fatal",
    },
  },
};

export default config;
