"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

const BASE_OPTIONS = ["logopedie","dyslexie_specialist","rt","psycholoog","jeugdzorg","leerplicht","cjg"];

export default function ExternalSupport({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const list = answers.externalSupport || [];
  const [customMode, setCustomMode] = React.useState(false);
  const [customText, setCustomText] = React.useState("");
  function toggle(name: string) {
    if (name === 'geen_extern') {
      const checked = list.includes('geen_extern');
      update({ externalSupport: checked ? [] : ['geen_extern'] });
      return;
    }
    const hasNone = list.includes('geen_extern');
    const base = hasNone ? [] : list;
    const has = base.includes(name);
    const next = has ? base.filter((n) => n !== name) : [...base, name];
    update({ externalSupport: next });
  }
  function addCustom() {
    const v = (customText || '').trim();
    if (!v) return;
    const clean = v.toLowerCase();
    update({ externalSupport: [...(list.filter(n => n !== 'geen_extern')), clean] });
    setCustomMode(false);
    setCustomText("");
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={4} /></div>
      <h2>Wie is er betrokken?</h2>
      <div className="flex flex-wrap gap-3 text-sm">
        {BASE_OPTIONS.map((key) => (
          <label key={key} className={`px-3 py-1 rounded-full border cursor-pointer ${list.includes(key) ? 'bg-teal-600 text-white' : 'bg-white'}`}>
            <input type="checkbox" className="hidden" checked={list.includes(key)} onChange={() => toggle(key)} />
            {key.replace(/_/g, ' ')}
          </label>
        ))}
        <label key="andere" className={`px-3 py-1 rounded-full border cursor-pointer ${customMode ? 'bg-teal-600 text-white' : 'bg-white'}`} onClick={() => setCustomMode(true)}>
          andere...
        </label>
      </div>

      {customMode && (
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="text-sm">Andere betrokken partij</div>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Bijv: ambulante begeleiding autisme" value={customText} onChange={(e) => setCustomText((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key==='Enter') { e.preventDefault(); addCustom(); } if (e.key==='Escape') { e.preventDefault(); setCustomMode(false); } }} />
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-md border" type="button" onClick={addCustom}>Toevoegen</button>
            <button className="text-sm text-blue-600 hover:underline" type="button" onClick={() => setCustomMode(false)}>Annuleren</button>
          </div>
        </div>
      )}

      <div className="pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={list.includes('geen_extern')} onChange={() => toggle('geen_extern')} />
          <span>Geen externe partijen betrokken (alleen school)</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}
