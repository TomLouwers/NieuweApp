import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "http");
  const base = `${proto}://${host}`;

  let body: any = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const bypass = request.headers.get("x-vercel-protection-bypass");
  if (auth) headers["Authorization"] = auth;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;

  const target = `${base}/api/generate-groepsplan${url.search || ""}`;
  const resp = await fetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const text = await resp.text();
  const outHeaders = new Headers({ "content-type": resp.headers.get("content-type") || "application/json" });
  const retryAfter = resp.headers.get("retry-after");
  if (retryAfter) outHeaders.set("retry-after", retryAfter);
  return new NextResponse(text, { status: resp.status, headers: outHeaders });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
