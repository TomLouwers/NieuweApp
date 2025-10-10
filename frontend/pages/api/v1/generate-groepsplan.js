"use strict";

const { z } = require("zod");
const { requireAuth } = require("../../../lib/auth.js");
const { take: takeRate } = require("../../../lib/rate-limit.js");
const { startRequest, endRequest, info, warn, error: logError } = require("../../../lib/logger.js");
const { getValidSLOCodes, validateSLOCode, extractSLOCodes } = require("../../../lib/slo-database.js");
const { handleAPIError, callClaudeWithRetry } = require("../../../lib/error-handler.js");
const { mdToHtml, wrapHtmlDoc } = require("../../../lib/markdown.js");
const { htmlToPdf } = require("../../../lib/pdf.js");

let AnthropicClient = null;
try {
  const mod = require("@anthropic-ai/sdk");
  AnthropicClient = mod?.default ?? mod?.Anthropic ?? mod;
} catch (_) {}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MODEL = OPENAI_KEY ? OPENAI_MODEL : CLAUDE_MODEL;
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.7;
const TIMEOUT_MS = 25000;

const GenerateSchema = z.object({
  groep: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().min(1).max(8)),
  vak: z.enum(["rekenen", "taal", "lezen"]),
  periode: z.string().min(1).max(64),
  previousContent: z.string().max(2000).optional().nullable().transform((v) => (typeof v === "string" ? v : "")),
  output: z.enum(["markdown", "pdf"]).default("markdown"),
  strictMode: z.boolean().default(true),
  // optional hint for filename when output=pdf
  filename: z.string().max(120).optional(),
});

function readRawJson(req) {
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
          try { buf = Buffer.from(chunk.buffer); } catch (_) { buf = Buffer.from(String(chunk), "utf8"); }
        } else buf = Buffer.from(String(chunk), "utf8");
        chunks.push(buf);
        total += buf.length;
        if (total > 1_000_000) reject(Object.assign(new Error("Request body too large."), { status: 413 }));
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

async function generateWithFallback({ groep, vak, periode, allowedSLO, previousSnippet, signal }) {
  const haveOpenAI = !!OPENAI_KEY;
  const haveAnthropic = !!process.env.ANTHROPIC_API_KEY && !!AnthropicClient;

  const system = buildSystemPrompt({ groep, vak, periode, allowedSLO, previousSnippet });
  const user = buildUserPrompt({ groep, vak, periode, allowedSLO, previousSnippet });

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
    } catch (_) { text = ""; }
    return text;
  }

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
        if (!AnthropicClient) throw Object.assign(new Error("Anthropic SDK ontbreekt of is niet geïnstalleerd."), { code: "SDK_NOT_AVAILABLE" });
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
      const status = err?.status || err?.statusCode || err?.response?.status;
      if (!isRecoverable(err)) break;
    }
  }
  throw lastErr || new Error("Onbekende fout bij genereren.");

  function isRecoverable(err) {
    const status = err?.status || err?.statusCode || err?.response?.status;
    const code = err?.code || err?.name || "";
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    if (/rate.?limit/i.test(String(err?.message || ""))) return true;
    if (code === "AbortError" || code === "TimeoutError") return true;
    return false;
  }
}

function qualityCheck({ text, groep, vak, allowedSLO, strict }) {
  const requiredH2 = [
    "## Beginsituatie",
    "## Doelen (SLO)",
    "## Aanpak",
    "## Differentiatie",
    "## Evaluatie",
  ];
  const missing = requiredH2.filter((h) => !text.includes(h));
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const referenced = extractSLOCodes(text);
  const validRefs = referenced.filter((c) => validateSLOCode(c, groep, vak));

  const errors = [];
  const warnings = [];

  if (strict) {
    if (missing.length) errors.push(`Ontbrekende secties: ${missing.join(", ")}`);
    const minW = Number(process.env.GENERATE_MIN_WORDS || 550);
    const maxW = Number(process.env.GENERATE_MAX_WORDS || 1200);
    if (wordCount < minW) errors.push(`Tekst te kort (${wordCount} woorden, minimaal ${minW}).`);
    if (wordCount > maxW) warnings.push(`Tekst lang (${wordCount} woorden, doel maximaal ${maxW}).`);
    if (validRefs.length < 2) errors.push("Gebruik minimaal 2 geldige SLO-codes.");
  } else {
    if (missing.length) warnings.push(`Secties missen mogelijk: ${missing.join(", ")}`);
    if (validRefs.length < 2) warnings.push("Weinig geldige SLO-codes gevonden.");
  }

  return { errors, warnings, referenced, validRefs };
}

