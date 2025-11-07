"use strict";

// Next.js API route to generate an OPP via Claude/OpenAI
// Mirrors generate-groepsplan.js patterns: fallback provider, timeout, friendly errors, optional persistence

const { createClient: createSupabaseClient, getUserFromToken } = require("../../lib/supabase.js");
const { handleAPIError, callClaudeWithRetry } = require("../../lib/error-handler.js");

let AnthropicClient = null;
try {
  const mod = require("@anthropic-ai/sdk");
  AnthropicClient = mod?.default ?? mod?.Anthropic ?? mod;
} catch (_) {}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MODEL = OPENAI_KEY ? OPENAI_MODEL : CLAUDE_MODEL;
const MAX_TOKENS = 6000; // OPP is longer than Groepsplan
const TEMPERATURE = 0.6;
const TIMEOUT_MS = 30000; // keep p95 < 30s

// ---- Input parsing helpers ----
async function readRawJson(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      let total = 0;
      req.on("data", (chunk) => {
        let buf;
        if (Buffer.isBuffer(chunk)) buf = chunk;
        else if (chunk instanceof Uint8Array) buf = Buffer.from(chunk);
        else if (typeof chunk === "string") buf = Buffer.from(chunk, "utf8");
        else if (chunk && typeof chunk === "object" && typeof chunk.buffer === "object") {
          try { buf = Buffer.from(chunk.buffer); } catch { buf = Buffer.from(String(chunk), "utf8"); }
        } else buf = Buffer.from(String(chunk), "utf8");
        chunks.push(buf);
        total += buf.length;
        if (total > 1_500_000) reject(Object.assign(new Error("Request body too large."), { status: 413 }));
      });
      req.on("end", () => {
        try {
          if (total === 0) return resolve({});
          let raw = Buffer.concat(chunks, total).toString("utf8");
          if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
          const trimmed = raw.trim();
          if (!trimmed) return resolve({});
          resolve(JSON.parse(trimmed));
        } catch (e) {
          reject(Object.assign(new Error("Invalid JSON body."), { status: 400 }));
        }
      });
      req.on("error", (e) => reject(Object.assign(e || new Error("Body stream error"), { status: 400 })));
    } catch (e) {
      reject(Object.assign(e || new Error("Unexpected body parse error"), { status: 400 }));
    }
  });
}

async function getBody(req) {
  if (req && req.body != null) {
    if (typeof req.body === "object") return req.body;
    if (Buffer.isBuffer(req.body)) {
      try { return JSON.parse(req.body.toString("utf8")); } catch {}
    }
    if (typeof req.body === "string") {
      const s = req.body.trim().replace(/^\uFEFF/, "");
      try { return JSON.parse(s); } catch {}
    }
  }
  const ct = String(req?.headers?.["content-type"] || req?.headers?.["Content-Type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return await readRawJson(req); } catch { return {}; }
  }
  return {};
}

function coerceString(v, dflt = "") { return typeof v === "string" ? v : dflt; }
function coerceNumber(v, dflt = null) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") { const n = Number(v); if (Number.isFinite(n)) return n; }
  return dflt;
}
function coerceArray(v) { return Array.isArray(v) ? v : []; }

