"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function ConfirmStudent({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);

  return (
    <div className="space-y-4">
      <h2>Bevestig leerling</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Naam</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={answers.studentName || ''} onChange={(e) => update({ studentName: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Leeftijd</label>
          <input type="number" min={3} max={16} className="mt-1 w-full border rounded-md px-3 py-2" value={answers.age || ''} onChange={(e) => update({ age: Number(e.target.value) || null })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Groep</label>
          <input type="number" min={1} max={8} className="mt-1 w-full border rounded-md px-3 py-2" value={answers.groep || ''} onChange={(e) => update({ groep: Number(e.target.value) || null })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Geslacht</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={answers.gender || ''} onChange={(e) => update({ gender: e.target.value as any })}>
            <option value="">Kies...</option>
            <option value="jongen">Jongen</option>
            <option value="meisje">Meisje</option>
            <option value="anders">Anders</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}

