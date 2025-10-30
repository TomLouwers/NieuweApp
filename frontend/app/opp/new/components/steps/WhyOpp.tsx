"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

const options = [
  { id: 'significante_achterstand', label: 'Significante leerachterstand (2+ jaar)' },
  { id: 'gedragsproblematiek', label: 'Ernstige gedragsproblematiek' },
  { id: 'meervoudige_problematiek', label: 'Meervoudige problematiek (cognitief + sociaal-emotioneel)' },
  { id: 'naar_so', label: 'Mogelijk overstap naar speciaal onderwijs' },
  { id: 'terug_van_so', label: 'Terugkomst vanuit speciaal onderwijs' },
  { id: 'langdurige_ziekte', label: 'Langdurige ziekte/afwezigheid' },
];

export default function WhyOpp({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const [sel, setSel] = React.useState(answers.reasonForOpp || "");
  return (
    <div className="space-y-4">
      <h2>Waarom heeft deze leerling een OPP nodig?</h2>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2">
            <input type="radio" name="reason" checked={sel === opt.id} onChange={() => setSel(opt.id)} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={() => { update({ reasonForOpp: sel }); onNext(); }}>Volgende</button>
      </div>
    </div>
  );
}

