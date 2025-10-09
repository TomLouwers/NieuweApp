export type RateHeaders = {
  limit: number;
  remaining: number;
  reset: number; // epoch seconds
};

// Phase 0: no-op limiter that just sets indicative headers without enforcement
export function applyRateHeaders(init?: Partial<RateHeaders>): HeadersInit {
  const limit = init?.limit ?? 100;
  const remaining = init?.remaining ?? 100;
  const reset = init?.reset ?? Math.floor(Date.now() / 1000) + 3600;
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}

