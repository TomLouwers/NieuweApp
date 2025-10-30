"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

const options = [
  { id: 'involved_constructive', label: 'Constructief en betrokken' },
  { id: 'involved_but_concerned', label: 'Betrokken maar bezorgd' },
  { id: 'difficult_contact', label: 'Moeizaam contact' },
  { id: 'conflict', label: 'Conflictsituatie of miscommunicatie' },
  { id: 'low_contact', label: 'Weinig contact mogelijk' },
];

export default function ParentInvolvement({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const [sel, setSel] = React.useState(answers.parentInvolvement || "");
  return (
    <div className="space-y-4">
      <h2>Hoe is de samenwerking met ouders?</h2>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2">
            <input type="radio" name="parents" checked={sel === opt.id} onChange={() => setSel(opt.id)} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={() => { update({ parentInvolvement: sel }); onNext(); }}>Volgende</button>
      </div>
    </div>
  );
}

