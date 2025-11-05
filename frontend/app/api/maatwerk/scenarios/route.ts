import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/maatwerk/scenarios";

const TOKEN = process.env.PEBBLE_API_TOKEN || process.env.PEBBLE_API_KEY || "";
const BASE = process.env.PEBBLE_API_BASE || "https://api.sandbox.pebble.nl/v1";

const catIcon: Record<string, string> = {
  "Niveau-mismatch": "📈",
  "Leerproblemen": "🧩",
  "Taal": "🗣️",
  "Gedrag/Emotie": "🧠",
  "Cognitieve verschillen": "🌟",
  "Omgevingsfactoren": "🏫",
};

const catColor: Record<string, string> = {
  "Niveau-mismatch": "#4B5F6D",
  "Leerproblemen": "#6B5B95",
  "Taal": "#2E8B57",
  "Gedrag/Emotie": "#D2691E",
  "Cognitieve verschillen": "#E0A500",
  "Omgevingsfactoren": "#008B8B",
};

export async function GET() {
  if (TOKEN) {
    try {
      const resp = await fetch(`${BASE}/scenarios`, { headers: { Authorization: `Bearer ${TOKEN}` } });
      const data = await resp.json().catch(() => ({}));
      // Pass-through when available
      if (resp.ok) return NextResponse.json(data);
    } catch {}
  }
  // Fallback to local list enriched with icon/color
  const items = SCENARIOS.map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
    category: s.category,
    frequency: s.frequency,
    icon: catIcon[s.category] || "✅",
    color: catColor[s.category] || "#4A6B59",
  }));
  return NextResponse.json({ scenarios: items });
}

