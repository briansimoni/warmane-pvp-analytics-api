import { api } from "./api";
import { crawler } from "./crawlerManager";
import { logger } from "./lib/util/logger";

/**
 * This provides a way to run the Lambda code locally.
 * Running a Koa server effectively simulates API Gateway + Lambda.
 * With only a slight modification, you could run this on a real
 * server or a container.
 */
if (process.env.AWS_EXECUTION_ENV === undefined) {
  api.listen(4000, () => {
    logger.info("api lambda listening on 4000");
  });

  crawler.listen(4001, () => {
    logger.info("crawler lambda running on 4001");
  });
}
