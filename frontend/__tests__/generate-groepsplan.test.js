const handler = require("../pages/api/generate-groepsplan.js");
const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("generate-groepsplan API", () => {
  test("returns 405 on non-POST", async () => {
    const { req, res } = createReqRes({ method: "GET" });
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._json?.success).toBe(false);
    expect(res._headers["allow"]).toContain("POST");
  });

  test("400 on invalid groep (out of range)", async () => {
    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 9, vak: "rekenen", periode: "Q2" },
    });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
  });

  test("400 on invalid vak", async () => {
    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "wereldoriëntatie", periode: "Q2" },
    });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
  });

  test("400 on missing/invalid periode", async () => {
    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "taal", periode: "" },
    });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
  });
});

