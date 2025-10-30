"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function SummaryGenerate({ onBack }: { onBack: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const generate = useOppStore((s) => s.generateOpp);
  const gen = useOppStore((s) => s.generation);

  async function onDownload() {
    const content = useOppStore.getState().generation.content || '';
    if (!content) return;
    const meta = { studentName: '[Leerling]', groep: answers.groep || '' };
    const resp = await fetch('/api/export-opp-word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, metadata: meta }) });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `opp_anon_g${meta.groep || ''}.docx`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h2>Samenvatting & Genereren</h2>
      <div className="text-sm bg-gray-50 p-4 rounded-md border">
        <div>Leerling: Anoniem, groep {answers.groep || '?'}</div>
        <div>Uitstroomprofiel: {answers.uitstroomprofiel?.type || 'onbekend'}</div>
        <div>Oudercontact: {answers.parentInvolvement || 'onbekend'}</div>
      </div>
      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" onClick={generate} disabled={gen.status==='loading'}>
          {gen.status==='loading' ? 'Maken…' : 'Genereer OPP'}
        </button>
        {gen.status==='done' && (
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={onDownload}>Download als Word</button>
        )}
      </div>
      {gen.status==='error' && <div className="text-sm text-red-600">Er ging iets mis bij genereren.</div>}
      {gen.status==='done' && (
        <div className="mt-4 p-4 border rounded-md bg-white max-h-80 overflow-auto">
          <h3 className="text-md font-semibold mb-2">Voorbeeld (Markdown)</h3>
          <pre className="whitespace-pre-wrap text-sm">{gen.content}</pre>
        </div>
      )}
    </div>
  );
}
