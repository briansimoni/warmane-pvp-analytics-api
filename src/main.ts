import serverless from "aws-serverless-koa";
import { configureApp } from "./appConfig";
import { router } from "./routes";
import crawlerApp from "./crawlerApp";
import { config } from "./config";

console.log(config.crawlerSqsEndpoint);

const app = configureApp();
const appLogger = app.context.log;

app.use(router.routes());
app.use(router.allowedMethods());

if (process.env.AWS_EXECUTION_ENV === undefined) {
  app.listen(4000, () => {
    appLogger.info("api lambda listening on 4000");
  });

  crawlerApp.listen(4001, () => {
    appLogger.info("crawler lambda running on 4001");
  });
}

export const apiHandler = serverless(app);
export const crawlerHandler = serverless(crawlerApp);
