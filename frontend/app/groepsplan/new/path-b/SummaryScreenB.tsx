"use client";
import React from "react";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import { useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import {
  getSelectedGroep,
  getSelectedVak,
  getSelectedChallenge,
  getBTotalStudents,
  getBComposition,
  getBStartPoint,
  getBLevelBasis,
  getBLevelIntensief,
  getSummaryPeriode,
  getSummaryAantalLeerlingen,
  getSummaryGroepsindeling,
  setSummaryPeriode,
  setSummaryAantalLeerlingen,
  setSummaryGroepsindeling,
} from "@/lib/stores/groepsplanStore";

interface SummaryScreenBProps {
  onBack: () => void;
  onGenerate: () => void;
}

export default function SummaryScreenB({ onBack, onGenerate }: SummaryScreenBProps) {
  const { ref, bind, thresholdReached } = useSwipeBack(onBack);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  React.useEffect(() => { headingRef.current?.focus(); }, []);
  const groep = getSelectedGroep();
  const vak = getSelectedVak();
  const challenge = getSelectedChallenge();
  const total = getBTotalStudents();
  const comp = getBComposition();
  const start = getBStartPoint();
  const basisLv = getBLevelBasis();
  const intensiefLv = getBLevelIntensief();

  const initialAantal = getSummaryAantalLeerlingen() || String(total || "");
  const [periode, setPeriode] = React.useState<string>(getSummaryPeriode() || "");
  const [aantal, setAantal] = React.useState<string>(initialAantal);
  const [indeling, setIndeling] = React.useState<string>(getSummaryGroepsindeling() || "");

  const [editPeriode, setEditPeriode] = React.useState(false);
  const [editAantal, setEditAantal] = React.useState(false);
  const [editIndeling, setEditIndeling] = React.useState(false);
  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };

  React.useEffect(() => { setSummaryPeriode(periode || null); scheduleSave(); }, [periode]);
  React.useEffect(() => { setSummaryAantalLeerlingen(aantal || null); scheduleSave(); }, [aantal]);
  React.useEffect(() => { setSummaryGroepsindeling(indeling || null); scheduleSave(); }, [indeling]);

  const canGenerate = Boolean((periode || "").trim()) && Boolean(parseInt(aantal)) && Boolean(indeling);

  function count(p: number) { return Math.round((p * (parseInt(aantal) || total || 0)) / 100); }

  function onRootKeyDown(e: React.KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (e.key === 'Escape') { e.preventDefault(); onBack(); }
    if (e.key === 'Enter' && canGenerate && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { e.preventDefault(); onGenerate(); }
  }

  return (
    <div className="space-y-6" ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={5} />
        <span className="ml-3 text-sm">Klaar!</span>
      </div>

      <h2 ref={headingRef} tabIndex={-1}>Samenvatting</h2>

      <ul className="space-y-2">
        <li className="checkmark-item" style={{ ['--index' as any]: 0 } as React.CSSProperties}><div className="rounded-md border border-border p-3">Groep: {groep != null ? `Groep ${groep}` : '-'}</div></li>
        <li className="checkmark-item" style={{ ['--index' as any]: 1 } as React.CSSProperties}><div className="rounded-md border border-border p-3">Vak: {vak || '-'}</div></li>
        <li className="checkmark-item" style={{ ['--index' as any]: 2 } as React.CSSProperties}><div className="rounded-md border border-border p-3">Uitdaging: {challenge || '-'}</div></li>
        <li className="checkmark-item" style={{ ['--index' as any]: 3 } as React.CSSProperties}><div className="rounded-md border border-border p-3">Startpunt: {start || '-'}</div></li>
        {start === 'toets' ? (
          <li className="checkmark-item" style={{ ['--index' as any]: 4 } as React.CSSProperties}>
            <div className="rounded-md border border-border p-3">Niveaus — Basis: {basisLv || '-'}, Intensief: {intensiefLv || '-'}</div>
          </li>
        ) : null}
        <li className="checkmark-item" style={{ ['--index' as any]: 5 } as React.CSSProperties}>
          <div className="rounded-md border border-border p-3">Totaal leerlingen: {parseInt(aantal) || total || 0}</div>
        </li>
        <li className="checkmark-item" style={{ ['--index' as any]: 6 } as React.CSSProperties}>
          <div className="rounded-md border border-border p-3">
            <div>Basis: {comp.basis}% → {count(comp.basis)} leerlingen</div>
            <div>Meer ondersteuning: {comp.support}% → {count(comp.support)} leerlingen</div>
            <div>Uitdaging/Meer: {comp.more}% → {count(comp.more)} leerlingen</div>
          </div>
        </li>
        <li className="checkmark-item" style={{ ['--index' as any]: 7 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-2 rounded-md border border-border p-3 w-full">
            <div>
              <div className="text-sm text-muted">Periode</div>
              <div className="text-base">{periode || '-'}</div>
            </div>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditPeriode((v) => !v)}>✏️ Aanpassen</button>
          </div>
        </li>
        {editPeriode && (
          <li><div className="rounded-md border border-border p-3"><input className="w-full border border-border rounded-md px-3 py-2" placeholder="Bijv. Blok 2 (nov-jan)" value={periode} onChange={(e) => setPeriode(e.target.value)} /></div></li>
        )}
        <li className="checkmark-item" style={{ ['--index' as any]: 8 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-2 rounded-md border border-border p-3 w-full">
            <div>
              <div className="text-sm text-muted">Aantal leerlingen</div>
              <div className="text-base">{aantal || '-'}</div>
            </div>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditAantal((v) => !v)}>✏️ Aanpassen</button>
          </div>
        </li>
        {editAantal && (
          <li><div className="rounded-md border border-border p-3"><input className="w-full border border-border rounded-md px-3 py-2" type="number" min={1} inputMode="numeric" placeholder="Bijv. 28" value={aantal} onChange={(e) => setAantal(e.target.value)} /></div></li>
        )}
        <li className="checkmark-item" style={{ ['--index' as any]: 9 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-2 rounded-md border border-border p-3 w-full">
            <div>
              <div className="text-sm text-muted">Groepsindeling</div>
              <div className="text-base">{indeling || '-'}</div>
            </div>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditIndeling((v) => !v)}>✏️ Aanpassen</button>
          </div>
        </li>
        {editIndeling && (
          <li>
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="text-sm">Groepsindeling</div>
              <div className="flex flex-wrap gap-2">
                {["basis", "intensief", "meer"].map((opt) => (
                  <button key={opt} type="button" className={`px-3 py-2 rounded-md border ${indeling === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-foreground border-border hover:border-blue-500"}`} onClick={() => setIndeling(opt)}>{opt}</button>
                ))}
              </div>
            </div>
          </li>
        )}
      </ul>

      <div className="flex items-center justify-end gap-3">
        <button className={`border border-border px-4 py-2 rounded-md ${thresholdReached ? 'ring-2 ring-blue-500' : ''}`} onClick={onBack} aria-label="Vorige">← Vorige</button>
        <button className={`px-4 py-2 rounded-md ${canGenerate ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} disabled={!canGenerate} onClick={onGenerate} aria-label="Genereer groepsplan">✓ Genereer groepsplan</button>
      </div>
    </div>
  );
}
