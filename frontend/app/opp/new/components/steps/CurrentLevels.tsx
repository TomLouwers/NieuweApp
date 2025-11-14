"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

export default function CurrentLevels({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const cl = answers.currentLevels || {};
  function set(path: keyof typeof cl, val: string) {
    update({ currentLevels: { ...cl, [path]: val } });
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={2} /></div>
      <h2>Waar staat de leerling nu?</h2>
      <div className="text-sm text-muted">Vul alleen de vakken in waar de leerling extra ondersteuning krijgt. Andere vakken kun je leeg laten.</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium">Technisch lezen</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.technischLezen || ''} onChange={(e) => set('technischLezen', e.target.value)}>
            <option value="">Kies...</option>
            {['E3','M3','E4','M4','E5','M5','E6','M6','E7','M7','E8','M8'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Spelling</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.spelling || ''} onChange={(e) => set('spelling', e.target.value)}>
            <option value="">Kies...</option>
            {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Rekenen</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.rekenen || ''} onChange={(e) => set('rekenen', e.target.value)}>
            <option value="">Kies...</option>
            {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Begrijpend lezen</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.begrijpendLezen || ''} onChange={(e) => set('begrijpendLezen', e.target.value)}>
            <option value="">Kies...</option>
            {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Sociaal-emotioneel</label>
          <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.sociaalEmotioneel || ''} onChange={(e) => set('sociaalEmotioneel', e.target.value)}>
            <option value="">Kies...</option>
            <option value="geen_zorgen">Geen zorgen</option>
            <option value="lichte_zorgen">Lichte zorgen</option>
            <option value="ernstige_zorgen">Ernstige zorgen</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Gedrag en werkhouding (optioneel)</label>
        <input className="mt-1 w-full border rounded-md px-3 py-2" value={cl.beschrijving_gedrag || ''} onChange={(e) => set('beschrijving_gedrag', e.target.value)} placeholder="Bijv: snel afgeleid, moeite met taakafmaak, perfectionistisch…" />
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}
