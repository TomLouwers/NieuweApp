"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function DecisionPoint({ onUpload, onScratch }: { onUpload: () => void; onScratch: () => void }) {
  const router = useRouter();
  const [showSample, setShowSample] = React.useState(false);
  return (
    <div className="space-y-4">
      <h2>Nieuw OPP</h2>
      <div className="space-y-2">
        <span className="wb-time-badge"><span className="icon" aria-hidden>⏱</span><span>5 minuten werk</span></span>
        <div className="text-sm wb-subtle"><span aria-hidden>🔒 </span>Privacy-first: Je vult de naam van de leerling in na het downloaden. Zo blijven alle persoonlijke gegevens bij jou.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          role="button"
          tabIndex={0}
          className="wb-paper paper-texture border-0 rounded-xl p-6 hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => { router.push('/opp/new?step=a1'); onUpload(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?step=a1'); onUpload(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Ik heb een eerder OPP</h3>
          <div className="text-sm wb-subtle space-y-1">
            <p>Bouw voort op een bestaand OPP</p>
            <p>Upload PDF of Word - max 10MB</p>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="wb-paper paper-texture border-0 rounded-xl p-6 hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => { router.push('/opp/new?flow=scratch&step=b1'); onScratch(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?flow=scratch&step=b1'); onScratch(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Start vanaf nul</h3>
          <div className="text-sm wb-subtle space-y-1">
            <p><span aria-hidden>🎯 </span>Populairste keuze: beantwoord 7 vragen</p>
            <p>✓ Geen leerlingnamen opgeslagen — alles blijft bij jou</p>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="wb-paper paper-texture border-0 rounded-xl p-6 hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => setShowSample(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSample(true); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Bekijk eerst een voorbeeld</h3>
          <div className="text-sm wb-subtle space-y-1">
            <p><span aria-hidden>👁️ </span>Nieuw bij Pebble? Zie eerst wat je krijgt</p>
            <p>→ Voorbeeld OPP voor een fictieve leerling</p>
          </div>
        </div>
      </div>
      <div>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">Terug</a>
      </div>

      {showSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Voorbeeld OPP" onClick={() => setShowSample(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Voorbeeld OPP</h3>
              <button className="text-sm" onClick={() => setShowSample(false)}>Sluiten</button>
            </div>
            <div className="prose max-w-none">
              <h1>Ontwikkelingsperspectief</h1>
              <p>Leerling: [NAAM LEERLING INVULLEN] — Groep 5 — Datum: november 2025</p>
              <h2>Reden voor OPP</h2>
              <p>Korte professionele motivatie…</p>
              <h2>Huidige niveaus</h2>
              <ul>
                <li>Technisch lezen: AVI E3</li>
                <li>Rekenen: Niveau E</li>
              </ul>
              <h2>Ontwikkelingsperspectief</h2>
              <p>VMBO Basis/Kader (praktijkgericht)…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

