# AI Prompts — Gebruikshandleiding

Deze recepten laten zien hoe je vanuit code een groepsplan genereert, op basis van de Prompt Engineering Guide. Alle output is Nederlands, met 6 vaste secties, SMARTI-doelen en expliciete verwijzing naar het Mickey Mouse-model.

## From Scratch

```ts
import { generateFromScratch } from '@/src/ai/generate';

const result = await generateFromScratch({
  groep: 5,
  vakgebied: 'spelling',
  challenge: 'enorme_niveauverschillen',
  aantalLeerlingen: 28,
  groepsindeling: { basis: 18, intensief: 5, meer: 5 },
  startingPoint: 'midden',
  toetsScores: { basis: 'D', intensief: 'E' },
});

console.log(result.markdown); // Markdown met 6 secties
console.log(result.compliance.overall); // >= 8 verwacht
console.log(result.qualityChecks);
```

## From Upload

```ts
import { generateFromUpload } from '@/src/ai/generate';

const result = await generateFromUpload({
  extracted_text: '...volledige tekst uit eerder document...',
  groep: 5,
  vakgebied: 'spelling',
  previous_periode: 'Blok 1',
  previous_groepsindeling: 'B:18 / O:5 / M:5',
  previous_goals: '...doelen...',
  previous_results: '...resultaten...',
  new_vakgebied: 'spelling',
  challenge_description: 'enorme niveauverschillen',
  any_user_modifications: 'meer focus op werkwoordspelling',
});
```

## Refine Section

```ts
import { refineSection } from '@/src/ai/generate/refine';

const { refinedContent, changes } = await refineSection({
  sectionContent: '## Aanpak... (bestaande tekst)',
  userInstruction: 'maak korter en voeg tijdsindicaties toe',
  groep: 5,
  vakgebied: 'spelling',
  sectionName: 'Didactische en Pedagogische Aanpak',
  instructionKey: 'maak korter',
});
```

## Kwaliteitsinterpretatie

- `qualityChecks` bevat o.a.: lengte, generiek taalgebruik, concrete getallen, Mickey Mouse-vermelding, placeholders, taal-NL check.
- Bij meerdere waarschuwingen: herprompt of refinement.

## Kosten

- Richtlijn per plan: ~€0,05 (zie cost.ts). Log toont tokens en EUR-schatting.

