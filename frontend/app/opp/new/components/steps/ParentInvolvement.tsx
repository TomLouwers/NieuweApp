"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

const options = [
  { id: 'involved_constructive', label: 'Constructief en betrokken' },
  { id: 'involved_but_concerned', label: 'Betrokken maar bezorgd' },
  { id: 'difficult_contact', label: 'Moeizaam contact' },
  { id: 'conflict', label: 'Conflictsituatie of miscommunicatie' },
  { id: 'low_contact', label: 'Weinig contact mogelijk' },
  { id: 'too_early', label: 'Nog te vroeg om te beoordelen (nieuwe leerling)' },
];

export default function ParentInvolvement({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const [sel, setSel] = React.useState(answers.parentInvolvement || "");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={5} /></div>
      <h2>Hoe is de samenwerking met ouders/verzorgers?</h2>
      <div className="text-sm text-muted"><span aria-hidden>🔒 </span>Let op: Deze informatie is alleen voor jouw context, niet zichtbaar in het OPP dat ouders lezen.</div>
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
        <button className={`px-4 py-2 rounded-md ${sel ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`} disabled={!sel} onClick={() => { update({ parentInvolvement: sel }); onNext(); }}>Volgende</button>
      </div>
    </div>
  );
}
