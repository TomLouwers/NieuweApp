"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function StudentBasics({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  return (
    <div className="space-y-4">
      <h2>Voor wie maak je een OPP?</h2>
      <div className="text-sm wb-subtle">Privacy: we versturen geen naam of leeftijd naar onze AI. Het document wordt anoniem gegenereerd en je kunt het na download lokaal personaliseren.</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="wb-text-field-label">Groep</label>
          <div className="wb-text-field-wrapper">
            <input type="number" min={1} max={8} className="wb-text-field-input" value={answers.groep || ''} onChange={(e) => update({ groep: Number(e.target.value) || null })} placeholder="1-8" />
            <div className="wb-text-field-underline" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Voornaamwoorden</label>
          <div className="mt-1 flex items-center gap-3">
            {['jongen','meisje','anders'].map(v => (
              <label key={v} className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input type="radio" name="gender" checked={answers.gender===v} onChange={() => update({ gender: v as any })} />
                <span>{v}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md wb-btn wb-btn-secondary" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md wb-btn wb-btn-primary" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}
