// Lightweight analytics helper that is SSR/CSR safe
// Noops unless NEXT_PUBLIC_ANALYTICS_KEY is present and not in test

type Props = Record<string, any> | undefined;

const g: any = (typeof globalThis !== 'undefined' ? globalThis : {}) as any;
if (!g.__analytics_state) {
  g.__analytics_state = { last: new Map<string, number>(), currentStep: '', stepStart: 0 };
}

function enabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV === 'test') return false;
  const key = process.env.NEXT_PUBLIC_ANALYTICS_KEY || '';
  return Boolean(key);
}

function fingerprint(event: string, props?: Props) {
  try {
    // Only fingerprint shallow props to avoid PII
    const shallow: Record<string, any> = {};
    if (props) {
      for (const k of Object.keys(props)) {
        const v = (props as any)[k];
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') shallow[k] = v;
      }
    }
    return `${event}:${JSON.stringify(shallow)}`;
  } catch {
    return event;
  }
}

export function markStepStart(step: string) {
  g.__analytics_state.currentStep = step;
  g.__analytics_state.stepStart = Date.now();
}

export function msSinceStepStart(): number | null {
  const t = g.__analytics_state.stepStart || 0;
  if (!t) return null;
  return Math.max(0, Date.now() - t);
}

export function currentStep(): string {
  return g.__analytics_state.currentStep || '';
}

export function track(event: string, props?: Props) {
  // SSR-safe no-op
  if (!enabled()) return;
  const ms = msSinceStepStart();
  const body = {
    event,
    ts: Date.now(),
    step: currentStep() || undefined,
    ms_since_step: ms ?? undefined,
    props: props || {},
  };
  // Deduplicate identical events within 1s window to avoid double-fire in StrictMode
  try {
    const key = fingerprint(event, { ...(props || {}), step: body.step });
    const now = Date.now();
    const last = g.__analytics_state.last.get(key) || 0;
    if (now - last < 1000) return;
    g.__analytics_state.last.set(key, now);
  } catch {}

  try {
    const payload = JSON.stringify(body);
    const url = '/api/analytics';
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload as any, keepalive: true }).catch(() => {});
  } catch {
    // swallow
  }
}

export default { track, markStepStart, msSinceStepStart, currentStep };
