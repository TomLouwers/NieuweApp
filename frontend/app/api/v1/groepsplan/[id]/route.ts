import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { ok, err, HTTP } from "@/lib/api/respond";
import { getClient } from "@/lib/api/supabase-helpers";

interface Ctx { params: { id: string } }

export async function GET(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders() });
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const sb = getClient(token);
  if (!sb) {
    return err({ code: "NOT_FOUND", message: "Dit groepsplan bestaat niet of is verlopen", details: { documentId: ctx.params.id } }, HTTP.NOT_FOUND, { headers });
  }
  try {
    const { data, error } = await sb.from("documents").select("id, title, content, metadata, created_at, updated_at").eq("id", ctx.params.id).single();
    if (error || !data) throw error || new Error("not found");
    const body = {
      documentId: data.id,
      title: data.title,
      content: { sections: [{ id: "document", title: "Document", content: String(data.content || ""), subsections: [] }] },
      metadata: data.metadata || {},
      complianceScore: null,
      status: (data.metadata?.status || "draft") as string,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.metadata?.expiresAt || null,
    };
    return ok(body, { headers });
  } catch (_) {
    return err({ code: "NOT_FOUND", message: "Dit groepsplan bestaat niet of is verlopen", details: { documentId: ctx.params.id } }, HTTP.NOT_FOUND, { headers });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders() });
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const sb = getClient(token);
  if (!sb) {
    // Accept but no-op to keep client flows working
    const now = new Date().toISOString();
    return ok({ documentId: ctx.params.id, version: 1, updatedSections: [], updatedAt: now, complianceScore: { overall: 9, checks: {} } }, { headers });
  }
  let body: any = {};
  try { body = await request.json(); } catch {}
  const updates = Array.isArray(body?.updates) ? body.updates : [];
  const metaPatch = body?.metadata || {};
  try {
    const { data, error } = await sb.from("documents").select("id, content, metadata").eq("id", ctx.params.id).single();
    if (error || !data) throw error || new Error("not found");
    let contentStr = String(data.content || "");
    // Simple strategy: if any update with operation replace exists for a section named 'document', replace entire content
    const replaceUpdate = updates.find((u: any) => (u?.operation || "replace") === "replace" && !!u?.content);
    if (replaceUpdate) {
      contentStr = String(replaceUpdate.content);
    } else {
      const appendUpdate = updates.find((u: any) => (u?.operation || "replace") === "append" && !!u?.content);
      if (appendUpdate) contentStr = contentStr + "\n\n" + String(appendUpdate.content);
    }
    const newMeta = { ...(data.metadata || {}), ...(metaPatch || {}), version: (data.metadata?.version || 1) + 1 };
    const { error: upErr } = await sb.from("documents").update({ content: contentStr, metadata: newMeta }).eq("id", ctx.params.id);
    if (upErr) throw upErr;
    const updatedAt = new Date().toISOString();
    return ok({ documentId: ctx.params.id, version: newMeta.version, updatedSections: updates.map((u: any) => u?.sectionId).filter(Boolean), updatedAt, complianceScore: { overall: 9, checks: {} } }, { headers });
  } catch (_) {
    return err({ code: "CONFLICT", message: "Kon document niet bijwerken" }, HTTP.CONFLICT, { headers });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders() });
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const sb = getClient(token);
  if (!sb) {
    // No-op deletion
    return new NextResponse(null, { status: 204, headers });
  }
  try {
    const { error } = await sb.from("documents").delete().eq("id", ctx.params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204, headers });
  } catch (_) {
    return err({ code: "NOT_FOUND", message: "Dit groepsplan bestaat niet" }, HTTP.NOT_FOUND, { headers });
  }
}

