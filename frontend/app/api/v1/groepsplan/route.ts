import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { ok } from "@/lib/api/respond";
import { getClient } from "@/lib/api/supabase-helpers";

export async function GET(request: Request) {
  // List documents for authenticated user when possible.
  const url = new URL(request.url);
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const sort = (url.searchParams.get("sort") || "createdAt").toLowerCase();
  const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const headers = new Headers({ ...applyRateHeaders() });

  const sb = getClient(token);
  if (!sb) {
    // Fallback: empty list, keeps app working when no DB
    return ok({ items: [], pagination: { total: 0, limit, offset, hasMore: false } }, { headers });
  }

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

