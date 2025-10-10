import { buildRefinePrompt, instructionClarifications } from "../prompts/refine";
import { callClaude } from "../client";

export async function refineSection(params: {
  sectionContent: string;
  userInstruction: string; // <= 200 chars
  groep: number;
  vakgebied: string;
  sectionName: string;
  instructionKey?: keyof typeof instructionClarifications;
}) {
  const { sectionContent, userInstruction, groep, vakgebied, sectionName, instructionKey } = params;
  if (!userInstruction || userInstruction.length > 200) {
    throw new Error('VALIDATION_ERROR: userInstruction te lang of leeg');
  }
  const prompt = buildRefinePrompt({ section_content: sectionContent, user_instruction: userInstruction, groep, vakgebied, section_name: sectionName, instruction_key: instructionKey });
  let text = '';
  try { text = await callClaude(prompt, { temperature: 0.5 }); } catch { /* ignore */ }
  const refinedContent = text && text.trim() ? text : sectionContent;
  const changes = refinedContent !== sectionContent ? [{ type: 'modification', description: 'Sectie aangepast volgens instructie' }] : [];
  return { refinedContent, originalContent: sectionContent, changes };
}

