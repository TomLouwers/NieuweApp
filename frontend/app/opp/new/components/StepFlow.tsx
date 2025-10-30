"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SlideContainer from "@/app/groepsplan/new/components/SlideContainer";
import { useOppStore } from "@/lib/stores/oppStore";

type StepKey =
  | "decision"
  | "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8"
  | "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8"
  | "summary" | "result";

const order: StepKey[] = [
  "decision",
  "a1","a2","a3","a4","a5","a6","a7","a8",
  "b1","b2","b3","b4","b5","b6","b7","b8",
  "summary"
];

import DecisionPoint from "./steps/DecisionPoint";
import UploadProcessing from "./steps/UploadProcessing";
import ConfirmStudent from "./steps/ConfirmStudent";
import WhatChanged from "./steps/WhatChanged";
import CurrentLevels from "./steps/CurrentLevels";
import Uitstroomprofiel from "./steps/Uitstroomprofiel";
import ExternalSupport from "./steps/ExternalSupport";
import ParentInvolvement from "./steps/ParentInvolvement";
import SummaryGenerate from "./steps/SummaryGenerate";
import StudentBasics from "./steps/StudentBasics";
import WhyOpp from "./steps/WhyOpp";
import AdditionalContext from "./steps/AdditionalContext";

export default function StepFlowOpp() {
  const router = useRouter();
  const search = useSearchParams();
  const flow = (search?.get("flow") || "").toLowerCase();
  const stepParam = (search?.get("step") || "").toLowerCase();
  const setStepStore = useOppStore((s) => s.setStep);
  const stepStore = useOppStore((s) => s.currentStep);

  function stepFromParams(): StepKey {
    if (stepParam && order.includes(stepParam as StepKey)) return stepParam as StepKey;
    if (flow === "scratch") return "b1";
    if (flow === "upload") return "a1";
    return "decision";
  }

  const [step, setStep] = React.useState<StepKey>(stepFromParams());
  const prevIndex = React.useRef(order.indexOf(step));

  React.useEffect(() => {
    const s = stepFromParams();
    setStep((prev) => (prev === s ? prev : s));
    setStepStore(s);
  }, [flow, stepParam]);

  const currentIndex = order.indexOf(step);
  const direction = currentIndex >= prevIndex.current ? "forward" : "back";
  React.useEffect(() => { prevIndex.current = currentIndex; }, [currentIndex]);

  function pushStep(next: StepKey) {
    const params = new URLSearchParams(search ? Array.from(search.entries()) : []);
    params.delete("flow");
    params.set("step", next);
    try { useOppStore.getState().saveDraft().catch(() => {}); } catch {}
    router.push(`/opp/new?${params.toString()}`);
  }

  function render() {
    switch (step) {
      case "decision": return <DecisionPoint onUpload={() => pushStep("a1")} onScratch={() => pushStep("b1")} />;
      case "a1": return <UploadProcessing onDone={() => pushStep("a2")} onCancel={() => pushStep("decision")} />;
      case "a2": return <ConfirmStudent onBack={() => pushStep("a1")} onNext={() => pushStep("a3")} />;
      case "a3": return <WhatChanged onBack={() => pushStep("a2")} onNext={() => pushStep("a4")} />;
      case "a4": return <CurrentLevels onBack={() => pushStep("a3")} onNext={() => pushStep("a5")} />;
      case "a5": return <Uitstroomprofiel onBack={() => pushStep("a4")} onNext={() => pushStep("a6")} />;
      case "a6": return <ExternalSupport onBack={() => pushStep("a5")} onNext={() => pushStep("a7")} />;
      case "a7": return <ParentInvolvement onBack={() => pushStep("a6")} onNext={() => pushStep("a8")} />;
      case "a8": return <SummaryGenerate onBack={() => pushStep("a7")} />;
      case "b1": return <StudentBasics onBack={() => pushStep("decision")} onNext={() => pushStep("b2")} />;
      case "b2": return <WhyOpp onBack={() => pushStep("b1")} onNext={() => pushStep("b3")} />;
      case "b3": return <CurrentLevels onBack={() => pushStep("b2")} onNext={() => pushStep("b4")} />;
      case "b4": return <Uitstroomprofiel onBack={() => pushStep("b3")} onNext={() => pushStep("b5")} />;
      case "b5": return <ExternalSupport onBack={() => pushStep("b4")} onNext={() => pushStep("b6")} />;
      case "b6": return <ParentInvolvement onBack={() => pushStep("b5")} onNext={() => pushStep("b7")} />;
      case "b7": return <AdditionalContext onBack={() => pushStep("b6")} onNext={() => pushStep("b8")} />;
      case "b8": return <SummaryGenerate onBack={() => pushStep("b7")} />;
      default: return <SummaryGenerate onBack={() => pushStep("decision")} />;
    }
  }

  return (
    <div>
      <SlideContainer nodeKey={step} direction={direction as any}>
        {render()}
      </SlideContainer>
    </div>
  );
}

