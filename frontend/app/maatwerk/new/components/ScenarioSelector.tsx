"use client";
import React from "react";
import { CATEGORIES, SCENARIOS, ScenarioDefinition } from "@/lib/maatwerk/scenarios";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function ScenarioSelector({ value, onChange }: Props) {
  const [items, setItems] = React.useState<(ScenarioDefinition & { icon?: string; color?: string })[]>(SCENARIOS as any);
  const cats = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of items) set.add(s.category);
    return Array.from(set.values());
  }, [items]);

  // Collapsible categories: expand first by default
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    if (!cats.length) return;
    setExpanded((prev) => {
      // keep existing toggles but ensure new cats are initialized; first cat expanded by default
      const next: Record<string, boolean> = { ...prev };
      cats.forEach((c, i) => { if (next[c] == null) next[c] = i === 0; });
      return next;
    });
  }, [cats]);

  React.useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/maatwerk/scenarios', { cache: 'force-cache' });
        const data = await resp.json().catch(() => ({}));
        const list = (data?.scenarios || []) as any[];
        if (Array.isArray(list) && list.length) setItems(list as any);
      } catch {}
    })();
  }, []);
  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange(Array.from(set));
  }
  return (
    <div className="space-y-4">
      {(cats.length ? cats : CATEGORIES).map((cat) => {
        const list = (items.length ? items : SCENARIOS).filter((s: any) => s.category === cat);
        const count = list.length;
        const isOpen = Boolean(expanded[cat]);
        return (
          <div key={cat}>
            <button
              type="button"
              className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-[rgba(0,0,0,0.03)]"
              aria-expanded={isOpen}
              onClick={() => setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))}
            >
              <h3 className="wb-section-header" style={{ fontSize: 18, margin: 0 }}>{cat}</h3>
              <div className="text-sm wb-subtle">{isOpen ? '▼' : '▶'} {count} scenario{count === 1 ? '' : 's'}</div>
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {list.map((s: any) => {
                  const selected = value.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`scenario-card relative component touchable text-left px-3 rounded-lg wb-paper paper-texture ${selected ? 'selected' : ''}`}
                      onClick={() => toggle(s.id)}
                      title={`${s.label} — ${s.description}`}
                    >
                      <div className="flex items-center justify-between gap-2 h-[55px]">
                        <div className="min-w-0">
                          <div className="title">{s.label}</div>
                          <div className="subtitle wb-subtle">{s.description}</div>
                        </div>
                        {selected ? <span aria-hidden className="check">✓</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <style jsx>{`
        .scenario-card {
          background: #FFF9F0;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .scenario-card:hover { background: #FFF5E6; border-color: #E5D5BF; }
        .scenario-card.selected { background: #4A6B5C; color: #fff; border-color: #3A5B4C; }
        .scenario-card.selected .subtitle { color: rgba(255,255,255,0.85); }
        .scenario-card .check { position: absolute; top: 8px; right: 10px; font-size: 18px; line-height: 1; color: #fff; font-weight: 700; }
        .title { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .subtitle { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}

