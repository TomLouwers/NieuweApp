import { NextResponse } from "next/server";

const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";
const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";

import { getJob } from "@/lib/maatwerk/localJobs";

export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId;
  if (TOKEN && !jobId.startsWith("local_")) {
    try {
      const resp = await fetch(`${BASE}/worksheets/generate/${encodeURIComponent(jobId)}/status`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: e?.message || 'Status poll failed' } }, { status: 500 });
    }
  }

  // Local dev fallback: instantly completed with simple worksheet stubs
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown job' } }, { status: 404 });
  }
  const { scenarios = [], context = {} } = job.body || {};
  const worksheets = (Array.isArray(scenarios) ? scenarios : []).map((sid: string, i: number) => ({
    worksheet_id: `ws_${jobId}_${i + 1}`,
    scenario_id: sid,
    scenario_label: sid,
    context,
    source: 'manual',
    files: {
      worksheet_pdf: '#',
      answer_key_pdf: '#',
      teaching_notes_pdf: undefined,
    },
    metadata: {
      generation_time_ms: 1500,
      quality_score: 8.0,
      exercise_count: 6,
      regeneration_count: 0,
      download_count: 0,
    },
    created_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
    is_favorite: false,
    tags: [],
  }));
  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
    progress: 1.0,
    completed_at: new Date().toISOString(),
    duration_seconds: 2,
    worksheets,
    batch_download_url: '#'
  });
}
