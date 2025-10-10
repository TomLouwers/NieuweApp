import { buildScratchPrompt, ScratchInputs } from "../prompts/generation.scratch";
import { callClaude } from "../client";
import { parseGroepsplanOutput } from "../parse/markdown";
import { runQualityChecks } from "../quality/checks";

export const promptVariants = (MAIN: string) => ({
  'v1_baseline': MAIN,
  'v2_more_examples': `${MAIN}

VOORBEELD van concrete interventie:
"Intensieve groep: 15 minuten verlengde instructie, maandag/woensdag/vrijdag van 8:30-8:45, met visueel stappenplan en MAB-blokken. Focus op splitsend optellen tot 20."

Schrijf alle interventies op dit niveau van concreetheid.`,
  'v3_anti_generic': `${MAIN}

VERBODEN FRASEN (gebruik deze NOOIT):
- "maatwerk bieden"
- "gedifferentieerd lesgeven"
- "extra aandacht geven"
- "individuele begeleiding"
- "optimaal leerklimaat"

Als je een algemene term wilt gebruiken, geef direct een concreet voorbeeld.`,
});

export function buildPromptWithVariant(variantText: string, inputs: ScratchInputs): string {
  const base = buildScratchPrompt(inputs);
  return `${base}\n\n${variantText}`;
}

export async function abTest(inputs: ScratchInputs, MAIN_GENERATION_PROMPT: string, numSamples = 3) {
  const variants = promptVariants(MAIN_GENERATION_PROMPT);
  const results: Record<string, any[]> = {};
  for (const [variant, prompt] of Object.entries(variants)) {
    results[variant] = [];
    for (let i = 0; i < numSamples; i++) {
      const out = await callClaude(buildPromptWithVariant(prompt, inputs));
      const parsed = parseGroepsplanOutput(out);
      const qualityChecks = runQualityChecks(parsed);
      results[variant].push({
        complianceScore: parsed.complianceChecks.overall,
        qualityScore: qualityChecks.filter(c => c.passed).length,
        length: out.length,
        genericPhraseCount: qualityChecks.find(c => c.name==='generic_language' && !c.passed) ? 3 : 0,
      });
    }
  }
  const summary = Object.entries(results).map(([variant, samples]) => {
    const avg = (arr: number[]) => arr.reduce((a,b)=>a+b,0)/arr.length;
    return {
      variant,
      avgCompliance: avg(samples.map((s: any)=>s.complianceScore)),
      avgQuality: avg(samples.map((s: any)=>s.qualityScore)),
      avgLength: avg(samples.map((s: any)=>s.length)),
      avgGenericCount: avg(samples.map((s: any)=>s.genericPhraseCount)),
    };
  });
  try { console.table(summary); } catch {}
  return summary;
}

