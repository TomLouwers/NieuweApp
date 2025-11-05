"use client";
import React from "react";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import { getSelectedChallenge, setSelectedChallenge, useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import { track } from "@/lib/utils/analytics";

const OPTIONS: string[] = [
  "Enorme niveauverschillen (meer dan 3 jaar spreiding)",
  "Veel leerlingen met dyslexie/dyscalculie",
  "Weinig instructietijd (veel uitval/gedrag)",
  "Ondersteuning van vorig blok werkte niet goed genoeg",
  "Nieuw in deze groep, ken de leerlingen nog niet goed",
  "Grote groep (28+), weinig ruimte voor differentiatie",
  "Leerlingen hebben moeite met zelfstandig werken",
  "Het gaat eigenlijk prima, gewoon continuïteit",
];

interface Props { onBack: () => void; onNext: () => void; }

export default function ChallengeScreen({ onBack, onNext }: Props) {
  const { ref, bind } = useSwipeBack(onBack);
  const [value, setValue] = React.useState<string>(getSelectedChallenge() || "");
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const headingId = "b3-title";

  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const setChallengeZ = useGroepsplanStore((s) => s.setChallenge);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return OPTIONS;
    return OPTIONS.filter(o => o.toLowerCase().includes(s));
  }, [search]);

  const [highlightPos, setHighlightPos] = React.useState<number>(() => {
    const idx = value ? OPTIONS.indexOf(value) : 0;
    const pos = Math.max(0, filtered.indexOf(OPTIONS[Math.max(0, idx)]));
    return pos >= 0 ? pos : 0;
  });

  React.useEffect(() => {
    if (!open) return;
    // reset highlight when search changes
    setHighlightPos(0);
  }, [search, open]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function confirmSelection(opt: string) {
    setValue(opt);
    setSelectedChallenge(opt);
    try { setChallengeZ(opt); } catch {}
    try { track('groepsplan_question_answered', { step: 'b3', field: 'challenge', value: opt }); } catch {}
    scheduleSave();
    setOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) { e.preventDefault(); setOpen(true); setHighlightPos(0); }
      if (e.key === "Escape") { e.preventDefault(); onBack(); }
      return;
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    const max = filtered.length;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const opt = filtered[highlightPos]; if (opt) confirmSelection(opt); return; }
    if (e.key === "Home") { e.preventDefault(); setHighlightPos(0); return; }
    if (e.key === "End") { e.preventDefault(); setHighlightPos(Math.max(0, max - 1)); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightPos((h) => {
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = (h + delta + max) % Math.max(1, max);
        return next;
      });
    }
  }

  function onRootKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (open) setOpen(false); else onBack();
      return;
    }
    if (e.key === 'Enter') {
      const canNext = Boolean(value);
      if (!open && canNext) { e.preventDefault(); onNext(); }
    }
  }

  const canNext = Boolean(value);

  return (
    <div className="space-y-6" aria-labelledby={headingId} ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={3} />
      </div>

      <div>
        <h2 id={headingId}>Wat is de grootste uitdaging voor dit blok?</h2>
      </div>

      <div className="relative dropdown" onKeyDown={onTriggerKeyDown}>
        <button ref={btnRef} type="button" aria-haspopup="listbox" aria-expanded={open} className="dropdown-trigger" onClick={() => { setOpen(v => !v); if (!open) setSearch(""); }}>
          <span className="dropdown-value">{value || "Selecteer..."}</span>
          <svg className="dropdown-arrow" viewBox="0 0 10 6" aria-hidden>
            <path d="M1 1 L5 5 L9 1" />
          </svg>
        </button>
        {open && (
          <div ref={menuRef} className="dropdown-menu" onKeyDown={onMenuKeyDown}>
            <div className="dropdown-search">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoeken..."
                className="dropdown-search-input"
                autoFocus
              />
            </div>
            <ul className="dropdown-list" role="listbox" aria-label="Uitdagingen">
              {filtered.map((opt, pos) => {
                const selected = value === opt;
                const active = highlightPos === pos;
                return (
                  <li key={opt}>
                    <button
                      role="option"
                      aria-selected={selected}
                      className={`dropdown-option ${selected ? 'selected' : ''} ${active ? 'active' : ''}`}
                      onMouseEnter={() => setHighlightPos(pos)}
                      onClick={() => confirmSelection(opt)}
                    >
                      <span className="dropdown-text">{opt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Vorige">Vorige</button>
        <button className={`px-4 py-2 rounded-md ${canNext ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} disabled={!canNext} onClick={onNext} aria-label="Volgende">
          Volgende
        </button>
      </div>
    </div>
  );
}

