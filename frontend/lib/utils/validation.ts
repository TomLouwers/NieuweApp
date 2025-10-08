export function validateGroep(g: unknown): g is number {
  const n = typeof g === "string" ? Number(g) : (g as number);
  return Number.isInteger(n) && n >= 1 && n <= 8;
}

export const ALLOWED_VAK = new Set(["rekenen", "taal", "lezen"]);

export function validateVak(v: unknown): v is string {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return ALLOWED_VAK.has(s);
}

export function validatePeriode(p: unknown): p is string {
  const s = typeof p === "string" ? p.trim() : "";
  return !!s && s.length <= 64;
}

