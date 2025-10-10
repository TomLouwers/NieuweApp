export interface UploadPromptInputs {
  extracted_text: string;
  groep?: number;
  vakgebied?: string;
  previous_periode?: string;
  previous_groepsindeling?: string;
  previous_goals?: string;
  previous_results?: string;
  new_vakgebied: string;
  challenge_description: string;
  any_user_modifications?: string;
}

export function buildUploadPrompt(inputs: UploadPromptInputs): string {
  if (!inputs || typeof inputs !== 'object') throw new Error('Ongeldige inputs');
  const {
    extracted_text,
    groep,
    vakgebied,
    previous_periode,
    previous_groepsindeling,
    previous_goals,
    previous_results,
    new_vakgebied,
    challenge_description,
    any_user_modifications,
  } = inputs;

  const prev = `
## Geüploade Document Context
<uploaded_context>
${(extracted_text || '').trim()}
</uploaded_context>

## Wat We Hebben Geëxtraheerd
<extracted_data>
- Groep: ${groep ?? ''}
- Vakgebied: ${vakgebied ?? ''}
- Vorige periode: ${previous_periode ?? ''}
- Vorige groepsindeling: ${previous_groepsindeling ?? ''}
- Vorige doelen: ${previous_goals ?? ''}
- Vorige resultaten: ${previous_results ?? ''}
</extracted_data>`;

  const next = `
## Nieuwe Context voor Dit Blok
<new_context>
- Vakgebied voor dit blok: ${new_vakgebied}
- Grootste uitdaging: ${challenge_description}
- Aanpassingen: ${any_user_modifications ?? ''}
</new_context>`;

  return `
<groepsplan_from_upload>
Genereer een nieuw groepsplan op basis van een eerder groepsplan van deze leerkracht.
${prev}
${next}

## Instructies
Genereer een NIEUW groepsplan dat:

1. **Leert van het verleden**: 
   - Als vorige doelen behaald zijn → verhoog het niveau
   - Als vorige doelen NIET behaald zijn → analyseer waarom en pas aan
   - Neem concrete aanpak over die werkte
   - Verbeter aanpak die niet werkte

2. **Consistent blijft met de leerkracht's stijl**:
   - Gebruik dezelfde toon en schrijfstijl als het geüploade document
   - Als de leerkracht specifieke formats gebruikt (bijv. tabellen), behoud die
   - Als er een specifieke schoolstructuur zichtbaar is, volg die

3. **Praktisch voortbouwt**:
   - Verwijs waar relevant naar "vorig blok": "Voortbouwend op de werkwoordspelling van vorig blok..."
   - Erken wat er al bekend is over de groep
   - Geef realistische nieuwe doelen (niet helemaal opnieuw beginnen)

4. **Nog steeds alle vereisten van Passend Onderwijs 2024 bevat**

Genereer nu het complete nieuwe groepsplan in markdown format.
</groepsplan_from_upload>
`.trim();
}

