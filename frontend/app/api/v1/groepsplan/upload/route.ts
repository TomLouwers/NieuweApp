import { NextResponse } from "next/server";
import { applyRateHeaders, checkRate } from "@/lib/api/rate-limit";
import { requireAuth } from "@/lib/api/auth";
import { ok, err, HTTP } from "@/lib/api/respond";

export async function POST(request: Request) {
  // Enforce JWT auth for v1
  const authCtx = await requireAuth(request);
  if (authCtx instanceof Response) return authCtx;

  // Phase 1: proxy to existing route, then reshape to spec envelope
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "http");
  const base = `${proto}://${host}`;
  const target = `${base}/api/groepsplan/upload${url.search || ""}`;
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const ct = request.headers.get("content-type");
  const bypass = request.headers.get("x-vercel-protection-bypass");
  if (auth) headers["Authorization"] = auth;
  if (ct) headers["Content-Type"] = ct;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass as string;

  // Rate-limiting (authenticated 100/h generic for upload)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const rate = await checkRate({ endpoint: "upload", userId: authCtx.userId, ip, limit: 100, token: authCtx.token });
  if (!rate.allowed) {
    const h = new Headers(rate.headers as any);
    h.set("Retry-After", "3600");
    return err({ code: "RATE_LIMIT_EXCEEDED", message: "Je hebt de limiet bereikt. Probeer het over 1 uur opnieuw." }, HTTP.TOO_MANY, { headers: h });
  }

  const resp = await fetch(target, { method: "POST", headers, body: request.body as any });
  const outHeaders = new Headers({ ...applyRateHeaders() });
  const retryAfter = resp.headers.get("retry-after");
  if (retryAfter) outHeaders.set("retry-after", retryAfter);

  let json: any = null;
  try { json = await resp.json(); } catch {}

  if (!resp.ok || !json?.ok) {
    const msg = String(json?.error || "Upload mislukt");
    if (resp.status === 413 || /te groot|too large/i.test(msg)) {
      return err({ code: "FILE_TOO_LARGE", message: "Het bestand is te groot (max 10MB)", details: { maxSize: 10 * 1024 * 1024 } }, HTTP.PAYLOAD_TOO_LARGE, { headers: outHeaders });
    }
    if (resp.status === 400 || /ongeldig bestandstype|invalid/i.test(msg)) {
      return err({ code: "INVALID_FILE_TYPE", message: "Dit bestandstype wordt niet ondersteund", details: { acceptedTypes: ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","image/jpeg","image/png"] } }, HTTP.BAD_REQUEST, { headers: outHeaders });
    }
    return err({ code: "EXTRACTION_FAILED", message: msg || "Kon geen bruikbare informatie uit het document halen" }, resp.status || HTTP.UNPROCESSABLE, { headers: outHeaders });
  }

  const now = new Date().toISOString();
  const data = {
    uploadId: json.id || crypto.randomUUID?.() || `upl_${Math.random().toString(36).slice(2, 10)}`,
    extractedData: json.extractedData || {
      groep: null,
      vakgebied: null,
      periode: null,
      aantalLeerlingen: null,
      groepsindeling: null,
      previousGoals: [],
      previousResults: null,
      schoolFormat: null,
      confidence: {},
    },
    originalFileName: json.filename || "upload",
    fileSize: json.size ?? null,
    processedAt: now,
  };
  return ok(data, { headers: outHeaders });
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}
