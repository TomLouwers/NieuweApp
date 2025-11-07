"use strict";

// Lightweight SLO context builder for OPP (CommonJS for pages/api compatibility)

const VAK_MAP = require("../data/slo/mappings/vak_to_slo.json");
const REK_KD = require("../data/slo/kerndoelen/rekenen.json");
const NL_KD = require("../data/slo/kerndoelen/nederlands.json");
const REK_F2 = require("../data/slo/inhoudslijnen/rekenen_fase2.json");
const REK_F3 = require("../data/slo/inhoudslijnen/rekenen_fase3.json");
const NL_F2 = require("../data/slo/inhoudslijnen/nederlands_fase2.json");

function mapGroepToFase(g) {
  const n = Number(g);
  if (!Number.isFinite(n)) return null;
  if (n <= 2) return 1; if (n <= 4) return 2; if (n <= 6) return 3; return 4;
}

function getMappingForVak(vakKey) {
  return VAK_MAP[vakKey] || null;
}

function loadKerndoelen(leergebied) {
  if (leergebied === 'Rekenen en wiskunde') return REK_KD;
  if (leergebied === 'Nederlandse taal') return NL_KD;
  return [];
}

function loadInhoudslijnen(leergebied, fase) {
  if (!fase) return [];
  if (leergebied === 'Rekenen en wiskunde') {
    if (fase === 2) return REK_F2;
    if (fase === 3) return REK_F3;
  }
  if (leergebied === 'Nederlandse taal') {
    if (fase === 2) return NL_F2;
  }
  return [];
}

function xmlEscape(s) {
  return String(s == null ? '' : s).replace(/[<>]/g, '');
}

function buildVakBlock(vakKey, groep) {
  const mapping = getMappingForVak(vakKey);
  if (!mapping) return '';
  const fase = Number(mapping.fase_by_groep?.[String(groep)]) || mapGroepToFase(groep);
  const kdAll = loadKerndoelen(mapping.leergebied);
  const kdList = (mapping.kerndoel_codes || []).map(c => kdAll.find(k => k.code === c)).filter(Boolean);
  const ihAll = loadInhoudslijnen(mapping.leergebied, fase);
  // Aggregate aanbodsdoelen (flatten) for brief summary
  const doelen = [];
  for (const l of ihAll) {
    const f = (l.fases || []).find(x => x.fase_nummer === fase);
    if (f && Array.isArray(f.aanbodsdoelen)) doelen.push(...f.aanbodsdoelen);
  }

  const kdXml = kdList.map(k => (
    `      <kerndoel code="${xmlEscape(k.code)}">\n` +
    `        <wat>${xmlEscape(k.doelzin)}</wat>\n` +
    `        <verwacht_niveau_groep_${xmlEscape(groep)}>${xmlEscape((doelen.slice(0,3).map(d=>d.beschrijving)).join('; '))}</verwacht_niveau_groep_${xmlEscape(groep)}>` +
    `\n      </kerndoel>`
  )).join("\n");

  return (
    `    <vakgebied naam="${xmlEscape(vakKey)}">\n` +
    `      <kerndoelen>\n` + kdXml + `\n      </kerndoelen>\n` +
    `    </vakgebied>`
  );
}

function criticalKerndoelenForProfile(upType) {
  const t = String(upType || '').toLowerCase();
  if (/vwo|havo/.test(t)) {
    return [
      { code: 'T2', prioriteit: 'hoog', rationale: 'Vlot technisch lezen als basis voor studerend lezen.' },
      { code: 'T3', prioriteit: 'hoog', rationale: 'Begrijpend/studerend lezen voor alle vakken.' },
      { code: 'F4', prioriteit: 'hoog', rationale: 'Automatiseren tot 100/1000 voor vlot rekenen.' },
      { code: 'F6', prioriteit: 'hoog', rationale: 'Alle tafels tot 10 automatisch voor algebraïsche opbouw.' },
    ];
  }
  if (/vmbo/.test(t)) {
    return [
      { code: 'T1', prioriteit: 'medium', rationale: 'Mondelinge taalvaardigheid voor praktijkopdrachten.' },
      { code: 'T2', prioriteit: 'hoog', rationale: 'Vlot technisch lezen is voorwaarde voor T3.' },
      { code: 'T3', prioriteit: 'hoog', rationale: 'Informatie uit teksten halen voor instructies.' },
      { code: 'F4', prioriteit: 'hoog', rationale: 'Automatiseren tot 100 voor rekenvaardigheid.' },
      { code: 'F6', prioriteit: 'medium', rationale: 'Tafels beheersen voor praktische berekeningen.' },
    ];
  }
  return [
    { code: 'T2', prioriteit: 'hoog', rationale: 'Technisch lezen ondersteunt alle vakken.' },
    { code: 'T3', prioriteit: 'hoog', rationale: 'Informatie uit teksten halen.' },
    { code: 'F4', prioriteit: 'hoog', rationale: 'Automatiseren tot 100.' },
  ];
}

function buildSLOOppContext(payload) {
  try {
    const groep = Number(payload?.groep || 0);
    if (!Number.isFinite(groep) || groep < 1 || groep > 8) return '';
    const upType = (payload?.uitstroomprofiel && (payload.uitstroomprofiel.type || payload.uitstroomprofiel)) || '';
    const cl = payload?.currentLevels || {};

    const vakKeys = [];
    if (cl.rekenen) { vakKeys.push('rekenen_automatiseren', 'rekenen_begrip'); }
    if (cl.technischLezen) { vakKeys.push('technisch_lezen'); }
    if (cl.begrijpendLezen) { vakKeys.push('begrijpend_lezen'); }
    if (cl.spelling) { vakKeys.push('spelling'); }
    // de-duplicate
    const seen = new Set();
    const vk = vakKeys.filter(k => { if (seen.has(k)) return false; seen.add(k); return true; });

    const vakXml = vk.map(v => buildVakBlock(v, groep)).filter(Boolean).join("\n");
    const krit = criticalKerndoelenForProfile(upType).map(k => (
      `    <kerndoel code="${xmlEscape(k.code)}" prioriteit="${xmlEscape(k.prioriteit)}">\n` +
      `      <waarom_kritisch>${xmlEscape(k.rationale)}</waarom_kritisch>\n` +
      `    </kerndoel>`
    )).join("\n");

    const xml = (
      `<slo_ontwikkel_perspectief>\n` +
      `  <student_profiel>\n` +
      `    Groep: ${xmlEscape(groep)}\n` +
      `    Uitstroomprofiel: ${xmlEscape(upType)}\n` +
      `  </student_profiel>\n` +
      `  <kerndoelen_verwachtingen>\n` + vakXml + `\n  </kerndoelen_verwachtingen>\n` +
      `  <uitstroom_relevantie>\n` + krit + `\n  </uitstroom_relevantie>\n` +
      `</slo_ontwikkel_perspectief>`
    );
    return xml;
  } catch {
    return '';
  }
}

module.exports = { buildSLOOppContext };

