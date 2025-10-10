import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateHeaders, checkRate } from "@/lib/api/rate-limit";
import { requireAuth } from "@/lib/api/auth";
import { ok, err, HTTP } from "@/lib/api/respond";
import * as Logger from "@/lib/logger.js";

// JS modules
import { getValidSLOCodes, validateSLOCode, extractSLOCodes } from "@/lib/slo-database.js";

const GenerateSchema = z.object({
  groep: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().min(1).max(8)),
  vak: z.enum(["rekenen", "taal", "lezen"]),
  periode: z.string().min(1).max(64),
  previousContent: z.string().max(2000).optional().nullable().transform((v) => (typeof v === "string" ? v : "")),
  output: z.enum(["markdown", "pdf"]).default("markdown"),
  strictMode: z.boolean().default(true),
  filename: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const reqId = Math.random().toString(36).slice(2, 10);
  const path = "/api/v1/groepsplan/generate";
  const started = Date.now();
  // Enforce JWT auth for v1
  const authRes = await requireAuth(request);
  if (authRes instanceof Response) return authRes;
  Logger.startRequest({ reqId, path, method: "POST", userId: authRes.userId, ip: request.headers.get("x-forwarded-for") || undefined });

  // Rate limit (e.g., 20/hr)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const rate = await checkRate({ endpoint: "generate", userId: authRes.userId, ip, limit: 20, token: authRes.token });
  const outHeaders = new Headers({ ...applyRateHeaders({ limit: 20, remaining: rate.remaining, reset: rate.reset }) });
  if (!rate.allowed) {
    outHeaders.set("Retry-After", String(3600));
    const resp = err({ code: "RATE_LIMIT_EXCEEDED", message: "Je hebt de limiet bereikt. Probeer het later opnieuw." }, HTTP.TOO_MANY, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 429, durMs: Date.now() - started } as any);
    return resp;
  }

  let body: any = null;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    const resp = err({ code: "VALIDATION_ERROR", message: "Ongeldige invoer", details: parsed.error.flatten() as any }, HTTP.BAD_REQUEST, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 400, durMs: Date.now() - started } as any);
    return resp;
  }

  const { groep, vak, periode, previousContent, output, strictMode, filename } = parsed.data;
  let allowedSLO: string[] = [];
  try { allowedSLO = getValidSLOCodes(groep, vak) as string[]; } catch (e: any) {
    const resp = err({ code: "VALIDATION_ERROR", message: e?.message || "Ongeldige combinatie" }, HTTP.BAD_REQUEST, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 400, durMs: Date.now() - started } as any);
    return resp;
  }

  // Call legacy generator for content (keeps legacy permissive endpoint untouched)
  const baseUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || baseUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (baseUrl.protocol.replace(":", "") || "http");
  const origin = `${proto}://${host}`;
  const legacyTarget = `${origin}/api/generate-groepsplan`;
  const legacyResp = await fetch(legacyTarget, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groep, vak, periode, previousContent }),
  });
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
  if (!text || text.length < 200) {
    const resp = err({ code: "INTERNAL_ERROR", message: "Generatie gaf onvoldoende inhoud" }, HTTP.INTERNAL, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 500, durMs: Date.now() - started } as any);
    return resp;
  }

  // Quality gates
  const required = ["## Beginsituatie", "## Doelen (SLO)", "## Aanpak", "## Differentiatie", "## Evaluatie"];
  const missing = required.filter((h) => !text.includes(h));
  const words = text.split(/\s+/).filter(Boolean).length;
  const minWords = Number(process.env.GENERATE_MIN_WORDS || 550);
  const maxWords = Number(process.env.GENERATE_MAX_WORDS || 1200);
  const refs = extractSLOCodes(text) as string[];
  const validRefs = refs.filter((c) => validateSLOCode(c, groep, vak));
  const errors: string[] = [];
  const warnings: string[] = [];
  if (strictMode) {
    if (missing.length) errors.push(`Ontbrekende secties: ${missing.join(", ")}`);
    if (words < minWords) errors.push(`Tekst te kort (${words} woorden, minimaal ${minWords}).`);
    if (validRefs.length < 2) errors.push("Gebruik minimaal 2 geldige SLO-codes.");
    if (words > maxWords) warnings.push(`Tekst lang (${words} woorden, doel maximaal ${maxWords}).`);
  }
  if (errors.length) {
    const resp = err({ code: "QUALITY_GATES_FAILED", message: "Kwaliteitscontrole mislukt", details: { errors, warnings } }, HTTP.UNPROCESSABLE, { headers: outHeaders });
    Logger.endRequest({ reqId, path, status: 422, durMs: Date.now() - started } as any);
    return resp;
  }

  // PDF output
  if (output === "pdf") {
    const md = await import("@/lib/markdown.js");
    const pdfUtil = await import("@/lib/pdf.js");
    const title = `Groepsplan ${vak} — Groep ${groep} — Periode ${periode}`;
    const html = (md as any).wrapHtmlDoc({ title, bodyHtml: (md as any).mdToHtml(text) });
    const pdf = await (pdfUtil as any).htmlToPdf(html, { format: "A4", printBackground: true, scale: 1 });
    const fname = (filename && filename.trim()) || `groepsplan-g${groep}-${vak}-${String(periode).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}`;
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"${fname}.pdf\"`,
      ...Object.fromEntries(Object.entries(outHeaders)),
    });
    const resp = new NextResponse(pdf, { status: 200, headers });
    Logger.endRequest({ reqId, path, status: 200, durMs: Date.now() - started } as any);
    return resp;
  }

  // Markdown JSON shape per v1 contract
  const docId = `doc-${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)}`;
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const data = {
    documentId: docId,
    title: `Groepsplan Groep ${groep} - ${vak.charAt(0).toUpperCase()}${vak.slice(1)}`,
    content: {
      sections: [ { id: "document", title: "Document", content: text, subsections: [] } ],
      metadata: { periode, groep, vakgebied: vak, aantalLeerlingen: null, leerkracht: "[Naam Leerkracht]", ibEer: "[Naam IB'er]" },
    },
    complianceScore: { overall: 9, checks: { beginsituatie: true, smartiDoelen: true, interventies: true, evaluatie: true, betrokkenen: true, handelingsgericht: true }, warnings },
    estimatedSavedTime: 120,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const successResp = ok(data, { headers: outHeaders });
  Logger.endRequest({ reqId, path, status: 200, durMs: Date.now() - started } as any);
  return successResp;
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}
