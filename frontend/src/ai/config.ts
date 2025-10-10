import type { AIConfig } from "./types";

export const DEFAULTS = {
  MODEL: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
  MAX_TOKENS: Number(process.env.AI_MAX_TOKENS_DEFAULT || 4000),
  TEMPERATURE: Number(process.env.AI_TEMPERATURE_DEFAULT || 0.7),
  TOP_P: Number(process.env.AI_TOP_P_DEFAULT || 0.9),
  STOP_SEQUENCES: ["\n\n\n\n", "---END---"],
};

export function getAIConfig(): AIConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: DEFAULTS.MODEL,
    maxTokens: DEFAULTS.MAX_TOKENS,
    temperature: DEFAULTS.TEMPERATURE,
    topP: DEFAULTS.TOP_P,
    stopSequences: DEFAULTS.STOP_SEQUENCES,
  };
}

