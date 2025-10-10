import type { ComplianceResult, Section } from "./types";

export function validateCompliance(sections: Section[]): ComplianceResult {
  const required = [
    'basisinformatie',
    'groepsanalyse',
    'smarti-doelen',
    'didactische-en-pedagogische-aanpak',
    'afstemming-en-samenwerking',
    'evaluatie-en-vervolg',
  ];

  const checks = {
    beginsituatie: false,
    smartiDoelen: false,
    interventies: false,
    evaluatie: false,
    betrokkenen: false,
    handelingsgericht: false,
  };

  const warnings: string[] = [];
  const errors: string[] = [];

  // Required sections present
  required.forEach((slug) => {
    const found = sections.some((s) => s.id.includes(slug) || s.title.toLowerCase().includes(slug.replace(/-/g, ' ')));
    if (!found) errors.push(`Verplichte sectie ontbreekt: ${slug}`);
  });

  // SMARTI goals heuristic
  const doelen = sections.find((s) => /doelen|smarti/i.test(s.title));
  if (doelen) {
    const content = doelen.content;
    const hasMeetbaar = /(\d+%|\d+ leerlingen)/i.test(content);
    const hasTijdgebonden = /(eind|week|maand|blok)/i.test(content);
    checks.smartiDoelen = hasMeetbaar && hasTijdgebonden;
    if (!hasMeetbaar) warnings.push('SMARTI doelen bevatten geen meetbare criteria (percentages/aantallen)');
    if (!hasTijdgebonden) warnings.push('SMARTI doelen bevatten geen tijdsindicatie');
  }

  // Interventions concreteness
  const aanpak = sections.find((s) => /aanpak|interventies/i.test(s.title));
  if (aanpak) {
    const content = aanpak.content;
    const hasTimeIndications = /(\d+ min|\d+ minuten|\d+x per week)/i.test(content);
    const hasVague = /(extra aandacht|meer oefening|individuele begeleiding)(?! met)/i.test(content);
    checks.interventies = hasTimeIndications && !hasVague;
    if (!hasTimeIndications) warnings.push('Interventies bevatten geen concrete tijdsindicaties');
    if (hasVague) warnings.push('Vage interventies gevonden. Maak specifieker');
  }

  // Handelingsgericht language
  const full = sections.map((s) => s.content).join(' ');
  const badPhrases = [
    /deze leerlingen zijn zwak/i,
    /kunnen niet/i,
    /zitten achter/i,
    /hebben moeite(?! met)/i,
  ];
  checks.handelingsgericht = true;
  badPhrases.forEach((re) => { if (re.test(full)) { checks.handelingsgericht = false; warnings.push('Niet-handelingsgericht taalgebruik gevonden. Vervang door "behoefte aan..."'); } });

  // Other flags
  checks.beginsituatie = /beginsituatie/i.test(full) || sections.some((s) => /basisinformatie/i.test(s.title));
  checks.evaluatie = /evaluatie/i.test(full);
  checks.betrokkenen = /ib\'er|ouders|betrokkenen/i.test(full);

  const totalChecks = Object.values(checks).length;
  const passed = Object.values(checks).filter(Boolean).length;
  const overall = Math.round((passed / totalChecks) * 10);
  const inspectieProof = errors.length === 0 && overall >= 8;

  return { overall, checks, warnings, errors, inspectieProof };
}

