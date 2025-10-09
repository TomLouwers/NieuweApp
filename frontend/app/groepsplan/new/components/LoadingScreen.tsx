"use client";
import React from "react";
import ErrorPanel from "@/app/groepsplan/new/components/ErrorPanel";
import { track } from "@/lib/utils/analytics";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps<Result = any> {
  start: () => Promise<Result>;
  onDone: (result: Result) => void;
  onRetry: () => void;
}

export default function LoadingScreen<Result = any>({ start, onDone, onRetry }: LoadingScreenProps<Result>) {
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState("Bezig met genereren…");
  const [error, setError] = React.useState<{ code?: string | null; message?: string | null } | null>(null);
  const [startedAt] = React.useState(() => Date.now());
  const minDisplayMs = 5000;
  const doneRef = React.useRef(false);

  function updateStatus(p: number) {
    if (p < 30) setStatus("Groepsplan structuur opzetten…");
    else if (p < 70) setStatus("SMARTI doelen formuleren…");
    else if (p < 90) setStatus("Interventies en aanpak beschrijven…");
    else setStatus("Document genereren…");
  }

  React.useEffect(() => {
    let t: any;
    // Linear-ish staged ramp to 99%
    function tick() {
      setProgress((prev) => {
        if (doneRef.current) return prev;
        let next = prev;
        if (prev < 30) next = Math.min(prev + 2, 29);
        else if (prev < 70) next = Math.min(prev + 1.5, 69);
        else if (prev < 90) next = Math.min(prev + 1, 89);
        else next = Math.min(prev + 0.5, 99);
        updateStatus(next);
        return Number(next.toFixed(1));
      });
      t = setTimeout(tick, 500);
    }
    t = setTimeout(tick, 500);

    // Start async
    let resolved = false;
    (async () => {
      try {
        try { track('generation_started'); } catch {}
        const res = await start();
        resolved = true;
        doneRef.current = true;
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, minDisplayMs - elapsed);
        setTimeout(() => {
          setProgress(100);
          try { track('generation_succeeded'); } catch {}
          onDone(res);
        }, wait + 300);
      } catch (e: any) {
        doneRef.current = true;
        const msg = (e && (e.message || e.toString())) || "Genereren mislukt";
        const code = (e && (e.code || e.name)) || null;
        setError({ code, message: String(msg) });
        try { track('generation_failed', { code, message: String(msg) }); } catch {}
      }
    })();

    return () => { if (t) clearTimeout(t); };
  }, [start, onDone]);

  if (error) {
    return (
      <ErrorPanel
        domain="generation"
        code={error.code}
        message={error.message}
        onPrimary={onRetry}
        primaryLabel="Probeer opnieuw"
      />
    );
  }

  const ariaMsg = `Bezig met genereren… ${Math.floor(progress)}%`;

  return (
    <div className="space-y-4 fade-in" aria-live="polite" role="status">
      <div className="text-4xl text-center" aria-hidden>⏳</div>
      <div className="text-center">{status}</div>
      <Progress value={Math.floor(progress)} label={ariaMsg} />
      <div className="mt-2 text-sm text-muted">{Math.floor(progress)}%</div>
      <div className="text-sm text-muted">~30 seconden</div>
      <style jsx>{`
        .fade-in { animation: fadeIn 500ms ease-in forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
