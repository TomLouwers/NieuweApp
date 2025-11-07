import { buildUploadPrompt, UploadPromptInputs } from "../prompts/generation.upload";
import { generateGroepsplanWithFallback } from "./orchestrator";
import { parseGroepsplanOutput } from "../parse/markdown";
import { validateCompliance } from "../parse/compliance";
import { runQualityChecks } from "../quality/checks";
import type { GenerationResult } from "../types";
import { buildSLOGroepsplanContext } from "../slo/context";

export async function generateFromUpload(inputs: UploadPromptInputs): Promise<GenerationResult> {
  const base = buildUploadPrompt(inputs);
  let slo = "";
  try {
    // Prefer explicit group/vak if provided in extracted data; fall back to new_vakgebied
    const groep = (inputs.groep as any) || 0;
    const vak = (inputs.new_vakgebied as any) || (inputs.vakgebied as any) || '';
    if (groep && vak) slo = await buildSLOGroepsplanContext(groep, vak);
  } catch {}
  const prompt = slo ? `${base}\n\n<slo_context_inject>\n${slo}\n</slo_context_inject>` : base;
  const markdown = await generateGroepsplanWithFallback(prompt, inputs, (out) => ({ checks: runQualityChecks(parseGroepsplanOutput(out)) } as any));
  const parsed = parseGroepsplanOutput(markdown);
  const compliance = validateCompliance(parsed.sections);
  parsed.complianceChecks = compliance;
  const qualityChecks = runQualityChecks(parsed);
  return { markdown, parsed, compliance, qualityChecks };
}
