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
                  className={`component touchable text-left p-3 rounded-lg wb-paper paper-texture ${selected ? 'selected' : ''}`}
                  onClick={() => toggle(s.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base" style={{ fontWeight: 500 }}>{s.label}</div>
                      <div className="text-sm wb-subtle">{s.description}</div>
                    </div>
                    {selected ? <span aria-hidden style={{ color: 'var(--wb-chalkboard-green)' }}>?</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

