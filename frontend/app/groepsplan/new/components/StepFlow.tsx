"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SlideContainer from "@/app/groepsplan/new/components/SlideContainer";
import DecisionPoint from "./DecisionPoint";
import ScratchStep from "./ScratchStep";

type StepKey = "decision" | "scratch" | "summary";
const order: StepKey[] = ["decision", "scratch", "summary"];

export default function StepFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const flow = (search?.get("flow") || "").toLowerCase();
  const stepParam = (search?.get("step") || "").toLowerCase();

  function stepFromParams(): StepKey {
    if (stepParam === "scratch") return "scratch";
    if (stepParam === "summary") return "summary";
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

  function pushStep(next: StepKey) {
    const params = new URLSearchParams(search ? Array.from(search.entries()) : []);
    params.delete("flow");
    params.set("step", next);
    router.push(`/groepsplan/new?${params.toString()}`);
  }

  const onNextFromScratch = () => pushStep("summary");
  const onBackToDecision = () => pushStep("decision");
  const onBackToScratch = () => pushStep("scratch");

  let content: React.ReactNode = null;
  if (step === "decision") {
    content = <DecisionPoint />;
  } else if (step === "scratch") {
    content = <ScratchStep onNext={onNextFromScratch} onBack={onBackToDecision} />;
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

  return (
    <SlideContainer direction={direction as any} nodeKey={step}>{content}</SlideContainer>
  );
}
