import { buildScratchPrompt } from '@/src/ai/prompts/generation.scratch';

describe('Scratch prompt', () => {
  const base = {
    groep: 5,
    vakgebied: 'spelling' as const,
    challenge: 'enorme_niveauverschillen' as const,
    aantalLeerlingen: 28,
    groepsindeling: { basis: 18, intensief: 5, meer: 5 },
    startingPoint: 'midden' as const,
  };

  it('includes Mickey Mouse and sections request', () => {
    const s = buildScratchPrompt(base);
    expect(s).toMatch(/Mickey Mouse/);
    expect(s).toMatch(/Genereer een volledig groepsplan/);
  });

  it('compiles with toetsScores', () => {
    const s = buildScratchPrompt({ ...base, toetsScores: { basis: 'D', intensief: 'E' } });
    expect(s).toMatch(/Recente toetsgegevens/);
  });
});

