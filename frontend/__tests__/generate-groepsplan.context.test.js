const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("generate-groepsplan API - previousContent context", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  test("includes previousContent in prompt and sets context metadata", async () => {
    const prior =
      "Dit is het vorige groepsplan. Leerlingen werkten aan hoofdrekenen, verhaalsommen en tempo. " +
      "Focus lag op automatiseren en strategie-verwoording. Dit dient als context en inspiratie.";

    // Prepare a sufficiently long mock response referencing prior context
    const mockText = [
      "# Groepsplan rekenen — Groep 5 — Periode Q2\n\n",
      "## Beginsituatie\n",
      "Gebaseerd op het vorige groepsplan is zichtbaar dat automatiseren voortgang laat zien, ",
      "maar nog niet stabiel is voor alle leerlingen. We herformuleren inzichten uit de vorige ",
      "periode zonder letterlijk te kopiëren en leggen nadruk op getalinzicht en verhaalsommen. ",
      "Leerlingen benoemen strategieën en controleren uitkomsten.\n\n",
      "## Doelen (SLO)\n",
      "We richten ons op REK-G5-1 en REK-G5-2, passend bij de leerlijn voor groep 5.\n\n",
      "## Aanpak\n",
      "Gerichte instructie, begeleide inoefening en zelfstandige verwerking met feedback. Coöperatieve werkvormen ",
      "bevorderen taal-denken rondom rekenen. Huiswerk en herhaald oefenen ondersteunen borging.\n\n",
      "## Differentiatie\n",
      "Niveau 1: herhaling en automatiseren; Niveau 2: strategiekeuze; Niveau 3: complexe ",
      "verhaalsommen en reflectie.\n\n",
      "## Evaluatie\n",
      "Formatieve checks, observaties en korte toetsen geven zicht op groei."
    ].join("");

    jest.doMock("@anthropic-ai/sdk", () => {
      const store = { lastCreateArgs: null };
      function AnthropicMock() {
        return {
          messages: {
            create: async (args) => {
              store.lastCreateArgs = args;
              return { content: [{ type: "text", text: mockText }] };
            },
          },
        };
      }
      AnthropicMock.__store = store;
      return AnthropicMock;
    });

    const handler = require("../pages/api/generate-groepsplan.js");
    const { req, res } = createReqRes({
      method: "POST",
      body: { groep: 5, vak: "rekenen", periode: "Q2", previousContent: prior },
    });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.success).toBe(true);
    expect(res._json?.warnings).toBeUndefined();

    // Context metadata
    expect(res._json?.metadata?.context?.previous_used).toBe(true);
    expect(res._json?.metadata?.context?.previous_chars_in_prompt).toBeGreaterThan(10);

    // Verify the prompt was biased with previous content
    const SDK = require("@anthropic-ai/sdk");
    const args = SDK.__store?.lastCreateArgs;
    expect(args).toBeTruthy();
    expect(typeof args?.system).toBe("string");
    expect(args?.messages?.[0]?.content).toEqual(expect.stringContaining("Vorig groepsplan (context):"));
    expect(args?.messages?.[0]?.content).toEqual(expect.stringContaining(prior.slice(0, 50)));
  });
});