// ---- Prompt builders ----
function buildSystemPromptOPP() {
  // System context derived from AI Prompt Engineering Guide (GUIDE-PROMPT-OPP-2025-001)
  return (
    "# SYSTEM CONTEXT\n" +
      "You are an expert Dutch primary school teacher and IB'er (internal coach) with 20+ years of experience writing OPPs (Ontwikkelingsperspectief Plannen).\n" +
      "You understand Passend Onderwijs 2024, the Handelingsgericht approach, parent-sensitive communication, realistic goal-setting for struggling students, and you write with an empathetic but professional tone.\n\n" +
    "# CRITICAL DIFFERENCES VS GROEPSPLAN\n" +
      "- OPP is INDIVIDUEEL, not a group\n- OPP is LANGE TERMIJN (6-12 maanden)\n- OPP MOET een UITSTROOMPROFIEL bevatten\n- OPP is GEVOELIG: ouders lezen dit\n- OPP biedt HOOP: focus op wat WEL kan\n\n" +
    "# TONE & LANGUAGE RULES (STRICT)\n" +
      "1) Start ELKE sectie met iets positiefs (sterktes/interesses).\n" +
      "2) Gebruik HANDELINGSGERICHTE taal: 'heeft baat bij', 'werkt aan', 'ontwikkelt zich naar'.\n" +
      "3) VERMIJD deficit-taal: 'kan niet', 'faalt', 'zwak', 'hopeloos', 'zal nooit'.\n" +
      "4) Oudervriendelijk: leg jargon uit (AVI, DMT, etc.), gebruik vergelijkingen (bijv. 'ongeveer groep 4 niveau').\n" +
      "5) Wees concreet: frequenties, tijden, wie-doet-wat; geen 'extra aandacht' zonder details.\n" +
      "6) Realistisch maar hoopvol: feitelijk over uitdagingen, concrete steun, haalbare doelen, hoopvolle afronding.\n\n" +
    "# OUTPUT FORMAT\n" +
      "- Gebruik Markdown met duidelijke H2-koppen voor 7 verplichte secties.\n" +
      "- Korte alinea's en opsommingen waar passend.\n" +
      "- Consistente voornaamwoorden op basis van het aangegeven gender (hij/zij/hen).\n"
  );
}

function pronounFor(gender) {
  const g = String(gender || "").toLowerCase();
  if (g === "male" || g === "jongen" || g === "m") return "hij";
  if (g === "female" || g === "meisje" || g === "v") return "zij";
  return "hen"; // neutral/anders
}

