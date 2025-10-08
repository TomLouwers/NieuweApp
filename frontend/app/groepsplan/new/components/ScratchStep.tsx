"use client";
import React from "react";
import SummaryList from "./SummaryList";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function ScratchStep({ onNext, onBack }: Props) {
  return (
    <div className="space-y-4">
      <h2>Stap 1 — Start vanaf nul</h2>
      <p className="text-muted">Dit is een demo van het vervolgscherm voor de flow "Start vanaf nul".</p>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-2">Samenvatting (geanimeerd):</p>
        <SummaryList
          variant="checkmark"
          items={[
            "Kies groep en vak",
            "Stel periode en doelen in",
            "Bevestig aanpak en evaluatie",
          ]}
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={onNext}>
          Volgende
        </button>
        <button className="border border-border px-4 py-2 rounded-md" onClick={onBack}>
          Terug
        </button>
      </div>
    </div>
  );
}

