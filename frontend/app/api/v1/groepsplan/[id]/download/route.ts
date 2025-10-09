import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";

interface Ctx { params: { id: string } }

export async function GET(request: Request, ctx: Ctx) {
  // Proxy to existing download route to keep current behavior
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "http");
  const base = `${proto}://${host}`;
  const target = `${base}/api/groepsplan/${encodeURIComponent(ctx.params.id)}/download${url.search || ""}`;
  const resp = await fetch(target, { method: "GET" });
  const buf = await resp.arrayBuffer();
  const outHeaders = new Headers({ ...applyRateHeaders(), "content-type": resp.headers.get("content-type") || "application/octet-stream" });
  const cd = resp.headers.get("content-disposition");
  if (cd) outHeaders.set("content-disposition", cd);
  return new NextResponse(buf, { status: resp.status, headers: outHeaders });
}

