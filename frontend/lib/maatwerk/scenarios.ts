export type ScenarioCategory =
  | "Niveau-mismatch"
  | "Leerproblemen"
  | "Taal"
  | "Gedrag/Emotie"
  | "Cognitieve verschillen"
  | "Omgevingsfactoren";

export interface ScenarioDefinition {
  id: string;
  label: string;
  description: string;
  category: ScenarioCategory;
  frequency: "Vaak" | "Soms" | "Zeer vaak";
  adjustments?: Record<string, any>;
  compatibleSubjects?: string[] | "all";
}

export const SCENARIOS: ScenarioDefinition[] = [
  // Niveau-mismatch
  { id: "onder-vi", label: "Onder VI-niveau", description: "VI-opdrachten nog te moeilijk", category: "Niveau-mismatch", frequency: "Soms", adjustments: { difficulty: { base_level_offset: -2 } } },
  { id: "tussen-vi-midden", label: "Tussen VI en Midden", description: "VI te makkelijk, Midden te moeilijk", category: "Niveau-mismatch", frequency: "Vaak", adjustments: { difficulty: { base_level_offset: -0.5 } } },
  { id: "tussen-midden-plus", label: "Tussen Midden en Plus", description: "Midden te makkelijk, Plus te moeilijk", category: "Niveau-mismatch", frequency: "Vaak" },
  { id: "boven-plus", label: "Boven Plus-niveau", description: "Gifted/Plus te makkelijk", category: "Niveau-mismatch", frequency: "Soms", adjustments: { difficulty: { base_level_offset: +2 } } },

  // Leerproblemen (subset covering expanded list)
  { id: "dyslexie", label: "Dyslexie", description: "Korte teksten, audio, visueel", category: "Leerproblemen", frequency: "Vaak", adjustments: { typography: { font_size: 14, line_spacing: 1.5 }, audio: { tts: true } } },
  { id: "dyscalculie", label: "Dyscalculie", description: "Visuele steun, hulpmiddelen", category: "Leerproblemen", frequency: "Vaak", compatibleSubjects: ["Rekenen"] },
  { id: "traag-tempo", label: "Traag werktempo", description: "Minder opgaven, meer tijd", category: "Leerproblemen", frequency: "Zeer vaak" },
  { id: "adhd", label: "ADHD/concentratie", description: "Korte blokken, variatie", category: "Leerproblemen", frequency: "Vaak" },
  { id: "werkgeheugen", label: "Zwak werkgeheugen", description: "Kleine stappen, geheugensteun", category: "Leerproblemen", frequency: "Vaak" },
  { id: "begrijpend-lezen-zwak", label: "Zwak begrijpend lezen", description: "Pre-teaching, structuur", category: "Leerproblemen", frequency: "Vaak" },
  { id: "executieve-functies-zwak", label: "Zwakke executieve functies", description: "Structuur en planning", category: "Leerproblemen", frequency: "Soms" },
  { id: "ruimtelijk-inzicht-zwak", label: "Zwak ruimtelijk inzicht (Rekenen)", description: "Visueel-spatieel steun", category: "Leerproblemen", frequency: "Soms", compatibleSubjects: ["Rekenen"] },
  { id: "fijne-motoriek-zwak", label: "Zwakke fijne motoriek (Schrijven)", description: "Minder schrijfwerk", category: "Leerproblemen", frequency: "Soms", compatibleSubjects: ["Schrijven"] },
  { id: "auditieve-verwerking", label: "Auditieve verwerkingsproblemen", description: "Alles schriftelijk en visueel", category: "Leerproblemen", frequency: "Soms" },

  // Taal
  { id: "nt2-begin", label: "NT2 - Beginnend", description: "<1 jaar NL, visueel", category: "Taal", frequency: "Soms" },
  { id: "nt2-gevorderd", label: "NT2 - Gevorderd", description: "Vereenvoudigde zinnen", category: "Taal", frequency: "Soms" },
  { id: "woordenschat-zwak", label: "Zwakke woordenschat", description: "Expliciete woordenschat", category: "Taal", frequency: "Vaak" },

  // Gedrag/Emotie
  { id: "autisme", label: "Autisme", description: "Structuur, voorspelbaarheid", category: "Gedrag/Emotie", frequency: "Soms" },
  { id: "faalangst", label: "Faalangst", description: "Veilige stappen, positief", category: "Gedrag/Emotie", frequency: "Soms" },
  { id: "motivatie-laag", label: "Weinig zelfvertrouwen / motivatie", description: "Eigen doelen en keuze", category: "Gedrag/Emotie", frequency: "Vaak" },
  { id: "frustratie-regulatie", label: "Boosheid / frustratieregulatie", description: "Kleine stappen, rust", category: "Gedrag/Emotie", frequency: "Soms" },
  { id: "perfectionisme", label: "Perfectionisme", description: "Fouten = leren", category: "Gedrag/Emotie", frequency: "Soms" },

  // Cognitieve verschillen
  { id: "hoogbegaafd", label: "Hoogbegaafd / snelle denker", description: "Compacting, diepte", category: "Cognitieve verschillen", frequency: "Soms" },
  { id: "onderpresteerder", label: "Onderpresteerder", description: "Relevantie en autonomie", category: "Cognitieve verschillen", frequency: "Soms" },

  // Omgevingsfactoren
  { id: "lage-ses", label: "Weinig thuissupport / lage SES", description: "Schooltijd herhalen", category: "Omgevingsfactoren", frequency: "Vaak" },
  { id: "prikkel-concentratie", label: "Concentratieproblemen door prikkels", description: "Rustige werkplek", category: "Omgevingsfactoren", frequency: "Soms" },
];

export const CATEGORIES: ScenarioCategory[] = [
  "Niveau-mismatch",
  "Leerproblemen",
  "Taal",
  "Gedrag/Emotie",
  "Cognitieve verschillen",
  "Omgevingsfactoren",
];

export function getScenariosByCategory() {
  const byCat: Record<ScenarioCategory, ScenarioDefinition[]> = {
    "Niveau-mismatch": [],
    "Leerproblemen": [],
    "Taal": [],
    "Gedrag/Emotie": [],
    "Cognitieve verschillen": [],
    "Omgevingsfactoren": [],
  } as any;
  for (const s of SCENARIOS) byCat[s.category].push(s);
  return byCat;
}

