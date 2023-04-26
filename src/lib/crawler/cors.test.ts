import supertest from "supertest";
import Koa from "koa";
import { router } from "../../routes";
import cors, { Options } from "@koa/cors";
import { allowedOrigins, configureApp } from "../../appConfig";
import bunyan from "bunyan";

const corsOptions: Options = {
  origin: (ctx: Koa.Context) => {
    const requestOrigin = ctx.request.header.origin;
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return "";
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};

const testLogger = bunyan.createLogger({
  name: "warmane-pvp-analytics-api-test",
  level: "fatal",
  serializers: bunyan.stdSerializers,
});

const app = configureApp(testLogger);
app.use(cors(corsOptions));
app.use(router.routes());

const request = supertest.agent(app.callback());

describe("CORS tests", () => {
  it("should allow requests from allowed origins", async () => {
    const response = await request
      .get("/character")
      .query({ character: "test", realm: "test" })
      .set("Origin", allowedOrigins[0]);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      allowedOrigins[0]
    );
  });

  it("should not allow requests from disallowed origins", async () => {
    const disallowedOrigin = "https://example.com";
    const response = await request
      .get("/character")
      .query({ character: "test", realm: "test" })
      .set("Origin", disallowedOrigin);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
