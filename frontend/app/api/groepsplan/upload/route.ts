import { NextResponse } from "next/server";
import { createClient, getUserFromToken } from "@/lib/supabase.js";

const ACCEPT = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function validExt(name: string) {
  const lower = name.toLowerCase();
  for (const ext of ACCEPT) if (lower.endsWith(ext)) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const ct = request.headers.get("content-type") || "";
    if (!/multipart\/form-data/i.test(ct)) {
      return NextResponse.json({ ok: false, error: "Invalid content type" }, { status: 400 });
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Bestand ontbreekt" }, { status: 400 });
    }
    const name = file.name || "upload";
    if (!validExt(name)) {
      return NextResponse.json({ ok: false, error: "Ongeldig bestandstype", code: "invalid_format" }, { status: 400 });
    }
    // Size check
    const size = file.size || 0;
    if (size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Bestand te groot", code: "too_large" }, { status: 413 });
    }
    const id = `doc_${Math.random().toString(36).slice(2, 10)}`;
    const mime = file.type || "application/octet-stream";

    // Attempt persistence to Supabase (storage + documents table)
    let stored = false;
    let storagePath = "";
    let userId: string | null = null;
    try {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
      const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";

      // Identify user (optional)
      if (token) {
        try {
          const { user } = await getUserFromToken(token);
          userId = user?.id || null;
        } catch {}
      }

      const supabase = createClient(undefined, undefined, token ? { accessToken: token } : {} as any);
      const bucket = process.env.SUPABASE_UPLOADS_BUCKET || "uploads";
      const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      storagePath = `${userId || "anon"}/${today}/${id}-${safeName}`;

      const buf = Buffer.from(await file.arrayBuffer());
      const up = await supabase.storage.from(bucket).upload(storagePath, buf, {
        contentType: mime,
        upsert: false,
      });
      if (up?.error) throw up.error;

      const insert = {
        user_id: userId,
        type: "upload",
        title: name,
        content: "",
        metadata: { filename: name, size, mime, storagePath, bucket },
      } as any;
      const { data, error: dbError } = await supabase.from("documents").insert(insert).select("id").single();
      if (dbError) throw dbError;
      if (data?.id) {
        return NextResponse.json({ ok: true, id: data.id, filename: name, size, mime, storagePath }, { status: 200 });
      }
      stored = true;
    } catch (_) {
      // Ignore persistence errors; fall back to ephemeral id
      stored = false;
    }

    // Placeholder extraction (mock)
    const extractedData = (() => {
      // naive guess group number from filename e.g., groep5, g5, groep-5
      const m = /groep[^0-9]?([1-8])/i.exec(name) || /g([1-8])/i.exec(name);
      const groep = m ? Number(m[1]) : null;
      return { groep };
    })();

    return NextResponse.json({ ok: true, id, filename: name, size, mime, storagePath, stored, extractedData }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Upload mislukt" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
