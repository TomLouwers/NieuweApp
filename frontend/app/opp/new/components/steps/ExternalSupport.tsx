"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

const options = ["logopedie","dyslexie_specialist","rt","psycholoog","jeugdzorg","leerplicht","cjg","geen_extern"];

export default function ExternalSupport({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const update = useOppStore((s) => s.updateAnswers);
  const list = answers.externalSupport || [];
  function toggle(name: string) {
    const has = list.includes(name);
    const next = has ? list.filter((n) => n !== name) : [...list, name];
    update({ externalSupport: next });
  }
  return (
    <div className="space-y-4">
      <h2>Wie is er betrokken?</h2>
      <div className="flex flex-wrap gap-3 text-sm">
        {options.map((key) => (
          <label key={key} className={`px-3 py-1 rounded-full border cursor-pointer ${list.includes(key) ? 'bg-teal-600 text-white' : 'bg-white'}`}>
            <input type="checkbox" className="hidden" checked={list.includes(key)} onChange={() => toggle(key)} />
            {key.replace(/_/g, ' ')}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={onNext}>Volgende</button>
      </div>
    </div>
  );
}

