// Optional Supabase accessors that never throw in absence of config
import { createClient as createSb, getUserFromToken } from "@/lib/supabase.js";

export function getClient(token?: string | null) {
  try {
    // If token is provided, pass as accessToken to forward auth
    const client = createSb(undefined, undefined, token ? { accessToken: token } : ({} as any));
    return client as any;
  } catch (_) {
    return null;
  }
}

export async function currentUserId(token?: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { user } = await getUserFromToken(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

