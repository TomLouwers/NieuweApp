import { ok, err, HTTP } from "@/lib/api/respond";
import { applyRateHeaders } from "@/lib/api/rate-limit";
import { getClient } from "@/lib/api/supabase-helpers";

interface Ctx { params: { id: string } }

export async function POST(request: Request, ctx: Ctx) {
  const headers = new Headers({ ...applyRateHeaders() });
  let body: any = {};
  try { body = await request.json(); } catch {}
  const sectionId = typeof body?.sectionId === "string" ? body.sectionId : undefined;
  const instruction = typeof body?.instruction === "string" ? body.instruction : "";
  if (!instruction || instruction.length > 200) {
    return err({ code: "VALIDATION_ERROR", message: "instruction is verplicht (max 200 tekens)" }, HTTP.BAD_REQUEST, { headers });
  }

  // Try to load original content best-effort (optional)
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const sb = getClient(token);
  let originalContent = "";
  try {
    if (sb) {
      const { data } = await sb.from("documents").select("content").eq("id", ctx.params.id).single();
      originalContent = typeof data?.content === "string" ? data.content : JSON.stringify(data?.content ?? "");
    }
  } catch {}

  // Very simple refinement mock: prepend a note and echo instruction
  const refined = `// Refine: ${instruction}\n\n` + originalContent;
  const changes = [
    { type: "addition", description: "Toegevoegd: samenvatting van de instructie en context" },
  ];
  return ok({ refinedContent: refined, sectionId: sectionId || null, originalContent, changes, applied: false }, { headers });
}

