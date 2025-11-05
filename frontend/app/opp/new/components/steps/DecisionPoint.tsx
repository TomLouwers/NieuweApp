"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function DecisionPoint({ onUpload, onScratch }: { onUpload: () => void; onScratch: () => void }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2>Nieuw OPP</h2>
      <div>
        <span className="wb-time-badge"><span className="icon" aria-hidden>⏱</span><span>5 minuten werk</span></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          role="button"
          tabIndex={0}
          className="wb-paper paper-texture border-0 rounded-xl p-6 hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => { router.push('/opp/new?step=a1'); onUpload(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?step=a1'); onUpload(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Ik heb een eerder OPP</h3>
          <p className="text-sm wb-subtle">Upload vorig OPP, ik vul aan</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="wb-paper paper-texture border-0 rounded-xl p-6 hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => { router.push('/opp/new?flow=scratch&step=b1'); onScratch(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?flow=scratch&step=b1'); onScratch(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Start vanaf nul</h3>
          <p className="text-sm wb-subtle">Nieuwe leerling of eerste OPP</p>
        </div>
      </div>
      <div>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">Terug</a>
      </div>
    </div>
  );
}
