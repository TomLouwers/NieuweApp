"use strict";

// Simple in-memory fixed-window limiter. Not suitable for multi-instance.
// Keys by userId if available, else IP. Configure limits via env.

const BUCKET = new Map();

function getWindowMs() {
  const n = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  return Number.isFinite(n) && n > 0 ? n : 60000;
}

function getLimit() {
  const n = Number(process.env.RATE_LIMIT_MAX || 20);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

function keyFor({ userId, ip, route }) {
  const p = String(route || "");
  if (userId) return `u:${userId}:${p}`;
  return `ip:${ip || "unknown"}:${p}`;
}

function take({ userId, ip, route }) {
  const limit = getLimit();
  const windowMs = getWindowMs();
  const k = keyFor({ userId, ip, route });
  const now = Date.now();
  let entry = BUCKET.get(k);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }
  entry.count += 1;
  BUCKET.set(k, entry);
  const remaining = Math.max(0, limit - entry.count);
  const limited = entry.count > limit;
  return { limited, remaining, resetAt: entry.resetAt, limit };
}

module.exports = { take };

