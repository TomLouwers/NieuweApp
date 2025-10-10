export interface GenerationMetrics {
  avgGenerationTime?: number;
  p95GenerationTime?: number;
  successRate?: number;
  retries?: number;
  fallbacks?: number;
  genericWarnings?: number;
  avgCompliance?: number;
}

export type MetricsSink = (metrics: GenerationMetrics & { ts: string }) => void;

let sink: MetricsSink | null = null;

export function setMetricsSink(fn: MetricsSink) { sink = fn; }

export function recordGenerationMetrics(m: GenerationMetrics) {
  const payload = { ts: new Date().toISOString(), ...m };
  if (sink) return sink(payload);
  try { console.log(JSON.stringify({ type: 'metrics', ...payload })); } catch { /* noop */ }
}

