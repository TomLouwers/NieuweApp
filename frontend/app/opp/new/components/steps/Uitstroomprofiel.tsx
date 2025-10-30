"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

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
      <h2>Waar gaat de leerling naar toe?</h2>
      <div className="space-y-2">
        {choices.map((c) => (
          <label key={c.id} className="flex items-center gap-2">
            <input type="radio" name="uitstroom" checked={up.type === c.id} onChange={() => update({ uitstroomprofiel: { ...up, type: c.id } })} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium">Motivatie</label>
        <input className="mt-1 w-full border rounded-md px-3 py-2" value={up.rationale || ''} onChange={(e) => update({ uitstroomprofiel: { ...up, rationale: e.target.value } })} placeholder="Waarom is dit realistisch?" />
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}

