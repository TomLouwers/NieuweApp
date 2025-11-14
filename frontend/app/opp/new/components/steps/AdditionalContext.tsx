"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

export default function AdditionalContext({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={6} /></div>
      <h2>Nog iets dat belangrijk is om te weten? (optioneel)</h2>
      <div className="text-sm text-muted">Dit veld is er voor context die nergens anders past. Max 500 tekens - dit is voor context, niet voor de volledige geschiedenis.</div>
      <textarea className="w-full min-h-[120px] border rounded-md px-3 py-2" value={answers.additionalContext || ''} onChange={(e) => update({ additionalContext: e.target.value })} placeholder={"Bijv: recente gebeurtenissen (scheiding, verhuizing), eerdere schoolwissels, diagnoses in behandeling, thuissituatie als relevant…"} maxLength={500} />
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Verder</button>
      </div>
    </div>
  );
}
