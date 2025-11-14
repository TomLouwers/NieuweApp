"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

const choices = [
  { id: 'vmbo_basis_kader', label: 'VMBO Basis/Kader (praktijkgericht)' },
  { id: 'vmbo_kader_tl', label: 'VMBO Kader/TL (gemengd)' },
  { id: 'havo', label: 'HAVO (theoretisch)' },
  { id: 'speciaal_vo', label: 'Speciaal VO (zeer intensief)' },
  { id: 'onduidelijk', label: 'Nog onduidelijk (te vroeg)' },
];

export default function Uitstroomprofiel({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const up = answers.uitstroomprofiel || { type: '', rationale: '' };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={3} /></div>
      <h2>Wat is het huidige ontwikkelingsperspectief?</h2>
      <div className="text-sm text-muted">Let op: Dit is een prognose, geen belofte. Je kunt dit altijd bijstellen.</div>
      <div className="space-y-2">
        {choices.map((c) => (
          <label key={c.id} className="flex items-center gap-2">
            <input type="radio" name="uitstroom" checked={up.type === c.id} onChange={() => update({ uitstroomprofiel: { ...up, type: c.id } })} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium">Waarom past dit perspectief? <span className="text-muted">(optioneel)</span></label>
        <input className="mt-1 w-full border rounded-md px-3 py-2" value={up.rationale || ''} onChange={(e) => update({ uitstroomprofiel: { ...up, rationale: e.target.value } })} placeholder="Bijv: gezien huidige vorderingen en werkhouding, met ondersteuning haalbaar…" />
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}
