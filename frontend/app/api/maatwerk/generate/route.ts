import { NextResponse } from "next/server";
import { z } from "zod";
import { SCENARIOS } from "@/lib/maatwerk/scenarios";

const BodySchema = z.object({
  scenarios: z.array(z.string()).min(1).max(10),
  context: z.object({
    groep: z.number().int().min(1).max(8),
    vak: z.enum(["Rekenen", "Taal", "Spelling", "Begrijpend lezen", "Schrijven", "Wereldoriëntatie"]),
    onderwerp: z.string().min(2).max(50),
    week: z.string().max(40).optional().nullable(),
    methode: z.string().max(60).optional().nullable(),
  }),
});

function mdForScenario(params: { id: string; label: string; groep: number; vak: string; onderwerp: string }) {
  const { id, label, groep, vak, onderwerp } = params;
  const header = `# ${vak} – Groep ${groep} – ${onderwerp}\n\n`;
  const meta = `- Scenario: ${label} (${id})\n- Doel: Differentiatie op maat voor ${onderwerp}\n`;
  const body = `\n## Opgaven\n- Opgave 1: [beschrijving aangepast aan scenario]\n- Opgave 2: [beschrijving]\n- Opgave 3: [beschrijving]\n\n## Antwoorden (overzicht)\n- 1) …\n- 2) …\n- 3) …\n\n## Aanpassingen\n- Pas aantal opgaven en moeilijkheid aan conform scenario\n- Gebruik visuele steun indien relevant\n- Markeer kernopgaven indien traag tempo\n`;
  return header + meta + body;
}

export async function POST(req: Request) {
  let json: any = null;
  try { json = await req.json(); } catch { json = {}; }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const { scenarios, context } = parsed.data;
  // Map scenario IDs to definitions
  const items = scenarios.map((id) => {
    const def = SCENARIOS.find((s) => s.id === id);
    const label = def?.label || id;
    const content = mdForScenario({ id, label, groep: context.groep, vak: context.vak, onderwerp: context.onderwerp });
    return {
      scenarioId: id,
      label,
      content,
      metadata: { groep: context.groep, vak: context.vak, onderwerp: context.onderwerp, generatedAt: new Date().toISOString() },
    };
  });
  return NextResponse.json({ ok: true, items });
}

export function GET() {
  return NextResponse.json({ ok: true, message: "POST to generate maatwerk worksheets" });
}

