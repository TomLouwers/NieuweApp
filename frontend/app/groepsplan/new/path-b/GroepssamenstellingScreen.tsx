"use client";
import React from "react";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import GroupCompositionSlider from "@/app/groepsplan/new/components/GroupCompositionSlider";
import { getBTotalStudents, setBTotalStudents, getBComposition, setBComposition, getBUnknown, setBUnknown } from "@/lib/stores/groepsplanStore";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export default function GroepssamenstellingScreen({ onBack, onNext }: Props) {
  const [total, setTotal] = React.useState<number>(getBTotalStudents());
  const compInit = getBComposition();
  const [perc, setPerc] = React.useState<{ basis: number; support: number; more: number }>(compInit);
  const [unknown, setUnknown] = React.useState<boolean>(getBUnknown());
  const lastIdx = React.useRef<0 | 1 | 2>(0);

  // Debounce persist (100ms)
  React.useEffect(() => {
    const t = setTimeout(() => {
      setBTotalStudents(total);
      setBComposition(perc);
      setBUnknown(unknown);
    }, 100);
    return () => clearTimeout(t);
  }, [total, perc, unknown]);

  function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

  function setUnknownChecked(v: boolean) {
    setUnknown(v);
    if (v) {
      setPerc({ basis: 70, support: 15, more: 15 });
    }
  }

  function updateIndex(idx: 0 | 1 | 2, v: number) {
    if (unknown) return;
    v = clamp(Math.round(v), 0, 100);
    lastIdx.current = idx;
    const values = [perc.basis, perc.support, perc.more] as number[];
    const othersIdx = [0,1,2].filter((i) => i !== idx);
    const rest = othersIdx.reduce((s, i) => s + values[i], 0);
    const targetRest = 100 - v;
    let scaled = othersIdx.map((i) => (rest === 0 ? targetRest / 2 : values[i] * (targetRest / rest)));
    const floors = scaled.map((x) => Math.floor(x));
    let remainder = targetRest - floors.reduce((s, x) => s + x, 0);
    const fracs = scaled.map((x, i) => ({ i, f: x - floors[i] })).sort((a, b) => b.f - a.f);
    for (let k = 0; k < floors.length && remainder > 0; k++) {
      floors[fracs[k].i] += 1; remainder -= 1;
    }
    const next = [...values] as number[];
    next[idx] = v;
    next[othersIdx[0]] = floors[0];
    next[othersIdx[1]] = floors[1];
    // Fix rounding drift if any
    const sum = next[0] + next[1] + next[2];
    if (sum !== 100) {
      const delta = 100 - sum;
      // Apply delta to last changed slider for tie-break
      next[idx] = clamp(next[idx] + delta, 0, 100);
      const sum2 = next[0] + next[1] + next[2];
      if (sum2 !== 100) {
        // as fallback adjust first other
        next[othersIdx[0]] = clamp(next[othersIdx[0]] + (100 - sum2), 0, 100);
      }
    }
    setPerc({ basis: next[0], support: next[1], more: next[2] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={2} />
      </div>

      <div>
        <h2>Hoe ziet je groep eruit?</h2>
      </div>

      <div className="space-y-2">
        <div className="text-sm">Jouw groep heeft ongeveer:</div>
        <input
          type="range"
          min={15}
          max={35}
          step={1}
          value={total}
          onChange={(e) => setTotal(Number(e.target.value))}
          className="w-full total-range"
          aria-label="Totaal aantal leerlingen"
        />
        <div className="text-base">{total} leerlingen</div>
      </div>

      <div className="space-y-3">
        <div className="text-sm">Daarvan zitten op dit moment ongeveer:</div>
        <GroupCompositionSlider label="Basisniveau" value={perc.basis} onChange={(v) => updateIndex(0, v)} total={total} disabled={unknown} />
        <GroupCompositionSlider label="Meer ondersteuning" value={perc.support} onChange={(v) => updateIndex(1, v)} total={total} disabled={unknown} />
        <GroupCompositionSlider label="Uitdaging/Meer" value={perc.more} onChange={(v) => updateIndex(2, v)} total={total} disabled={unknown} />
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={unknown} onChange={(e) => setUnknownChecked(e.target.checked)} />
        <span>Weet ik niet precies</span>
      </label>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack} aria-label="Vorige">← Vorige</button>
        <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={onNext} aria-label="Volgende">Volgende →</button>
      </div>

      <style jsx>{`
        .total-range { height: 8px; -webkit-appearance: none; appearance: none; background: transparent; }
        .total-range:focus { outline: none; }
        .total-range::-webkit-slider-runnable-track { height: 8px; background: #e5e7eb; border-radius: 9999px; }
        .total-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #3B82F6; margin-top: -8px; cursor: pointer; }
        .total-range::-moz-range-track { height: 8px; background: #e5e7eb; border-radius: 9999px; }
        .total-range::-moz-range-thumb { width: 24px; height: 24px; border: none; border-radius: 50%; background: #3B82F6; cursor: pointer; }
      `}</style>
    </div>
  );
}

