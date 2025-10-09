"use client";
import React from "react";
import useSwipeBack from "@/app/groepsplan/new/hooks/useSwipeBack";
import ProgressDots from "@/app/groepsplan/new/components/ProgressDots";
import { CSSTransition } from "react-transition-group";
import { setBUnknown, setBStartPoint, setBLevelBasis, setBLevelIntensief, useGroepsplanStore } from "@/lib/stores/groepsplanStore";
import { track } from "@/lib/utils/analytics";
import Select from "@/components/ui/select";

type Choice = "begin" | "midden" | "toets" | "";

interface Props { onBack: () => void; onNext: () => void; }

export default function StartingPointScreen({ onBack, onNext }: Props) {
  const { ref, bind, thresholdReached } = useSwipeBack(onBack);
  const saveDraft = useGroepsplanStore((s) => s.saveDraft);
  const saveTimer = React.useRef<any>(null);
  const scheduleSave = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveDraft().catch(()=>{}); }, 500); };
  const [choice, setChoice] = React.useState<Choice>("");
  const [basis, setBasis] = React.useState<string>("");
  const [intensief, setIntensief] = React.useState<string>("");
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  React.useEffect(() => { headingRef.current?.focus(); }, []);

  const valid = choice && (choice !== "toets" || (basis && intensief));

  function onSelect(c: Choice) {
    setChoice(c);
    setBStartPoint(c);
    if (c !== "toets") { setBasis(""); setIntensief(""); }
    try { track('groepsplan_question_answered', { step: 'b4', field: 'start', value: c }); } catch {}
    scheduleSave();
  }

  React.useEffect(() => { setBUnknown(false); }, []);

  function onRootKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onBack(); }
    if (e.key === 'Enter' && valid) { e.preventDefault(); onNext(); }
  }

  return (
    <div className="space-y-6" ref={ref} {...bind} onKeyDown={onRootKeyDown}>
      <div className="flex items-center justify-end">
        <ProgressDots total={5} current={4} />
      </div>

      <div>
        <h2 ref={headingRef} tabIndex={-1}>Waar begin je in het jaar?</h2>
      </div>

      <div role="radiogroup" aria-label="Startpunt" className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="radio" name="start" checked={choice === "begin"} onChange={() => onSelect("begin")} />
          <span>Begin van het schooljaar</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="start" checked={choice === "midden"} onChange={() => onSelect("midden")} />
          <span>Midden in het jaar</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="start" checked={choice === "toets"} onChange={() => onSelect("toets")} />
          <span>Ik heb recente toetsgegevens</span>
        </label>
      </div>

      <CSSTransition in={choice === "toets"} timeout={300} classNames="expansion" unmountOnExit nodeRef={nodeRef}>
        <div ref={nodeRef} className="rounded-md border border-border p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-sm">Basisgroep niveau</div>
              <Select value={basis} onChange={(e) => { setBasis((e.target as HTMLSelectElement).value); setBLevelBasis((e.target as HTMLSelectElement).value || null); try { track('groepsplan_question_answered', { step: 'b4', field: 'basisLevel', value: (e.target as HTMLSelectElement).value }); } catch {} scheduleSave(); }}>
                <option value="">Kies niveau</option>
                {['A','B','C','D','E','F'].map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <div className="text-sm">Intensieve groep niveau</div>
              <Select value={intensief} onChange={(e) => { setIntensief((e.target as HTMLSelectElement).value); setBLevelIntensief((e.target as HTMLSelectElement).value || null); try { track('groepsplan_question_answered', { step: 'b4', field: 'intensiefLevel', value: (e.target as HTMLSelectElement).value }); } catch {} scheduleSave(); }}>
                <option value="">Kies niveau</option>
                {['A','B','C','D','E','F'].map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </Select>
            </label>
          </div>
        </div>
      </CSSTransition>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className={`border border-border px-4 py-2 rounded-md ${thresholdReached ? 'ring-2 ring-blue-500' : ''}`} onClick={onBack} aria-label="Vorige">← Vorige</button>
        <button className={`px-4 py-2 rounded-md ${valid ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} disabled={!valid} onClick={onNext} aria-label="Volgende">Volgende →</button>
      </div>
    </div>
  );
}
