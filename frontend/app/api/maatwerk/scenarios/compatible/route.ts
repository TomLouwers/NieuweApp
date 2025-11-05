import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/maatwerk/scenarios";

const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";

const idMap: Record<string, string> = {
  'adhd': 'adhd-concentratie',
  'werkgeheugen': 'slecht-werkgeheugen',
  'begrijpend-lezen-zwak': 'zwakke-begrijpend-lezen',
  'executieve-functies-zwak': 'zwakke-executieve-functies',
  'ruimtelijk-inzicht-zwak': 'slecht-ruimtelijk-inzicht',
  'fijne-motoriek-zwak': 'zwakke-fijne-motoriek',
  'woordenschat-zwak': 'zwakke-woordenschat',
  'motivatie-laag': 'weinig-zelfvertrouwen',
  'frustratie-regulatie': 'boosheid-frustratie',
  'nt2-begin': 'nt2-beginnend',
  'lage-ses': 'weinig-thuissupport',
  'prikkel-concentratie': 'concentratie-prikkels',
};

function normalizeIds(ids: string[]) {
  return ids.map((id) => idMap[id] || id);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get('subject') || '';
  const scenarios = (url.searchParams.get('scenarios') || '').split(',').map(s => s.trim()).filter(Boolean);

  if (TOKEN) {
    try {
      const qs = new URLSearchParams({ subject, scenarios: normalizeIds(scenarios).join(',') });
      const resp = await fetch(`${BASE}/scenarios/compatible?${qs}`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: e?.message || 'Compatibility check failed' } }, { status: 500 });
    }
  }

  // Local evaluation
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const norm = normalizeIds(scenarios);
  const has = (id: string) => norm.includes(id);
  // incompatibilities
  let compatible = true;
  if (has('boven-plus') && has('onder-vi')) { compatible = false; warnings.push('Boven Plus conflicteert met Onder VI'); }
  if (has('hoogbegaafd') && (has('traag-tempo') || has('traag-tempo'))) { compatible = false; warnings.push('Hoogbegaafd conflicteert met Traag werktempo'); }
  // category limit
  const mismatchCount = norm.filter((id) => {
    const def = SCENARIOS.find(s => s.id === id || idMap[s.id] === id);
    return def?.category === 'Niveau-mismatch';
  }).length;
  if (mismatchCount > 1) { compatible = false; warnings.push('Maximaal 1 scenario uit Niveau-mismatch per generatie'); }
  // subject restrictions
  if (has('dyscalculie') && subject !== 'Rekenen') { compatible = false; warnings.push('Dyscalculie alleen voor Rekenen'); }
  if (has('slecht-ruimtelijk-inzicht') && !(subject === 'Rekenen' || subject === 'Wereldoriëntatie')) { compatible = false; warnings.push('Slecht ruimtelijk inzicht alleen Rekenen of Wereldoriëntatie'); }

  return NextResponse.json({
    requested_scenarios: scenarios,
    compatible,
    can_combine: compatible,
    warnings,
    suggestions,
  });
}