function buildUserPromptOPP(payload) {
  const {
    studentName, age, groep, gender,
    reasonForOpp,
    currentLevels = {},
    uitstroomprofiel = {},
    externalSupport = [],
    parentInvolvement,
    uploadId,
    previousOppData = {},
    additionalContext,
    teacherFocusArea,
    uploadedText,
    changesSinceLast,
  } = payload || {};

  const p = pronounFor(gender);
  const cl = {
    technischLezen: coerceString(currentLevels.technischLezen || currentLevels.technisch_lezen || currentLevels.technisch_lezen_niveau || ""),
    spelling: coerceString(currentLevels.spelling || currentLevels.spelling_niveau || ""),
    rekenen: coerceString(currentLevels.rekenen || currentLevels.rekenen_niveau || ""),
    begrijpendLezen: coerceString(currentLevels.begrijpendLezen || currentLevels.begrijpend_lezen_niveau || ""),
    sociaalEmotioneel: coerceString(currentLevels.sociaalEmotioneel || currentLevels.sociaal_emotioneel || ""),
    gedrag: coerceString(currentLevels.beschrijving_gedrag || currentLevels.gedrag || ""),
  };
  const up = {
    type: coerceString(uitstroomprofiel.type || ""),
    rationale: coerceString(uitstroomprofiel.rationale || ""),
  };
  const prev = {
    previousGoals: coerceString(previousOppData.previousGoals || ""),
    goalsAchieved: coerceString(previousOppData.goalsAchieved || ""),
    goalsNotAchieved: coerceString(previousOppData.goalsNotAchieved || ""),
    progressSince: coerceString(previousOppData.progressSince || ""),
    reasonForProgress: coerceString(previousOppData.reasonForProgress || ""),
  };

  // Master prompt with optional continuation (upload) context
  let prompt = "";

  // If user uploaded a previous OPP or provided continuation context, prepend enhanced continuation block
  const hasContinuation = Boolean(uploadId || changesSinceLast);
  if (hasContinuation) {
    prompt += (
      "# PREVIOUS OPP CONTEXT\n\n" +
      "You have received a previous OPP for this student. Use it as foundation.\n\n" +
      "## Changes Since Last OPP\n" + coerceString(changesSinceLast || "") + "\n\n" +
      "## Current Situation (Updated)\n" +
      `Technisch lezen: ${cl.technischLezen} | Spelling: ${cl.spelling} | Rekenen: ${cl.rekenen} | Begrijpend lezen: ${cl.begrijpendLezen} | Sociaal-emotioneel: ${cl.sociaalEmotioneel}` +
      (cl.gedrag ? ` | Gedrag/werkhouding: ${cl.gedrag}` : "") +
      "\n\n---\n\n# TASK: Generate NEW OPP that Shows Continuity\n" +
      "- Refer to previous goals in Beginsituatie ('Vorig jaar was het doel...').\n" +
      "- Explain progress or lack thereof constructively; adjust approach accordingly.\n" +
      "- Continue what worked; change what didn’t; keep tone consistent and respectful.\n\n"
    );
  }

  prompt += (
    "# TASK\nGenerate a complete OPP (Ontwikkelingsperspectief Plan) for a primary school student.\n\n" +
    "# STUDENT CONTEXT (ANON)\n" +
      `- **Leerling:** [anoniem]\n` +
      `- **Groep:** ${coerceNumber(groep, "")}\n` +
      `- **Voornaamwoorden:** '${p}' (afgeleid van keuze of neutraal)\n\n` +
    "# REASON FOR OPP\n" + coerceString(reasonForOpp) + "\n\n" +
    "# CURRENT LEVELS\n" +
      `- **Technisch lezen:** ${cl.technischLezen} (AVI)\n` +
      `- **Spelling:** ${cl.spelling} (Cito)\n` +
      `- **Rekenen:** ${cl.rekenen} (Cito)\n` +
      `- **Begrijpend lezen:** ${cl.begrijpendLezen}\n` +
      `- **Sociaal-emotioneel:** ${cl.sociaalEmotioneel}\n` +
      (cl.gedrag ? `- **Gedrag/werkhouding:** ${cl.gedrag}\n` : "") +
      "\n" +
    "# UITSTROOMPROFIEL\n" + `${up.type} - ${up.rationale}\n\n` +
    "# EXTERNAL SUPPORT\n" + `${coerceArray(externalSupport).join(", ") || "(geen of onbekend)"}\n\n` +
    "# PARENT INVOLVEMENT\n" + `${coerceString(parentInvolvement)}\n\n` +
    "# OUTPUT REQUIREMENTS (7 mandatory sections)\n" +
      "## 1. Leerlingprofiel (start met sterktes; ontwikkelingsgeschiedenis; gezinssituatie indien relevant; eerdere ondersteuning)\n" +
      "## 2. Beginsituatie (concrete niveaus met vergelijkingen; SEO; werkhouding; start met wat goed gaat)\n" +
      "## 3. Uitstroomprofiel & Perspectief (realistisch; implicaties voor ondersteuning; VO-perspectief)\n" +
      "## 4. Ontwikkeldoelen (minimaal 3 SMART; incl. 1 cognitief en 1 sociaal-emotioneel)\n" +
      "## 5. Aanpak (concrete interventies met frequenties, wie, materialen; klasaanpassingen; rol ouders)\n" +
      "## 6. Betrokkenen (school, extern, ouders, leerling)\n" +
      "## 7. Evaluatie en Vervolg (momenten, metingen, plan B; herziening uitstroomprofiel)\n\n" +
    "# TONE & LANGUAGE (ENFORCE)\n" +
      `- Begin elke sectie met iets positiefs. Vermijd 'kan niet', 'faalt', 'zwak'. Gebruik handelingsgerichten zoals 'heeft baat bij'.\n` +
      `- Oudervriendelijk (leg jargon uit; vergelijkingsniveaus). Zinnen < 20 woorden waar mogelijk.\n` +
      `- Gebruik voornaamwoorden consistent: '${p}'.\n\n` +
    "# QUALITY CHECKS BEFORE OUTPUT\n" +
      "- Minimaal 3 SMART-doelen (koppel 'Specifiek/Meetbaar/Realistisch/Tijdsgebonden').\n" +
      "- Concrete frequenties en tijden ('3x/week 15 min 1-op-1').\n" +
      "- Geen onverklaard jargon.\n" +
      "- Balans realisme en hoop.\n\n" +
    "# FORMAT\n" +
      "Output als nette Markdown met H2-koppen zoals boven gespecificeerd.\n"
  );

  return prompt;
}

