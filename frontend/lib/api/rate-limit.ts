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

// Best-effort rate limit using Supabase when available; otherwise allow.
export async function checkRate(opts: { endpoint: string; userId?: string | null; ip?: string | null; limit: number; windowSeconds?: number; token?: string | null; }): Promise<{ allowed: boolean; remaining: number; reset: number; headers: HeadersInit }>
{
  const windowSeconds = opts.windowSeconds ?? 3600;
  const reset = Math.floor(Date.now() / 1000) + windowSeconds;
  const key = opts.userId ? `u:${opts.userId}` : `ip:${opts.ip || "unknown"}`;
  // Default allow with headers if no backend persistence
  try {
    const { getClient } = await import("@/lib/api/supabase-helpers");
    const sb = getClient(opts.token || null);
    if (!sb) return { allowed: true, remaining: opts.limit, reset, headers: applyRateHeaders({ limit: opts.limit, remaining: opts.limit, reset }) };

    const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
    const row = { key, endpoint: opts.endpoint, window_ts: windowStart, count: 0 } as any;
    // Try to increment atomically
    // Note: table rate_limits(key text, endpoint text, window_ts bigint, count int)
    const { data, error } = await sb
      .from("rate_limits")
      .upsert({ key: row.key, endpoint: row.endpoint, window_ts: row.window_ts, count: 0 }, { onConflict: "key,endpoint,window_ts" })
      .select("count, window_ts").single();
    if (error && !String(error?.message || "").includes("duplicate")) {
      return { allowed: true, remaining: opts.limit, reset, headers: applyRateHeaders({ limit: opts.limit, remaining: opts.limit, reset }) };
    }
    // Increment
    const { data: upd } = await sb
      .rpc("rl_increment", { p_key: key, p_endpoint: opts.endpoint, p_window_ts: windowStart })
      .catch(() => ({ data: null } as any));
    const count = (upd && typeof upd.count === 'number') ? upd.count : ((data?.count ?? 0) + 1);
    const remaining = Math.max(0, opts.limit - count);
    const allowed = count <= opts.limit;
    return { allowed, remaining, reset, headers: applyRateHeaders({ limit: opts.limit, remaining, reset }) };
  } catch {
    return { allowed: true, remaining: opts.limit, reset, headers: applyRateHeaders({ limit: opts.limit, remaining: opts.limit, reset }) };
  }
}
