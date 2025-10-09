"use client";
import React from "react";
import ErrorPanel from "@/app/groepsplan/new/components/ErrorPanel";
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/utils/analytics";
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
  const [error, setError] = React.useState<{ code?: string | null; message?: string | null } | null>(null);
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
    try { track('upload_started'); } catch {}
    scheduleHint();

    // Start async work
    start()
      .then((result) => {
        doneRef.current = true;
        // animate to 100 after server complete
        setProgress((prev) => (prev >= 100 ? prev : 100));
        setStatus("Klaar");
        try { track('upload_succeeded'); } catch {}
        setTimeout(() => onDone(result), 300);
      })
      .catch((e) => {
        doneRef.current = true;
        const msg = (e && (e.message || e.toString())) || "Upload mislukt";
        // try attach a coarse code if present
        const code = (e && (e.code || e.name)) || null;
        setError({ code, message: String(msg) });
        try { track('upload_failed', { code, message: String(msg) }); } catch {}
      })
      .finally(() => {
        if (tick) clearInterval(tick);
        if (hintTimer) clearTimeout(hintTimer);
      });

    return () => { if (tick) clearInterval(tick); if (hintTimer) clearTimeout(hintTimer); };
  }, [start, onDone]);

  if (error) {
    return (
      <ErrorPanel
        domain="upload"
        code={error.code}
        message={error.message}
        onPrimary={onRetry}
        onSecondary={onStartFromScratch}
        primaryLabel="Probeer opnieuw"
        secondaryLabel="Start toch vanaf nul"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2>We verwerken je upload…</h2>
      <div aria-live="polite" role="status">{status}</div>

      <Progress value={progress} label="Upload voortgang" />
      <div className="mt-2 text-sm text-muted">{progress}%</div>

      {longHint ? (
        <div className="text-sm text-muted">Dit duurt iets langer dan verwacht, nog ~15 sec…</div>
      ) : null}
    </div>
  );
}
