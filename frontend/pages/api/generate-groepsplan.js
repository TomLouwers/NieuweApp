"use strict";

// Next.js API route to generate a groepsplan via Claude (Anthropic)
// Do not persist raw uploads or inputs. No PII at rest.
// Non-negotiables handled: input validation, no PII logging, timeout, friendly errors, length guard

const {
  getValidSLOCodes,
  validateSLOCode,
  extractSLOCodes,
} = require("../../lib/slo-database.js");
const { createClient: createSupabaseClient, getUserFromToken } = require("../../lib/supabase.js");
const { handleAPIError, callClaudeWithRetry } = require("../../lib/error-handler.js");

let AnthropicClient = null;
try {
  // Support either default or named export across versions
  const mod = require("@anthropic-ai/sdk");
  AnthropicClient = mod?.default ?? mod?.Anthropic ?? mod;
} catch (_) {
  // Library not installed in some environments; handled at runtime with a friendly error
}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
// Allow overriding the Anthropic model by env; default to stable Sonnet 3.5
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MODEL = OPENAI_KEY ? OPENAI_MODEL : CLAUDE_MODEL;
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.7;
const TIMEOUT_MS = 25000; // keep p95 under ~25s on hobby plans (soft-fail)
const SLOW_HINT = "Dit bestand is complex, probeer opnieuw of later.";

// Allowed values for validation
const ALLOWED_VAK = new Set(["rekenen", "taal", "lezen"]);

function sanitizeVak(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function isInteger(val) {
  return Number.isInteger(val);
}

function parseGroep(input) {
  if (typeof input === "number" && isInteger(input)) return input;
  if (typeof input === "string" && input.trim() !== "") {
    const n = Number(input);
    if (Number.isFinite(n) && isInteger(n)) return n;
  }
  return NaN;
}

function buildSystemPrompt({ groep, vak, periode, allowedSLO, previousSnippet }) {
  // System prompt aligned with the Prompt Engineering Guide while preserving legacy H2 structure
  return (
    "Je bent een expert onderwijsadviseur (Passend Onderwijs, HGW) voor het Nederlandse basisonderwijs. " +
    "Je schrijft concreet en praktisch in natuurlijk Nederlands (geen AI-taal), met handelingsgericht taalgebruik. " +
    "Noem nooit leerlingen bij naam; gebruik geen herleidbare voorbeelden. " +
    "Werk voor groep " + groep + " voor het vak \"" + vak + "\" in periode \"" + periode + "\". " +
    "Wat je NOOIT doet: geen vage frasen (bijv. 'maatwerk bieden', 'gedifferentieerd lesgeven') zonder concrete uitwerking; geen onrealistische doelen; geen theoretische uitwijdingen. " +
    "Wat je WEL doet: concrete tijden (bijv. 15 minuten, 3x per week), specifieke materialen (stappenplan, rekenrek, MAB), realistische percentages (bijv. 80%). " +
    "Integreer het Mickey Mouse-model (basis, intensief, meer) en SMARTI-doelen waar passend binnen de structuur. " +
    "Structuur is verplicht en exact als volgt met H2-koppen (behoud deze koppen):\n\n" +
    "## Beginsituatie\n" +
    "## Doelen (SLO)\n" +
    "## Aanpak\n" +
    "## Differentiatie\n" +
    "## Evaluatie\n\n" +
    "In 'Doelen (SLO)': formuleer SMARTI (Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden, Inspirerend) en verwijs inhoudelijk naar relevante SLO-doelen passend bij groep " + groep + " en vak " + vak + ". " +
    "Gebruik expliciet 2–4 SLO-codes uitsluitend uit de whitelist hieronder in het exacte formaat 'XXX-G<groep>-<n>'.\n" +
    "ONLY use these SLO codes (whitelist):\n" + (Array.isArray(allowedSLO) ? allowedSLO.join(", ") : "") + "\n" +
    "Als er geen passende codes zijn, laat ze weg in plaats van nieuwe te verzinnen. " +
    (previousSnippet ? "Gebruik de meegegeven context alleen ter inspiratie (verwijs ernaar in 'Beginsituatie'); herformuleer, kopieer geen zinnen letterlijk." : "")
  );
}

function buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet, extraEmphasis = "" }) {
  return (
    "Genereer een volledig groepsplan in Markdown met de voorgeschreven H2-secties. " +
    "Gebruik concreet taalgebruik en vermijd generieke frasen; voeg specifieke tijden, aantallen en materialen toe. " +
    "Benadruk het Mickey Mouse-model in de analyse en differentiatie (basis, intensief, meer). " +
    "Begin met een H1-titel in dit format: \n\n" +
    `# Groepsplan ${vak} — Groep ${groep} — Periode ${periode}\n\n` +
    "Schrijf daarna direct de vereiste secties (H2) in de opgegeven volgorde.\n" +
    "In 'Doelen (SLO)': gebruik uitsluitend SLO-codes uit de whitelist. Geen andere codes.\n" +
    "Whitelist: " + (Array.isArray(allowedSLO) ? allowedSLO.join(", ") : "") + ".\n" +
    (previousSnippet ? "Vorig groepsplan (context):\n" + previousSnippet + "\n" : "") +
    (extraEmphasis ? "\n\n" + extraEmphasis.trim() + "\n" : "")
  );
}

