"use client";
import React from "react";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import { getSelectedGroep, getSelectedVak, setSelectedGroep, setSelectedVak } from "@/lib/stores/groepsplanStore";

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
  const [groep, setGroepState] = React.useState<number | null>(getSelectedGroep());
  const [vak, setVakState] = React.useState<string>(getSelectedVak() || "");

  const canNext = Boolean(groep) && Boolean(vak);

  function selectGroep(n: number) {
    setGroepState(n);
    setSelectedGroep(n);
  }
  function selectVak(v: string) {
    setVakState(v);
    setSelectedVak(v);
  }

  const groepBtnBase = "w-[60px] h-[60px] inline-flex items-center justify-center rounded-md border text-base transition-colors duration-200 min-h-[44px]";
  const vakBtnBase = "inline-flex items-center justify-center rounded-md border px-3 py-2 min-h-[44px] transition-colors duration-200";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={1} />
      </div>

      <div>
        <h2>Voor welke groep?</h2>
      </div>

      <div role="radiogroup" aria-label="Kies groep" className="grid grid-cols-4 gap-2">
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

      <div role="radiogroup" aria-label="Kies vak" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Terug naar begin">← Terug naar begin</button>
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

