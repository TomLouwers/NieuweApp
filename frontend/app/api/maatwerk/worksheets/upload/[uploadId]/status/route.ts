import { NextResponse } from "next/server";
const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";
const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
import { getUpload, updateUpload } from "@/lib/maatwerk/localUploads";

export async function GET(_req: Request, { params }: { params: { uploadId: string } }) {
  const uploadId = params.uploadId;
  if (TOKEN && !uploadId.startsWith('upl_')) {
    try {
      const resp = await fetch(`${BASE}/worksheets/upload/${encodeURIComponent(uploadId)}/status`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: e?.message || 'Status failed' } }, { status: 500 });
    }
  }

  const u = getUpload(uploadId);
  if (!u) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown upload' } }, { status: 404 });

  if (u.stage === 'analysis') {
    // Simulate awaiting validation with recognized content
    const recognized_content = {
      vak: 'Rekenen', onderwerp: 'Vermenigvuldigen', groep: 5, groep_confidence: 0.8,
      niveau: 'Midden', aantal_opgaven: 10,
      opgaven_preview: [
        { nummer: 1, type: 'calculation', tekst: '12 × 3 = ___', confidence: 0.95 },
        { nummer: 2, type: 'word_problem', tekst: 'Tim heeft 4 zakken met elk 5 knikkers. Hoeveel?', confidence: 0.9 }
      ],
      metode_detected: undefined, methode_confidence: undefined, page_number: undefined,
      ocr_quality: 'good', overall_confidence: 0.85,
    } as any;
    updateUpload(uploadId, { stage: 'awaiting_validation', recognized: recognized_content });
    return NextResponse.json({
      upload_id: uploadId,
      status: 'awaiting_validation',
      current_step: 'analysis',
      progress: 0.6,
      steps: { upload: 'completed', ocr: 'completed', analysis: 'completed', generation: 'awaiting_validation' },
      recognized_content,
      validation_required: true,
      validation_url: `/api/maatwerk/worksheets/upload/${uploadId}/validate`,
    });
  }

  if (u.stage === 'generating') {
    // Advance to completed
    const worksheets = (u.worksheets && u.worksheets.length ? u.worksheets : [
      { worksheet_id: `ws_${uploadId}_1`, scenario_id: 'dyslexie', scenario_label: 'Dyslexie', source: 'photo_adaptation', files: { worksheet_pdf: '#', answer_key_pdf: '#', comparison_pdf: '#' } },
      { worksheet_id: `ws_${uploadId}_2`, scenario_id: 'traag-tempo', scenario_label: 'Traag werktempo', source: 'photo_adaptation', files: { worksheet_pdf: '#', answer_key_pdf: '#', comparison_pdf: '#' } }
    ]);
    updateUpload(uploadId, { stage: 'completed', worksheets });
    return NextResponse.json({
      upload_id: uploadId,
      status: 'completed', progress: 1.0,
      steps: { upload: 'completed', ocr: 'completed', analysis: 'completed', generation: 'completed' },
      original_image_url: '#',
      recognized_content: u.recognized || null,
      worksheets,
      batch_download_url: '#',
      completed_at: new Date().toISOString(),
      total_duration_seconds: Math.round((Date.now() - (u.createdAt || Date.now()))/1000)
    });
  }

  // awaiting_validation remains
  return NextResponse.json({
    upload_id: uploadId,
    status: 'awaiting_validation',
    current_step: 'analysis',
    progress: 0.6,
    steps: { upload: 'completed', ocr: 'completed', analysis: 'completed', generation: 'awaiting_validation' },
    recognized_content: u.recognized || null,
    validation_required: true,
    validation_url: `/api/maatwerk/worksheets/upload/${uploadId}/validate`,
  });
}

