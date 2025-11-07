import rekKerndoelen from '@/data/slo/kerndoelen/rekenen.json';
import nlKerndoelen from '@/data/slo/kerndoelen/nederlands.json';
import rekFase2 from '@/data/slo/inhoudslijnen/rekenen_fase2.json';
import rekFase3 from '@/data/slo/inhoudslijnen/rekenen_fase3.json';
import nlFase2 from '@/data/slo/inhoudslijnen/nederlands_fase2.json';
import VAK_MAP from '@/data/slo/mappings/vak_to_slo.json';

export type Leergebied =
  | 'Nederlandse taal'
  | 'Engelse taal'
  | 'Rekenen en wiskunde'
  | 'Oriëntatie op jezelf en de wereld'
  | 'Kunstzinnige oriëntatie'
  | 'Bewegingsonderwijs';

export interface Kerndoel {
  id: string;
  code: string;
  titel: string;
  doelzin: string;
  uitwerking?: string;
  toelichting?: string;
  leergebied: Leergebied;
  onderwijs_type: string;
  gerelateerde_doelen?: string[];
  inhoudslijnen?: string[];
}

export interface Aanbodsdoel {
  id: string;
  beschrijving: string;
  kennis?: string[];
  vaardigheden?: string[];
  houdingen?: string[];
  voorbeelden?: string[];
  didactiek?: string;
}

export interface Fase {
  fase_nummer: 1 | 2 | 3 | 4;
  groepen: string;
  beschrijving: string;
  aanbodsdoelen: Aanbodsdoel[];
}

export interface Inhoudslijn {
  id: string;
  naam: string;
  kerndoel_id: string;
  leergebied: Leergebied;
  fases: Fase[];
}

export interface SLOContext {
  kerndoelen: Kerndoel[];
  inhoudslijnen: Inhoudslijn[];
  fase: number | null;
  relevant_aanbodsdoelen: Aanbodsdoel[];
  leergebied: Leergebied | null;
}

type VakKey = keyof typeof VAK_MAP;

export class SLOContextResolver {
  mapGroepToFase(groep: number): 1 | 2 | 3 | 4 | null {
    if (groep <= 0) return null as any;
    if (groep <= 2) return 1;
    if (groep <= 4) return 2;
    if (groep <= 6) return 3;
    return 4;
  }

  getKerndoelenForVak(vak: string): { leergebied: Leergebied; codes: string[] } | null {
    const key = vak as VakKey;
    const mapping = (VAK_MAP as any)[key];
    if (!mapping) return null;
    return { leergebied: mapping.leergebied as Leergebied, codes: mapping.kerndoel_codes as string[] };
  }

  getFaseForGroep(vak: string, groep: number): number | null {
    const key = vak as VakKey;
    const mapping = (VAK_MAP as any)[key];
    if (!mapping) return null;
    const f = mapping.fase_by_groep?.[String(groep)] ?? null;
    return (typeof f === 'number' ? f : null);
  }

  private loadKerndoelen(leergebied: Leergebied): Kerndoel[] {
    if (leergebied === 'Rekenen en wiskunde') return (rekKerndoelen as any) as Kerndoel[];
    if (leergebied === 'Nederlandse taal') return (nlKerndoelen as any) as Kerndoel[];
    return [];
  }

  private loadInhoudslijnen(leergebied: Leergebied, fase: number | null): Inhoudslijn[] {
    if (!fase) return [];
    if (leergebied === 'Rekenen en wiskunde') {
      if (fase === 2) return (rekFase2 as any) as Inhoudslijn[];
      if (fase === 3) return (rekFase3 as any) as Inhoudslijn[];
    }
    if (leergebied === 'Nederlandse taal') {
      if (fase === 2) return (nlFase2 as any) as Inhoudslijn[];
      // fase 3+ not yet provided in MVP
    }
    return [];
  }

  async getContextForGroepVak(groep: number, vak: string): Promise<SLOContext> {
    const meta = this.getKerndoelenForVak(vak);
    const fase = this.getFaseForGroep(vak, groep) ?? this.mapGroepToFase(groep);
    if (!meta) {
      return { kerndoelen: [], inhoudslijnen: [], fase, relevant_aanbodsdoelen: [], leergebied: null };
    }
    const all = this.loadKerndoelen(meta.leergebied);
    const kerndoelen = meta.codes
      .map((c) => all.find((k) => k.code === c))
      .filter(Boolean) as Kerndoel[];

    const inhoudslijnen = this.loadInhoudslijnen(meta.leergebied, fase);
    const relevant_aanbodsdoelen: Aanbodsdoel[] = [];
    if (fase) {
      for (const lijn of inhoudslijnen) {
        const f = (lijn.fases || []).find((x) => x.fase_nummer === (fase as any));
        if (f?.aanbodsdoelen?.length) relevant_aanbodsdoelen.push(...f.aanbodsdoelen);
      }
    }

    return { kerndoelen, inhoudslijnen, fase, relevant_aanbodsdoelen, leergebied: meta.leergebied };
  }
}

export const sloResolver = new SLOContextResolver();

