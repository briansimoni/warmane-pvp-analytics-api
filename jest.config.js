module.exports = {
  rootDir: "./src",
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  testEnvironmentOptions: {
    env: {
      LOG_LEVEL: "fatal",
    },
  },
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
};
