import { NextResponse } from "next/server";
const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";
const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
import { setUpload } from "@/lib/maatwerk/localUploads";

export async function POST(req: Request) {
  // Proxy to Pebble if configured
  if (TOKEN) {
    try {
      const form = await req.formData();
      const fd = new FormData();
      for (const [k, v] of form.entries()) {
        fd.append(k, v as any);
      }
      const resp = await fetch(`${BASE}/worksheets/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        body: fd as any,
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: e?.message || 'Upload failed' } }, { status: 500 });
    }
  }

  // Local fallback: create upload and return 202
  const id = `upl_${Math.random().toString(36).slice(2, 10)}`;
  setUpload({ id, createdAt: Date.now(), stage: 'analysis' });
  const status_url = `/api/maatwerk/worksheets/upload/${id}/status`;
  return NextResponse.json({
    upload_id: id,
    status: 'processing',
    steps: { upload: 'completed', ocr: 'processing', analysis: 'pending', generation: 'pending' },
    estimated_time_seconds: 5,
    status_url,
  }, { status: 202 });
}

