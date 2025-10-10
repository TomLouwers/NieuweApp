const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("generate-groepsplan API - rate limit handling", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  test("returns 429 with retryAfter when Claude is rate limited", async () => {
    // Mock error-handler to force a rate limit error without waiting for backoff
    jest.doMock("../lib/error-handler.js", () => {
      const actual = jest.requireActual("../lib/error-handler.js");
      return {
        ...actual,
        callClaudeWithRetry: jest.fn(async () => {
          const err = new Error("Rate limited");
          err.status = 429;
          err.retryAfter = 3;
          throw err;
        }),
      };
    });

    const handler = require("../pages/api/generate-groepsplan.js");

    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "rekenen", periode: "Q2" },
    });

    await handler(req, res);

    expect(res._status).toBe(429);
    expect(res._json?.success).toBe(false);
    expect(res._json?.metadata?.retryAfter).toBe(3);
    expect(String(res._json?.metadata?.error || "")).toMatch(/Te veel verzoeken/i);
  });
});
