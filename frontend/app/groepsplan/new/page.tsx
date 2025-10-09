"use client";
import StepFlow from "./components/StepFlow";
import { Suspense, useEffect, useState } from "react";
import { loadLatestDraftLocal, clearDraftLocal } from "@/lib/utils/persistence";
import { useRouter } from "next/navigation";
import { useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import { track } from "@/lib/utils/analytics";

export default function NewGroepsplanPage() {
  const router = useRouter();
  const loadDraft = useGroepsplanStore((s) => s.loadDraft);
  const clearDraft = useGroepsplanStore((s) => s.clearDraft);
  const getState = useGroepsplanStore.getState;
  const [resume, setResume] = useState<{ key: string; savedAt: number; data: any } | null>(null);
  useEffect(() => {
    track('groepsplan_new_viewed');
    (async () => {
      const d = await loadLatestDraftLocal().catch(() => null);
      if (d) setResume(d);
    })();
  }, []);
  return (
    <main className="space-y-4">
      <div>
        <h1>Nieuw Groepsplan</h1>
        <p className="text-muted">Maak een keuze om te starten.</p>
      </div>
      <Suspense fallback={<div className="loading">Laden…</div>}>
        <StepFlow />
      </Suspense>
      {resume && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Je was bezig met een groepsplan</h3>
            <div className="text-sm text-muted">
              {resume.data?.answers?.groep ? `Groep ${resume.data.answers.groep}` : 'Groep ?'}, {resume.data?.answers?.vakgebied || 'Vak ?'}
              <br />
              Vraag {(() => {
                const s = String(resume.data?.currentStep || 'decision');
                if (s.startsWith('b')) return `${s.replace('b','')}`;
                if (s.startsWith('a')) return `${s.replace('a','')}`;
                return '1';
              })()} van 5
            </div>
            <div className="flex items-center justify-end gap-3">
              <button className="border border-border px-4 py-2 rounded-md" onClick={async () => { await clearDraftLocal(resume.key); await clearDraft(); setResume(null); router.push('/groepsplan/new'); }}>Opnieuw beginnen</button>
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={async () => { await loadDraft(); const step = useGroepsplanStore.getState().currentStep || 'decision'; setResume(null); router.push(`/groepsplan/new?step=${step}`); }}>Verder gaan</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
