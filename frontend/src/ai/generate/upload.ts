import { buildUploadPrompt, UploadPromptInputs } from "../prompts/generation.upload";
import { generateGroepsplanWithFallback } from "./orchestrator";
import { parseGroepsplanOutput } from "../parse/markdown";
import { validateCompliance } from "../parse/compliance";
import { runQualityChecks } from "../quality/checks";
import type { GenerationResult } from "../types";

export async function generateFromUpload(inputs: UploadPromptInputs): Promise<GenerationResult> {
  const prompt = buildUploadPrompt(inputs);
  const markdown = await generateGroepsplanWithFallback(prompt, inputs, (out) => ({ checks: runQualityChecks(parseGroepsplanOutput(out)) } as any));
  const parsed = parseGroepsplanOutput(markdown);
  const compliance = validateCompliance(parsed.sections);
  parsed.complianceChecks = compliance;
  const qualityChecks = runQualityChecks(parsed);
  return { markdown, parsed, compliance, qualityChecks };
}

