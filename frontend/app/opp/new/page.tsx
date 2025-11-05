"use client";
import React, { Suspense } from 'react';
import StepFlowOpp from "./components/StepFlow";

export default function NewOPPPage() {
  return (
    <main className="theme-warmbath wb-plain-bg min-h-screen space-y-4">
      <div>
        <h1>Nieuw OPP</h1>
        <p className="wb-subtle">Upload een vorig OPP of start vanaf nul.</p>
      </div>
      <Suspense fallback={<div className="loading">Laden…</div>}>
        <StepFlowOpp />
      </Suspense>
    </main>
  );
}
