"use strict";

function nowIso() {
  try {
    return new Date().toISOString();
  } catch (_) {
    return String(Date.now());
  }
}

function base(event, extra = {}) {
  return {
    ts: nowIso(),
    level: event.level || "info",
    msg: event.msg || "",
    ...extra,
  };
}

function log(event, extra) {
  try {
    const payload = base(event, extra);
    // Avoid leaking sensitive fields by default
    delete payload.body;
    delete payload.headers;
    console.log(JSON.stringify(payload));
  } catch (_) {
    // Fallback minimal log
    try { console.log(`[log] ${event?.level || "info"}: ${event?.msg || ""}`); } catch (_) {}
  }
}

function info(msg, extra) { log({ level: "info", msg }, extra); }
function warn(msg, extra) { log({ level: "warn", msg }, extra); }
function error(msg, extra) { log({ level: "error", msg }, extra); }

function startRequest({ reqId, path, method, userId, ip }) {
  info("req.start", { reqId, path, method, userId: userId || null, ip: ip || null });
}

function endRequest({ reqId, path, status, durMs }) {
  info("req.end", { reqId, path, status, dur_ms: durMs });
}

module.exports = { log, info, warn, error, startRequest, endRequest };

