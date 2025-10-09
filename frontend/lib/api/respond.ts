import { NextResponse } from "next/server";

function nowIso() {
  try { return new Date().toISOString(); } catch { return ""; }
}

function rid() {
  // Lightweight request id
  return Math.random().toString(36).slice(2, 10);
}

export function ok(data: any, init?: ResponseInit) {
  const body = { data, meta: { requestId: rid(), timestamp: nowIso() } };
  return NextResponse.json(body, { status: 200, ...(init || {}) });
}

export type ErrorBody = {
  code: string;
  message: string;
  details?: Record<string, any> | null;
};

export function err(error: ErrorBody, status = 400, init?: ResponseInit) {
  const body = { error, meta: { requestId: rid(), timestamp: nowIso() } };
  return NextResponse.json(body, { status, ...(init || {}) });
}

export const HTTP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE: 422,
  TOO_MANY: 429,
  INTERNAL: 500,
  UNAVAILABLE: 503,
};

