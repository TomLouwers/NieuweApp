"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function StudentBasics({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  return (
    <div className="space-y-4">
      <h2>Voor wie maak je een OPP?</h2>
      <div className="text-sm text-muted">Privacy: we versturen geen naam of leeftijd naar onze AI. Het document wordt anoniem gegenereerd en je kunt het na download lokaal personaliseren.</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Groep</label>
          <input type="number" min={1} max={8} className="mt-1 w-full border rounded-md px-3 py-2" value={answers.groep || ''} onChange={(e) => update({ groep: Number(e.target.value) || null })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Voornaamwoorden</label>
          <div className="mt-1 flex items-center gap-3">
            {['jongen','meisje','anders'].map(v => (
              <label key={v} className="flex items-center gap-1">
                <input type="radio" name="gender" checked={answers.gender===v} onChange={() => update({ gender: v as any })} /> {v}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}
