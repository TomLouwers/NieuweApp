const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("export-word API", () => {
  test("streams a DOCX with headers for valid content", async () => {
    const handler = require("../pages/api/export-word.js");

    const content = [
      "# Groepsplan rekenen — Groep 5 — Periode Q2",
      "",
      "## Beginsituatie",
      "Leerlingen ontwikkelen rekenvaardigheid en automatiseren basisfeiten.",
      "",
      "- Doelgericht oefenen",
      "- Feedback en reflectie",
      "",
      "Paragraaf met toelichting over aanpak en differentiatie.",
    ].join("\n");

    const { req, res } = createReqRes({
      method: "POST",
      body: { content, metadata: { groep: 5, vak: "rekenen", periode: "Q2" } },
    });

    await handler(req, res);

    expect(res._status).toBe(200);
    const ct = res._headers["content-type"] || "";
    expect(ct).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const cd = res._headers["content-disposition"] || "";
    expect(cd).toContain("attachment;");
    expect(cd).toContain("groepsplan_groep5_Q2.docx");

    expect(Buffer.isBuffer(res._body)).toBe(true);
    expect(res._body.length).toBeGreaterThan(200);
  });

  test("returns 400 when content is missing", async () => {
    const handler = require("../pages/api/export-word.js");
    const { req, res } = createReqRes({ method: "POST", body: { content: "" } });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
  });

  test("returns 405 on non-POST", async () => {
    const handler = require("../pages/api/export-word.js");
    const { req, res } = createReqRes({ method: "GET" });
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._json?.success).toBe(false);
    const allow = res._headers["allow"];
    if (Array.isArray(allow)) {
      expect(allow).toContain("POST");
    } else {
      expect(String(allow)).toContain("POST");
    }
  });
});
