import bunyan from "bunyan";
import { config } from "../../config";
import bunyanFormat from "bunyan-format";

const format = bunyanFormat({ outputMode: "short", color: true });

// export const logger = bunyan.createLogger({
//   name: config.serviceName,
//   level: config.logLevel,
//   serializers: bunyan.stdSerializers,
// });

let logger: bunyan;

if (process.env.AWS_EXECUTION_ENV === undefined) {
  logger = bunyan.createLogger({
    name: config.serviceName,
    level: config.logLevel,
    serializers: bunyan.stdSerializers,
    streams: [
      {
        stream: format,
        level: config.logLevel,
      },
    ],
  });
} else {
  logger = bunyan.createLogger({
    name: config.serviceName,
    level: config.logLevel,
    serializers: bunyan.stdSerializers,
  });
}

export { logger };
