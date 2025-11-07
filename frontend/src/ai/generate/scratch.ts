import { buildScratchPrompt, ScratchInputs } from "../prompts/generation.scratch";
import { generateGroepsplanWithFallback } from "./orchestrator";
import { parseGroepsplanOutput } from "../parse/markdown";
import { validateCompliance } from "../parse/compliance";
import { runQualityChecks } from "../quality/checks";
import type { GenerationResult } from "../types";
import { buildSLOGroepsplanContext } from "../slo/context";

export async function generateFromScratch(inputs: ScratchInputs): Promise<GenerationResult> {
  const base = buildScratchPrompt(inputs);
  // Inject SLO curriculum context (non-fatal if it fails)
  let slo = "";
  try {
    slo = await buildSLOGroepsplanContext(inputs.groep as any, inputs.vakgebied as any);
  } catch {}
  const prompt = slo ? `${base}\n\n<slo_context_inject>\n${slo}\n</slo_context_inject>` : base;
  const markdown = await generateGroepsplanWithFallback(prompt, inputs, (out) => ({ checks: runQualityChecks(parseGroepsplanOutput(out)) } as any));
  const parsed = parseGroepsplanOutput(markdown);
  const compliance = validateCompliance(parsed.sections);
  parsed.complianceChecks = compliance;
  const qualityChecks = runQualityChecks(parsed);
  return { markdown, parsed, compliance, qualityChecks };
}
