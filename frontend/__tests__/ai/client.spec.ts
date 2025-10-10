import { getAIConfig } from '@/src/ai/config';
import * as client from '@/src/ai/client';

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: class Anthropic {
      apiKey: string;
      constructor({ apiKey }: any) { this.apiKey = apiKey; }
      messages = {
        create: async (_params: any) => {
          return { content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 100, output_tokens: 200, cache_read_input_tokens: 0 } } as any;
        }
      }
    },
    APIError: class APIError extends Error {}
  };
});

describe('AI client', () => {
  const KEY = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => { jest.resetModules(); process.env.ANTHROPIC_API_KEY = 'test-key'; });
  afterAll(() => { process.env.ANTHROPIC_API_KEY = KEY; });

  it('merges default config', () => {
    const cfg = getAIConfig();
    expect(cfg.model).toBeTruthy();
    expect(cfg.maxTokens).toBeGreaterThan(0);
  });

  it('throws friendly error when missing API key', async () => {
    process.env.ANTHROPIC_API_KEY = '';
    await expect(client.callClaude('hi')).rejects.toHaveProperty('code', 'AI_CONFIG_MISSING');
  });

  it('throws 400 on empty prompt', async () => {
    await expect(client.callClaude('')).rejects.toHaveProperty('status', 400);
  });
});

