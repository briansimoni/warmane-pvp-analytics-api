import serverless from "aws-serverless-koa";
import { configureApp } from "./appConfig";

const app = configureApp();

if (process.env.AWS_EXECUTION_ENV === undefined) {
  const appLogger = app.context.log;
  app.listen(3000, () => {
    appLogger.info("server listening on 3000");
  });
}

export const handler = serverless(app);
