import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { getAIConfig } from "./config";
import type { AICallOverrides, AICallResult } from "./types";
import { SYSTEM_PROMPT } from "./prompts/system";
import { logUsage } from "./logger";
import { calculateCost } from "../ai/cost";

function friendlyMissingKeyError() {
  const e = new Error("AI is niet geconfigureerd. Voeg ANTHROPIC_API_KEY toe.");
  (e as any).code = "AI_CONFIG_MISSING";
  (e as any).status = 500;
  return e;
}

function badRequest(msg: string) {
  const e = new Error(msg);
  (e as any).code = "AI_BAD_REQUEST";
  (e as any).status = 400;
  return e;
}

export async function callClaudeRaw(prompt: string, overrides: AICallOverrides = {}): Promise<AICallResult> {
  if (!prompt || !prompt.trim()) throw badRequest("Lege prompt niet toegestaan");
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw friendlyMissingKeyError();

  const anthropic = new Anthropic({ apiKey: cfg.apiKey });

  const maxTokens = overrides.max_tokens ?? cfg.maxTokens;
  const temperature = overrides.temperature ?? cfg.temperature;
  const top_p = overrides.top_p ?? cfg.topP;
  const stop_sequences = overrides.stop_sequences ?? cfg.stopSequences;
  const metadata = overrides.metadata || {};

  try {
    // Use system prompt with ephemeral cache per guide
    const resp = await anthropic.messages.create({
      model: cfg.model,
      max_tokens: maxTokens,
      temperature,
      top_p,
      stop_sequences,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } as any } as any,
      ] as any,
      messages: [
        { role: "user", content: prompt },
      ],
      metadata,
    } as any);

    const block = resp?.content?.[0];
    const text = (block && (block as any).type === "text") ? String((block as any).text || "") : "";
    if (!text) {
      const e = new Error("AI gaf geen tekstuele respons");
      (e as any).code = "AI_NON_TEXT";
      (e as any).status = 502;
      throw e;
    }

    const usage = resp?.usage ? {
      input_tokens: (resp.usage as any).input_tokens || 0,
      output_tokens: (resp.usage as any).output_tokens || 0,
      cache_read_input_tokens: (resp.usage as any).cache_read_input_tokens || 0,
    } : null;

    // Log usage + cost
    const cost = calculateCost(usage || undefined);
    logUsage({ model: cfg.model, usage, estimatedCostEUR: cost?.estimatedCost });

    return { text, usage };
  } catch (err: any) {
    if (err?.name === "AbortError" || err?.code === "ETIMEDOUT") throw err;
    // Network classification
    if (err instanceof APIError) {
      throw err; // upstream provides status codes
    }
    const e = new Error(String(err?.message || "AI netwerkfout"));
    (e as any).code = "AI_NETWORK";
    (e as any).cause = err;
    throw e;
  }
}

export async function callClaude(prompt: string, overrides: AICallOverrides = {}): Promise<string> {
  const { text } = await callClaudeRaw(prompt, overrides);
  return text;
}

