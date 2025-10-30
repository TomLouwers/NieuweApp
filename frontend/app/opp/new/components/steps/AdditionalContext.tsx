"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function AdditionalContext({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  return (
    <div className="space-y-4">
      <h2>Nog iets dat we moeten weten? (optioneel)</h2>
      <textarea className="w-full min-h-[120px] border rounded-md px-3 py-2" value={answers.additionalContext || ''} onChange={(e) => update({ additionalContext: e.target.value })} placeholder="Bijv: thuissituatie, diagnoses, eerdere schoolwissel... (max 500 tekens)" maxLength={500} />
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Verder</button>
      </div>
    </div>
  );
}

