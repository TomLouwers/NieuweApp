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
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
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
  return (
    "Je bent een ervaren Nederlandse leerkracht die compacte, duidelijke en direct toepasbare groepsplannen opstelt voor het basisonderwijs. " +
    "Respecteer privacy: noem nooit leerlingen bij naam en gebruik geen herleidbare voorbeelden. " +
    "Lever uitsluitend geldige Markdown zonder codeblokken, gericht op groep " +
    groep +
    " voor het vak \"" +
    vak +
    "\" in de periode \"" +
    periode +
    "\". Gebruik toegankelijke taal, korte alinea's en waar passend bullet points. " +
    "Houd het beknopt maar volledig (ongeveer 600–900 woorden). " +
    "Structuur is verplicht en exact als volgt met H2-koppen: \n\n" +
    "## Beginsituatie\n" +
    "## Doelen (SLO)\n" +
    "## Aanpak\n" +
    "## Differentiatie\n" +
    "## Evaluatie\n\n" +
    "In 'Doelen (SLO)' verwijs je inhoudelijk naar relevante SLO-doelen passend bij groep " +
    groep +
    " en het vak " +
    vak +
    ", zonder externe links. Sluit af zonder extra secties.\n\n" +
    "Gebruik expliciet 2–4 SLO-codes in het exacte formaat 'XXX-G<groep>-<n>' uit de whitelist hieronder. " +
    "Gebruik GEEN andere SLO-codes dan deze whitelist.\n" +
    "ONLY use these SLO codes (whitelist):\n" +
    (Array.isArray(allowedSLO) ? allowedSLO.join(", ") : "") +
    "\n" +
    "Als er geen passende codes zijn, laat ze weg in plaats van nieuwe te verzinnen. " +
    (previousSnippet
      ? "Gebruik de meegegeven context alleen ter inspiratie: verwijs ernaar in 'Beginsituatie', herformuleer en kopieer geen zinnen letterlijk."
      : "")
  );
}

function buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet }) {
  return (
    "Genereer een groepsplan in Markdown met de voorgeschreven secties en opbouw. " +
    "Voeg indien relevant korte voorbeelden van werkvormen toe voor Nederlandse klassenpraktijk. " +
    "Begin met een H1-titel in dit format: \n\n" +
    `# Groepsplan ${vak} — Groep ${groep} — Periode ${periode}\n\n` +
    "Schrijf daarna direct de vereiste secties (H2) in de opgegeven volgorde.\n" +
    "In 'Doelen (SLO)': gebruik uitsluitend SLO-codes uit de whitelist. Geen andere codes.\n" +
    "Whitelist: " + (Array.isArray(allowedSLO) ? allowedSLO.join(", ") : "") + ".\n" +
    (previousSnippet
      ? "Vorig groepsplan (context):\n" + previousSnippet
      : "")
  );
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
        // Normalize chunk to Buffer
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        chunks.push(buf);
        total += buf.length;
        if (total > 1_000_000) {
          reject(Object.assign(new Error("Request body too large."), { status: 413 }));
        }
      });
      req.on("end", () => {
        try {
          if (total === 0) return resolve({});
          const raw = Buffer.concat(chunks, total).toString("utf8");
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
  // In tests or local dev Next may have already parsed body
  if (req && typeof req.body === "object" && req.body !== null) return req.body;
  // On Vercel with bodyParser disabled we parse manually
  const ct = String(req?.headers?.["content-type"] || req?.headers?.["Content-Type"] || "").toLowerCase();
  if (ct.includes("application/json")) return await readRawJson(req);
  // Fallback: empty body
  return {};
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
  let body = {};
  try {
    body = await getBody(req);
  } catch (e) {
    const status = e?.status && Number.isFinite(e.status) ? e.status : 400;
    return res.status(status).json(friendlyValidationError("Ongeldig JSON-body formáat."));
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
    const { text, usage } = await callClaude({ groep, vak, periode, allowedSLO, previousSnippet, signal: ctrl?.signal });

    const durationMs = Date.now() - started;

    if (!text || text.length < 500) {
      return res.status(502).json({
        success: false,
        content: "",
        metadata: {
          error: "Generatie mislukt of resultaat te kort. Probeer het nogmaals.",
          model: MODEL,
          duration_ms: durationMs,
          input: { groep, vak, periode },
          slo: { suggested: allowedSLO },
        },
      });
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
              model: MODEL,
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
        model: MODEL,
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
    if (warnings.length) response.warnings = warnings;
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
