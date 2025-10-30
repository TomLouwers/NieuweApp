const { createReqRes } = require("../../test-utils/mockReqRes.js");

describe("/api/generate-opp happy path", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  test("returns 200 with content and warnings shape", async () => {
    const longText = [
      "# Ontwikkelingsperspectief Plan\n\n",
      "## 1. Leerlingprofiel\n",
      "[Sterktes] Leerling is gemotiveerd en houdt van lezen. [Uitdagingen] Heeft behoefte aan structuur.\n\n",
      "## 2. Beginsituatie\n",
      "Technisch lezen: AVI E4. Spelling: E. Rekenen: D. Begrijpend lezen: E. Sociaal-emotioneel: lichte zorgen.\n\n",
      "## 3. Uitstroomprofiel\n",
      "Op dit moment lijkt VMBO Kader/TL realistisch, dit kan veranderen.\n\n",
      "## 4. Ontwikkeldoelen (SMARTI)\n",
      "Doel 1: Technisch lezen verbetert naar AVI M5 in 6 maanden.\n\n",
      "## 5. Aanpak\n",
      "15 min 1-op-1 begeleiding, 3x per week.\n\n",
      "## 6. Betrokkenen\n",
      "Leerkracht, IB'er, ouders, dyslexiespecialist.\n\n",
      "## 7. Evaluatie en Bijstelling\n",
      "Tussenevaluaties na 3 en 6 maanden; plan B indien nodig.\n\n",
      // pad to ensure length
      "Extra details ".repeat(100)
    ].join("");

    jest.doMock("../../lib/error-handler.js", () => {
      const actual = jest.requireActual("../../lib/error-handler.js");
      return { ...actual, callClaudeWithRetry: jest.fn(async () => ({ content: [{ type: "text", text: longText }], usage: { input_tokens: 100, output_tokens: 800 } })) };
    });

    const handler = require("../../pages/api/generate-opp.js");
    const { req, res } = createReqRes({ method: "POST", body: {
      studentName: "Noah", age: 10, groep: 7, gender: "male",
      reasonForOpp: "significant_learning_delay",
      currentLevels: { technischLezen: "E4", spelling: "E", rekenen: "D", begrijpendLezen: "E", sociaalEmotioneel: "lichte_zorgen" },
      uitstroomprofiel: { type: "vmbo_kader_tl", rationale: "..." },
      externalSupport: ["dyslexie_specialist"], parentInvolvement: "involved_but_concerned"
    } });

    await handler(req, res);

    expect(res._status).toBe(200);
    const json = res._json;
    expect(json?.success).toBe(true);
    expect(typeof json?.content).toBe("string");
    expect(json.content.length).toBeGreaterThanOrEqual(800);
    if (json.warnings) expect(Array.isArray(json.warnings)).toBe(true);
  });
});

