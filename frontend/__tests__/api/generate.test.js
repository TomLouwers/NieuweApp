const { createReqRes } = require("../../test-utils/mockReqRes.js");

describe("/api/generate-groepsplan happy path", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  test("returns 200 with contract shape and valid SLO refs", async () => {
    const longText = [
      "# Groepsplan rekenen — Groep 5 — Periode Q2\n\n",
      "## Beginsituatie\n",
      "Leerlingen laten groei in automatiseren zien, maar niet iedereen is stabiel. We richten ons op getalinzicht,",
      " bewerkingen en verhaalsommen. We zetten in op strategie-verwoording, controle en reflectie.\n\n",
      "## Doelen (SLO)\n",
      "We werken aan REK-G5-1 en REK-G5-2, passend bij de leerlijn voor groep 5.\n\n",
      "## Aanpak\n",
      "Expliciete directe instructie met begeleide inoefening. Coöperatieve werkvormen en doelgericht oefenen met",
      " formatieve feedback. Graduele transfer naar abstract niveau.\n\n",
      "## Differentiatie\n",
      "Niveau 1: automatiseren en herhaling; Niveau 2: strategieën en modelling; Niveau 3: complexe verhaalsommen",
      " en zelfregulatie.\n\n",
      "## Evaluatie\n",
      "Formatieve checks, observaties, korte toetsen en nabespreking van oplossingsstrategieën.\n\n",
      // pad the content to exceed 500 chars
      "Aanvullende toelichting: herhaald oefenen, huiswerk waar passend, spelvormen, inzet van materiaal en",
      " differentiatie in tempo en complexiteit zorgen voor borging en verdieping van vaardigheden."
    ].join("");

    jest.doMock("../../lib/error-handler.js", () => {
      const actual = jest.requireActual("../../lib/error-handler.js");
      return {
        ...actual,
        callClaudeWithRetry: jest.fn(async () => ({ content: [{ type: "text", text: longText }], usage: { input_tokens: 100, output_tokens: 800 } })),
      };
    });

    const handler = require("../../pages/api/generate-groepsplan.js");
    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "rekenen", periode: "Q2" },
    });

    await handler(req, res);

    expect(res._status).toBe(200);
    const json = res._json;
    expect(json?.success).toBe(true);
    expect(typeof json?.content).toBe("string");
    expect(json.content.length).toBeGreaterThanOrEqual(500);

    const md = json?.metadata || {};
    expect(typeof md.model).toBe("string");
    expect(typeof md.duration_ms).toBe("number");
    expect(md.input).toEqual({ groep: 5, vak: "rekenen", periode: "Q2" });
    expect(md.length).toBe(json.content.length);

    const slo = md.slo || {};
    expect(Array.isArray(slo.suggested)).toBe(true);
    expect(Array.isArray(slo.referenced)).toBe(true);
    expect(slo.referenced).toEqual(expect.arrayContaining(["REK-G5-1", "REK-G5-2"]));
    expect(Array.isArray(slo.invalid_references)).toBe(true);
    expect(slo.invalid_references.length).toBe(0);
    expect(slo.valid_reference_count).toBeGreaterThanOrEqual(1);

    // No warnings on valid SLO usage
    expect(json.warnings).toBeUndefined();
  });
});

