import { sloResolver } from '@/src/services/sloContextResolver';

function esc(txt: any): string { return String(txt ?? '').replace(/[<>]/g, ''); }

function mapVakToKey(vak: string): string | null {
  const v = vak.toLowerCase();
  if (v.includes('reken')) return 'rekenen_automatiseren';
  if (v.includes('spelling')) return 'spelling';
  if (v.includes('begrijpend')) return 'begrijpend_lezen';
  if (v.includes('technisch')) return 'technisch_lezen';
  if (v.includes('schrijf')) return 'schrijven';
  return null;
}

export async function buildSLOWerkbladContext(params: { groep: number; vak: string; onderwerp: string }): Promise<string> {
  const groep = Number(params.groep);
  const vak = String(params.vak || '');
  const onderwerp = String(params.onderwerp || '');
  if (!Number.isFinite(groep) || groep < 1 || groep > 8 || !vak) return '';
  try {
    const key = mapVakToKey(vak);
    if (!key) return '';
    const ctx = await sloResolver.getContextForGroepVak(groep, key);
    if (!ctx || (!ctx.kerndoelen.length && !ctx.inhoudslijnen.length)) return '';
    const fase = ctx.fase ? String(ctx.fase) : '';
    const kd = ctx.kerndoelen.map(k => (
      `    <kerndoel code="${esc(k.code)}">\n` +
      `      <naam>${esc(k.titel)}</naam>\n` +
      `      <wat_leerling_leert>${esc(k.doelzin)}</wat_leerling_leert>\n` +
      `      <relevant_voor_onderwerp>${esc(onderwerp)}</relevant_voor_onderwerp>\n` +
      `    </kerndoel>`
    )).join('\n');

    const doelen = (ctx.inhoudslijnen || []).map(l => {
      const f = (l.fases || []).find(x => String(x.fase_nummer) === String(ctx.fase));
      if (!f) return '';
      const ad = (f.aanbodsdoelen || []).slice(0, 4).map(d => (
        `    <aanbodsdoel>\n` +
        `      <wat>${esc(d.beschrijving)}</wat>\n` +
        (d.voorbeelden?.length ? `      <voorbeelden>${esc(d.voorbeelden)}</voorbeelden>\n` : '') +
        `    </aanbodsdoel>`
      )).join('\n');
      return ad;
    }).filter(Boolean).join('\n');

    const xml = [
      '<slo_werkblad_context>',
      '  <onderwerp_mapping>',
      `    Groep: ${esc(groep)}`,
      `    Vak: ${esc(vak)}`,
      `    Onderwerp: ${esc(onderwerp)}`,
      `    Fase: ${esc(fase)}`,
      '  </onderwerp_mapping>',
      '  <relevante_kerndoelen>',
      kd,
      '  </relevante_kerndoelen>',
      '  <aanbodsdoelen_deze_fase>',
      doelen,
      '  </aanbodsdoelen_deze_fase>',
      '</slo_werkblad_context>'
    ].join('\n');
    return xml;
  } catch {
    return '';
  }
}
