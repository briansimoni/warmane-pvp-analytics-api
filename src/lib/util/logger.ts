import bunyan from "bunyan";
import { config } from "../../config";

export const logger = bunyan.createLogger({
  name: config.serviceName,
  level: config.logLevel,
  serializers: bunyan.stdSerializers,
});
