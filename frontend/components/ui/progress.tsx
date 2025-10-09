"use client";
import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0..100
  min?: number;
  max?: number;
  label?: string;
}

export function Progress({ value, min = 0, max = 100, label, className = "", ...rest }: ProgressProps) {
  const now = Math.max(min, Math.min(max, Math.round(value)));
  return (
    <div className={["w-full rounded-md border border-border p-2", className].join(" ")} role="progressbar" aria-valuemin={min} aria-valuemax={max} aria-valuenow={now} aria-label={label} {...rest}>
      <div className="h-2 w-full rounded bg-gray-100">
        <div className="h-2 rounded bg-blue-600 transition-[width] duration-300 ease-out" style={{ width: `${now}%` }} />
      </div>
    </div>
  );
}

export default Progress;

