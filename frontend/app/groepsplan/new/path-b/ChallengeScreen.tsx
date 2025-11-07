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
  const headingId = "b3-title";

  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const setChallengeZ = useGroepsplanStore((s) => s.setChallenge);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };

  function confirmSelection(opt: string) {
    setValue(opt);
    setSelectedChallenge(opt);
    try { setChallengeZ(opt); } catch {}
    try { track('groepsplan_question_answered', { step: 'b3', field: 'challenge', value: opt }); } catch {}
    scheduleSave();
  }
  function onRootKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
      return;
    }
    if (e.key === 'Enter') {
      const canNext = Boolean(value);
      if (canNext) { e.preventDefault(); onNext(); }
    }
  }

  const canNext = Boolean(value);

  return (
    <div className="space-y-6" aria-labelledby={headingId} ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={3} />
      </div>

      <div>
        <h2 id={headingId}>Wat is de grootste uitdaging voor dit blok?</h2>
      </div>

      <div role="radiogroup" aria-label="Uitdagingen" className="grid grid-cols-1 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <div
              key={opt}
              role="radio"
              aria-checked={selected}
              tabIndex={selected || !value ? 0 : -1}
              className={`inline-flex items-start gap-2 rounded-md border px-3 py-2 min-h-[44px] ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-foreground border-border hover:bg-blue-50'}`}
              onClick={() => confirmSelection(opt)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); confirmSelection(opt); } }}
            >
              <span className="mt-1" aria-hidden>●</span>
              <span className="break-words">{opt}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Vorige">Vorige</button>
        <button className={`px-4 py-2 rounded-md ${canNext ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} disabled={!canNext} onClick={onNext} aria-label="Volgende">
          Volgende
        </button>
      </div>
    </div>
  );
}
