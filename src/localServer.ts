import { api } from "./api";
import { crawler } from "./crawler";
import { logger } from "./lib/util/logger";

if (process.env.AWS_EXECUTION_ENV === undefined) {
  api.listen(4000, () => {
    logger.info("api lambda listening on 4000");
  });

  crawler.listen(4001, () => {
    logger.info("crawler lambda running on 4001");
  });
}

// export const apiHandler = serverless(app);
// export const crawlerHandler = serverless(crawlerApp);
