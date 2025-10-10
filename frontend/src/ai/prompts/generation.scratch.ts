import { getChallengeGuidance, ChallengeKey } from "../context/challenges";
import { getExpectations, Vakgebied, Groep } from "../context/expectations";
import { getStartingPointDescription, StartingPoint } from "../context/startingPoint";

export interface ScratchInputs {
  groep: Groep;
  vakgebied: Vakgebied;
  challenge: ChallengeKey;
  aantalLeerlingen: number; // 1-40
  groepsindeling: { basis: number; intensief: number; meer: number };
  startingPoint: StartingPoint;
  toetsScores?: { basis: 'A'|'B'|'C'|'D'|'E'|'F'; intensief: 'A'|'B'|'C'|'D'|'E'|'F' };
}

export function buildScratchPrompt(inputs: ScratchInputs): string {
  if (!inputs || typeof inputs !== 'object') throw new Error('Ongeldige inputs');
  const { groep, vakgebied, challenge, aantalLeerlingen, groepsindeling, startingPoint, toetsScores } = inputs;
  if (aantalLeerlingen < 1 || aantalLeerlingen > 40) throw new Error('aantalLeerlingen buiten bereik (1-40)');
  const challengeGuidance = getChallengeGuidance(challenge);
  const expectations = getExpectations(vakgebied, groep);
  const startingPointDesc = getStartingPointDescription(startingPoint);

  const ts = toetsScores ? `
- **Recente toetsgegevens:**
  - Basisgroep gemiddeld: ${toetsScores.basis}-niveau
  - Intensieve groep gemiddeld: ${toetsScores.intensief}-niveau` : '';

  const startYearFlag = startingPoint === 'begin'
    ? `
BELANGRIJK: Dit is het begin van het schooljaar. Focus de eerste 3 weken op diagnosticeren en groepsindeling bepalen. De interventies starten pas na week 4.`
    : '';

  return `
<groepsplan_generation>
Genereer een volledig groepsplan voor een Nederlandse basisschoolleerkracht met de volgende context:

## Context
<context>
- **Groep:** ${groep}
- **Vakgebied:** ${vakgebied}
- **Aantal leerlingen:** ${aantalLeerlingen}
- **Groepsindeling:**
  - Basisgroep (B-niveau): ${groepsindeling.basis} leerlingen
  - Intensieve ondersteuning (O-niveau): ${groepsindeling.intensief} leerlingen
  - Meer-groep (M-niveau): ${groepsindeling.meer} leerlingen
- **Grootste uitdaging:** ${challenge}
- **Startpunt:** ${startingPointDesc}
${ts}
</context>

## Specifieke Aanpak voor Deze Uitdaging
${challengeGuidance}

## Verwachtingen voor ${vakgebied} in Groep ${groep}
${expectations}

## Instructies
Genereer een volledig groepsplan dat:
1. **Concreet** is: geen vage termen, wel specifieke aantallen/tijden/materialen
2. **Realistisch** is: passend bij de capaciteit van één leerkracht
3. **Handelingsgericht** is: focus op wat leerlingen NODIG hebben, niet op wat ze "niet kunnen"
4. **Praktisch bruikbaar** is: de leerkracht moet dit morgen kunnen gebruiken
5. **Voldoet aan Passend Onderwijs 2024**: alle verplichte onderdelen aanwezig

Gebruik het Mickey Mouse-model voor de groepsindeling (zoals beschreven in de systeemprompt).

Schrijf in de ik-vorm vanuit het perspectief van de leerkracht ("Ik ga...", "Mijn aanpak is...").
${startYearFlag}

Genereer nu het complete groepsplan in markdown format met duidelijke kopjes en subsecties.
</groepsplan_generation>
`.trim();
}

