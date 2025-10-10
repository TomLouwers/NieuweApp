import { buildScratchPrompt, ScratchInputs } from '@/src/ai/prompts/generation.scratch';
import { promptVariants, buildPromptWithVariant } from '@/src/ai/experiments/ab';

// This test only verifies assembly; it does not call the AI.
describe('A/B prompt assembly', () => {
  it('builds variants without crashing', () => {
    const inputs: ScratchInputs = {
      groep: 5,
      vakgebied: 'spelling',
      challenge: 'enorme_niveauverschillen',
      aantalLeerlingen: 28,
      groepsindeling: { basis: 18, intensief: 5, meer: 5 },
      startingPoint: 'midden',
    };
    const base = buildScratchPrompt(inputs);
    const variants = promptVariants('MAIN');
    for (const [k, v] of Object.entries(variants)) {
      const prompt = buildPromptWithVariant(v, inputs);
      expect(prompt).toContain(base);
      expect(typeof prompt).toBe('string');
    }
  });
});

