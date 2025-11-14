"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

export default function StudentBasics({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const groep = answers.groep as number | null;

  function selectGroep(n: number) {
    update({ groep: n });
  }

  function onGroupKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const count = 8;
    let idx = typeof groep === 'number' ? groep - 1 : 0;
    if (e.key === "Home") idx = 0;
    else if (e.key === "End") idx = count - 1;
    else {
      const delta = (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1;
      idx = (idx + delta + count) % count;
    }
    selectGroep(idx + 1);
    const items = (e.currentTarget as HTMLElement)?.querySelectorAll<HTMLElement>('[role="radio"]');
    items?.[idx]?.focus();
  }

  const groepBtnBase = "w-[60px] h-[60px] inline-flex items-center justify-center rounded-md border text-base transition-colors duration-200 min-h-[44px]";

  return (
    <div className="space-y-4">
      <h2>Voor wie maak je een OPP?</h2>
      <div className="text-sm wb-subtle">Privacy: we versturen geen naam of leeftijd naar onze AI. Het document wordt anoniem gegenereerd en je kunt het na download lokaal personaliseren.</div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Groep</label>
          <div role="radiogroup" aria-label="Groep" className="grid grid-cols-4 gap-2" onKeyDown={onGroupKeyDown}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
              const selected = groep === n;
              const cls = selected
                ? `${groepBtnBase} bg-blue-600 text-white border-blue-600`
                : `${groepBtnBase} bg-white text-foreground border-border hover:bg-blue-50`;
              return (
                <div
                  key={n}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || !groep ? 0 : -1}
                  className={cls}
                  onClick={() => selectGroep(n)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectGroep(n); } }}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Voornaamwoorden</label>
          <div className="mt-1 flex items-center gap-3">
            {['jongen','meisje','anders'].map(v => (
              <label key={v} className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input type="radio" name="gender" checked={answers.gender===v} onChange={() => update({ gender: v as any })} />
                <span>{v}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md wb-btn wb-btn-secondary" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md wb-btn wb-btn-primary" onClick={onNext} disabled={!answers.groep}>Volgende</button>
      </div>
    </div>
  );
}