// Provider-agnostic generator with fallback between OpenAI and Anthropic
async function generateWithFallback({ groep, vak, periode, allowedSLO, previousSnippet, signal, extraEmphasis }) {
  const haveOpenAI = !!OPENAI_KEY;
  const haveAnthropic = !!process.env.ANTHROPIC_API_KEY && !!AnthropicClient;

  const system = buildSystemPrompt({ groep, vak, periode, allowedSLO, previousSnippet });
  const user = buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet, extraEmphasis });

  function isRecoverable(err) {
    const status = err?.status || err?.statusCode || err?.response?.status;
    const code = err?.code || err?.name || "";
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    if (/rate.?limit/i.test(String(err?.message || ""))) return true;
    if (code === "AbortError" || code === "TimeoutError") return true;
    return false;
  }

  const makeOpenAIShim = (apiKey) => ({
    messages: {
      create: async (params, { signal } = {}) => {
        const sys = String(params?.system || "");
        let userText = "";
        try {
          const first = Array.isArray(params?.messages) ? params.messages[0] : null;
          userText = String(first?.content || "");
        } catch (_) {}

        const body = {
          model: OPENAI_MODEL,
          temperature: typeof params?.temperature === "number" ? params.temperature : TEMPERATURE,
          max_tokens: typeof params?.max_tokens === "number" ? params.max_tokens : MAX_TOKENS,
          messages: [
            ...(sys ? [{ role: "system", content: sys }] : []),
            { role: "user", content: userText },
          ],
        };

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });

        if (!resp.ok) {
          const err = new Error(`OpenAI request failed: ${resp.status}`);
          err.status = resp.status;
          try { err.headers = Object.fromEntries(resp.headers.entries()); } catch (_) {}
          throw err;
        }

        const json = await resp.json();
        const text = String(json?.choices?.[0]?.message?.content || "");
        return {
          content: [{ type: "text", text }],
          usage: {
            input_tokens: json?.usage?.prompt_tokens ?? null,
            output_tokens: json?.usage?.completion_tokens ?? null,
          },
        };
      },
    },
  });

  function extractText(resp) {
    let text = "";
    try {
      if (Array.isArray(resp?.content)) {
        text = resp.content
          .map((c) => (c?.type === "text" && typeof c?.text === "string" ? c.text : ""))
          .filter(Boolean)
          .join("\n");
      }
      if (!text && typeof resp?.content?.[0]?.text === "string") {
        text = resp.content[0].text;
      }
      text = (text || "").trim();
    } catch (_) {
      text = "";
    }
    return text;
  }

  // Attempt order
  const attempts = [];
  if (haveOpenAI) attempts.push("openai");
  if (haveAnthropic) attempts.push("anthropic");

  let lastErr = null;
  for (const provider of attempts) {
    try {
      if (provider === "openai") {
        const client = makeOpenAIShim(OPENAI_KEY);
        const params = { model: OPENAI_MODEL, max_tokens: MAX_TOKENS, temperature: TEMPERATURE, system, messages: [{ role: "user", content: user }] };
        const resp = await callClaudeWithRetry(client, params, { signal, maxRetries: 3, baseDelayMs: 800, maxDelayMs: 4000 });
        const text = extractText(resp);
        const usage = resp?.usage || null;
        return { text, usage, modelUsed: OPENAI_MODEL };
      }

      if (provider === "anthropic") {
        if (!AnthropicClient) throw Object.assign(new Error("Anthropic SDK ontbreekt of is niet geA_nstalleerd."), { code: "SDK_NOT_AVAILABLE" });
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw Object.assign(new Error("Server mist configuratie voor Anthropic API key."), { code: "MISSING_API_KEY" });
        const anthropic = new AnthropicClient({ apiKey, maxRetries: 0, timeout: TIMEOUT_MS });
        const params = { model: CLAUDE_MODEL, max_tokens: MAX_TOKENS, temperature: TEMPERATURE, system, messages: [{ role: "user", content: user }] };
        const resp = await callClaudeWithRetry(anthropic, params, { signal, maxRetries: 3, baseDelayMs: 800, maxDelayMs: 4000 });
        const text = extractText(resp);
        const usage = resp?.usage || null;
        return { text, usage, modelUsed: CLAUDE_MODEL };
      }
    } catch (err) {
      lastErr = err;
      if (!isRecoverable(err)) break; // do not fallback on non-recoverable errors
      // otherwise continue to next provider
    }
  }

  throw lastErr || new Error("Onbekende fout bij genereren.");
}

