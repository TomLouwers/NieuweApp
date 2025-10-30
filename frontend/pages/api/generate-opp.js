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
  return (
    "Je bent een ervaren IB'er (Intern Begeleider) gespecialiseerd in het schrijven van Ontwikkelingsperspectiefplannen (OPP's) voor het Nederlandse basisonderwijs.\n" +
    "\n## Jouw expertise\n" +
    "- Je schrijft OPP's die voldoen aan Passend Onderwijs 2024\n" +
    "- Je begrijpt de emotionele impact: ouders lezen dit over hun kind\n" +
    "- Je bent altijd respectvol, empathisch en handelingsgericht\n" +
    "- Je begrijpt de lange termijn: dit is geen groepsplan, maar een ontwikkelpad\n" +
    "\n## Kritieke verschillen met Groepsplannen\n" +
    "- OPP is INDIVIDUEEL, niet groep\n" +
    "- OPP is LANGE TERMIJN (6-12 maanden), niet 8 weken\n" +
    "- OPP moet UITSTROOMPROFIEL bevatten\n" +
    "- OPP is GEVOELIG: ouders lezen dit, wees respectvol\n" +
    "- OPP moet HOOP bieden: focus op wat WEL kan\n" +
    "\n## Taalgebruik (zeer belangrijk!)\nNOOIT:\n" +
    "- 'Student kan niet...'\n- 'Student is zwak in...'\n- 'Student heeft problemen met...'\n- 'Student faalt regelmatig...'\n" +
    "ALTIJD:\n- 'Student heeft behoefte aan...'\n- 'Student ontwikkelt zich op het gebied van...'\n- 'Student maakt kleine stappen in...'\n- 'We zien dat student goed reageert op...'\n" +
    "\n## Structuur sterkte-eerst\nBegin ALTIJD elke sectie met sterktes/positieve punten.\n\n## Uitstroomprofiel\n" +
    "- Wees realistisch maar niet definitief\n- Gebruik 'op dit moment lijkt X realistisch'\n- Erken dat dit kan veranderen en motiveer waarom\n\n## Ouders\n" +
    "- Ouders zijn partner, niet probleem\n- Erken hun zorgen en geef handvatten\n- Wees transparant over haalbaarheid\n\nGenereer een volledig, empathisch, en compliant OPP."
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

  // Build a concise, explicit generation instruction
  const header = (
    `Genereer een volledig Ontwikkelingsperspectief Plan (OPP) voor:\n\n` +
    `## Leerlinggegevens\n- Naam: ${coerceString(studentName)}\n- Leeftijd: ${coerceNumber(age, "")} jaar\n- Groep: ${coerceNumber(groep, "")}\n- Geslacht: ${coerceString(gender)} (gebruik '${p}')\n\n` +
    `## Reden voor OPP\n${coerceString(reasonForOpp)}\n\n` +
    `## Huidige Situatie\n` +
    `**Technisch lezen:** ${cl.technischLezen}\n` +
    `**Spelling:** ${cl.spelling}\n` +
    `**Rekenen:** ${cl.rekenen}\n` +
    `**Begrijpend lezen:** ${cl.begrijpendLezen}\n` +
    `**Sociaal-emotioneel:** ${cl.sociaalEmotioneel}\n` +
    (cl.gedrag ? `**Gedrag/werkhouding:** ${cl.gedrag}\n` : "") +
    `\n## Voortgang sinds vorige OPP\n` +
    (uploadId ? (
      `**Eerdere doelen:** ${prev.previousGoals}\n` +
      `**Behaald:** ${prev.goalsAchieved}\n` +
      `**Niet behaald:** ${prev.goalsNotAchieved}\n` +
      `**Reden:** ${prev.reasonForProgress || prev.progressSince}\n`
    ) : `Dit is het eerste OPP voor deze leerling.`) +
    `\n## Uitstroomprofiel\n${up.type}\n**Motivatie:** ${up.rationale}\n\n` +
    `## Betrokken externe partijen\n${coerceArray(externalSupport).join(", ") || "(geen of onbekend)"}\n\n` +
    `## Oudercontact\n${coerceString(parentInvolvement)}\n\n` +
    `## Specifieke focus leerkracht\n${coerceString(teacherFocusArea || "")}\n\n---\n\n` +
    `Genereer het volledige OPP in Markdown met de volgende secties en volgorde:\n` +
    `1. **Leerlingprofiel** (sterktes eerst, ontwikkelingsgeschiedenis, gezinssituatie indien relevant)\n` +
    `2. **Beginsituatie** (cognitief per vak + SEO, concreet, noem sterktes en huidige ondersteuning)\n` +
    `3. **Uitstroomprofiel** (realistisch, kan wijzigen, motiveer op basis van huidige ontwikkeling)\n` +
    `4. **Ontwikkeldoelen (SMARTI)** (3-5 doelen, incl. minimaal 1 sociaal-emotioneel, termijn 6-12m)\n` +
    `5. **Aanpak** (concrete interventies met frequenties, wie-doet-wat, klasaanpassingen, rol ouders)\n` +
    `6. **Betrokkenen** (school, extern, ouders, leerling)\n` +
    `7. **Evaluatie en Bijstelling** (momenten, metingen, plan B/plan bij behalen)\n` +
    `8. **Transitie en Vervolgstappen** (naar VO of SO indien van toepassing)\n` +
    `9. **Bijlagen (optioneel)**\n` +
    `10. **Ondertekening**\n\n` +
    `Toon: empathisch, respectvol, handelingsgericht, concreet, hoopvol maar realistisch.\n` +
    `Gebruik '${p}' consequent. Vermijd deficit-taal ('kan niet', 'faalt', 'zwak', 'onmogelijk').\n` +
    `Wees specifiek met tijden/frequenties (bijv. '15 min 1-op-1, 3x per week').\n`
  );

  return header;
}

