import supertest from "supertest";
import { allowedOrigins, api } from "../../api";

const request = supertest.agent(api.callback());

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

  it("should allow requests from warmane.dog", async () => {
    const response = await request
      .get("/character")
      .query({ character: "test", realm: "test" })
      .set("Origin", "https://warmane.dog");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://warmane.dog"
    );
  });
});
