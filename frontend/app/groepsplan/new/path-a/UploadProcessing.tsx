"use client";
import React from "react";
import { setCurrentPath } from "@/lib/stores/groepsplanStore";

interface UploadProcessingProps {
  start: () => Promise<any>;
  onDone: (result?: any) => void;
  onRetry: () => void;
  onStartFromScratch: () => void;
}

export default function UploadProcessing({ start, onDone, onRetry, onStartFromScratch }: UploadProcessingProps) {
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState("Bestand uploaden…");
  const [startedAt] = React.useState(() => Date.now());
  const [longHint, setLongHint] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const doneRef = React.useRef(false);

  React.useEffect(() => { setCurrentPath('upload'); }, []);

  React.useEffect(() => {
    let tick: any;
    let hintTimer: any;

    function updateStatus(p: number) {
      if (p < 20) setStatus("Bestand uploaden…");
      else if (p < 60) setStatus("Document analyseren…");
      else if (p < 100) setStatus("Informatie ophalen…");
      else setStatus("Klaar");
    }

    function scheduleProgress() {
      tick = setInterval(() => {
        setProgress((prev) => {
          if (doneRef.current) return prev; // stop auto-increment; finalization handled separately
          let next = prev;
          if (prev < 20) next = Math.min(prev + 3, 19);
          else if (prev < 60) next = Math.min(prev + 2, 59);
          else if (prev < 90) next = Math.min(prev + 1, 89);
          else next = Math.min(prev + 1, 99);
          updateStatus(next);
          return next;
        });
      }, 600);
    }

    function scheduleHint() {
      hintTimer = setTimeout(() => setLongHint(true), 30000);
    }

    scheduleProgress();
    scheduleHint();

    // Start async work
    start()
      .then((result) => {
        doneRef.current = true;
        // animate to 100 after server complete
        setProgress((prev) => (prev >= 100 ? prev : 100));
        setStatus("Klaar");
        setTimeout(() => onDone(result), 300);
      })
      .catch(() => {
        doneRef.current = true;
        setError("Dit bestand kan ik niet lezen");
      })
      .finally(() => {
        if (tick) clearInterval(tick);
        if (hintTimer) clearTimeout(hintTimer);
      });

    return () => { if (tick) clearInterval(tick); if (hintTimer) clearTimeout(hintTimer); };
  }, [start, onDone]);

  if (error) {
    return (
      <div className="space-y-4" role="alert" aria-live="assertive">
        <h2>Dit bestand kan ik niet lezen</h2>
        <p className="text-muted">Controleer of het bestand niet corrupt is en probeer het opnieuw, of start vanaf nul.</p>
        <div className="flex items-center gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={onRetry}>Probeer opnieuw</button>
          <button className="border border-border px-4 py-2 rounded-md" onClick={onStartFromScratch}>Start toch vanaf nul</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2>We verwerken je upload…</h2>
      <div aria-live="polite" role="status">{status}</div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="w-full rounded-md border border-border p-2"
      >
        <div className="h-2 w-full rounded bg-gray-100">
          <div className="h-2 rounded bg-blue-600 transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-sm text-muted">{progress}%</div>
      </div>

      {longHint ? (
        <div className="text-sm text-muted">Dit duurt iets langer dan verwacht, nog ~15 sec…</div>
      ) : null}
    </div>
  );
}

