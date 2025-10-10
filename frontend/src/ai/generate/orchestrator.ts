import { callClaude } from "../client";
import type { ScratchInputs } from "../prompts/generation.scratch";
import type { UploadPromptInputs } from "../prompts/generation.upload";

export function isIncomplete(output: string): boolean {
  const hasEvaluatie = /evaluatie/i.test(output || "");
  const t = (output || "").trim();
  const endsAbruptly = !/[\.!*]$/.test(t) && t.length > 1000;
  return !hasEvaluatie || endsAbruptly;
}

export function isTooGeneric(output: string, checks: { name: string; passed: boolean }[]): boolean {
  const genericWarnings = checks.filter(c => c.name === 'generic_language' && !c.passed);
  return genericWarnings.length > 0;
}

export function isWrongLanguage(output: string): boolean {
  const englishIndicators = [' the ', ' and ', ' is ', ' to ', ' students ', ' learning ', ' goals ', ' interventions ', ' assessment '];
  const dutchIndicators = [' de ', ' het ', ' en ', ' van ', ' leerlingen ', ' doelen ', ' interventies ', ' evaluatie '];
  const lower = ` ${String(output || '').toLowerCase()} `;
  const enCount = englishIndicators.filter(w => lower.includes(w)).length;
  const nlCount = dutchIndicators.filter(w => lower.includes(w)).length;
  return enCount > nlCount;
}

export async function retryGeneration(originalPrompt: string, attempt: number) {
  if (attempt > 3) throw new Error('Max retries exceeded');
  const max_tokens = 4000 + (attempt * 500);
  return await callClaude(originalPrompt, { max_tokens, temperature: 0.7 });
}

export async function retryWithStrongerPrompt(originalPrompt: string) {
  const enhancedPrompt = `
${originalPrompt}

KRITISCH BELANGRIJK: 
- GEEN algemene frasen zoals "maatwerk bieden" of "gedifferentieerd lesgeven"
- WEL concrete tijden: "15 minuten", "3x per week"
- WEL specifieke materialen: "stappenplan op A4", "MAB-blokken"
- WEL exacte aantallen: "80% van de intensieve groep"

Als je abstracte termen gebruikt, geef dan direct een concreet voorbeeld erna.
`;
  return await callClaude(enhancedPrompt, { temperature: 0.5 });
}

export async function retryWithLanguageEmphasis(originalPrompt: string) {
  const languagePrompt = `
BELANGRIJK: Schrijf ALLEEN in het Nederlands. Gebruik Nederlandse onderwijsterminologie.

${originalPrompt}

Alle output moet in het Nederlands zijn. Geen Engels.
`;
  return await callClaude(languagePrompt);
}

export function generateTemplateGroepsplan(inputs: ScratchInputs | UploadPromptInputs): string {
  // Minimal safe fallback with sections and placeholders
  const groep = (inputs as any).groep ?? '[?]';
  const vak = (inputs as any).vakgebied || (inputs as any).new_vakgebied || '[vakgebied]';
  const templateBody = `\n\n## 2. Groepsanalyse & Onderwijsbehoeften (Mickey Mouse-model)\n\n| Groep | Aantal | Onderwijsbehoefte | Focus |\n|-------|--------|-------------------|-------|\n| Basisgroep | - | Heldere instructie en oefentijd | B-niveau |\n| Intensief | - | Verlengde instructie en herhaling | O-niveau |\n| Meer | - | Verkorting en verrijking | M-niveau |\n\n[Concrete beschrijving per groep]\n\n## 3. SMARTI Doelen\n- [Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden, Inspirerend doel]\n\n## 4. Didactische en Pedagogische Aanpak\n[Instructie, verwerking, pedagogiek per groep]\n\n## 5. Afstemming en Samenwerking\n**IB'er:** [Concrete afspraken]  \n**Ouders:** [Communicatie]  \n**Leerlingen:** [Betrokkenheid]\n\n## 6. Evaluatie en Vervolg\n**Evaluatiemoment:** [Wanneer]  \n**Wat wordt geëvalueerd:** [Specifiek]  \n**Vervolg:** [Aanpassen indien nodig]\n`;
  return `# 1. Basisinformatie en Context\n\n**Periode:** [Periode]\n**Groep:** ${groep}\n**Aantal leerlingen:** [aantal]\n**Vakgebied:** ${vak}\n**Leerkracht:** [Naam Leerkracht]\n**IB'er:** [Naam IB'er]\n${templateBody}`;
}

export async function generateGroepsplanWithFallback(
  builtPrompt: string,
  userInputs: ScratchInputs | UploadPromptInputs,
  qualityRunner?: (out: string) => { checks: { name: string; passed: boolean }[] }
): Promise<string> {
  let lastError: Error | null = null;
  // Attempt 1
  try {
    const result = await callClaude(builtPrompt, { max_tokens: 4000, temperature: 0.7 });
    if (isIncomplete(result)) throw new Error('Incomplete generation');
    if (qualityRunner) {
      const q = qualityRunner(result);
      if (isTooGeneric(result, q.checks)) throw new Error('Too generic');
    }
    if (isWrongLanguage(result)) throw new Error('Wrong language');
    return result;
  } catch (e: any) {
    lastError = e; /* continue */
  }

  // Attempt 2
  try {
    const result = await retryWithStrongerPrompt(builtPrompt);
    if (!isIncomplete(result)) return result;
  } catch (e: any) { lastError = e; }

  // Attempt 3
  try {
    const result = await retryGeneration(builtPrompt, 1);
    return result;
  } catch (e: any) { lastError = e; }

  // Fallback
  return generateTemplateGroepsplan(userInputs);
}

