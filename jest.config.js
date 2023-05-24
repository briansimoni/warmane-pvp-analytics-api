module.exports = {
  rootDir: "./src",
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  testEnvironmentOptions: {
    env: {
      LOG_LEVEL: "fatal",
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "integration"],
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
};
