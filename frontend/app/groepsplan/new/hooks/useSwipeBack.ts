"use client";
import { useCallback, useMemo, useRef, useState } from "react";

const SWIPE_THRESHOLD = 50; // px (gentle back swipe)
const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms

export type SwipeBind = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

export default function useSwipeBack(onBack: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startTRef = useRef(0);
  const [thresholdReached, setThresholdReached] = useState(false);
  const vibedRef = useRef(false);

  const resetTransform = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      el.style.transition = "transform 200ms ease-out";
      el.style.transform = "translateX(0)";
      setTimeout(() => {
        if (!el) return;
        el.style.transition = "";
      }, 220);
    } catch {}
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    try {
      startXRef.current = e.touches[0].clientX;
      startTRef.current = Date.now();
      setThresholdReached(false);
      vibedRef.current = false;
      const el = containerRef.current; if (el) el.style.transition = "";
    } catch {}
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    try {
      const x = e.touches[0].clientX;
      const dx = x - startXRef.current;
      if (dx <= 0) return; // only swipe back (right)
      const el = containerRef.current;
      if (el) {
        const tx = Math.min(dx * 0.3, 50);
        el.style.transform = `translateX(${tx}px)`;
      }
      const reached = dx > SWIPE_THRESHOLD;
      if (reached !== thresholdReached) setThresholdReached(reached);
    } catch {}
  }, [thresholdReached]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    try {
      const endX = e.changedTouches[0].clientX;
      const endT = Date.now();
      const dx = endX - startXRef.current;
      const dt = Math.max(1, endT - startTRef.current);
      const velocity = dx / dt;
      if (dx > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
        onBack();
      } else {
        resetTransform();
        setThresholdReached(false);
      }
    } catch {
      resetTransform();
    }
  }, [onBack, resetTransform]);

  const bind: SwipeBind = useMemo(() => ({ onTouchStart, onTouchMove, onTouchEnd }), [onTouchStart, onTouchMove, onTouchEnd]);

  return { ref: containerRef, bind, thresholdReached } as const;
}
