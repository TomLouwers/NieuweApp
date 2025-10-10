import type { AIUsage } from "./types";

// Pricing per Guide (Oct 2025), converted to EUR
const INPUT_COST_PER_1M_USD = 3.00;
const OUTPUT_COST_PER_1M_USD = 15.00;
const CACHED_COST_PER_1M_USD = 0.30;
const USD_TO_EUR = 0.92;

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCost: number; // EUR
}

export function calculateCost(usage?: AIUsage | null): CostEstimate | undefined {
  if (!usage) return undefined;
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const cached = usage.cache_read_input_tokens || 0;
  const inputCost = (input / 1_000_000) * INPUT_COST_PER_1M_USD;
  const outputCost = (output / 1_000_000) * OUTPUT_COST_PER_1M_USD;
  const cachedCost = (cached / 1_000_000) * CACHED_COST_PER_1M_USD;
  const totalEUR = (inputCost + outputCost + cachedCost) * USD_TO_EUR;
  return {
    inputTokens: input,
    outputTokens: output,
    cachedTokens: cached,
    estimatedCost: totalEUR,
  };
}

