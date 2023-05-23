import supertest from "supertest";
import Koa from "koa";
import { allowedOrigins } from "../../api";
import cors, { Options } from "@koa/cors";

const api = new Koa();

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

api.use(cors(corsOptions));
const request = supertest.agent(api.callback());

describe("CORS tests", () => {
  test.each(allowedOrigins)("should allow requests from %s", async (origin) => {
    const response = await request
      .get("/something")
      .query({ character: "test", realm: "test" })
      .set("Origin", origin);

    expect(response.headers["access-control-allow-origin"]).toBe(origin);
  });

  it("should not allow requests from disallowed origins", async () => {
    const disallowedOrigin = "https://example.com";
    const response = await request
      .get("/character")
      .query({ character: "test", realm: "test" })
      .set("Origin", disallowedOrigin);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
