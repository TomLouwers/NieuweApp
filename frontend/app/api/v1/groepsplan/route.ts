import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { ok, err, HTTP } from "@/lib/api/respond";
import { getClient } from "@/lib/api/supabase-helpers";
import { requireAuth } from "@/lib/api/auth";

export async function GET(request: Request) {
  // List documents for authenticated user when possible.
  const url = new URL(request.url);
  const authCtx = await requireAuth(request);
  if (authCtx instanceof Response) return authCtx;
  const token = authCtx.token;
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const sort = (url.searchParams.get("sort") || "createdAt").toLowerCase();
  const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const headers = new Headers({ ...applyRateHeaders() });

  const sb = getClient(token);
  if (!sb) return err({ code: "SERVICE_UNAVAILABLE", message: "Database niet beschikbaar" }, HTTP.UNAVAILABLE, { headers });

  try {
    let q = sb.from("documents").select("id, title, metadata, created_at, updated_at");
    q = q.eq("type", "groepsplan");
    if (token) {
      // We cannot reliably get userId without a separate call; assume RLS handles it in Supabase
    }
    // Sorting mapping
    const sortMap: Record<string, string> = { createdat: "created_at", updatedat: "updated_at", title: "title" };
    const sortCol = sortMap[sort] || "created_at";
    q = q.order(sortCol, { ascending: order === "asc" });
    q = q.range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    const total = typeof count === "number" ? count : (data?.length || 0);
    const items = (data || []).map((d: any) => ({
      documentId: d.id,
      title: d.title,
      metadata: d.metadata || {},
      status: (d.metadata?.status || "draft") as string,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      version: d.metadata?.version || 1,
    }));
    return ok({ items, pagination: { total, limit, offset, hasMore: offset + items.length < total } }, { headers });
  } catch (_) {
    return ok({ items: [], pagination: { total: 0, limit, offset, hasMore: false } }, { headers });
  }
}
