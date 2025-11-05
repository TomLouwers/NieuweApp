"use client";
import React from "react";
import ErrorPanel from "@/app/groepsplan/new/components/ErrorPanel";
import { track } from "@/lib/utils/analytics";

interface LoadingScreenExternal {
  setStatus: (s: string) => void;
  setProgress: (p: number) => void;
}

interface LoadingScreenProps<Result = any> {
  start: (ext?: LoadingScreenExternal) => Promise<Result>;
  onDone: (result: Result) => void;
  onRetry: () => void;
  externalRef?: React.MutableRefObject<LoadingScreenExternal | null>;
}

export default function LoadingScreen<Result = any>({ start, onDone, onRetry, externalRef }: LoadingScreenProps<Result>) {
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState("Je plan wordt geschreven");
  const [error, setError] = React.useState<{ code?: string | null; message?: string | null } | null>(null);
  const [startedAt] = React.useState(() => Date.now());
  const minDisplayMs = 5000;
  const doneRef = React.useRef(false);

  // Optional: expose setters to parent for live updates
  React.useEffect(() => {
    if (!externalRef) return;
    externalRef.current = {
      setStatus: (s) => setStatus(String(s || "")),
      setProgress: (p) => setProgress(Math.max(0, Math.min(100, Number(p) || 0))),
    };
    return () => { externalRef.current = null; };
  }, [externalRef]);

  React.useEffect(() => {
    const msgs = [
      "Je plan wordt geschreven",
      "Structuur opzetten",
      "Details invullen",
      "Laatste controle"
    ];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % msgs.length; setStatus(msgs[i]); }, 3000);
    return () => clearInterval(t);
  }, []);

  function stepProgress(prev: number) {
    if (prev < 30) return Math.min(prev + 2, 29);
    if (prev < 70) return Math.min(prev + 1.5, 69);
    if (prev < 90) return Math.min(prev + 1, 89);
    return Math.min(prev + 0.5, 99);
  }

  React.useEffect(() => {
    let t: any;
    function tick() {
      setProgress((prev) => {
        if (doneRef.current) return prev;
        const next = stepProgress(prev);
        return Number(next.toFixed(1));
      });
      t = setTimeout(tick, 500);
    }
    t = setTimeout(tick, 500);

    (async () => {
      try {
        try { track('generation_started'); } catch {}
        const res = await start(externalRef?.current || undefined);
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

  return (
    <div className="theme-warmbath wb-gen-bg wb-gen-wrap fade-in" aria-live="polite" role="status">
      <div className="flex flex-col items-center">
        <div className="paper-stack" aria-hidden>
          <div className="paper paper-1" />
          <div className="paper paper-2" />
          <div className="paper paper-3 writing" />
        </div>
        <h2 className="text-center" style={{ fontSize: 18 }}>{status}</h2>
        <div className="wb-progress-track" aria-hidden>
          <div className="wb-progress-fill" style={{ width: `${Math.floor(progress)}%` }} />
        </div>
        <div className="mt-2 text-sm text-muted">{Math.floor(progress)}%</div>
        <div className="text-sm text-muted">Ongeveer 20–30 seconden</div>
      </div>
      <style jsx>{`
        .fade-in { animation: fadeIn 300ms ease-in forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
