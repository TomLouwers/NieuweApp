import { ok, err, HTTP } from "@/lib/api/respond";
import { applyRateHeaders } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const headers = new Headers({ ...applyRateHeaders() });
  const url = new URL(request.url);
  const groep = parseInt(url.searchParams.get("groep") || "", 10);
  const vakgebied = url.searchParams.get("vakgebied") || "";
  const type = url.searchParams.get("type") || "";
  if (!groep || !vakgebied || !type) {
    return err({ code: "VALIDATION_ERROR", message: "groep, vakgebied en type zijn verplicht" }, HTTP.BAD_REQUEST, { headers });
  }
  // Stub: return 5 suggestions based on inputs
  const baseId = `${String(vakgebied).replace(/\s+/g, '_').toLowerCase()}_${groep}`;
  const mk = (i: number) => ({ id: `${type}-${baseId}-${i}`, text: suggestText(type, groep, vakgebied, i), popularity: Math.max(0.5, 0.95 - i * 0.05), usedBy: 100 + i * 15, tags: ["SMARTI", baseId, type] });
  const suggestions = [mk(1), mk(2), mk(3), mk(4), mk(5)];
  const data = { suggestions, context: { groep, vakgebied, type, totalSuggestions: suggestions.length } };
  return ok(data, { headers });
}

function suggestText(type: string, groep: number, vak: string, i: number) {
  if (type === 'goals') return `${90 - i * 2}% van de basisgroep beheerst ${vak} op D-niveau (groep ${groep})`;
  if (type === 'interventions') return `Voeg 2x per week gerichte ${vak}-interventies toe (groep ${groep})`;
  if (type === 'challenges') return `Typische uitdaging ${i}: differentiatie in ${vak} (groep ${groep})`;
  return `Suggestie ${i} voor ${vak} (groep ${groep})`;
}

