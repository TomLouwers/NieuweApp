"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SlideContainer from "@/app/groepsplan/new/components/SlideContainer";
import dynamic from "next/dynamic";
import DecisionPoint from "./DecisionPoint";
import ScratchStep from "./ScratchStep";
import GroepVakScreen from "../path-b/GroepVakScreen";
const GroepssamenstellingScreen = dynamic(() => import("../path-b/GroepssamenstellingScreen"));
const ChallengeScreenB = dynamic(() => import("../path-b/ChallengeScreen"));
const StartingPointScreen = dynamic(() => import("../path-b/StartingPointScreen"));
const SummaryScreenB = dynamic(() => import("../path-b/SummaryScreenB"));
import { useGroepsplanStore } from "@/lib/stores/groepsplanStore";
const ConfirmExtracted = dynamic(() => import("../path-a/ConfirmExtracted"));
const Challenge = dynamic(() => import("../path-a/Challenge"));
const SummaryScreen = dynamic(() => import("../components/SummaryScreen"));
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";
import PaywallModal from "@/components/PaywallModal";
import AutoSaveToast from "../components/AutoSaveToast";
import { setSelectedGroep, setSelectedVak, getSelectedGroep, getSelectedVak, getSummaryPeriode } from "@/lib/stores/groepsplanStore";
import { track, markStepStart } from "@/lib/utils/analytics";

type StepKey = "decision" | "scratch" | "b2" | "b3" | "b4" | "b5" | "a2" | "a3" | "a4" | "summary";
const order: StepKey[] = ["decision", "scratch", "b2", "b3", "b4", "b5", "a2", "a3", "a4", "summary"];

