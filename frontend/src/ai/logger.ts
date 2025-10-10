import type { AIUsage } from "./types";

export function logUsage(context: {
  model: string;
  usage?: AIUsage | null;
  estimatedCostEUR?: number;
}) {
  const payload = {
    ts: new Date().toISOString(),
    type: "ai_usage",
    model: context.model,
    usage: context.usage || null,
    eur: typeof context.estimatedCostEUR === "number" ? Number(context.estimatedCostEUR.toFixed(6)) : null,
  };
  try { console.log(JSON.stringify(payload)); } catch { /* noop */ }
}

export function logEvent(event: string, extra?: Record<string, any>) {
  try { console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...(extra || {}) })); } catch { /* noop */ }
}