async function handler(req, res) {
  const started = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);
  const path = "/api/v1/generate-groepsplan";
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString();
  try {
    // Require POST
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ success: false, content: "", metadata: { error: "Method Not Allowed" } });
    }

    // Auth (JWT) required
    const { user, token } = await requireAuth(req);
    startRequest({ reqId, path, method: req.method, userId: user?.id, ip });

    // Rate limit per user
    const rl = takeRate({ userId: user?.id, ip, route: path });
    try {
      res.setHeader("X-RateLimit-Limit", String(rl.limit));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rl.remaining)));
      const resetSecs = Math.max(0, Math.floor((rl.resetAt - Date.now()) / 1000));
      res.setHeader("X-RateLimit-Reset", String(resetSecs));
    } catch (_) {}
    if (rl.limited) {
      const e = new Error("Rate limit exceeded");
      e.status = 429;
      e.code = "RATE_LIMIT";
      e.retryAfter = Math.max(0, Math.ceil((rl.resetAt - Date.now()) / 1000));
      throw e;
    }

    // Parse JSON body
    const body = await readRawJson(req);
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        content: "",
        metadata: { error: "Ongeldig verzoek.", details: parsed.error.flatten() },
      });
    }

    const { groep, vak, periode, previousContent, output, strictMode, filename } = parsed.data;

    // Allowed SLO for combo
    let allowedSLO = [];
    try { allowedSLO = getValidSLOCodes(groep, vak); } catch (e) {
      return res.status(400).json({ success: false, content: "", metadata: { error: e?.message || "Ongeldige combinatie." } });
    }

    // Timeout control
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (_) {} }, TIMEOUT_MS) : null;

    try {
      const { text, usage, modelUsed } = await generateWithFallback({ groep, vak, periode, allowedSLO, previousSnippet: previousContent || "", signal: ctrl?.signal });

      const durationMs = Date.now() - started;

      if (!text || text.length < 200) {
        return res.status(502).json({ success: false, content: "", metadata: { error: "Generatie mislukt of resultaat te kort.", model: modelUsed || MODEL } });
      }

      const qc = qualityCheck({ text, groep, vak, allowedSLO, strict: strictMode });
      if (qc.errors.length) {
        return res.status(422).json({ success: false, content: "", metadata: { error: "Kwaliteitscontrole mislukt", issues: qc.errors } });
      }

      const meta = {
        model: modelUsed || MODEL,
        duration_ms: durationMs,
        input: { groep, vak, periode },
        length: text.length,
        words: String(text || "").split(/\s+/).filter(Boolean).length,
        slo: { suggested: allowedSLO, referenced: qc.referenced, valid_reference_count: qc.validRefs.length },
        strictMode,
      };

      // Output handling
      if (output === "pdf") {
        const title = `Groepsplan ${vak} — Groep ${groep} — Periode ${periode}`;
        const bodyHtml = mdToHtml(text);
        const html = wrapHtmlDoc({ title, bodyHtml });
        const pdf = await htmlToPdf(html, { format: "A4", printBackground: true, scale: 1 });

        const fname = (filename && filename.trim()) || `groepsplan-g${groep}-${vak}-${String(periode).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=\"${fname}.pdf\"`);
        res.setHeader("X-Model-Used", meta.model);
        res.setHeader("X-Generate-Duration", String(durationMs));
        try { endRequest({ reqId, path, status: 200, durMs: durationMs }); } catch (_) {}
        return res.status(200).send(Buffer.from(pdf));
      }

      const response = { success: true, content: text, metadata: meta };
      if (qc.warnings.length) response.warnings = qc.warnings;
      try { endRequest({ reqId, path, status: 200, durMs: durationMs }); } catch (_) {}
      return res.status(200).json(response);
    } catch (err) {
      try { logError("generate.error", { reqId, code: err?.code || err?.name || "ERR" }); } catch (_) {}
      return handleAPIError(err, res, { shape: "generate" });
    }
    finally {
      // Clear timeout
      try { /* eslint-disable no-unsafe-finally */ if (timeoutId) clearTimeout(timeoutId); } catch (_) {}
    }
  } catch (outerErr) {
    return handleAPIError(outerErr, res, { shape: "generate" });
  }
}

module.exports = handler;
module.exports.default = module.exports;
module.exports.config = { maxDuration: 60, api: { bodyParser: false } };
