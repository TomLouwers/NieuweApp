import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateHeaders, checkRate } from "@/lib/api/rate-limit";
import { requireAuth } from "@/lib/api/auth";
import { ok, err, HTTP } from "@/lib/api/respond";
import * as Logger from "@/lib/logger.js";

const GenerateOPPSchema = z.object({
  studentName: z.string().min(1),
  age: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().min(3).max(16)),
  groep: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().min(1).max(8)),
  gender: z.string().min(1),
  reasonForOpp: z.string().min(1),
  currentLevels: z.object({
    technischLezen: z.string().optional(),
    spelling: z.string().optional(),
    rekenen: z.string().optional(),
    begrijpendLezen: z.string().optional(),
    sociaalEmotioneel: z.string().optional(),
    beschrijving_gedrag: z.string().optional(),
  }).partial().default({}),
  uitstroomprofiel: z.object({ type: z.string().min(1), rationale: z.string().optional() }).default({ type: "", rationale: "" }),
  externalSupport: z.array(z.string()).default([]),
  parentInvolvement: z.string().optional(),
  uploadId: z.string().optional(),
  previousOppData: z.object({
    previousGoals: z.string().optional(),
    goalsAchieved: z.string().optional(),
    goalsNotAchieved: z.string().optional(),
    reasonForProgress: z.string().optional(),
    progressSince: z.string().optional(),
  }).partial().default({}),
  additionalContext: z.string().optional(),
  teacherFocusArea: z.string().optional(),
});

export async function POST(request: Request) {
  const reqId = Math.random().toString(36).slice(2, 10);
  const path = "/api/v1/opp/generate";
  const started = Date.now();
  const authRes = await requireAuth(request);
  if (authRes instanceof Response) return authRes;
  Logger.startRequest({ reqId, path, method: "POST", userId: authRes.userId, ip: request.headers.get("x-forwarded-for") || undefined });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const rate = await checkRate({ endpoint: "opp_generate", userId: authRes.userId, ip, limit: 20, token: authRes.token });
  const outHeaders = new Headers({ ...applyRateHeaders({ limit: 20, remaining: rate.remaining, reset: rate.reset }) });
  if (!rate.allowed) {
    outHeaders.set("Retry-After", String(3600));
    const resp = err({ code: "RATE_LIMIT_EXCEEDED", message: "Je hebt de limiet bereikt. Probeer het later opnieuw." }, HTTP.TOO_MANY, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 429, durMs: Date.now() - started } as any);
    return resp;
  }

  let body: any = null;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = GenerateOPPSchema.safeParse(body);
  if (!parsed.success) {
    const resp = err({ code: "VALIDATION_ERROR", message: "Ongeldige invoer", details: parsed.error.flatten() as any }, HTTP.BAD_REQUEST, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 400, durMs: Date.now() - started } as any);
    return resp;
  }

  const payload = parsed.data;

  // Call legacy generator (non-auth) to reuse model plumbing
  const baseUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || baseUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (baseUrl.protocol.replace(":", "") || "http");
  const origin = `${proto}://${host}`;
  const legacyTarget = `${origin}/api/generate-opp`;
  const legacyResp = await fetch(legacyTarget, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authRes.token}` }, body: JSON.stringify(payload) });
  let legacyJson: any = null;
  try { legacyJson = await legacyResp.json(); } catch {}
  if (!legacyResp.ok || !legacyJson?.success) {
    const status = legacyResp.status || 500;
    const msg = legacyJson?.metadata?.error || "Genereren mislukt";
    const resp = err({ code: status === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR", message: String(msg) }, status, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status, durMs: Date.now() - started } as any);
    return resp;
  }

  const text: string = String(legacyJson.content || "");
  if (!text || text.length < 800) {
    const resp = err({ code: "INTERNAL_ERROR", message: "Generatie gaf onvoldoende inhoud" }, HTTP.INTERNAL, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 500, durMs: Date.now() - started } as any);
    return resp;
  }

  // Compliance checks (presence)
  const has = (h: RegExp) => h.test(text);
  const checks = {
    leerlingprofiel: has(/##\s*1\.?\s*Leerlingprofiel/i),
    beginsituatie: has(/##\s*2\.?\s*Beginsituatie/i),
    uitstroomprofiel: has(/##\s*3\.?\s*Uitstroomprofiel/i),
    ontwikkeldoelen: has(/##\s*4\.?\s*Ontwikkeldoelen/i),
    aanpak: has(/##\s*5\.?\s*Aanpak/i),
    betrokkenen: has(/##\s*6\.?\s*Betrokkenen/i),
    evaluatie: has(/##\s*7\.?\s*Evaluatie/i),
  } as const;
  const overall = Object.values(checks).filter(Boolean).length >= 6 ? 9 : 7;

  // Produce v1 response shape
  const oppId = `opp-${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  const data = {
    oppId,
    studentName: payload.studentName,
    content: { sections: [ { id: "document", title: "Document", content: text } ] },
    complianceScore: { overall, checks },
    estimatedTimeSaved: 240,
    generatedAt: now,
  };

  const response = ok(data, { headers: outHeaders });
  Logger.endRequest({ reqId, path, status: 200, durMs: Date.now() - started } as any);
  return response;
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}

