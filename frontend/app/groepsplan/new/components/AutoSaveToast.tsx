"use client";
import React from "react";
import { useGroepsplanStore } from "@/lib/stores/groepsplanStore";

export default function AutoSaveToast() {
  const lastSavedAt = useGroepsplanStore((s) => s.lastSavedAt);
  const [visible, setVisible] = React.useState(false);
  const hideTimer = React.useRef<any>(null);

  React.useEffect(() => {
    if (!lastSavedAt) return;
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1200);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [lastSavedAt]);

  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full bg-black/80 text-white text-sm px-3 py-1 shadow-md flex items-center gap-2" role="status" aria-live="polite">
        <span aria-hidden>✓</span>
        <span>Opgeslagen</span>
      </div>
    </div>
  );
}
