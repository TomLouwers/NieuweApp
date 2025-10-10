export type ClaudeModel = string;

export interface AIConfig {
  apiKey?: string;
  model: ClaudeModel;
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
}

export interface AICallOverrides {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  metadata?: Record<string, any> & { user_id?: string };
}

export interface AIUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
}

export interface AICallResult {
  text: string;
  usage?: AIUsage | null;
}

export interface GenerationResult {
  markdown: string;
  parsed: import("./parse/types").ParsedGroepsplan;
  compliance: import("./parse/types").ComplianceResult;
  qualityChecks: import("./quality/checks").QualityCheck[];
  usage?: AIUsage;
  cost?: {
    estimatedCost: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
}

