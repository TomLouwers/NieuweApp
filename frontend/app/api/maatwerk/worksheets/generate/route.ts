import { NextResponse } from "next/server";

const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";
const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
import { setJob } from "@/lib/maatwerk/localJobs";
import { buildSLOWerkbladContext } from "@/src/ai/slo/worksheet";

export async function POST(req: Request) {
  let json: any = {};
  try { json = await req.json(); } catch {}
  const { scenarios, context, options } = json || {};

  // Enrich context with SLO (non-fatal)
  let enrichedContext = context || {};
  try {
    const g = Number(context?.groep);
    const v = String(context?.vak || '').toLowerCase();
    const onderwerp = String(context?.onderwerp || '');
    if (Number.isFinite(g) && g >= 1 && g <= 8 && v) {
      const slo = await buildSLOWerkbladContext({ groep: g, vak: v, onderwerp });
      if (slo) enrichedContext = { ...context, slo_werkblad_context: slo };
    }
  } catch {}

  if (TOKEN) {
    try {
      const resp = await fetch(`${BASE}/worksheets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ scenarios, context: enrichedContext, options })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return NextResponse.json({ ok: false, error: data?.error || 'GENERATION_START_FAILED' }, { status: resp.status });
      }
      // Expect job_id + status_url
      return NextResponse.json({ ok: true, job_id: data.job_id, status_url: data.status_url, estimated_time_seconds: data.estimated_time_seconds ?? 30 });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR', message: e?.message || 'Generation start failed' }, { status: 500 });
    }
  }

  // Local dev fallback: create a pseudo job and let status return completed
  const jobId = `local_${Math.random().toString(36).slice(2, 10)}`;
  setJob({ id: jobId, createdAt: Date.now(), body: { scenarios, context: enrichedContext, options } });
  const statusUrl = `/api/maatwerk/worksheets/generate/${jobId}/status`;
  return NextResponse.json({ ok: true, job_id: jobId, status_url: statusUrl, estimated_time_seconds: 2 });
}
