"use client";
import React from "react";
import { Slider } from "@/components/ui/slider";

interface GroupCompositionSliderProps {
  label: string;
  hint?: string;
  value: number; // percentage 0..100
  onChange: (v: number) => void;
  total: number; // total students
  disabled?: boolean;
}

export default function GroupCompositionSlider({ label, hint, value, onChange, total, disabled }: GroupCompositionSliderProps) {
  const count = Math.round((total * value) / 100);
  const progress = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="space-y-1">
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        {hint ? <div className="text-xs text-muted">{hint}</div> : null}
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        disabled={disabled}
        className="wb-slider"
        style={{ ['--progress' as any]: progress }}
        aria-label={`${label} percentage`}
      />
      <div className="text-sm text-muted">{value}% - {count} leerlingen</div>
    </div>
  );
}
