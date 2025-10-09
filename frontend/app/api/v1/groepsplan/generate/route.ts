import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  // Proxy to existing app route (/api/groepsplan/generate)
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
  const text = await resp.text();
  const outHeaders = new Headers({ "content-type": resp.headers.get("content-type") || "application/json", ...applyRateHeaders({ limit: 20 }) });
  const retryAfter = resp.headers.get("retry-after");
  if (retryAfter) outHeaders.set("retry-after", retryAfter);
  return new NextResponse(text, { status: resp.status, headers: outHeaders });
}

export function GET() {
  return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } }, { status: 405 });
}

