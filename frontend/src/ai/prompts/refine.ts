export const instructionClarifications = {
  'maak korter': 'Schrap algemene uitleg en herhaling. Behoud concrete cijfers, tijden, en materialen. Max 50% van originele lengte.',
  'voeg meer differentiatie toe': 'Voeg specifieke verschillen toe tussen de 3 groepen: wat doet Basis anders dan Intensief? Wat doet Meer anders? Geef concrete voorbeelden.',
  'formeler toon': 'Verwijder ik-vorm, schrijf in derde persoon ("De leerkracht zal..."). Verwijder informele taal. Behoud alle inhoud.',
  'toegankelijker voor ouders': 'Vervang jargon (SMARTI, HGW, OGW) door gewone taal. Leg onderwijstermen uit in haakjes. Maak zinnen korter.',
  'concrete voorbeelden': 'Voeg bij elke interventie een concreet voorbeeld toe: welk materiaal, welke opdracht, hoe ziet het eruit in de praktijk?',
  'meer tijd/minder tijd': 'Pas tijdsindicaties aan: als "meer tijd" → verhoog van bijv. 15min naar 20-25min. Als "minder tijd" → verlaag en maak efficiënter.',
} as const;

export function buildRefinePrompt(params: {
  section_content: string;
  user_instruction: string;  // <= 200 chars validation
  groep: number;
  vakgebied: string;
  section_name: string;
  instruction_key?: keyof typeof instructionClarifications;
}): string {
  const { section_content, user_instruction, groep, vakgebied, section_name, instruction_key } = params;
  if (!user_instruction || user_instruction.length > 200) {
    throw new Error('user_instruction is verplicht en maximaal 200 tekens');
  }
  const clar = instruction_key ? instructionClarifications[instruction_key] : undefined;
  const clarBlock = clar ? `\n\nSpecifiek voor deze instructie:\n${clar}` : '';

  return `
<groepsplan_refine>
De leerkracht wil een aanpassing maken aan hun groepsplan.

## Huidige Sectie
<current_content>
${section_content || ''}
</current_content>

## Instructie van Leerkracht
"${user_instruction}"

## Context van het Groepsplan
- Groep: ${groep}
- Vakgebied: ${vakgebied}
- Sectie: ${section_name}

## Taak
Pas de sectie aan volgens de instructie van de leerkracht, maar:

1. **Behoud de structuur**: Als er subsecties/tabellen zijn, behoud die
2. **Behoud de toon**: Schrijf in dezelfde stijl als de huidige sectie
3. **Blijf concreet**: Als de leerkracht zegt "maak korter", schrap vaagheden maar behoud specificiteit
4. **Blijf compliant**: Zorg dat Passend Onderwijs vereisten intact blijven${clarBlock}

Genereer alleen de aangepaste sectie, niet het hele document.
</groepsplan_refine>
`.trim();
}

