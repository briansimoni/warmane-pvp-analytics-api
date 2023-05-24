module.exports = {
  rootDir: "./src",
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  testEnvironmentOptions: {
    env: {
      LOG_LEVEL: "fatal",
    },
  },
  testMatch: ["**/*.integration.test.ts"],
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
};
