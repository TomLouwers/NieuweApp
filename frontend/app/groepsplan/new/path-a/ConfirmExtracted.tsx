"use client";
import React from "react";

type Extracted = { groep?: number | null } | null | undefined;

interface ConfirmExtractedProps {
  extractedData?: Extracted;
  onBack: () => void;
  onNext: (payload: { groep: number; vak: string }) => void;
}

const VAK_OPTIONS = [
  "Rekenen (automatiseren)",
  "Rekenen (begrip/strategie)",
  "Spelling",
  "Technisch lezen",
  "Begrijpend lezen",
  "Schrijven",
  "Andere…",
] as const;

export default function ConfirmExtracted({ extractedData, onBack, onNext }: ConfirmExtractedProps) {
  const extractedGroep = Number(extractedData?.groep ?? NaN);
  const hasExtracted = Number.isInteger(extractedGroep) && extractedGroep >= 1 && extractedGroep <= 8;

  // group mode: "yes" confirms extracted; "no" lets user pick; if none extracted, default to "no"
  const [mode, setMode] = React.useState<"yes" | "no">(hasExtracted ? "yes" : "no");
  const [groep, setGroep] = React.useState<number | null>(hasExtracted ? extractedGroep : null);

  const [vakIndex, setVakIndex] = React.useState<number>(-1);
  const vak = vakIndex >= 0 ? VAK_OPTIONS[vakIndex] : "";

  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  function handleArrowNav(e: React.KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " "].includes(e.key)) return;
    e.preventDefault();
    const max = VAK_OPTIONS.length;
    if (e.key === "Home") return setVakIndex(0);
    if (e.key === "End") return setVakIndex(max - 1);
    if (e.key === "Enter" || e.key === " ") {
      if (vakIndex < 0) setVakIndex(0);
      return;
    }
    if (vakIndex < 0) return setVakIndex(0);
    const delta = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    let next = vakIndex + delta;
    if (next < 0) next = max - 1;
    if (next >= max) next = 0;
    setVakIndex(next);
    // move focus to item if present
    const el = listRef.current?.querySelectorAll<HTMLElement>("[role='radio']")[next];
    el?.focus();
  }

  const canContinue = Number.isInteger(groep) && groep! >= 1 && groep! <= 8 && vakIndex >= 0;

  return (
    <div className="space-y-6" aria-labelledby="confirm-title">
      <div>
        <h2 id="confirm-title">Ik zie dat dit voor {hasExtracted ? `Groep ${extractedGroep}` : "een groep"} was</h2>
        <p className="text-muted">Klopt dat?</p>
      </div>

      {hasExtracted ? (
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="groep-confirm"
              value="yes"
              checked={mode === "yes"}
              onChange={() => {
                setMode("yes");
                setGroep(extractedGroep);
              }}
            />
            <span>Ja, nog steeds Groep {extractedGroep}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="groep-confirm"
              value="no"
              checked={mode === "no"}
              onChange={() => setMode("no")}
            />
            <span className="inline-flex items-center gap-2">
              Nee, nu Groep
              <select
                className="border border-border rounded-md px-2 py-1"
                disabled={mode !== "no"}
                value={groep ?? ""}
                onChange={(e) => setGroep(Number(e.target.value))}
              >
                <option value="" disabled>
                  Kies groep
                </option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm">Kies nu de juiste groep</label>
          <select
            className="border border-border rounded-md px-2 py-2"
            value={groep ?? ""}
            onChange={(e) => setGroep(Number(e.target.value))}
          >
            <option value="" disabled>
              Kies groep
            </option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      <hr className="my-2 border-border" />

      <div>
        <h3>Waar ga je dit blok mee aan de slag?</h3>
      </div>

      <div
        role="radiogroup"
        aria-label="Kies vak"
        ref={listRef}
        onKeyDown={handleArrowNav}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {VAK_OPTIONS.map((label, i) => {
          const selected = vakIndex === i;
          const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm border transition-colors duration-200 min-h-[44px]";
          const styles = selected
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-foreground border-border hover:border-blue-500";
          return (
            <div
              key={label}
              role="radio"
              aria-checked={selected}
              tabIndex={selected || vakIndex < 0 ? 0 : -1}
              className={`${base} ${styles}`}
              onClick={() => setVakIndex(i)}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Vorige">
          ← Vorige
        </button>
        <button
          className={`px-4 py-2 rounded-md ${canContinue ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
          disabled={!canContinue}
          onClick={() => canContinue && onNext({ groep: groep!, vak })}
          aria-label="Volgende"
        >
          Volgende →
        </button>
      </div>
    </div>
  );
}

