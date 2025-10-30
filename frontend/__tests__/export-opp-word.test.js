const handler = require("../pages/api/export-opp-word.js");
const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("export-opp-word", () => {
  test("exports docx with OPP filename", async () => {
    const { req, res } = createReqRes({ method: "POST", body: {
      content: "# Ontwikkelingsperspectief Plan\n\n## 1. Leerlingprofiel\n...",
      metadata: { studentName: "Noah", groep: 7 }
    } });
    await handler(req, res);
    expect(res._status).toBe(200);
    const headers = res._headers || {};
    const ct = headers['content-type'] || headers['Content-Type'] || '';
    expect(String(ct).toLowerCase()).toContain("wordprocessingml");
    const cd = headers['content-disposition'] || headers['Content-Disposition'] || '';
    expect(String(cd).toLowerCase()).toContain("attachment");
  });
});
