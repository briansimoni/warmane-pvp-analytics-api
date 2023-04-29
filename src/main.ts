import serverless from "aws-serverless-koa";
import { configureApp } from "./appConfig";
import { router } from "./routes";
import crawlerApp from "./crawlerApp";

const app = configureApp();
const appLogger = app.context.log;

app.use(router.routes());
app.use(router.allowedMethods());

if (process.env.AWS_EXECUTION_ENV === undefined) {
  app.listen(3000, () => {
    appLogger.info("server listening on 3000");
  });

  crawlerApp.listen(3001, () => {
    appLogger.info("server running on 3001");
  });
}

export const apiHandler = serverless(app);
export const crawlerHandler = serverless(crawlerApp);
