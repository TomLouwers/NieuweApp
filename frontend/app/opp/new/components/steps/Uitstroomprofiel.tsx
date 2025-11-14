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
  const [showExamples, setShowExamples] = React.useState(false);

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
        <label className="block text-sm font-medium">
          Waarom past dit perspectief? <span className="text-muted">(optioneel)</span>
          <button
            type="button"
            className="ml-2 text-sm text-blue-600 hover:underline"
            onClick={() => setShowExamples(true)}
            aria-haspopup="dialog"
            aria-controls="opp-motivation-examples"
          >
            ℹ️ Voorbeelden
          </button>
        </label>
        <input
          className="mt-1 w-full border rounded-md px-3 py-2"
          value={up.rationale || ''}
          onChange={(e) => update({ uitstroomprofiel: { ...up, rationale: (e.target as HTMLInputElement).value } })}
          placeholder="Bijv: gezien huidige vorderingen en werkhouding, met ondersteuning haalbaar..."
        />
      </div>

      {showExamples && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Voorbeeldmotivaties"
          id="opp-motivation-examples"
          onClick={() => setShowExamples(false)}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Voorbeeldmotivaties</h3>
              <button className="text-sm" onClick={() => setShowExamples(false)}>Sluiten</button>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Bij succesvolle inzet en extra ondersteuning in taal en rekenen</li>
              <li>Gezien de huidige vorderingen en werkhouding</li>
              <li>Met aangepaste leerstof en praktische aanpak</li>
              <li>Op basis van recente toetsresultaten en inzet in de klas</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}