export default function StepFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const flow = (search?.get("flow") || "").toLowerCase();
  const stepParam = (search?.get("step") || "").toLowerCase();

  function stepFromParams(): StepKey {
    if (stepParam === "scratch") return "scratch";
    if (stepParam === "summary") return "summary";
    if (stepParam === "b2") return "b2";
    if (stepParam === "b3") return "b3";
    if (stepParam === "b4") return "b4";
    if (stepParam === "b5") return "b5";
    if (stepParam === "a2") return "a2";
    if (stepParam === "a3") return "a3";
    if (stepParam === "a4") return "a4";
    if (flow === "scratch") return "scratch";
    return "decision";
  }

  const [step, setStep] = React.useState<StepKey>(stepFromParams());
  const prevIndex = React.useRef(order.indexOf(step));

  React.useEffect(() => {
    const s = stepFromParams();
    setStep((prev) => (prev === s ? prev : s));
  }, [flow, stepParam]);

  const currentIndex = order.indexOf(step);
  const direction = currentIndex >= prevIndex.current ? "forward" : "back";
  React.useEffect(() => {
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  // Preload next screen assets upon step mount
  React.useEffect(() => {
    (async () => {
      try {
        if (step === "scratch") {
          await import("../path-b/GroepssamenstellingScreen");
        } else if (step === "b2") {
          await import("../path-b/ChallengeScreen");
        } else if (step === "b3") {
          await import("../path-b/StartingPointScreen");
        } else if (step === "b4") {
          await import("../path-b/SummaryScreenB");
        } else if (step === "a2") {
          await import("../path-a/Challenge");
        } else if (step === "a3") {
          await import("../components/SummaryScreen");
        }
      } catch {}
    })();
  }, [step]);

  // Analytics: mark step start on change
  React.useEffect(() => { markStepStart(step); }, [step]);

  // Announce step changes for screen readers (derive message without extra state)
  const liveMsg = React.useMemo(() => {
    const idx = Math.max(1, order.indexOf(step) + 1);
    return `Vraag ${idx} van ${order.length}`;
  }, [step]);

  function pushStep(next: StepKey) {
    const params = new URLSearchParams(search ? Array.from(search.entries()) : []);
    params.delete("flow");
    params.set("step", next);
    try { useGroepsplanStore.getState().saveDraft().catch(() => {}); } catch {}
    router.push(`/groepsplan/new?${params.toString()}`);
  }

  const onNextFromScratch = () => pushStep("summary");
  const onBackToDecision = () => { track('groepsplan_question_back', { from: step, to: 'decision' }); pushStep("decision"); };
  const onBackToScratch = () => { track('groepsplan_question_back', { from: step, to: 'scratch' }); pushStep("scratch"); };

  function normalizeVak(longLabel: string | null): "rekenen" | "taal" | "lezen" {
    const v = (longLabel || "").toLowerCase();
    if (v.includes("rekenen")) return "rekenen";
    if (v.includes("lezen")) return "lezen";
    return "taal"; // spelling/schrijven/andere
  }

  const [showLoading, setShowLoading] = React.useState(false);
  const [resultData, setResultData] = React.useState<any | null>(null);
  const [showPaywall, setShowPaywall] = React.useState(false);
  const pricingPhase = (process?.env?.NEXT_PUBLIC_PRICING_PHASE as string) || 'ppd_only';
  const ppdPrice = Number(process?.env?.NEXT_PUBLIC_PPD_PRICE_EUR || '3.99');

  async function doDownload() {
    try {
      if (!resultData) return;
      track('groepsplan_downloaded', { groep: resultData.groep, vak: resultData.vak, periode: resultData.periode, priced: true, phase: pricingPhase });
      const body = { content: String(resultData?.json?.content || ""), metadata: { groep: resultData.groep, vak: resultData.vak, periode: resultData.periode } };
      const resp = await fetch('/api/export-word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Groepsplan_G${resultData.groep}_${resultData.vak}_${resultData.periode}.docx`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {}
  }
  const handleGenerate = React.useCallback(() => {
    setShowLoading(true);
  }, []);

  async function startGenerate() {
    const groep = getSelectedGroep();
    const vakLabel = getSelectedVak();
    const periode = getSummaryPeriode() || "";
    const vak = normalizeVak(vakLabel || "");
    if (!groep || !vak || !periode) return;
    const resp = await fetch("/api/groepsplan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groep, vak, periode }),
      });
    const json = await resp.json().catch(() => ({}));
    return { ok: resp.ok, json, groep, vak, periode };
  }

  let content: React.ReactNode = null;
  if (step === "decision") {
    content = <DecisionPoint />;
  } else if (step === "scratch") {
    content = (
      <GroepVakScreen
        onBack={onBackToDecision}
        onNext={() => pushStep("b2")}
      />
    );
  } else if (step === "b2") {
    content = (
      <GroepssamenstellingScreen
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'scratch' }); pushStep("scratch"); }}
        onNext={() => pushStep("b3")}
      />
    );
  } else if (step === "b3") {
    content = (
      <ChallengeScreenB
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'b2' }); pushStep("b2"); }}
        onNext={() => pushStep("b4")}
      />
    );
  } else if (step === "b4") {
    content = (
      <StartingPointScreen
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'b3' }); pushStep("b3"); }}
        onNext={() => pushStep("b5")}
      />
    );
  } else if (step === "b5") {
    content = (
      <SummaryScreenB
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'b4' }); pushStep("b4"); }}
        onGenerate={handleGenerate}
      />
    );
  } else if (step === "a2") {
    content = (
      <ConfirmExtracted
        extractedData={undefined}
        onBack={onBackToDecision}
        onNext={({ groep, vak }) => {
          setSelectedGroep(groep);
          setSelectedVak(vak);
          pushStep("a3");
        }}
      />
    );
  } else if (step === "a3") {
    content = (
      <Challenge
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'a2' }); pushStep("a2"); }}
        onNext={() => pushStep("a4")}
      />
    );
  } else if (step === "a4") {
    content = (
      <SummaryScreen
        onBack={() => { track('groepsplan_question_back', { from: step, to: 'a3' }); pushStep("a3"); }}
        onGenerate={handleGenerate}
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        <h2>Samenvatting</h2>
        <p className="text-muted">Voorbeeld van een eindoverzicht. Dit scherm is voor de demo.</p>
        <div className="flex items-center gap-3">
          <button className="border border-border px-4 py-2 rounded-md" onClick={onBackToScratch}>Terug</button>
          <a className="bg-blue-600 text-white px-4 py-2 rounded-md" href="/dashboard">Naar dashboard</a>
        </div>
      </div>
    );
  }

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>('h1, h2, [role="heading"]');
    if (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus();
    }
  }, [step]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{liveMsg}</div>
      <div ref={containerRef}>
        <SlideContainer direction={direction as any} nodeKey={step}>{content}</SlideContainer>
      </div>
      <AutoSaveToast />
      {showLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-md">
            <LoadingScreen
              start={async () => {
                const res = await startGenerate();
                return res;
              }}
              onDone={(res: any) => {
                setShowLoading(false);
                setResultData(res);
              }}
              onRetry={() => {
                setShowLoading(false);
              }}
            />
          </div>
        </div>
      )}
      {resultData && (
        <ResultScreen
          title={`Groepsplan Groep ${resultData.groep} ${resultData.vak} ${resultData.periode}`}
          period={resultData.periode}
          content={String(resultData?.json?.content || "")}
          docId={((resultData?.json?.metadata?.storage as any)?.id) || `draft_${Date.now()}`}
          onEdit={(id) => { const target = id || `draft_${Date.now()}`; track('groepsplan_edited', { id: target }); location.href = `/groepsplan/edit/${target}`; }}
          onDownload={async () => {
            try {
              const requirePay = pricingPhase === 'ppd_only' || pricingPhase === 'hybrid';
              if (requirePay) { setShowPaywall(true); return; }
              await doDownload();
            } catch (_) {}
          }}
          onClose={() => { track('groepsplan_abandoned'); setResultData(null); }}
          downloadPriceEUR={ppdPrice}
        />
      )}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onPaid={async () => { await doDownload(); }}
          priceEUR={ppdPrice}
          phase={(pricingPhase === 'hybrid' ? 'hybrid' : 'ppd_only') as any}
          subMonthlyEUR={Number(process?.env?.NEXT_PUBLIC_SUB_MONTHLY_EUR || '9.99')}
          subAnnualEUR={Number(process?.env?.NEXT_PUBLIC_SUB_ANNUAL_EUR || '89')}
        />
      )}
    </>
  );
}

async function doDownload() {
  try {
    // This function expects to run within StepFlow scope, but we keep it here for clarity; callers bind resultData.
  } catch {}
}
