import { NextResponse } from "next/server";

export const runtime = 'nodejs';

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const ab = await (file as any).arrayBuffer();
  const bstr = Buffer.from(ab).toString('base64');
  // Map common types; default to image/jpeg if unknown
  let mediaType = (file as any).type || 'image/jpeg';
  if (!/^image\//.test(mediaType)) {
    if ((file as any).name?.toLowerCase().endsWith('.png')) mediaType = 'image/png';
    else if ((file as any).name?.toLowerCase().endsWith('.jpg') || (file as any).name?.toLowerCase().endsWith('.jpeg')) mediaType = 'image/jpeg';
    else if ((file as any).name?.toLowerCase().endsWith('.heic')) mediaType = 'image/heic';
  }
  return { data: bstr, mediaType };
}

function extractJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  // Fallback: find first { ... }
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return null;
}

async function analyzeWithAnthropic(file: File) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  if (!key) return null;
  const { data, mediaType } = await fileToBase64(file);
  // Only support images for now; PDFs fall back
  if (!/^image\//.test(mediaType)) return null;
  const payload = {
    model,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text:
`Analyze this Dutch primary school worksheet image.
Extract and return ONLY valid JSON with fields:
{"vak":"Rekenen|Taal|Spelling|Begrijpend lezen|Schrijven|Wereldoriëntatie","onderwerp":"string","groep":1,"aantalOpgaven":10,"niveau":"VI|Midden|Plus","opgaven":[{"nummer":1,"type":"calculation|word|fill|question","tekst":"..."}],"confidence":0.0}
Rules: Use Dutch labels. groep 1-8. aantalOpgaven 1-50. confidence 0.0-1.0.
` }
        ]
      }
    ]
  } as any;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) return null;
  const json = await resp.json().catch(() => ({}));
  const text = String(json?.content?.[0]?.text || '');
  const parsed = extractJson(text);
  if (!parsed) return null;
  return parsed;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'NO_FILE' }, { status: 400 });
    const size = (file as any).size ?? 0;
    if (size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'TOO_LARGE' }, { status: 413 });

    // Anthropic Vision if configured and image
    let analysis: any = null;
    try { analysis = await analyzeWithAnthropic(file); } catch {}
    if (analysis && analysis.vak && analysis.groep) {
      // Basic clamp/cleanup
      const groep = clamp(Number(analysis.groep) || 5, 1, 8);
      const aantalOpgaven = clamp(Number(analysis.aantalOpgaven) || 10, 1, 50);
      const vak = String(analysis.vak || 'Rekenen');
      const onderwerp = String(analysis.onderwerp || (vak === 'Rekenen' ? 'Vermenigvuldigen' : 'Onderwerp'));
      const niveau = String(analysis.niveau || 'Midden');
      const opgaven = Array.isArray(analysis.opgaven) ? analysis.opgaven.slice(0, 20).map((o: any, i: number) => ({ nummer: Number(o.nummer) || (i + 1), type: String(o.type || 'question'), tekst: String(o.tekst || '') })) : [];
      const confidence = clamp(Number(analysis.confidence) || 0.75, 0, 1);
      const recognized_content = {
        vak, onderwerp, groep,
        groep_confidence: confidence,
        niveau,
        aantal_opgaven: aantalOpgaven,
        opgaven_preview: opgaven.map((o: any) => ({ nummer: o.nummer, type: o.type, tekst: o.tekst, confidence })),
        methode_detected: undefined,
        methode_confidence: undefined,
        page_number: undefined,
        ocr_quality: confidence > 0.8 ? 'good' : confidence > 0.6 ? 'fair' as const : 'poor',
        overall_confidence: confidence,
      } as const;
      return NextResponse.json({ ok: true, recognized_content, analysis: { vak, onderwerp, groep, aantalOpgaven, niveau, opgaven, confidence }, source: 'anthropic' });
    }

    // Fallback heuristic
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
    const recognized_content = {
      vak, onderwerp, groep,
      groep_confidence: 0.6,
      niveau,
      aantal_opgaven: aantalOpgaven,
      opgaven_preview: opgaven.map((o) => ({ ...o, confidence: 0.6 })),
      methode_detected: undefined,
      methode_confidence: undefined,
      page_number: undefined,
      ocr_quality: 'fair' as const,
      overall_confidence: confidence,
    };
    return NextResponse.json({ ok: true, recognized_content, analysis: { vak, onderwerp, groep, aantalOpgaven, niveau, opgaven, confidence }, source: 'fallback' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'INTERNAL', message: e?.message || 'Analyze failed' }, { status: 500 });
  }
}

export function GET() { return NextResponse.json({ ok: true, message: 'POST multipart/form-data with file' }); }
