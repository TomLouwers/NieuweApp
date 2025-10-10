import type { ScratchInputs } from "@/src/ai/prompts/generation.scratch";
import type { UploadPromptInputs } from "@/src/ai/prompts/generation.upload";
import { generateFromScratch, generateFromUpload } from "@/src/ai/generate";

function assertValidScratch(inputs: ScratchInputs) {
  const total = inputs.groepsindeling.basis + inputs.groepsindeling.intensief + inputs.groepsindeling.meer;
  if (total !== inputs.aantalLeerlingen) {
    const e: any = new Error('VALIDATION_ERROR: som groepsindeling ≠ aantalLeerlingen');
    e.code = 'VALIDATION_ERROR';
    e.details = { expected: inputs.aantalLeerlingen, got: total };
    throw e;
  }
}

export async function generateForApiFromScratch(inputs: ScratchInputs) {
  assertValidScratch(inputs);
  return await generateFromScratch(inputs);
}

export async function generateForApiFromUpload(inputs: UploadPromptInputs) {
  if (!inputs.extracted_text || !inputs.new_vakgebied || !inputs.challenge_description) {
    const e: any = new Error('VALIDATION_ERROR: ontbrekende velden');
    e.code = 'VALIDATION_ERROR';
    throw e;
  }
  return await generateFromUpload(inputs);
}

export async function refineForApi(params: {
  sectionContent: string;
  userInstruction: string;
  groep: number;
  vakgebied: string;
  sectionName: string;
  instructionKey?: any;
}) {
  const { refineSection } = await import("@/src/ai/generate/refine");
  return await refineSection(params as any);
}

