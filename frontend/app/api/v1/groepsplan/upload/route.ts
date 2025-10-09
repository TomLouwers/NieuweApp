import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  // Proxy to existing route to avoid breaking behavior (Phase 0)
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

  const resp = await fetch(target, { method: "POST", headers, body: request.body as any });
  const text = await resp.text();
  const outHeaders = new Headers({ "content-type": resp.headers.get("content-type") || "application/json", ...applyRateHeaders() });
  const retryAfter = resp.headers.get("retry-after");
  if (retryAfter) outHeaders.set("retry-after", retryAfter);
  return new NextResponse(text, { status: resp.status, headers: outHeaders });
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}

