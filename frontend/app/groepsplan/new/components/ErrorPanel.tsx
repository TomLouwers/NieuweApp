"use client";
import React from "react";

type Domain = "upload" | "generation";

export interface ErrorPanelProps {
  domain: Domain;
  code?: string | null;
  message?: string | null;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

function normalize(str?: string | null) {
  return (str || "").toLowerCase();
}

function mapKnown(domain: Domain, code?: string | null, message?: string | null) {
  const m = normalize(message);
  const c = normalize(code);

  if (domain === "upload") {
    // Too large
    if (c?.includes("too_large") || m.includes("too large") || m.includes("te groot") || m.includes("413")) {
      return {
        title: "Bestand te groot",
        explanation: "Het bestand is groter dan 10MB.",
        guidance: "Kies een kleiner bestand of comprimeer het bestand.",
        primaryLabel: "Ander bestand kiezen",
        secondaryLabel: "Start vanaf nul",
      };
    }
    // Invalid format
    if (c?.includes("invalid_format") || m.includes("ongeldig bestandstype") || m.includes("invalid content type")) {
      return {
        title: "Ongeldig bestandstype",
        explanation: "Dit type wordt niet ondersteund.",
        guidance: "Toegestaan: .pdf, .docx, .jpg, .jpeg, .png.",
        primaryLabel: "Ander bestand kiezen",
        secondaryLabel: "Start vanaf nul",
      };
    }
    // Corrupted/unreadable
    if (c?.includes("corrupted") || m.includes("corrupt") || m.includes("kan ik niet lezen") || m.includes("kan niet lezen") ) {
      return {
        title: "Dit bestand kan ik niet lezen",
        explanation: "Mogelijk is het bestand beschadigd of leeg.",
        guidance: "Controleer het bestand en probeer het opnieuw, of start vanaf nul.",
        primaryLabel: "Probeer opnieuw",
        secondaryLabel: "Start toch vanaf nul",
      };
    }
    // Network or generic
    if (c?.includes("network") || m.includes("failed to fetch") || m.includes("netwerk")) {
      return {
        title: "Netwerkfout",
        explanation: "We konden de upload niet voltooien.",
        guidance: "Controleer je internetverbinding en probeer het opnieuw.",
        primaryLabel: "Probeer opnieuw",
        secondaryLabel: "Start vanaf nul",
      };
    }
    return {
      title: "Dit bestand kan ik niet lezen",
      explanation: "Mogelijk is het bestand beschadigd of leeg.",
      guidance: "Controleer het bestand en probeer het opnieuw, of start vanaf nul.",
      primaryLabel: "Probeer opnieuw",
      secondaryLabel: "Start toch vanaf nul",
    };
  }

  // generation
  if (c?.includes("timeout") || m.includes("timeout") || m.includes("time-out") || m.includes("time out")) {
    return {
      title: "Time-out bij genereren",
      explanation: "Het duurde te lang om het document te genereren.",
      guidance: "Probeer het opnieuw of ga terug om je invoer te controleren.",
      primaryLabel: "Opnieuw genereren",
      secondaryLabel: "Terug",
    };
  }
  if (c?.includes("ai_error") || m.includes("ai") || m.includes("model") || m.includes("server error") || m.includes("500")) {
    return {
      title: "Fout bij genereren",
      explanation: "De AI gaf een foutmelding.",
      guidance: "Probeer het opnieuw. Als het blijft misgaan, pas je invoer aan.",
      primaryLabel: "Opnieuw genereren",
      secondaryLabel: "Terug",
    };
  }
  if (c?.includes("network") || m.includes("failed to fetch") || m.includes("netwerk")) {
    return {
      title: "Netwerkfout",
      explanation: "We konden het document niet genereren.",
      guidance: "Controleer je internetverbinding en probeer het opnieuw.",
      primaryLabel: "Opnieuw genereren",
      secondaryLabel: "Terug",
    };
  }
  return {
    title: "Genereren mislukt",
    explanation: "Er is iets misgegaan tijdens het genereren.",
    guidance: "Probeer het opnieuw of ga terug.",
    primaryLabel: "Opnieuw genereren",
    secondaryLabel: "Terug",
  };
}

export default function ErrorPanel({ domain, code, message, onPrimary, onSecondary, primaryLabel, secondaryLabel }: ErrorPanelProps) {
  const mapped = mapKnown(domain, code, message);
  const title = mapped.title;
  const explanation = mapped.explanation;
  const guidance = mapped.guidance;
  const primary = primaryLabel || mapped.primaryLabel;
  const secondary = secondaryLabel || mapped.secondaryLabel;
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div ref={ref} role="alert" aria-live="assertive" tabIndex={-1} className="space-y-3">
      <h2>{title}</h2>
      <p className="text-muted">{explanation}</p>
      <p className="text-muted">{guidance}</p>
      <div className="flex items-center gap-3 pt-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={onPrimary}>{primary}</button>
        {onSecondary ? (
          <button className="border border-border px-4 py-2 rounded-md" onClick={onSecondary}>{secondary}</button>
        ) : null}
      </div>
      {message ? <div className="text-xs text-muted" aria-hidden>({message})</div> : null}
    </div>
  );
}
