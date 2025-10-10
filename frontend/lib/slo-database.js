"use strict";

// Static SLO code placeholders for MVP. No outbound calls.

const VAK_PREFIX = {
  rekenen: "REK",
  taal: "TAA",
  lezen: "LEZ",
};

function buildSLOCodes() {
  const groups = Array.from({ length: 8 }, (_, i) => i + 1);
  const out = { rekenen: {}, taal: {}, lezen: {} };
  for (const g of groups) {
    out.rekenen[g] = Array.from({ length: 5 }, (_, i) => `${VAK_PREFIX.rekenen}-G${g}-${i + 1}`);
    out.taal[g] = Array.from({ length: 5 }, (_, i) => `${VAK_PREFIX.taal}-G${g}-${i + 1}`);
    out.lezen[g] = Array.from({ length: 5 }, (_, i) => `${VAK_PREFIX.lezen}-G${g}-${i + 1}`);
  }
  return out;
}

const SLO_CODES = buildSLOCodes();

function normalizeGroep(input) {
  if (typeof input === "number" && Number.isInteger(input)) return input;
  if (typeof input === "string" && input.trim() !== "") {
    const n = Number(input);
    if (Number.isFinite(n) && Number.isInteger(n)) return n;
  }
  throw new Error("Ongeldige 'groep'. Verwacht een getal 1 t/m 8.");
}

function normalizeVak(vak) {
  const v = typeof vak === "string" ? vak.trim().toLowerCase() : "";
  if (!Object.prototype.hasOwnProperty.call(SLO_CODES, v)) {
    const supported = Object.keys(SLO_CODES).join(", ");
    throw new Error(`Ongeldig 'vak'. Kies uit: ${supported}.`);
  }
  return v;
}

function getValidSLOCodes(groep, vak) {
  const g = normalizeGroep(groep);
  const v = normalizeVak(vak);
  if (g < 1 || g > 8) {
    throw new Error("'groep' buiten bereik. Gebruik 1 t/m 8.");
  }
  const list = SLO_CODES[v][g];
  if (!Array.isArray(list)) {
    throw new Error(`Geen SLO-codes beschikbaar voor vak '${v}' en groep '${g}'.`);
  }
  return list.slice();
}

function validateSLOCode(code, groep, vak) {
  // Throws for unsupported groep/vak
  const validList = getValidSLOCodes(groep, vak);

  if (typeof code !== "string" || !code.trim()) return false;
  const candidate = code.trim().toUpperCase();
  return validList.some((base) => candidate.startsWith(base.toUpperCase()));
}

function extractSLOCodes(text) {
  if (typeof text !== "string" || !text) return [];
  const re = /([A-Z]{3}-G([1-8])-\d+)/gi;
  const found = [];
  const seen = new Set();
  for (const match of text.matchAll(re)) {
    const base = String(match[1]).toUpperCase();
    if (!seen.has(base)) {
      seen.add(base);
      found.push(base);
    }
  }
  return found;
}

module.exports = {
  SLO_CODES,
  getValidSLOCodes,
  validateSLOCode,
  extractSLOCodes,
};

