// Unit test to verify SLO extraction and metadata post-processing

const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("generate-groepsplan API - SLO integration", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key"; // prevent MISSING_API_KEY
  });

  test("extracts and validates SLO codes, fills metadata", async () => {
    // Mock Anthropic SDK to return a long markdown with SLO codes
    jest.mock("@anthropic-ai/sdk", () => {
      return function AnthropicMock() {
        return {
          messages: {
            create: async () => {
              const longText = [
                "# Groepsplan rekenen — Groep 5 — Periode Q2\n\n",
                "## Beginsituatie\n",
                "Leerlingen tonen groei in rekenvaardigheid. De basisautomatisering is wisselend,",
                " sommige leerlingen wisselen nog tussen strategieën. We richten ons op het versterken ",
                "van getalinzicht, bewerkingen en verhaalsommen. Deze periode leggen we nadruk op ",
                "strategiekeuze, het verwoorden van oplossingsstappen en het controleren van uitkomsten.\n\n",
                "## Doelen (SLO)\n",
                // Include valid and invalid SLO references; one with suffix to test prefix handling
                "We werken aan REK-G5-1, REK-G5-2b en TAA-G5-3 als kader.\n\n",
                "## Aanpak\n",
                "Instructie volgens EDI met verlengde inoefening. Coöperatieve werkvormen,\n",
                " doelgericht oefenen met feedback, inzet van concreet-materiële modellen en graduele ",
                "transfer naar abstract niveau. Differentiatie op tempo en complexiteit.\n\n",
                "## Differentiatie\n",
                "Niveau 1 richt zich op automatiseren en getalbegrip; niveau 2 op ",
                "strategiekeuze en modelling; niveau 3 op verhaalsommen met meerdere stappen en ",
                "zelfstandige reflectie.\n\n",
                "## Evaluatie\n",
                "We gebruiken formatieve checks, nabespreken strategieën en leerlingreflectie. ",
                "Doorlopende leerlijn: LEZ-G4-2 komt soms terug in contexten, maar hoofdfocus is rekenen.\n",
              ].join("");
              return { content: [{ type: "text", text: longText }] };
            },
          },
        };
      };
    });

    const handler = require("../pages/api/generate-groepsplan.js");

    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "rekenen", periode: "Q2" },
    });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.success).toBe(true);
    expect(typeof res._json?.content).toBe("string");
    expect(res._json.content.length).toBeGreaterThanOrEqual(500);

    const slo = res._json?.metadata?.slo;
    expect(Array.isArray(slo?.suggested)).toBe(true);
    expect(slo.suggested.length).toBeGreaterThanOrEqual(5);
    expect(slo.suggested).toContain("REK-G5-1");

    expect(slo.referenced).toEqual(["REK-G5-1", "REK-G5-2", "TAA-G5-3", "LEZ-G4-2"]);
    expect(slo.valid_reference_count).toBe(2); // two valid for rekenen groep 5
    expect(slo.invalid_references).toEqual(["TAA-G5-3", "LEZ-G4-2"]);

    // Warnings should mention invalid codes
    const warnings = res._json?.warnings || [];
    const joined = (warnings.join(" \n ") || "").toUpperCase();
    expect(warnings.length).toBeGreaterThan(0);
    expect(joined).toContain("TAA-G5-3");
    expect(joined).toContain("LEZ-G4-2");
  });
});
