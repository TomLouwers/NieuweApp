"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";

type CL = {
  technischLezen?: string;
  spelling?: string;
  rekenen?: string;
  begrijpendLezen?: string;
  sociaalEmotioneel?: string;
  beschrijving_gedrag?: string;
};

export default function CurrentLevels({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const cl = (answers.currentLevels || {}) as CL;

  const SUBJECTS: Array<{ key: keyof CL; label: string }> = [
    { key: 'technischLezen', label: 'Technisch lezen' },
    { key: 'spelling', label: 'Spelling' },
    { key: 'rekenen', label: 'Rekenen' },
    { key: 'begrijpendLezen', label: 'Begrijpend lezen' },
    { key: 'sociaalEmotioneel', label: 'Sociaal-emotioneel' },
  ];

  const [selected, setSelected] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SUBJECTS.forEach(s => { init[s.key] = Boolean((cl as any)[s.key]); });
    return init;
  });

  function toggleSubject(key: keyof CL) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    if (selected[key]) {
      const next = { ...cl } as any;
      delete next[key];
      update({ currentLevels: next });
    }
  }

  function setLevel(path: keyof CL, val: string) {
    update({ currentLevels: { ...cl, [path]: val } });
  }

  function aviLabel(code: string) {
    const m: Record<string, string> = {
      E3: 'AVI E3 (half groep 3)',
      M3: 'AVI M3',
      E4: 'AVI E4 (half groep 4)',
      M4: 'AVI M4 (eind groep 3)',
      E5: 'AVI E5',
      M5: 'AVI M5',
      E6: 'AVI E6',
      M6: 'AVI M6',
      E7: 'AVI E7',
      M7: 'AVI M7',
      E8: 'AVI E8',
      M8: 'AVI M8',
    };
    return m[code] || code;
  }

  const canNext = SUBJECTS.some(s => selected[s.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={2} /></div>
      <h2>Waar staat de leerling nu?</h2>
      <div className="text-sm text-muted">We vragen alleen de vakken waar extra aandacht nodig is.</div>

      <div className="space-y-3">
        <div className="text-sm">Selecteer vakken: <span className="text-muted">(kies minimaal 1)</span></div>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <label key={s.key} className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${selected[s.key] ? 'bg-teal-600 text-white' : 'bg-white'}`}>
              <input type="checkbox" className="hidden" checked={!!selected[s.key]} onChange={() => toggleSubject(s.key)} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {selected['technischLezen'] && (
          <div>
            <label className="block text-sm font-medium">Technisch lezen</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.technischLezen || ''} onChange={(e) => setLevel('technischLezen', (e.target as HTMLSelectElement).value)}>
              <option value="">Kies niveau…</option>
              {['E3','M3','E4','M4','E5','M5','E6','M6','E7','M7','E8','M8'].map(v => <option key={v} value={v}>{aviLabel(v)}</option>)}
            </select>
          </div>
        )}
        {selected['spelling'] && (
          <div>
            <label className="block text-sm font-medium">Spelling</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.spelling || ''} onChange={(e) => setLevel('spelling', (e.target as HTMLSelectElement).value)}>
              <option value="">Kies niveau…</option>
              {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{`Niveau ${v}`}</option>)}
            </select>
          </div>
        )}
        {selected['rekenen'] && (
          <div>
            <label className="block text-sm font-medium">Rekenen</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.rekenen || ''} onChange={(e) => setLevel('rekenen', (e.target as HTMLSelectElement).value)}>
              <option value="">Kies niveau…</option>
              {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{`Niveau ${v}`}</option>)}
            </select>
          </div>
        )}
        {selected['begrijpendLezen'] && (
          <div>
            <label className="block text-sm font-medium">Begrijpend lezen</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.begrijpendLezen || ''} onChange={(e) => setLevel('begrijpendLezen', (e.target as HTMLSelectElement).value)}>
              <option value="">Kies niveau…</option>
              {['F','E','D','C','B','A'].map(v => <option key={v} value={v}>{`Niveau ${v}`}</option>)}
            </select>
          </div>
        )}
        {selected['sociaalEmotioneel'] && (
          <div>
            <label className="block text-sm font-medium">Sociaal-emotioneel</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={cl.sociaalEmotioneel || ''} onChange={(e) => setLevel('sociaalEmotioneel', (e.target as HTMLSelectElement).value)}>
              <option value="">Kies situatie…</option>
              <option value="geen_zorgen">Geen zorgen</option>
              <option value="lichte_zorgen">Lichte zorgen</option>
              <option value="ernstige_zorgen">Ernstige zorgen</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Gedrag en werkhouding (optioneel)</label>
        <input className="mt-1 w-full border rounded-md px-3 py-2" value={cl.beschrijving_gedrag || ''} onChange={(e) => setLevel('beschrijving_gedrag', (e.target as HTMLInputElement).value)} placeholder="Bijvoorbeeld: snel afgeleid, weinig doorzettingsvermogen, perfectionistisch…" />
      </div>

      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className={`px-4 py-2 rounded-md ${canNext ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`} disabled={!canNext} onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}

