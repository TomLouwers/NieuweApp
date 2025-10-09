"use client";
import React from "react";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import { getSelectedGroep, getSelectedVak, setSelectedGroep, setSelectedVak, useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import { track } from "@/lib/utils/analytics";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const VAKS = [
  "Rekenen",
  "Spelling",
  "Begrijpend lezen",
  "Technisch lezen",
  "Schrijven",
  "Andere...",
];

export default function GroepVakScreen({ onBack, onNext }: Props) {
  const { ref, bind, thresholdReached } = useSwipeBack(onBack);
  // Use store API without React hook to avoid test env issues
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { useGroepsplanStore.getState().saveDraft().catch(()=>{}); }, 500); };
  const [groep, setGroepState] = React.useState<number | null>(getSelectedGroep());
  const [vak, setVakState] = React.useState<string>(getSelectedVak() || "");
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const groepRef = React.useRef<HTMLDivElement | null>(null);
  const vakRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => { headingRef.current?.focus(); }, []);

  const canNext = Boolean(groep) && Boolean(vak);

  function selectGroep(n: number) {
    setGroepState(n);
    setSelectedGroep(n);
    try { useGroepsplanStore.getState().setGroep(n); } catch {}
    try { track('groepsplan_question_answered', { step: 'scratch', field: 'groep', value: n }); } catch {}
    scheduleSave();
  }
  function selectVak(v: string) {
    setVakState(v);
    setSelectedVak(v);
    try { useGroepsplanStore.getState().setVakgebied(v); } catch {}
    try { track('groepsplan_question_answered', { step: 'scratch', field: 'vakgebied', value: v }); } catch {}
    scheduleSave();
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
    const items = groepRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
    items?.[idx]?.focus();
  }

  function onVakKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const count = VAKS.length;
    let idx = Math.max(0, VAKS.indexOf(vak));
    if (e.key === "Home") idx = 0;
    else if (e.key === "End") idx = count - 1;
    else {
      const delta = (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1;
      idx = (idx + delta + count) % count;
    }
    selectVak(VAKS[idx]);
    const items = vakRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
    items?.[idx]?.focus();
  }

  function onRootKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onBack(); return; }
    if (e.key === 'Enter') { const canNext = Boolean(groep) && Boolean(vak); if (canNext) { e.preventDefault(); onNext(); } }
  }

  const groepBtnBase = "w-[60px] h-[60px] inline-flex items-center justify-center rounded-md border text-base transition-colors duration-200 min-h-[44px]";
  const vakBtnBase = "inline-flex items-center justify-center rounded-md border px-3 py-2 min-h-[44px] transition-colors duration-200";

  return (
    <div className="space-y-6" ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={1} />
      </div>

      <div>
        <h2 ref={headingRef} tabIndex={-1}>Voor welke groep?</h2>
      </div>

      <div ref={groepRef} role="radiogroup" aria-label="Kies groep" className="grid grid-cols-4 gap-2" onKeyDown={onGroupKeyDown}>
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

      <hr className="my-2 border-border" />

      <div>
        <h2>Welk vakgebied?</h2>
      </div>

      <div ref={vakRef} role="radiogroup" aria-label="Kies vak" className="grid grid-cols-1 sm:grid-cols-2 gap-2" onKeyDown={onVakKeyDown}>
        {VAKS.map((label) => {
          const selected = vak === label;
          const cls = selected
            ? `${vakBtnBase} bg-blue-600 text-white border-blue-600`
            : `${vakBtnBase} bg-white text-foreground border-border hover:bg-blue-50`;
          return (
            <div
              key={label}
              role="radio"
              aria-checked={selected}
              tabIndex={selected || !vak ? 0 : -1}
              className={cls}
              onClick={() => selectVak(label)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectVak(label); } }}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className={`border border-border px-4 py-2 rounded-md ${thresholdReached ? 'ring-2 ring-blue-500' : ''}`} onClick={onBack} aria-label="Terug naar begin">← Terug naar begin</button>
        <button
          className={`px-4 py-2 rounded-md ${canNext ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
          disabled={!canNext}
          onClick={onNext}
          aria-label="Volgende"
        >
          Volgende →
        </button>
      </div>
    </div>
  );
}
