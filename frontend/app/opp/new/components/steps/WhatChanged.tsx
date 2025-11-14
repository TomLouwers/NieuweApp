"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

const options = [
  { id: 'good_progress', label: 'Goede vooruitgang geboekt' },
  { id: 'low_progress', label: 'Weinig vooruitgang, doelen aanpassen' },
  { id: 'new_issues', label: 'Nieuwe problematiek ontstaan' },
  { id: 'vo_transition', label: 'Overstap naar VO komt dichterbij' },
  { id: 'support_change', label: 'Wijziging externe ondersteuning' },
];

export default function WhatChanged({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const [sel, setSel] = React.useState(answers.changesSinceLast || "");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={1} /></div>
      <h2>Wat is er veranderd sinds vorige OPP?</h2>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2">
            <input type="radio" name="changes" checked={sel === opt.id} onChange={() => setSel(opt.id)} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className={`px-4 py-2 rounded-md ${sel ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`} disabled={!sel} onClick={() => { update({ changesSinceLast: sel }); onNext(); }}>Volgende</button>
      </div>
    </div>
  );
}
