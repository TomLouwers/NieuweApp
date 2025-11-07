import { sloResolver } from '@/src/services/sloContextResolver';

function esc(txt?: string | string[]): string {
  if (Array.isArray(txt)) return txt.join('; ').replace(/[<>]/g, '');
  return String(txt || '').replace(/[<>]/g, '');
}

export async function buildSLOGroepsplanContext(groep: number, vak: string): Promise<string> {
  try {
    const ctx = await sloResolver.getContextForGroepVak(groep, vak);
    if (!ctx || (!ctx.kerndoelen.length && !ctx.inhoudslijnen.length)) return '';
    const fase = ctx.fase ? String(ctx.fase) : '';
    const header = [
      '<slo_curriculum_context>',
      '  <context_voor>',
      `    Groep: ${groep}`,
      `    Vakgebied: ${esc(vak)}`,
      `    Fase: ${esc(fase)}`,
      '  </context_voor>'
    ].join('\n');

    const kd = ctx.kerndoelen.map(k => [
      `    <kerndoel code="${esc(k.code)}">`,
      `      <titel>${esc(k.titel)}</titel>`,
      `      <doelzin>${esc(k.doelzin)}</doelzin>`,
      k.uitwerking ? `      <uitwerking>${esc(k.uitwerking)}</uitwerking>` : '',
      '      <waarom_relevant>',
      `        Dit kerndoel is relevant omdat ${esc(vak)} in groep ${groep} zich richt op deze competenties.`,
      '      </waarom_relevant>',
      '    </kerndoel>'
    ].filter(Boolean).join('\n')).join('\n');

    const kdBlock = [
      '  <relevante_kerndoelen>',
      kd,
      '  </relevante_kerndoelen>'
    ].join('\n');

    const ih = ctx.inhoudslijnen.map(l => {
      const faseData = (l.fases || []).find(f => String(f.fase_nummer) === String(ctx.fase));
      const doelen = (faseData?.aanbodsdoelen || []).map(d => [
        '        <doel>',
        `          <wat>${esc(d.beschrijving)}</wat>`,
        d.voorbeelden?.length ? `          <voorbeelden>${esc(d.voorbeelden)}</voorbeelden>` : '',
        '        </doel>'
      ].filter(Boolean).join('\n')).join('\n');
      return [
        `    <inhoudslijn naam="${esc(l.naam)}">`,
        `      <fase_beschrijving>${esc(faseData?.beschrijving || '')}</fase_beschrijving>`,
        '      <aanbodsdoelen>',
        doelen,
        '      </aanbodsdoelen>',
        '    </inhoudslijn>'
      ].join('\n');
    }).join('\n');

    const ihBlock = [
      '  <inhoudslijnen_deze_fase>',
      ih,
      '  </inhoudslijnen_deze_fase>'
    ].join('\n');

    const instruct = [
      '  <instructies_voor_groepsplan>',
      '    Gebruik deze kerndoelen en inhoudslijnen als basis voor het groepsplan:',
      '    1. LINK GROEPEN AAN KERNDOELEN',
      '       - Intensieve groep: Welke kerndoelen/aanbodsdoelen leren ze?',
      '       - Basis groep: Welke kerndoelen/aanbodsdoelen consolideren ze?',
      '       - Meer groep: Welke kerndoelen/aanbodsdoelen zijn beheerst?',
      '    2. FORMULEER DOELEN MET KERNDOEL-REFERENTIE',
      '       Voorbeeld: "Basisgroep werkt aan F4 (automatiseren tot 100): splitsen tot 20 en tafels 2,5,10"',
      '    3. SHOW PROGRESSION',
      '       Gebruik aanbodsdoelen om concrete stappen te benoemen.',
      '    4. JUSTIFY DIFFERENTIATION',
      '       Verschillende groepen werken aan verschillende aanbodsdoelen binnen dezelfde kerndoelen.',
      '  </instructies_voor_groepsplan>'
    ].join('\n');

    return [header, kdBlock, ihBlock, instruct, '</slo_curriculum_context>'].join('\n');
  } catch {
    return '';
  }
}

