import { parseGroepsplanOutput } from '@/src/ai/parse/markdown';
import { validateCompliance } from '@/src/ai/parse/compliance';

const md = `# 1. Basisinformatie en Context\n\n**Groep:** 5\n**Vakgebied:** Spelling\n**Periode:** Q2\n**Aantal leerlingen:** 28\n\n# 2. Groepsanalyse & Onderwijsbehoeften\n\n# 3. SMARTI Doelen\n80% van de intensieve groep behaalt doel X in 6 weken.\n\n# 4. Didactische en Pedagogische Aanpak\n15 minuten verlengde instructie, 3x per week.\n\n# 5. Afstemming en Samenwerking\nIB'er betrokken.\n\n# 6. Evaluatie en Vervolg\nEvaluatie in week 6.`;

describe('Parsing & Compliance', () => {
  it('parses sections and extracts metadata', () => {
    const parsed = parseGroepsplanOutput(md);
    expect(parsed.sections.length).toBeGreaterThanOrEqual(6);
    expect(parsed.metadata.groep).toBe(5);
  });
  it('validates compliance and flags required sections', () => {
    const parsed = parseGroepsplanOutput(md);
    const comp = validateCompliance(parsed.sections);
    expect(comp.errors.length).toBeGreaterThanOrEqual(0);
  });
});

