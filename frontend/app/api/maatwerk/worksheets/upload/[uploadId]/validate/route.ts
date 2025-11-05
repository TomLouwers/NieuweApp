import { NextResponse } from "next/server";
const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";
const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
import { getUpload, updateUpload } from "@/lib/maatwerk/localUploads";

export async function POST(req: Request, { params }: { params: { uploadId: string } }) {
  const uploadId = params.uploadId;
  if (TOKEN && !uploadId.startsWith('upl_')) {
    try {
      const body = await req.text();
      const resp = await fetch(`${BASE}/worksheets/upload/${encodeURIComponent(uploadId)}/validate`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: e?.message || 'Validate failed' } }, { status: 500 });
    }
  }

  const u = getUpload(uploadId);
  if (!u) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown upload' } }, { status: 404 });
  // Accept corrections (ignored in stub) and move to generating
  updateUpload(uploadId, { stage: 'generating' });
  const status_url = `/api/maatwerk/worksheets/upload/${uploadId}/status`;
  return NextResponse.json({ upload_id: uploadId, status: 'generating', message: 'Recognition validated. Starting worksheet generation.', status_url }, { status: 202 });
}

