import { SYSTEM_PROMPT } from '@/src/ai/prompts/system';

describe('SYSTEM_PROMPT', () => {
  it('matches snapshot', () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });
});

