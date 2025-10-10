import { buildScratchPrompt, ScratchInputs } from "../prompts/generation.scratch";
import { generateGroepsplanWithFallback } from "./orchestrator";
import { parseGroepsplanOutput } from "../parse/markdown";
import { validateCompliance } from "../parse/compliance";
import { runQualityChecks } from "../quality/checks";
import type { GenerationResult } from "../types";

export async function generateFromScratch(inputs: ScratchInputs): Promise<GenerationResult> {
  const prompt = buildScratchPrompt(inputs);
  const markdown = await generateGroepsplanWithFallback(prompt, inputs, (out) => ({ checks: runQualityChecks(parseGroepsplanOutput(out)) } as any));
  const parsed = parseGroepsplanOutput(markdown);
  const compliance = validateCompliance(parsed.sections);
  parsed.complianceChecks = compliance;
  const qualityChecks = runQualityChecks(parsed);
  return { markdown, parsed, compliance, qualityChecks };
}

