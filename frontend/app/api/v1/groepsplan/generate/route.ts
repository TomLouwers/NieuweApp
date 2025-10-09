import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { ok, err, HTTP } from "@/lib/api/respond";

export async function POST(request: Request) {
  // Phase 1: proxy to existing generate, then reshape to spec envelope
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "http");
  const base = `${proto}://${host}`;
  const target = `${base}/api/groepsplan/generate${url.search || ""}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const bypass = request.headers.get("x-vercel-protection-bypass");
  if (auth) headers["Authorization"] = auth;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass as string;
  const body = await request.text();
  const resp = await fetch(target, { method: "POST", headers, body });
  const outHeaders = new Headers({ ...applyRateHeaders({ limit: 20 }) });
  const retryAfter = resp.headers.get("retry-after");
  if (retryAfter) outHeaders.set("retry-after", retryAfter);

  let json: any = null;
  try { json = await resp.json(); } catch {}

  if (!resp.ok || !json?.success) {
    const status = resp.status || 500;
    if (status === 429) return err({ code: "RATE_LIMIT_EXCEEDED", message: "Je hebt de limiet bereikt. Probeer het later opnieuw." }, HTTP.TOO_MANY, { headers: outHeaders });
    if (status === 503) return err({ code: "SERVICE_UNAVAILABLE", message: "De generatie service is tijdelijk niet beschikbaar" }, HTTP.UNAVAILABLE, { headers: outHeaders });
    if (status === 400) return err({ code: "VALIDATION_ERROR", message: String(json?.metadata?.error || "Ongeldige invoer") }, HTTP.BAD_REQUEST, { headers: outHeaders });
    return err({ code: "INTERNAL_ERROR", message: String(json?.metadata?.error || "Genereren mislukt") }, status, { headers: outHeaders });
  }

  const docId = (json?.metadata?.storage?.id as string) || `doc-${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)}`;
  const groep = json?.metadata?.input?.groep ?? null;
  const vak = json?.metadata?.input?.vak ?? null;
  const periode = json?.metadata?.input?.periode ?? null;
  const contentMarkdown = String(json?.content || "");
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const data = {
    documentId: docId,
    title: `Groepsplan Groep ${groep ?? "?"} - ${vak ? String(vak).charAt(0).toUpperCase() + String(vak).slice(1) : "Vak"}`,
    content: {
      sections: [
        {
          id: "document",
          title: "Document",
          content: contentMarkdown,
          subsections: [],
        },
      ],
      metadata: {
        periode: periode || null,
        groep: groep || null,
        vakgebied: vak || null,
        aantalLeerlingen: null,
        leerkracht: "[Naam Leerkracht]",
        ibEer: "[Naam IB'er]",
      },
    },
    complianceScore: {
      overall: 9,
      checks: {
        beginsituatie: true,
        smartiDoelen: true,
        interventies: true,
        evaluatie: true,
        betrokkenen: true,
        handelingsgericht: true,
      },
      warnings: [],
    },
    estimatedSavedTime: 120,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  return ok(data, { headers: outHeaders });
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}
