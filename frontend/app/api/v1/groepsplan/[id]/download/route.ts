import { NextResponse } from "next/server";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { err, HTTP } from "@/lib/api/respond";
import { getClient } from "@/lib/api/supabase-helpers";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

interface Ctx { params: { id: string } }

function boolParam(v: string | null, d = false): boolean { if (!v) return d; return v === "1" || v.toLowerCase() === "true"; }

function sanitizeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9_\-\.]+/g, "_");
}

export async function GET(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders(), "Cache-Control": "public, max-age=3600" });
  const url = new URL(request.url);
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;

  const format = (url.searchParams.get("format") || "docx").toLowerCase();
  const template = (url.searchParams.get("template") || "default").toLowerCase();
  const includeMetadata = boolParam(url.searchParams.get("includeMetadata"), false);
  const strictMode = boolParam(url.searchParams.get("strictMode"), false);

  // Load document from Supabase (best-effort)
  const sb = getClient(token);
  if (!sb) {
    return err({ code: "NOT_FOUND", message: "Dit groepsplan bestaat niet" }, HTTP.NOT_FOUND, { headers });
  }

  let row: any = null;
  try {
    const { data, error } = await sb.from("documents").select("id, title, content, metadata").eq("id", ctx.params.id).single();
    if (error || !data) throw error || new Error("not found");
    row = data;
  } catch (_) {
    return err({ code: "NOT_FOUND", message: "Dit groepsplan bestaat niet" }, HTTP.NOT_FOUND, { headers });
  }

  const meta = row?.metadata || {};
  const groep = meta?.groep ?? meta?.metadata?.groep ?? null;
  const vakgebied = meta?.vakgebied ?? meta?.metadata?.vak ?? null;
  const periode = meta?.periode ?? meta?.metadata?.periode ?? null;
  const year = new Date().getFullYear();
  const vakTitle = vakgebied ? String(vakgebied).replace(/_/g, " ") : "Vak";
  const periodLabel = typeof periode === "string" ? periode : (periode?.label || "Periode");
  const filenameBase = `Groepsplan_Groep${groep ?? "_"}_${vakTitle}_${periodLabel}_${year}`;

  // Try cached export in Supabase storage
  const bucket = process.env.SUPABASE_EXPORTS_BUCKET || "exports";
  const cacheKeyRaw = JSON.stringify({ doc: row.id, format, template, includeMetadata, strictMode });
  const cacheKey = `${row.id}/${format}/${Buffer.from(cacheKeyRaw).toString("base64url")}`;

  async function tryDownloadCache() {
    try {
      const dl = await sb.storage.from(bucket).download(cacheKey);
      if ((dl as any)?.data) {
        const ab = await (dl as any).data.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch {}
    return null;
  }

  let cached = await tryDownloadCache();
  if (cached) {
    const { headers: h } = buildHeadersForFormat(format, `${sanitizeFilename(filenameBase)}.${format}`);
    for (const [k, v] of Object.entries(h)) headers.set(k, v);
    return new NextResponse(new Uint8Array(cached), { status: 200, headers });
  }

  // Build export from content
  const contentText = typeof row.content === "string" ? row.content : JSON.stringify(row.content ?? "");
  let buffer: Buffer;
  if (format === "docx") {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: row.title || `Groepsplan Groep ${groep ?? "?"} - ${vakTitle}`, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: contentText }),
            ...(includeMetadata ? [
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Metadata:", heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: JSON.stringify(meta) }),
            ] : []),
          ],
        },
      ],
    });
    const buf = await Packer.toBuffer(doc);
    buffer = Buffer.from(buf);
  } else if (format === "html") {
    const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>${escapeHtml(row.title || filenameBase)}</title></head><body><h1>${escapeHtml(row.title || filenameBase)}</h1><pre>${escapeHtml(contentText)}</pre>${includeMetadata ? `<hr><h2>Metadata</h2><pre>${escapeHtml(JSON.stringify(meta, null, 2))}</pre>` : ""}</body></html>`;
    buffer = Buffer.from(html, "utf-8");
  } else if (format === "pdf") {
    // Placeholder minimal PDF (valid but simple)
    const minimalPDF = `%PDF-1.1\n1 0 obj<<>>endobj\n2 0 obj<<>>endobj\n3 0 obj<</Type /Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 72 720 Td (${escapePdf("Groepsplan export (placeholder)")}) Tj ET\nendstream endobj\n5 0 obj<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>endobj\n6 0 obj<</Type /Pages /Kids[3 0 R]/Count 1>>endobj\n7 0 obj<</Type /Catalog /Pages 6 0 R>>endobj\nxref\n0 8\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000096 00000 n \n0000000203 00000 n \n0000000398 00000 n \n0000000480 00000 n \n0000000536 00000 n \ntrailer<</Size 8/Root 7 0 R>>\nstartxref\n598\n%%EOF`;
    buffer = Buffer.from(minimalPDF, "binary");
  } else {
    return err({ code: "VALIDATION_ERROR", message: "Unsupported format" }, HTTP.BAD_REQUEST, { headers });
  }

  // Upload to cache (best-effort)
  try {
    const contentType = buildHeadersForFormat(format, "").headers["Content-Type"];
    await sb.storage.from(bucket).upload(cacheKey, buffer, { contentType, upsert: true });
  } catch {}

  const { headers: h } = buildHeadersForFormat(format, `${sanitizeFilename(filenameBase)}.${format}`);
  for (const [k, v] of Object.entries(h)) headers.set(k, v);
  return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
}

function buildHeadersForFormat(format: string, filename: string) {
  if (format === "docx") {
    return { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=${filename}`,
    } };
  }
  if (format === "pdf") {
    return { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}`,
    } };
  }
  return { headers: {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Disposition": `attachment; filename=${filename}`,
  } };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);
}

function escapePdf(s: string) {
  return s.replace(/[()\\]/g, (c) => (c === "(" ? "\\(" : c === ")" ? "\\)" : "\\\\"));
}