// ---- Quality checks for OPP (empathy + completeness) ----
function oppQuality(text) {
  const checks = { warnings: [], errors: [], flags: {} };
  const full = String(text || "");
  const t = full.toLowerCase();
  // Deficit language
  const banned = ["kan niet", "zwak", "problemen", "faalt", "nooit", "onmogelijk"];
  const foundBanned = banned.filter((b) => t.includes(b));
  if (foundBanned.length) { checks.warnings.push(`Deficit-taal gedetecteerd: ${foundBanned.join(", ")}`); checks.flags.deficit = true; }
  // Required sections (loose match)
  const must = ["## 1. leer", "## 2. begin", "## 3. uitstroom", "## 4. ontwikkeldoelen", "## 5. aanpak", "## 6. betrokken", "## 7. evalu"];
  const missing = must.filter((h) => !t.includes(h));
  if (missing.length) { checks.errors.push("Vereiste secties ontbreken of zijn onvolledig."); checks.flags.missingSections = true; }
  // Minimal length
  if (full.length < 1200) { checks.warnings.push("OPP lijkt kort. Overweeg meer concreetheid en voorbeelden."); }
  // Strength-balance ratio heuristic per section: count sentences starting with positive cues vs challenge cues
  const positiveCues = [/\b(sterk|sterktes|positief|goed|gemotiveerd|interesse)\b/i, /heeft behoefte aan/i, /maakt kleine stappen/i, /reageert goed op/i];
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
  // Jargon or vague phrasing
  const vague = ["extra aandacht", "maatwerk", "uitdaging aangaan", "optimaliseren"];
  const foundVague = vague.filter((v) => t.includes(v));
  if (foundVague.length) checks.warnings.push(`Mogelijk vage taal: ${foundVague.join(", ")}. Maak concreet met tijden/frequentie.`);
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
  if (!name || !age || !groep || groep < 1 || groep > 8) {
    return res.status(400).json(friendlyValidationError("Ongeldige invoer: 'studentName', 'age', 'groep' zijn verplicht (groep 1..8)."));
  }

  const system = buildSystemPromptOPP();
  const user = buildUserPromptOPP(body);

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId = null;
  if (ctrl) timeoutId = setTimeout(() => { try { ctrl.abort(); } catch {} }, TIMEOUT_MS);

  try {
    let { text, usage, modelUsed } = await generateOPP({ system, user, signal: ctrl?.signal });
    const durationMs = Date.now() - started;

    if (!text || text.length < 800) {
      return res.status(502).json({ success: false, content: "", metadata: { error: "Generatie mislukt of resultaat te kort.", model: modelUsed || MODEL, duration_ms: durationMs } });
    }

    const qc = oppQuality(text);
    if (qc.flags?.missingSections || qc.flags?.deficit || qc.flags?.lowStrengthBalance) {
      // one retry with stronger instructions
      const emph = user + "\n\nKRITIEK: Neem ALLE vereiste secties op; vermijd deficit-taal; formuleer handelingsgericht; begin elke sectie met sterktes (positief) en voeg concrete voorbeelden en frequenties toe.";
      try {
        const r2 = await generateOPP({ system, user: emph, signal: ctrl?.signal });
        if (r2?.text && r2.text.length > text.length * 0.8) text = r2.text;
      } catch {}
    }

    // Optional persistence (authenticated calls only)
    let storageSaved = false;
    try {
      const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
      const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
      if (token) {
        const { user } = await getUserFromToken(token);
        if (user) {
          const supabase = createSupabaseClient(undefined, undefined, { accessToken: token });
          const insert = {
            user_id: user.id,
            type: "opp",
            title: `OPP ${name} (groep ${groep})`,
            content: text,
            metadata: { studentName: name, age, groep, gender, model: modelUsed || MODEL, tokensUsed: usage?.output_tokens ?? null, duration_ms: durationMs },
          };
          const { error: dbError } = await supabase.from("documents").insert(insert);
          if (!dbError) storageSaved = true;
        }
      }
    } catch {}

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
