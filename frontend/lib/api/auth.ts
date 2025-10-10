import { getUserFromToken } from "@/lib/supabase.js";

export type AuthContext = {
  userId: string | null;
  demo: boolean;
  token: string | null;
};

export async function parseAuth(request: Request, { allowDemo = true }: { allowDemo?: boolean } = {}): Promise<AuthContext> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return { userId: null, demo: !!allowDemo, token: null };
  try {
    const { user } = await getUserFromToken(token);
    return { userId: user?.id || null, demo: false, token };
  } catch {
    return { userId: null, demo: !!allowDemo, token: null };
  }
}

export async function requireAuth(request: Request): Promise<AuthContext | Response> {
  const ctx = await parseAuth(request, { allowDemo: false });
  if (!ctx.userId || !ctx.token) {
    return new Response(
      JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" }, meta: { requestId: Math.random().toString(36).slice(2,10), timestamp: new Date().toISOString() } }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }
  return ctx;
}
