"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function DecisionPoint({ onUpload, onScratch }: { onUpload: () => void; onScratch: () => void }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2>Nieuw OPP</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          role="button"
          tabIndex={0}
          className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-600 cursor-pointer"
          onClick={() => { router.push('/opp/new?step=a1'); onUpload(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?step=a1'); onUpload(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Ik heb een eerder OPP</h3>
          <p className="text-sm text-muted">Upload vorig OPP, ik vul aan</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-600 cursor-pointer"
          onClick={() => { router.push('/opp/new?flow=scratch&step=b1'); onScratch(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/opp/new?flow=scratch&step=b1'); onScratch(); } }}
        >
          <h3 className="text-lg font-semibold mb-2">Start vanaf nul</h3>
          <p className="text-sm text-muted">Nieuwe leerling of eerste OPP</p>
        </div>
      </div>
      <div>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">Terug</a>
      </div>
    </div>
  );
}

