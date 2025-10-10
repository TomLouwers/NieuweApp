import { runQualityChecks } from '@/src/ai/quality/checks';
import { ParsedGroepsplan } from '@/src/ai/parse/types';

function makePlan(text: string): ParsedGroepsplan {
  return { sections: [{ id: 'doc', title: 'Document', content: text, subsections: [] }], metadata: { groep: 5, vakgebied: 'spelling', periode: 'Q2', aantalLeerlingen: 28 }, complianceChecks: { overall: 0, checks: { beginsituatie: false, smartiDoelen: false, interventies: false, evaluatie: false, betrokkenen: false, handelingsgericht: false }, warnings: [], errors: [], inspectieProof: false } as any };
}

describe('Quality checks', () => {
  it('flags too short text', () => {
    const checks = runQualityChecks(makePlan('korte tekst').
      as any);
    expect(checks.find(c => c.name==='length')?.passed).toBe(false);
  });
  it('flags missing Mickey Mouse', () => {
    const text = 'Dit is een lange '.repeat(2000);
    const checks = runQualityChecks(makePlan(text));
    expect(checks.some(c => c.name==='mickey_mouse' && !c.passed)).toBe(true);
  });
});