// ---- Quality checks for OPP (empathy + completeness) ----
function oppQuality(text, opts = {}) {
  const checks = { warnings: [], errors: [], flags: {} };
  const full = String(text || "");
  const t = full.toLowerCase();
  // 1) Required sections
  const must = ["## 1. leer", "## 2. begin", "## 3. uitstroom", "## 4. ontwikkeldoelen", "## 5. aanpak", "## 6. betrokken", "## 7. evalu"];
  const missing = must.filter((h) => !t.includes(h));
  if (missing.length) { checks.errors.push("Vereiste secties ontbreken of zijn onvolledig."); checks.flags.missingSections = true; }
  // 2) Length target (approx)
  const wordCount = full.split(/\s+/).filter(Boolean).length;
  if (wordCount < 1500) checks.warnings.push(`Kort document (${wordCount} woorden, doel 2000-3500).`);
  if (wordCount > 4000) checks.warnings.push(`Lang document (${wordCount} woorden, doel 2000-3500).`);
  // 3) Deficit language
  const banned = ["kan niet", "faalt", "zwak", "hopeloos", "zal nooit", "onmogelijk"];
  const foundBanned = banned.filter((b) => t.includes(b));
  if (foundBanned.length) { checks.warnings.push(`Deficit-taal gedetecteerd: ${foundBanned.join(", ")}`); checks.flags.deficit = true; }
  // 4) Strength-balance heuristic
  const positiveCues = [/\b(sterk|sterktes|positief|goed|gemotiveerd|interesse)\b/i, /heeft baat bij/i, /maakt kleine stappen/i, /reageert goed op/i, /werkt aan/i, /ontwikkelt zich/i];
  const challengeCues = [/\b(uitdaging|moeilijk|zorg|achterstand|intensieve ondersteuning)\b/i, /moeite met/i];
  let pos = 0, neg = 0;
  try {
    const sentences = full.split(/[\.!?]\s+/);
    for (const s of sentences) {
      const st = s.trim(); if (!st) continue;
      if (positiveCues.some((re) => re.test(st))) pos++;
      if (challengeCues.some((re) => re.test(st))) neg++;
    }
  } catch {}
  if (neg > 0 && pos / Math.max(1, neg) < 0.5) {
    checks.warnings.push("Weinig positieve formuleringen t.o.v. aandachtspunten. Voeg sterktes toe per sectie (sterktes eerst).");
    checks.flags.lowStrengthBalance = true;
  }
  // 5) SMART goal heuristic (count Specifiek/Meetbaar pairs)
  const smartMatches = full.match(/\b(Specifiek|Meetbaar|Realistisch|Tijdsgebonden)\b[:：]/gi) || [];
  const smartCount = Math.floor(smartMatches.length / 3); // rough lower bound
  if (smartCount < 3) checks.warnings.push(`Weinig SMART-structuur gedetecteerd (~${smartCount} doelen). Doel: ≥ 3.`);
  // 6) Presence of SEO goal terms
  if (!/sociaal\-?emot/i.test(t)) checks.warnings.push("Controleer: is er een sociaal-emotioneel doel opgenomen?");
  // 7) Jargon detection without hints
  const jargon = ["avi", "dmt", "stanine", "didact", "seo ", "leeftijdsadequaat"];
  const foundJargon = jargon.filter((j) => t.includes(j));
  if (foundJargon.length) checks.warnings.push(`Controleer uitleg bij jargon: ${foundJargon.join(", ")}`);
  // 8) Vague phrasing
  const vague = ["extra aandacht", "meer oefenen", "beter leren", "optimaliseren", "uitdaging aangaan"];
  const foundVague = vague.filter((v) => t.includes(v));
  if (foundVague.length) checks.warnings.push(`Mogelijk vage taal: ${foundVague.join(", ")}. Maak concreet met tijden/frequentie.`);
  // 9) Pronoun consistency (heuristic)
  const g = String(opts.gender || "").toLowerCase();
  const usedHij = /\bhij\b|\bhem\b|\bzijn\b/i.test(full);
  const usedZij = /\bzij\b|\bhaar\b/i.test(full);
  const usedHen = /\bhen\b|\bhun\b/i.test(full);
  if (g === 'male' && (usedZij || usedHen)) checks.warnings.push("Controleer voornaamwoorden: verwacht 'hij/hem/zijn'.");
  if (g === 'female' && (usedHij || usedHen)) checks.warnings.push("Controleer voornaamwoorden: verwacht 'zij/haar'.");
  if (g !== 'male' && g !== 'female' && (usedHij || usedZij)) checks.warnings.push("Overweeg genderneutraal 'hen/hun'.");
  return checks;
}

