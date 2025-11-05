"use client";
import React from "react";

interface ProgressDotsProps {
  total: number;
  current: number; // 1-based index
  className?: string;
}

export default function ProgressDots({ total, current, className }: ProgressDotsProps) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  const aria = `Vraag ${current} van ${total}`;
  return (
    <div className={className} aria-label={aria} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} role="progressbar" tabIndex={0}>
      {dots.map((i) => {
        const state = i < current ? "completed" : i === current ? "current" : "upcoming";
        return <span key={i} className={`progress-dot ${state}`} aria-hidden />;
      })}
      <span className="ml-3 text-sm text-muted" aria-hidden>Vraag {current}/{total}</span>
      <style jsx>{`
        .progress-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin: 0 4px; }
        .progress-dot.completed { background-color: var(--wb-chalkboard-green, #3B82F6); }
        .progress-dot.current { background-color: var(--wb-chalkboard-green, #3B82F6); animation: pulse 2s ease-in-out infinite; }
        .progress-dot.upcoming { background-color: #D1D5DB; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } }
      `}</style>
      </div>
  );
}
