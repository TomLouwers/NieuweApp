import { NextResponse } from "next/server";

export const runtime = 'nodejs';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'NO_FILE' }, { status: 400 });
    const size = (file as any).size ?? 0;
    if (size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'TOO_LARGE' }, { status: 413 });

    // Basic heuristic defaults; hook up real OCR later
    const name = (file as any).name || 'upload';
    const lower = String(name).toLowerCase();
    let vak = 'Rekenen';
    if (lower.includes('taal') || lower.includes('spelling')) vak = 'Taal';
    if (lower.includes('wereld') || lower.includes('wo')) vak = 'Wereldoriëntatie';
    let groep = 5;
    const m = lower.match(/groep[_-]?(\d)/);
    if (m) groep = clamp(parseInt(m[1], 10) || 5, 1, 8);
    const onderwerp = vak === 'Rekenen' ? 'Vermenigvuldigen' : vak === 'Taal' ? 'Begrijpend lezen' : 'Onderwerp';
    const aantalOpgaven = 10;
    const niveau = 'Midden';
    const opgaven = Array.from({ length: Math.min(10, aantalOpgaven) }, (_, i) => ({ nummer: i + 1, type: vak === 'Rekenen' ? 'calculation' : 'question', tekst: vak === 'Rekenen' ? `${12 + i} × ${2 + (i % 3)} = ___` : `Vraag ${i + 1}: …` }));
    const confidence = 0.65;

    return NextResponse.json({ ok: true, analysis: { vak, onderwerp, groep, aantalOpgaven, niveau, opgaven, confidence } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'INTERNAL', message: e?.message || 'Analyze failed' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: true, message: 'POST multipart/form-data with file' });
}