// ---- Provider calls ----
function makeOpenAIShim(apiKey) {
  return {
    messages: {
      create: async (params, { signal } = {}) => {
        const sys = String(params?.system || "");
        let userText = "";
        try {
          const first = Array.isArray(params?.messages) ? params.messages[0] : null;
          userText = String(first?.content || "");
        } catch {}
        const body = {
          model: OPENAI_MODEL,
          temperature: typeof params?.temperature === "number" ? params.temperature : TEMPERATURE,
          max_tokens: typeof params?.max_tokens === "number" ? params.max_tokens : MAX_TOKENS,
          messages: [ ...(sys ? [{ role: "system", content: sys }] : []), { role: "user", content: userText } ],
        };
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });
        if (!resp.ok) {
          const err = new Error(`OpenAI request failed: ${resp.status}`);
          err.status = resp.status; try { err.headers = Object.fromEntries(resp.headers.entries()); } catch {}
          throw err;
        }
        const json = await resp.json();
        const text = String(json?.choices?.[0]?.message?.content || "");
        return { content: [{ type: "text", text }], usage: { input_tokens: json?.usage?.prompt_tokens ?? null, output_tokens: json?.usage?.completion_tokens ?? null } };
      },
    },
  };
}

async function generateOPP({ system, user, signal }) {
  const haveOpenAI = Boolean(OPENAI_KEY);
  const haveAnthropic = Boolean(AnthropicClient && process.env.ANTHROPIC_API_KEY);
  const attempts = [];
  if (haveOpenAI) attempts.push("openai");
  if (haveAnthropic) attempts.push("anthropic");

  let lastErr = null;
  for (const provider of attempts) {
    try {
      if (provider === "openai") {
        const client = makeOpenAIShim(OPENAI_KEY);
        const params = { model: OPENAI_MODEL, max_tokens: MAX_TOKENS, temperature: TEMPERATURE, system, messages: [{ role: "user", content: user }] };
        const resp = await callClaudeWithRetry(client, params, { signal, maxRetries: 2, baseDelayMs: 700, maxDelayMs: 3000 });
        let text = "";
        try { text = String(resp?.content?.[0]?.text || "").trim(); } catch {}
        return { text: text || "", usage: resp?.usage || null, modelUsed: OPENAI_MODEL };
      }
      if (provider === "anthropic") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const anthropic = new AnthropicClient({ apiKey, maxRetries: 0, timeout: TIMEOUT_MS });
        const params = { model: CLAUDE_MODEL, max_tokens: MAX_TOKENS, temperature: TEMPERATURE, system, messages: [{ role: "user", content: user }] };
        const resp = await callClaudeWithRetry(anthropic, params, { signal, maxRetries: 2, baseDelayMs: 700, maxDelayMs: 3000 });
        let text = "";
        try { text = String(resp?.content?.[0]?.text || "").trim(); } catch {}
        return { text: text || "", usage: resp?.usage || null, modelUsed: CLAUDE_MODEL };
      }
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error("Onbekende fout bij genereren.");
}

function friendlyValidationError(msg) {
  return { success: false, content: "", metadata: { error: msg } };
}

// ---- Handler ----
async function handler(req, res) {
  const started = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);
  try { console.log(`[generate-opp] start reqId=${reqId}`); } catch {}

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, content: "", metadata: { error: "Method Not Allowed" } });
  }

  let body = await getBody(req);
  if (!body || typeof body !== "object") body = {};

  // Minimal validation
  const name = coerceString(body.studentName);
  const age = coerceNumber(body.age);
  const groep = coerceNumber(body.groep);
  const gender = coerceString(body.gender);
  if (!groep || groep < 1 || groep > 8) {
    return res.status(400).json(friendlyValidationError("Ongeldige invoer: 'groep' is verplicht (1..8)."));
  }

  const system = buildSystemPromptOPP();
  const userBase = buildUserPromptOPP(body);
  // Inject SLO ontwikkelperspectief context (non-fatal)
  let user = userBase;
  try {
    const { buildSLOOppContext } = require("../../lib/slo-opp.js");
    const slo = buildSLOOppContext(body);
    if (slo && slo.length > 0) {
      user = `${userBase}\n\n${slo}`;
    }
  } catch (_) {}

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId = null;
  if (ctrl) timeoutId = setTimeout(() => { try { ctrl.abort(); } catch {} }, TIMEOUT_MS);

  try {
    let { text, usage, modelUsed } = await generateOPP({ system, user, signal: ctrl?.signal });
    const durationMs = Date.now() - started;

    if (!text || text.length < 800) {
      return res.status(502).json({ success: false, content: "", metadata: { error: "Generatie mislukt of resultaat te kort.", model: modelUsed || MODEL, duration_ms: durationMs } });
    }

    const qc = oppQuality(text, { gender });
    if (qc.flags?.missingSections || qc.flags?.deficit || qc.flags?.lowStrengthBalance) {
      // one retry with stronger instructions
      const emph = user + "\n\nKRITIEK: Neem ALLE vereiste secties op; vermijd deficit-taal; formuleer handelingsgericht; begin elke sectie met sterktes; voeg concrete voorbeelden en frequenties toe; gebruik consistente voornaamwoorden.";
      try {
        const r2 = await generateOPP({ system, user: emph, signal: ctrl?.signal });
        if (r2?.text && r2.text.length > text.length * 0.8) text = r2.text;
      } catch {}
    }

    // No persistence for OPP content to avoid storing PII (AVG compliance)
    const storageSaved = false;

    const resp = { success: true, content: text, metadata: { model: modelUsed || MODEL, duration_ms: Date.now() - started, length: text.length, storage: { saved: storageSaved } } };
    if (qc.warnings?.length) resp.warnings = qc.warnings;
    try { console.log(`[generate-opp] done reqId=${reqId} status=200 dur=${durationMs}ms`); } catch {}
    return res.status(200).json(resp);
  } catch (err) {
    try { console.log(`[generate-opp] error reqId=${reqId} code=${err?.code||err?.name||'ERR'}`); } catch {}
    return handleAPIError(err, res, { shape: "generate" });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

module.exports = handler;
module.exports.default = module.exports;
module.exports.config = { maxDuration: 60, api: { bodyParser: false } };
