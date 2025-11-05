"use client";
import React from "react";
import { CATEGORIES, SCENARIOS, ScenarioDefinition } from "@/lib/maatwerk/scenarios";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function ScenarioSelector({ value, onChange }: Props) {
  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange(Array.from(set));
  }
  return (
    <div className="space-y-6">
      {CATEGORIES.map((cat) => (
        <div key={cat}>
          <h3 className="wb-section-header" style={{ fontSize: 18 }}>{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SCENARIOS.filter((s) => s.category === cat).map((s) => {
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
                    {selected ? <span aria-hidden style={{ color: 'var(--wb-chalkboard-green)' }}>✓</span> : null}
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

