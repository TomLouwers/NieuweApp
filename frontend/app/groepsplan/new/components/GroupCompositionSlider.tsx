"use client";
import React from "react";
import { Slider } from "@/components/ui/slider";

interface GroupCompositionSliderProps {
  label: string;
  value: number; // percentage 0..100
  onChange: (v: number) => void;
  total: number; // total students
  disabled?: boolean;
}

export default function GroupCompositionSlider({ label, value, onChange, total, disabled }: GroupCompositionSliderProps) {
  const count = Math.round((total * value) / 100);
  return (
    <div className="space-y-1">
      <div className="text-sm">{label}</div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        disabled={disabled}
        className="composition-range"
        aria-label={`${label} percentage`}
      />
      <div className="text-sm text-muted">{value}% → {count} leerlingen</div>
      <style jsx>{`
        .composition-range { height: 8px; -webkit-appearance: none; appearance: none; background: transparent; }
        .composition-range:focus { outline: none; }
        .composition-range::-webkit-slider-runnable-track { height: 8px; background: #e5e7eb; border-radius: 9999px; }
        .composition-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #3B82F6; margin-top: -8px; cursor: pointer; }
        .composition-range::-moz-range-track { height: 8px; background: #e5e7eb; border-radius: 9999px; }
        .composition-range::-moz-range-thumb { width: 24px; height: 24px; border: none; border-radius: 50%; background: #3B82F6; cursor: pointer; }
      `}</style>
    </div>
  );
}
