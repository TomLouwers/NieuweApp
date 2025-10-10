"use strict";

class AppError extends Error {
  constructor(message, { statusCode = 500, code = "APP_ERROR", retryAfter = null, details = null } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfter = retryAfter;
    this.details = details;
  }
}

function parseRetryAfter(err) {
  if (typeof err?.retryAfter === "number") return err.retryAfter;
  if (typeof err?.retry_after === "number") return err.retry_after;
  const h = err?.headers || err?.response?.headers;
  const raw = h && (h["retry-after"] || h["Retry-After"]);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function handleAPIError(error, res, { shape = "generate" } = {}) {
  const env = process.env.NODE_ENV;
  const isDev = env === "development" || env === "test";

  const code = error?.code || error?.name || "ERROR";
  const statusFromErr = error?.status || error?.statusCode || error?.response?.status;
  let status = 500;
  let message = "Er ging iets mis op de server. Probeer het opnieuw.";
  let retryAfter = parseRetryAfter(error);

  // Special cases
  if (statusFromErr) status = statusFromErr;
  if (code === "AbortError" || code === "TimeoutError") {
    status = 503;
    message = "De generatie duurde te lang en is afgebroken. Probeer het opnieuw.";
  } else if (status === 401 || code === "401" || code === "UnauthorizedError") {
    status = 401;
    message = "Niet geautoriseerd. Log in om door te gaan.";
  } else if (status === 429 || code === "RateLimitError") {
    status = 429;
    message = "Te veel verzoeken. Probeer het later opnieuw.";
    if (retryAfter == null) retryAfter = 1;
  } else if (status === 400) {
    message = error?.message || "Ongeldig verzoek.";
  } else if (statusFromErr) {
    // Use provided status with a generic message if not handled above
    message = error?.message || message;
  }

  // If we're rate limited and have retryAfter, set standard header
  try {
    if (status === 429 && retryAfter != null) {
      const secs = Math.max(0, Math.floor(Number(retryAfter)) || 0);
      if (res && typeof res.setHeader === 'function') {
        res.setHeader("Retry-After", String(secs));
      }
    }
  } catch (_) {}

  if (shape === "upload") {
    const payload = { success: false, text: "", metadata: {}, filename: "", error: message, code };
    if (retryAfter != null) payload.retryAfter = retryAfter;
    if (isDev && status === 500) payload.debug = { stack: String(error?.stack || "") };
    return res.status(status).json(payload);
  }

  // Default shape for generate API
  const payload = {
    success: false,
    content: "",
    metadata: { error: message, code },
  };
  if (retryAfter != null) payload.metadata.retryAfter = retryAfter;
  if (isDev && status === 500) payload.metadata.debug = { stack: String(error?.stack || "") };
  return res.status(status).json(payload);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err) {
  const status = err?.status || err?.statusCode || err?.response?.status;
  const code = err?.code || err?.name;
  return status === 429 || code === "RateLimitError" || /rate.?limit/i.test(String(err?.message || ""));
}

function isAuthError(err) {
  const status = err?.status || err?.statusCode || err?.response?.status;
  return status === 401 || status === 403;
}

async function callClaudeWithRetry(
  anthropic,
  params,
  { signal, maxRetries = 4, baseDelayMs = 1000, maxDelayMs = 10000 } = {}
) {
  let attempt = 0;
  while (true) {
    try {
      return await anthropic.messages.create(params, { signal });
    } catch (err) {
      if (isAuthError(err)) throw err;
      if (!isRateLimitError(err)) throw err;
      if (attempt >= maxRetries) throw err;
      const ra = parseRetryAfter(err);
      let backoffMs = ra != null ? ra * 1000 : baseDelayMs * Math.pow(2, attempt);
      backoffMs = Math.min(backoffMs, maxDelayMs);
      const jitter = 200 + Math.floor(Math.random() * 400);
      await sleep(backoffMs + jitter);
      attempt += 1;
      continue;
    }
  }
}

module.exports = { AppError, handleAPIError, callClaudeWithRetry };

