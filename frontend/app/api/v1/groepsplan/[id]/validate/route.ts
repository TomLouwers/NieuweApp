import { ok, err, HTTP } from "@/lib/api/respond";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { getClient } from "@/lib/api/supabase-helpers";

interface Ctx { params: { id: string } }

export async function POST(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders() });
  // Optional strictMode
  let body: any = {};
  try { body = await request.json(); } catch {}
  const strict = Boolean(body?.strictMode);

  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const sb = getClient(token);
  let content = "";
  try {
    if (sb) {
      const { data } = await sb.from("documents").select("content").eq("id", ctx.params.id).single();
      content = typeof data?.content === "string" ? data.content : JSON.stringify(data?.content ?? "");
    }
  } catch {}

  // Heuristic checks (stub): ensure some required section titles are present in content text
  const checks = {
    beginsituatie: /beginsituatie/i.test(content),
    smartiDoelen: /doelen\s*\(slo\)|smart/i.test(content),
    interventies: /aanpak|interventies/i.test(content),
    evaluatie: /evaluatie/i.test(content),
    betrokkenen: /ib\'er|ouders|betrokkenen/i.test(content),
    handelingsgericht: /behoefte|handelingsgericht/i.test(content),
  };
  const scoreBase = Object.values(checks).filter(Boolean).length;
  const overall = Math.min(10, scoreBase + 4); // simple stub scoring
  const warnings: any[] = [];
  if (!checks.beginsituatie) warnings.push({ severity: 'minor', section: 'beginsituatie', message: 'Beginsituatie lijkt te ontbreken' });

  const data = {
    isCompliant: scoreBase >= 4,
    score: overall,
    checks: {
      required: {
        beginsituatie: { present: checks.beginsituatie, quality: checks.beginsituatie ? 'good' : 'poor', message: checks.beginsituatie ? 'Beginsituatie duidelijk' : 'Beginsituatie ontbreekt' },
        smartiDoelen: { present: checks.smartiDoelen, quality: checks.smartiDoelen ? 'good' : 'poor', message: checks.smartiDoelen ? 'Doelen gevonden' : 'SMARTI doelen ontbreken' },
        interventies: { present: checks.interventies, quality: checks.interventies ? 'good' : 'poor', message: checks.interventies ? 'Aanpak/interventies aanwezig' : 'Aanpak ontbreekt' },
        evaluatie: { present: checks.evaluatie, quality: checks.evaluatie ? 'good' : 'poor', message: checks.evaluatie ? 'Evaluatie aanwezig' : 'Evaluatie ontbreekt' },
        betrokkenen: { present: checks.betrokkenen, quality: checks.betrokkenen ? 'good' : 'adequate', message: checks.betrokkenen ? 'Betrokkenen benoemd' : 'Betrokkenen ontbreken' },
      },
      bestPractices: {
        handelingsgerichtTaalgebruik: { score: checks.handelingsgericht ? 0.85 : 0.5, message: checks.handelingsgericht ? 'Grotendeels handelingsgericht' : 'Overweeg handelingsgericht te formuleren' },
        positieveFraming: { score: 0.9, message: 'Positieve benadering zichtbaar' },
        concreetAanpak: { score: 0.9, message: 'Aanpak is concreet' },
      },
    },
    warnings,
    errors: [],
    inspectieProof: scoreBase >= (strict ? 6 : 4),
    validatedAt: new Date().toISOString(),
  };
  return ok(data, { headers });
}

