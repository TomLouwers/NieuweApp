import { buildUploadPrompt } from '@/src/ai/prompts/generation.upload';

describe('Upload prompt', () => {
  it('includes extracted and new context and is reasonably long', () => {
    const s = buildUploadPrompt({
      extracted_text: 'Eerder plan...'.repeat(100),
      groep: 5,
      vakgebied: 'spelling',
      previous_periode: 'Blok 1',
      previous_groepsindeling: 'B18 O5 M5',
      previous_goals: '...doelen...',
      previous_results: '...resultaten...',
      new_vakgebied: 'spelling',
      challenge_description: 'enorme niveauverschillen',
      any_user_modifications: 'meer focus op werkwoordspelling',
    });
    expect(s.length).toBeGreaterThan(1000);
    expect(s).toMatch(/Geüploade Document Context/);
    expect(s).toMatch(/Nieuwe Context/);
  });
});

