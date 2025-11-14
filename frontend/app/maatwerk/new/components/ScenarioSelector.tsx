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
    <div className="space-y-6">
      {(cats.length ? cats : CATEGORIES).map((cat) => (
        <div key={cat}>
          <h3 className="wb-section-header" style={{ fontSize: 18 }}>{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(items.length ? items : SCENARIOS).filter((s: any) => s.category === cat).map((s: any) => {
              const selected = value.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`scenario-card relative component touchable text-left p-3 rounded-lg wb-paper paper-texture ${selected ? 'selected' : ''}`}
                  onClick={() => toggle(s.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base" style={{ fontWeight: 500 }}>{s.label}</div>
                      <div className="text-sm subtitle wb-subtle">{s.description}</div>
                    </div>
                    {selected ? <span aria-hidden className="check">✓</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <style jsx>{`
        .scenario-card {
          background: #FFF9F0;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .scenario-card:hover {
          background: #FFF5E6;
          border-color: #E5D5BF;
        }
        .scenario-card.selected {
          background: #4A6B5C; /* warm green */
          color: #fff;
          border-color: #3A5B4C;
        }
        .scenario-card.selected .subtitle { color: rgba(255,255,255,0.85); }
        .scenario-card .check {
          position: absolute;
          top: 8px;
          right: 10px;
          font-size: 18px;
          line-height: 1;
          color: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

