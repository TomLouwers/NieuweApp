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

