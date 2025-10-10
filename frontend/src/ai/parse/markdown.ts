import type { ParsedGroepsplan, Section } from "./types";

function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function extractSubsections(content: string): Section[] {
  const subs: Section[] = [];
  const re = /^##\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const title = m[1].trim();
    const id = slugify(title);
    // capture until next H2 or end
    const start = m.index;
    const next = re.exec(content)?.index ?? content.length;
    // reset regex lastIndex for next while loop iteration
    if (re.lastIndex) re.lastIndex = start + 1;
    const sectionBody = content.substring(start, next).trim();
    subs.push({ id, title, content: sectionBody, subsections: [] });
  }
  return subs;
}

export function extractMetadata(basisInfoContent: string): any {
  const groepMatch = basisInfoContent.match(/\*\*Groep:\*\* (\d+)/);
  const vakMatch = basisInfoContent.match(/\*\*Vakgebied:\*\* (.+)/);
  const periodeMatch = basisInfoContent.match(/\*\*Periode:\*\* (.+)/);
  const aantalMatch = basisInfoContent.match(/\*\*Aantal leerlingen:\*\* (\d+)/);
  return {
    groep: groepMatch ? parseInt(groepMatch[1]) : null,
    vakgebied: vakMatch ? vakMatch[1].trim() : null,
    periode: periodeMatch ? periodeMatch[1].trim() : null,
    aantalLeerlingen: aantalMatch ? parseInt(aantalMatch[1]) : null,
  };
}

export function parseGroepsplanOutput(markdown: string): ParsedGroepsplan {
  const sections: Section[] = [];
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return {
      sections: [],
      metadata: { groep: null, vakgebied: null, periode: null, aantalLeerlingen: null },
      complianceChecks: {
        overall: 0,
        checks: { beginsituatie: false, smartiDoelen: false, interventies: false, evaluatie: false, betrokkenen: false, handelingsgericht: false } as any,
        warnings: ['Lege of ongeldige invoer'],
        errors: ['Geen markdown inhoud gevonden'],
        inspectieProof: false,
      } as any,
    } as any;
  }

  // Split by H1 headers in the '# <number>. <title>' shape
  const h1Regex = /^#\s+(\d+)\.\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const starts: Array<{ index: number; title: string }> = [];
  while ((match = h1Regex.exec(markdown)) !== null) {
    starts.push({ index: match.index, title: match[2].trim() });
  }
  // If no numbered H1s are present, treat the whole doc as one section
  if (starts.length === 0) {
    sections.push({ id: 'document', title: 'Document', content: markdown.trim(), subsections: extractSubsections(markdown) });
  } else {
    for (let i = 0; i < starts.length; i++) {
      const start = starts[i].index;
      const end = i < starts.length - 1 ? starts[i + 1].index : markdown.length;
      const content = markdown.substring(start, end).trim();
      sections.push({ id: slugify(starts[i].title), title: starts[i].title, content, subsections: extractSubsections(content) });
    }
  }

  const metadata = extractMetadata(sections[0]?.content || '');

  // compliance placeholder (actual logic in compliance.ts)
  const complianceChecks = {
    overall: 0,
    checks: { beginsituatie: false, smartiDoelen: false, interventies: false, evaluatie: false, betrokkenen: false, handelingsgericht: false } as any,
    warnings: [],
    errors: [],
    inspectieProof: false,
  } as any;

  return { sections, metadata, complianceChecks } as ParsedGroepsplan;
}

export { slugify, extractSubsections };