async function callClaude({ groep, vak, periode, allowedSLO, previousSnippet, signal }) {
  // If OPENAI_API_KEY is configured, use OpenAI via a small shim and return early
  if (OPENAI_KEY) {
    const makeOpenAIShim = (apiKey) => ({
      messages: {
        create: async (params, { signal } = {}) => {
          const sys = String(params?.system || "");
          let userText = "";
          try {
            const first = Array.isArray(params?.messages) ? params.messages[0] : null;
            userText = String(first?.content || "");
          } catch (_) {}

          const body = {
            model: OPENAI_MODEL,
            temperature: typeof params?.temperature === "number" ? params.temperature : TEMPERATURE,
            max_tokens: typeof params?.max_tokens === "number" ? params.max_tokens : MAX_TOKENS,
            messages: [
              ...(sys ? [{ role: "system", content: sys }] : []),
              { role: "user", content: userText },
            ],
          };

          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal,
          });

          if (!resp.ok) {
            const err = new Error(`OpenAI request failed: ${resp.status}`);
            err.status = resp.status;
            try { err.headers = Object.fromEntries(resp.headers.entries()); } catch (_) {}
            throw err;
          }

          const json = await resp.json();
          const text = String(json?.choices?.[0]?.message?.content || "");
          return {
            content: [{ type: "text", text }],
            usage: {
              input_tokens: json?.usage?.prompt_tokens ?? null,
              output_tokens: json?.usage?.completion_tokens ?? null,
            },
          };
        },
      },
    });

  const anthropic = makeOpenAIShim(OPENAI_KEY);
    const system = buildSystemPrompt({ groep, vak, periode, allowedSLO, previousSnippet });
    const user = buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet });
    const params = {
      model: OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system,
      messages: [
        { role: "user", content: user },
      ],
    };

    const resp = await callClaudeWithRetry(anthropic, params, { signal, maxRetries: 2 });

    // Extract text safely
    let text = "";
    try {
      if (Array.isArray(resp?.content)) {
        text = resp.content
          .map((c) => (c?.type === "text" && typeof c?.text === "string" ? c.text : ""))
          .filter(Boolean)
          .join("\n");
      }
      if (!text && typeof resp?.content?.[0]?.text === "string") {
        text = resp.content[0].text;
      }
      text = (text || "").trim();
    } catch (_) {
      text = "";
    }

    const usage = resp?.usage || null;
    return { text, usage };
  }
  if (!AnthropicClient) {
    throw Object.assign(new Error("Anthropic SDK ontbreekt of is niet geïnstalleerd."), {
      code: "SDK_NOT_AVAILABLE",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Server mist configuratie voor Anthropic API key."), {
      code: "MISSING_API_KEY",
    });
  }

  const anthropic = new AnthropicClient({
    apiKey,
    // Keep retries minimal to respect the 25s budget
    maxRetries: 0,
    timeout: TIMEOUT_MS,
  });

  const system = buildSystemPrompt({ groep, vak, periode, allowedSLO, previousSnippet });
  const user = buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet });

  const params = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system,
    messages: [
      {
        role: "user",
        content: user,
      },
    ],
  };

  const resp = await callClaudeWithRetry(anthropic, params, { signal, maxRetries: 2 });

  // Extract text safely
  let text = "";
  try {
    if (Array.isArray(resp?.content)) {
      text = resp.content
        .map((c) => (c?.type === "text" && typeof c?.text === "string" ? c.text : ""))
        .filter(Boolean)
        .join("\n");
    }
    if (!text && typeof resp?.content?.[0]?.text === "string") {
      text = resp.content[0].text;
    }
    text = (text || "").trim();
  } catch (_) {
    text = "";
  }

  const usage = resp?.usage || null;
  return { text, usage };
}

