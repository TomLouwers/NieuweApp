"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import { useRouter } from "next/navigation";

export default function SummaryGenerate({ onBack }: { onBack: () => void }) {
  const answers = useOppStore((s) => s.answers);
  const generate = useOppStore((s) => s.generateOpp);
  const gen = useOppStore((s) => s.generation);
  const currentStep = useOppStore((s) => s.currentStep);
  const router = useRouter();

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

  function mapReason(id?: string | null) {
    const map: Record<string,string> = {
      significante_achterstand: 'Flinke leerachterstand (2+ jaar)',
      gedragsproblematiek: 'Gedrag belemmert ontwikkeling',
      meervoudige_problematiek: 'Meerdere uitdagingen tegelijk',
      naar_so: 'Oriëntatie op speciaal onderwijs',
      terug_van_so: 'Overstap vanuit speciaal onderwijs',
      langdurige_ziekte: 'Langdurige afwezigheid door ziekte',
    };
    return (id && map[id]) || 'Onbekend';
  }
  function mapParent(id?: string | null) {
    const map: Record<string,string> = {
      involved_constructive: 'Constructief en betrokken',
      involved_but_concerned: 'Betrokken maar bezorgd',
      difficult_contact: 'Moeizaam contact',
      conflict: 'Conflictsituatie of miscommunicatie',
      low_contact: 'Weinig contact mogelijk',
      too_early: 'Nog te vroeg om te beoordelen',
    };
    return (id && map[id]) || 'Onbekend';
  }
  function mapUitstroom(id?: string | null) {
    const map: Record<string,string> = {
      vmbo_basis_kader: 'VMBO Basis/Kader (praktijkgericht)',
      vmbo_kader_tl: 'VMBO Kader/TL (gemengd)',
      havo: 'HAVO (theoretisch)',
      speciaal_vo: 'Speciaal VO (zeer intensief)',
      onduidelijk: 'Nog te vroeg om te bepalen',
    };
    return (id && map[id]) || 'Onbekend';
  }
  function goEdit(step: 'reason'|'levels'|'uitstroom'|'extern'|'ouders'|'context') {
    const isUpload = String(currentStep||'').startsWith('a');
    const stepMap = {
      reason: isUpload ? 'a3' : 'b2',
      levels: isUpload ? 'a4' : 'b3',
      uitstroom: isUpload ? 'a5' : 'b4',
      extern: isUpload ? 'a6' : 'b5',
      ouders: isUpload ? 'a7' : 'b6',
      context: isUpload ? 'a8' : 'b7',
    } as const;
    router.push(`/opp/new?step=${(stepMap as any)[step]}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><ProgressDots total={7} current={7} /></div>
      <h2>Samenvatting</h2>
      <div className="text-sm text-muted">Controleer of alles klopt voordat je het OPP genereert.</div>

      <div className="text-sm bg-gray-50 p-4 rounded-md border space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Leerling</div>
            <div>[Je vult de naam in na download] 🔒</div>
            <div>Groep: {answers.groep || '?'}</div>
          </div>
        </div>
        <hr className="border-border" />
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Reden voor OPP</div>
            <div>{mapReason(answers.reasonForOpp)}</div>
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('reason')}>Aanpassen</button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Huidige niveaus</div>
            <ul className="list-disc list-inside">
              {answers.currentLevels?.technischLezen ? <li>Technisch lezen: {answers.currentLevels.technischLezen}</li> : null}
              {answers.currentLevels?.spelling ? <li>Spelling: {answers.currentLevels.spelling}</li> : null}
              {answers.currentLevels?.rekenen ? <li>Rekenen: {answers.currentLevels.rekenen}</li> : null}
              {answers.currentLevels?.begrijpendLezen ? <li>Begrijpend lezen: {answers.currentLevels.begrijpendLezen}</li> : null}
              {answers.currentLevels?.sociaalEmotioneel ? <li>Sociaal-emotioneel: {String(answers.currentLevels.sociaalEmotioneel).replace(/_/g,' ')}</li> : null}
              {answers.currentLevels?.beschrijving_gedrag ? <li>Gedrag/werkhouding: {answers.currentLevels.beschrijving_gedrag}</li> : null}
            </ul>
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('levels')}>Aanpassen</button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Ontwikkelingsperspectief</div>
            <div>{mapUitstroom(answers.uitstroomprofiel?.type || null)}</div>
            {answers.uitstroomprofiel?.rationale ? <div className="text-muted">Motivatie: {answers.uitstroomprofiel.rationale}</div> : null}
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('uitstroom')}>Aanpassen</button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Externe betrokkenen</div>
            <div>{(answers.externalSupport||[]).length ? (answers.externalSupport||[]).filter(v=>v!== 'geen_extern').map(v => v.replace(/_/g,' ')).join(', ') || 'Geen' : 'Geen'}</div>
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('extern')}>Aanpassen</button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Samenwerking ouders</div>
            <div>{mapParent(answers.parentInvolvement)}</div>
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('ouders')}>Aanpassen</button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-muted">Extra context</div>
            <div>{answers.additionalContext || '—'}</div>
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => goEdit('context')}>Aanpassen</button>
        </div>
      </div>

      <div className="text-sm text-muted">Dit duurt ongeveer 30 seconden. Na downloaden: vul de naam van de leerling in bovenaan het document.</div>

      <div className="flex items-center gap-3">
        <button className="border px-4 py-2 rounded-md" onClick={onBack}>Terug</button>
        <button className={`px-4 py-2 rounded-md ${gen.status==='loading' ? 'bg-gray-200 text-gray-500' : 'bg-teal-600 text-white'}`} onClick={generate} disabled={gen.status==='loading'}>
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

