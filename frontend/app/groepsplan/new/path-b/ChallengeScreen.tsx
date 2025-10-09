"use client";
import React from "react";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import { getSelectedChallenge, setSelectedChallenge, useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import { track } from "@/lib/utils/analytics";

const OPTIONS: string[] = [
  "Enorme niveauverschillen (meer dan 3 jaar spreiding)",
  "Veel leerlingen met dyslexie/dyscalculie",
  "Weinig instructietijd (veel uitval/gedrag)",
  "Ondersteuning van vorig blok werkte niet goed genoeg",
  "Nieuw in deze groep, ken de leerlingen nog niet goed",
  "Grote groep (28+), weinig ruimte voor differentiatie",
  "Leerlingen hebben moeite met zelfstandig werken",
  "Het gaat eigenlijk prima, gewoon continuïteit",
];

interface Props { onBack: () => void; onNext: () => void; }

export default function ChallengeScreen({ onBack, onNext }: Props) {
  const { ref, bind } = useSwipeBack(onBack);
  const [value, setValue] = React.useState<string>(getSelectedChallenge() || "");
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<number>(() => (value ? Math.max(0, OPTIONS.indexOf(value)) : -1));
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  function onRootKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (open) setOpen(false); else onBack();
      return;
    }
    if (e.key === 'Enter') {
      const canNext = Boolean(value);
      if (!open && canNext) { e.preventDefault(); onNext(); }
    }
  }
  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const setChallengeZ = useGroepsplanStore((s) => s.setChallenge);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle() { setOpen((v) => !v); }
  function selectAt(i: number) {
    const v = OPTIONS[i];
    setValue(v);
    setSelectedChallenge(v);
    try { setChallengeZ(v); } catch {}
    try { track('groepsplan_question_answered', { step: 'b3', field: 'challenge', value: v }); } catch {}
    scheduleSave();
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) { e.preventDefault(); setOpen(true); setHighlight((h) => (h >= 0 ? h : 0)); }
      if (e.key === "Escape") { e.preventDefault(); onBack(); }
      return;
    }
    const max = OPTIONS.length;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (highlight >= 0) selectAt(highlight); return; }
    if (e.key === "Home") { e.preventDefault(); setHighlight(0); return; }
    if (e.key === "End") { e.preventDefault(); setHighlight(max - 1); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => {
        let n = h < 0 ? 0 : h + (e.key === "ArrowDown" ? 1 : -1);
        if (n < 0) n = max - 1; if (n >= max) n = 0; return n;
      });
    }
  }

  const canNext = Boolean(value);

  return (
    <div className="space-y-6" aria-labelledby="b3-title" ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={3} />
      </div>

      <div>
        <h2 id="b3-title">Wat is de grootste uitdaging voor dit blok?</h2>
      </div>

      <div className="relative" onKeyDown={onKeyDown}>
        <button ref={btnRef} type="button" aria-haspopup="listbox" aria-expanded={open} className="w-full border border-border rounded-md px-3 py-2 text-left" style={{ fontSize: 16 }} onClick={toggle}>
          {value || "Selecteer…"}
          <span className="float-right" aria-hidden>▼</span>
        </button>
        {open && (
          <div ref={listRef} role="listbox" tabIndex={-1} className="absolute z-10 mt-1 w-full rounded-md border border-border bg-white shadow-md" style={{ maxHeight: 300, overflowY: "auto", fontSize: 16 }}>
            {OPTIONS.map((opt, i) => {
              const selected = value === opt;
              const active = highlight === i;
              return (
                <div id={`opt-b3-${i}`} key={opt} role="option" aria-selected={selected} className={`px-3 py-2 break-words text-left cursor-pointer ${active ? "bg-blue-50" : ""} ${selected ? "font-medium" : ""}`} onMouseEnter={() => setHighlight(i)} onClick={() => selectAt(i)}>{opt}</div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Vorige">← Vorige</button>
        <button className={`px-4 py-2 rounded-md ${canNext ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} disabled={!canNext} onClick={onNext} aria-label="Volgende">
          Volgende →
        </button>
      </div>
    </div>
  );
}
