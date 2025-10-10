import type { ParsedGroepsplan } from "../parse/types";

export interface QualityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function runQualityChecks(groepsplan: ParsedGroepsplan): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const totalLength = (groepsplan.sections || []).reduce((sum, s) => sum + (s.content?.length || 0), 0);

  if (totalLength < 2000) {
    checks.push({ name: 'length', passed: false, message: 'Groepsplan is te kort (< 2000 tekens). Voeg meer detail toe.', severity: 'error' });
  } else if (totalLength > 8000) {
    checks.push({ name: 'length', passed: false, message: 'Groepsplan is te lang (> 8000 tekens). Maak compacter.', severity: 'warning' });
  } else {
    checks.push({ name: 'length', passed: true, message: `Groepsplan heeft goede lengte (${totalLength} tekens)`, severity: 'info' });
  }

  const fullText = (groepsplan.sections || []).map(s => s.content || '').join(' ');
  const genericPhrases = [
    'maatwerk bieden', 'gedifferentieerd lesgeven', 'passend onderwijs', 'alle leerlingen', 'optimaal leerklimaat', 'talenten ontwikkelen'
  ];
  const foundGeneric = genericPhrases.filter(p => fullText.toLowerCase().includes(p));
  if (foundGeneric.length > 2) {
    checks.push({ name: 'generic_language', passed: false, message: `Te veel generieke frasen gevonden: ${foundGeneric.join(', ')}. Maak concreter.`, severity: 'warning' });
  }

  const numMatches = fullText.match(/\d+/g) || [];
  if (numMatches.length < 10) {
    checks.push({ name: 'concrete_numbers', passed: false, message: 'Te weinig concrete getallen. Voeg meer specifieke aantallen/percentages/tijden toe.', severity: 'warning' });
  }

  if (!/mickey mouse/i.test(fullText)) {
    checks.push({ name: 'mickey_mouse', passed: false, message: 'Mickey Mouse-model niet expliciet genoemd. Voeg toe in groepsanalyse.', severity: 'warning' });
  }

  const placeholders = ['[naam leerkracht]', "[naam ib'", '[vul in]', 'xxx', '...'];
  const foundPH = placeholders.filter(ph => fullText.toLowerCase().includes(ph));
  if (foundPH.length > 3) {
    checks.push({ name: 'placeholders', passed: false, message: `Te veel placeholders: ${foundPH.join(', ')}. Dit is acceptabel, maar vermeld aan gebruiker.`, severity: 'info' });
  }

  const dutchWords = ['de', 'het', 'een', 'en', 'van', 'in', 'op'];
  const hasDutch = dutchWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(fullText));
  if (!hasDutch) {
    checks.push({ name: 'language', passed: false, message: 'Taal lijkt niet Nederlands. Controleer output.', severity: 'error' });
  }

  return checks;
}

