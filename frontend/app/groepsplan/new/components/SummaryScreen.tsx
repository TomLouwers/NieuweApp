"use client";
import React from "react";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import { useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import {
  getSelectedGroep,
  getSelectedVak,
  getSummaryPeriode,
  getSummaryAantalLeerlingen,
  getSummaryGroepsindeling,
  setSummaryPeriode,
  setSummaryAantalLeerlingen,
  setSummaryGroepsindeling,
} from "@/lib/stores/groepsplanStore";

interface SummaryScreenProps {
  onBack: () => void;
  onGenerate: () => void;
}

export default function SummaryScreen({ onBack, onGenerate }: SummaryScreenProps) {
  const { ref, bind, thresholdReached } = useSwipeBack(onBack);
  const groep = getSelectedGroep();
  const vak = getSelectedVak();
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  React.useEffect(() => { headingRef.current?.focus(); }, []);

  const [periode, setPeriode] = React.useState<string>(getSummaryPeriode() || "");
  const [aantal, setAantal] = React.useState<string>(getSummaryAantalLeerlingen() || "");
  const [indeling, setIndeling] = React.useState<string>(getSummaryGroepsindeling() || "");

  const [editPeriode, setEditPeriode] = React.useState(false);
  const [editAantal, setEditAantal] = React.useState(false);
  const [editIndeling, setEditIndeling] = React.useState(false);
  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };

  const [announce, setAnnounce] = React.useState("Klaar!");
  React.useEffect(() => {
    const t = setTimeout(() => setAnnounce(""), 1500);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => { setSummaryPeriode(periode || null); scheduleSave(); }, [periode]);
  React.useEffect(() => { setSummaryAantalLeerlingen(aantal || null); scheduleSave(); }, [aantal]);
  React.useEffect(() => { setSummaryGroepsindeling(indeling || null); scheduleSave(); }, [indeling]);

  const canGenerate = Boolean((periode || "").trim()) && Boolean(parseInt(aantal)) && Boolean(indeling);

  const items = [
    { label: "Groep", value: groep != null ? `Groep ${groep}` : "-" },
    { label: "Vak", value: vak || "-" },
    { label: "Periode", value: periode || "-", edit: "periode" },
    { label: "Aantal leerlingen", value: aantal || "-", edit: "aantal" },
    { label: "Groepsindeling", value: indeling || "-", edit: "indeling" },
  ];

  function onRootKeyDown(e: React.KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (e.key === 'Escape') { e.preventDefault(); onBack(); }
    if (e.key === 'Enter' && canGenerate && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { e.preventDefault(); onGenerate(); }
  }

  return (
    <div className="space-y-6" ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>

      <h2 ref={headingRef} tabIndex={-1}>Samenvatting</h2>

      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.label} className="checkmark-item" style={{ ["--index" as any]: i } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-2 rounded-md border border-border p-3">
              <div>
                <div className="text-sm text-muted">{it.label}</div>
                <div className="text-base">{it.value}</div>
              </div>
              {it.edit === "periode" ? (
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditPeriode((v) => !v)}>✏️ Aanpassen</button>
              ) : it.edit === "aantal" ? (
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditAantal((v) => !v)}>✏️ Aanpassen</button>
              ) : it.edit === "indeling" ? (
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditIndeling((v) => !v)}>✏️ Aanpassen</button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {/* Inline edit blocks */}
      {editPeriode && (
        <div className="rounded-md border border-border p-3">
          <label className="text-sm">Periode</label>
          <input
            className="mt-1 w-full border border-border rounded-md px-3 py-2"
            placeholder="Bijv. Blok 2 (nov-jan)"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          />
        </div>
      )}

      {editAantal && (
        <div className="rounded-md border border-border p-3">
          <label className="text-sm">Aantal leerlingen</label>
          <input
            className="mt-1 w-full border border-border rounded-md px-3 py-2"
            inputMode="numeric"
            type="number"
            min={1}
            placeholder="Bijv. 25"
            value={aantal}
            onChange={(e) => setAantal(e.target.value)}
          />
        </div>
      )}

      {editIndeling && (
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="text-sm">Groepsindeling</div>
          <div className="flex flex-wrap gap-2">
            {["basis", "intensief", "meer"].map((opt) => (
              <button
                key={opt}
                type="button"
                className={`px-3 py-2 rounded-md border ${indeling === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-foreground border-border hover:border-blue-500"}`}
                onClick={() => setIndeling(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button className={`border border-border px-4 py-2 rounded-md ${thresholdReached ? 'ring-2 ring-blue-500' : ''}`} onClick={onBack} aria-label="Vorige">← Vorige</button>
        <button
          className={`px-4 py-2 rounded-md ${canGenerate ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
          disabled={!canGenerate}
          onClick={onGenerate}
          aria-label="Genereer groepsplan"
        >
          ✓ Genereer groepsplan
        </button>
      </div>
    </div>
  );
}
