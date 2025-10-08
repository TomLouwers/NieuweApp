import { NextResponse } from "next/server";

const ACCEPT = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);

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
      return NextResponse.json({ ok: false, error: "Ongeldig bestandstype" }, { status: 400 });
    }
    // We do not persist; just simulate an id
    const id = `doc_${Math.random().toString(36).slice(2, 10)}`;
    const size = file.size || 0;
    const mime = file.type || "application/octet-stream";
    return NextResponse.json({ ok: true, id, filename: name, size, mime }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Upload mislukt" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
