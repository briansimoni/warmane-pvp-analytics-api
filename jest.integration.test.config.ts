/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  rootDir: "./src",
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "../coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testMatch: ["**/*.integration.test.ts"],
  testEnvironmentOptions: {
    env: {
      LOG_LEVEL: "fatal",
    },
  },
};

export default config;