function friendlyValidationError(msg) {
  return {
    success: false,
    content: "",
    metadata: { error: msg },
  };
}

async function readRawJson(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      let total = 0;
      req.on("data", (chunk) => {
        // Normalize chunk to Buffer across runtimes (Buffer, Uint8Array, string)
        let buf;
        if (Buffer.isBuffer(chunk)) {
          buf = chunk;
        } else if (chunk instanceof Uint8Array) {
          buf = Buffer.from(chunk);
        } else if (typeof chunk === "string") {
          buf = Buffer.from(chunk, "utf8");
        } else if (chunk && typeof chunk === "object" && typeof chunk.buffer === "object") {
          try { buf = Buffer.from(chunk.buffer); } catch (_) { buf = Buffer.from(String(chunk), "utf8"); }
        } else {
          buf = Buffer.from(String(chunk), "utf8");
        }
        chunks.push(buf);
        total += buf.length;
        if (total > 1_000_000) {
          reject(Object.assign(new Error("Request body too large."), { status: 413 }));
        }
      });
      req.on("end", () => {
        try {
          if (total === 0) return resolve({});
          let raw = Buffer.concat(chunks, total).toString("utf8");
          // Strip UTF-8 BOM if present
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
  // If Next or a proxy already set req.body, try to use it
  if (req && req.body != null) {
    if (typeof req.body === "object") return req.body;
    if (Buffer.isBuffer(req.body)) {
      try { return JSON.parse(req.body.toString("utf8")); } catch (_) { /* ignore */ }
    }
    if (typeof req.body === "string") {
      const s = req.body.trim().replace(/^\uFEFF/, "");
      try { return JSON.parse(s); } catch (_) { /* ignore */ }
    }
  }
  // Parse from raw stream when content-type hints JSON
  const ct = String(req?.headers?.["content-type"] || req?.headers?.["Content-Type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return await readRawJson(req); } catch (_) { return {}; }
  }
  // Support URL-encoded fallback
  if (ct.includes("application/x-www-form-urlencoded")) {
    try {
      const obj = await readRawJson(req); // will give {} because content isn't JSON; we need raw text
    } catch (_) {}
  }
  // Fallback: empty body
  return {};
}

// Prompt Engineering Guide: quality helpers
function peQualityChecks(text) {
  const checks = { warnings: [], errors: [], flags: {} };
  const full = String(text || "");
  // 1) Generic phrases
  const generic = [
    "maatwerk bieden",
    "gedifferentieerd lesgeven",
    "passend onderwijs",
    "alle leerlingen",
    "optimaal leerklimaat",
    "talenten ontwikkelen",
    "extra aandacht",
    "individuele begeleiding",
  ];
  const foundGeneric = generic.filter((g) => full.toLowerCase().includes(g));
  if (foundGeneric.length > 2) {
    checks.warnings.push(`Te veel generieke frasen: ${foundGeneric.join(", ")}`);
    checks.flags.tooGeneric = true;
  }
  // 2) Numbers presence
  const nums = full.match(/\d+/g) || [];
  if (nums.length < 10) {
    checks.warnings.push("Weinig concrete getallen aangetroffen. Voeg aantallen/percentages/tijden toe.");
  }
  // 3) Mickey Mouse mention
  if (!/mickey\s*mouse/i.test(full)) {
    checks.warnings.push("Mickey Mouse-model niet expliciet genoemd in de tekst.");
  }
  // 4) Placeholders
  const placeholders = ["[naam leerkracht]", "[naam ib'", "[vul in]", "xxx", "..."]; // simple set
  const foundPH = placeholders.filter((p) => full.toLowerCase().includes(p.replace(/\$/,'').toLowerCase()));
  if (foundPH.length > 3) {
    checks.warnings.push(`Veel placeholders: ${foundPH.join(", ")}`);
  }
  // 5) Incomplete (abrupt end or missing Evaluatie)
  const endsAbrupt = !/[\.!?]\s*$/.test(full.trim()) && full.length > 1000;
  if (!/##\s*Evaluatie/i.test(full) || endsAbrupt) {
    checks.errors.push("Document lijkt niet volledig (Evaluatie ontbreekt of abrupt einde).");
    checks.flags.incomplete = true;
  }
  // 6) Language heuristic
  const enWords = [" the ", " and ", " students ", " learning ", " goals ", " assessment "];
  const nlWords = [" de ", " het ", " en ", " van ", " leerlingen ", " doelen ", " evaluatie "];
  const enCount = enWords.reduce((n, w) => n + (full.toLowerCase().includes(w) ? 1 : 0), 0);
  const nlCount = nlWords.reduce((n, w) => n + (full.toLowerCase().includes(w) ? 1 : 0), 0);
  if (enCount > nlCount) {
    checks.errors.push("Taal lijkt niet Nederlands.");
    checks.flags.wrongLanguage = true;
  }
  return checks;
}

function getQuery(req) {
  try {
    const url = new URL(req.url || "", "http://localhost");
    const groep = url.searchParams.get("groep");
    const vak = url.searchParams.get("vak");
    const periode = url.searchParams.get("periode");
    const previousContent = url.searchParams.get("previousContent");
    const obj = {};
    if (groep != null) obj.groep = groep;
    if (vak != null) obj.vak = vak;
    if (periode != null) obj.periode = periode;
    if (previousContent != null) obj.previousContent = previousContent;
    return obj;
  } catch (_) {
    return {};
  }
}

async function handler(req, res) {
  const started = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);
  try { console.log(`[generate-groepsplan] start reqId=${reqId}`); } catch (_) {}

  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, content: "", metadata: { error: "Method Not Allowed" } });
  }

  // Basic body parsing and validation (no logging of body to respect privacy)
  let body = await getBody(req);
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    // Fallback to query parameters if body is empty or unparsed
    body = getQuery(req);
  }
  const groepRaw = body.groep;
  const vakRaw = body.vak;
  const periodeRaw = body.periode;
  const previousContentRaw = body.previousContent;

  const groep = parseGroep(groepRaw);
  const vak = sanitizeVak(vakRaw);
  const periode = typeof periodeRaw === "string" ? periodeRaw.trim() : "";
  const previousSnippet =
    typeof previousContentRaw === "string" && previousContentRaw
      ? previousContentRaw.slice(0, 2000)
      : "";

  if (!isInteger(groep) || groep < 1 || groep > 8) {
    return res
      .status(400)
      .json(friendlyValidationError("Ongeldige 'groep'. Gebruik een getal 1 t/m 8."));
  }

  if (!ALLOWED_VAK.has(vak)) {
    return res
      .status(400)
      .json(
        friendlyValidationError("Ongeldig 'vak'. Kies uit: 'rekenen', 'taal', 'lezen'.")
      );
  }

  if (!periode || typeof periode !== "string" || periode.length > 64) {
    return res
      .status(400)
      .json(friendlyValidationError("Ongeldige 'periode'. Gebruik een korte beschrijving, bijv. 'Q2'."));
  }

  // Prepare SLO codes for this groep/vak (throws if unsupported)
  let allowedSLO = [];
  try {
    allowedSLO = getValidSLOCodes(groep, vak);
  } catch (e) {
    // Should not happen due to earlier validation; return friendly 400 if it does
    return res.status(400).json(
      friendlyValidationError(e?.message || "Ongeldige combinatie van groep en vak.")
    );
  }

  // Prepare timeout with AbortController to soft-fail under ~25s
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId = null;
  if (ctrl) {
    timeoutId = setTimeout(() => {
      try {
        ctrl.abort();
      } catch (_) {
        /* ignore */
      }
    }, TIMEOUT_MS);
  }

  try {
    let attempt = 1;
    let emphasis = "";
    let { text, usage, modelUsed } = await generateWithFallback({ groep, vak, periode, allowedSLO, previousSnippet, signal: ctrl?.signal, extraEmphasis: emphasis });

    const durationMs = Date.now() - started;

    if (!text || text.length < 500) {
      return res.status(502).json({
        success: false,
        content: "",
        metadata: {
          error: "Generatie mislukt of resultaat te kort. Probeer het nogmaals.",
          model: modelUsed || MODEL,
          duration_ms: durationMs,
          input: { groep, vak, periode },
          slo: { suggested: allowedSLO },
        },
      });
    }

    // Quick Prompt-Engineering quality pass; try one recovery if needed
    const pe = peQualityChecks(text);
    if ((pe.flags?.incomplete || pe.flags?.wrongLanguage || pe.flags?.tooGeneric) && attempt === 1) {
      emphasis = (
        "KRITISCH BELANGRIJK:\n" +
        "- GEEN algemene frasen; WEL concrete tijden/aantallen/materialen.\n" +
        "- Noem expliciet het Mickey Mouse-model (basis, intensief, meer).\n" +
        "- Schrijf ALLEEN in het Nederlands.\n" +
        "- Zorg dat de sectie 'Evaluatie' aanwezig is en de tekst afgerond eindigt.\n"
      );
      try {
        const r2 = await generateWithFallback({ groep, vak, periode, allowedSLO, previousSnippet, signal: ctrl?.signal, extraEmphasis: emphasis });
        if (r2?.text && r2.text.length >= 200) {
          text = r2.text;
        }
      } catch (_) { /* ignore second attempt errors */ }
    }

    // Post-validation of SLO codes
    const referenced = extractSLOCodes(text);
    const validRefs = referenced.filter((c) => validateSLOCode(c, groep, vak));
    const invalidRefs = referenced.filter((c) => !validateSLOCode(c, groep, vak));

    const warnings = [];
    if (invalidRefs.length > 0) {
      warnings.push(
        `Onjuiste SLO-codes aangetroffen: ${invalidRefs.join(", ")}. Gebruik alleen codes uit de whitelist.`
      );
    }

    // Optional persistence to Supabase for authenticated users (RLS-safe)
    let storageSaved = false;
    try {
      const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
      const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
      if (token) {
        const { user } = await getUserFromToken(token);
        if (user) {
          const supabase = createSupabaseClient(undefined, undefined, { accessToken: token });
          const insert = {
            user_id: user.id,
            type: "groepsplan",
            title: `Groepsplan Groep ${groep} ${vak} ${periode}`,
            content: text,
            metadata: {
              groep,
              vak,
              periode,
              model: modelUsed || MODEL,
              tokensUsed: usage?.output_tokens ?? null,
              duration_ms: durationMs,
            },
          };
          const { error: dbError } = await supabase.from("documents").insert(insert);
          if (!dbError) storageSaved = true;
        }
      }
    } catch (_) {
      // do not fail the request if storage fails
    }

    const response = {
      success: true,
      content: text,
      metadata: {
        model: modelUsed || MODEL,
        duration_ms: durationMs,
        durationMs: durationMs,
        input: { groep, vak, periode },
        length: text.length,
        slo: {
          suggested: allowedSLO,
          referenced,
          mentionedCodes: referenced,
          valid_reference_count: validRefs.length,
          invalid_references: invalidRefs,
        },
        context: { previous_used: Boolean(previousSnippet), previous_chars_in_prompt: previousSnippet.length },
        storage: { saved: storageSaved },
      },
    };
    // Merge PE warnings
    const allWarnings = [...warnings, ...(pe?.warnings || [])];
    if (allWarnings.length) response.warnings = allWarnings;
    if (durationMs > TIMEOUT_MS) response.hint = SLOW_HINT;
    try { console.log(`[generate-groepsplan] done reqId=${reqId} status=200 dur=${durationMs}ms`); } catch (_) {}
    return res.status(200).json(response);
  } catch (err) {
    try { console.log(`[generate-groepsplan] error reqId=${reqId} code=${err?.code||err?.name||'ERR'}`); } catch (_) {}
    return handleAPIError(err, res, { shape: "generate" });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Explicitly avoid logging request bodies or secrets to comply with privacy constraint.

module.exports = handler;
// Ensure default export is attached to module.exports for bundlers/importers
module.exports.default = module.exports;
module.exports.config = { maxDuration: 60, api: { bodyParser: false } };
