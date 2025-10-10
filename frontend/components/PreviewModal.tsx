"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { track } from "@/lib/utils/analytics";

type Device = "mobile" | "desktop" | "unknown";

export default function PreviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [progress, setProgress] = useState(0);
  const [completedReported, setCompletedReported] = useState(false);
  const milestonesRef = useRef(new Set<number>());

  const device: Device = useMemo(() => {
    try {
      if (typeof window === "undefined") return "unknown";
      const hasTouch = "ontouchstart" in window || (navigator as any)?.maxTouchPoints > 0;
      return hasTouch ? "mobile" : "desktop";
    } catch {
      return "unknown";
    }
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const prev = document.body.style.overflow;
      document.body.setAttribute("data-prev-overflow", prev || "");
      document.body.style.overflow = "hidden";
      return () => {
        const old = document.body.getAttribute("data-prev-overflow") || "";
        document.body.style.overflow = old;
        document.body.removeAttribute("data-prev-overflow");
      };
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Analytics lifecycle
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setCompletedReported(false);
      milestonesRef.current.clear();
      track("preview_modal_opened", { device });
    }
  }, [isOpen, device]);

  if (!isOpen) return null;

  function onBackdrop() {
    track("preview_modal_closed", { source: "backdrop" });
    onClose();
  }
  function onHeaderClose() {
    track("preview_modal_closed", { source: "header" });
    onClose();
  }
  function onFooterClose() {
    track("preview_modal_closed", { source: "footer" });
    onClose();
  }

  function onContentScroll(e: React.UIEvent<HTMLDivElement>) {
    try {
      const el = e.currentTarget;
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100)));
      setProgress(pct);
      // Waypoints
      [25, 50, 75, 100].forEach((m) => {
        if (pct >= m && !milestonesRef.current.has(m)) {
          milestonesRef.current.add(m);
          track("preview_modal_progress", { percent: m, device });
        }
      });
      if (pct >= 80 && !completedReported) {
        setCompletedReported(true);
        track("preview_modal_completed", { device });
      }
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onBackdrop} />

      {/* Modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="relative bg-white rounded-xl shadow-2xl w-full md:max-w-4xl h-[90vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Voorbeeld Groepsplan</h2>
              <p className="text-sm text-gray-600 mt-1">Groep 5 - Spelling - Blok 2</p>
            </div>
            <button onClick={onHeaderClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Sluiten">
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Progress bar with percent label */}
          <div className="sticky top-[52px] md:top-[62px] z-10 bg-white px-4 md:px-6 py-2 flex items-center gap-2 border-b border-gray-100">
            <div className="h-1 bg-gray-200 rounded w-full overflow-hidden">
              <div className="h-full bg-blue-700 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-8 text-right">{progress}%</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4" onScroll={onContentScroll}>
            <SamplePlan />
          </div>

          {/* Footer CTA */}
          <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-white sticky bottom-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="font-semibold text-gray-900">Dit is een voorbeeld voor Groep 5 Spelling</p>
                <p className="text-sm text-gray-600">Maak jouw eigen groepsplan in 10 minuten</p>
              </div>
              <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                <button onClick={onFooterClose} className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Sluiten
                </button>
                <a
                  href="/groepsplan/new"
                  onClick={() => {
                    track("preview_cta_click", { source: "modal", device });
                  }}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                >
                  Maak jouw eigen
                  <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SamplePlan() {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Document Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-6 md:p-8 border-b-2 border-blue-700">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Groepsplan Groep 5 - Spelling</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <span>
            <strong>Periode:</strong> Blok 2 (november - januari)
          </span>
          <span>
            <strong>Schooljaar:</strong> 2024-2025
          </span>
          <span>
            <strong>Aantal leerlingen:</strong> 28
          </span>
        </div>
      </div>

      {/* Document Content */}
      <div className="p-6 md:p-8 space-y-8 text-gray-800 leading-relaxed">
        {/* 1. Groepsanalyse */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">1. Groepsanalyse &amp; Onderwijsbehoeften</h2>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Mickey Mouse Model</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Groep</th>
                  <th className="border border-gray-300 p-3 text-left">Aantal</th>
                  <th className="border border-gray-300 p-3 text-left">Onderwijsbehoefte</th>
                  <th className="border border-gray-300 p-3 text-left">Focus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Basisgroep</td>
                  <td className="border border-gray-300 p-3">18</td>
                  <td className="border border-gray-300 p-3">Heldere, gestructureerde instructie en voldoende oefentijd</td>
                  <td className="border border-gray-300 p-3">B-niveau</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 p-3 font-medium">Intensief</td>
                  <td className="border border-gray-300 p-3">5</td>
                  <td className="border border-gray-300 p-3">Verlengde instructie met visuele ondersteuning en extra herhaling</td>
                  <td className="border border-gray-300 p-3">O-niveau</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Meer-groep</td>
                  <td className="border border-gray-300 p-3">5</td>
                  <td className="border border-gray-300 p-3">Compacte instructie en verrijking met complexe opdrachten</td>
                  <td className="border border-gray-300 p-3">M-niveau</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. SMARTI Doelen */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">2. SMARTI Doelen</h2>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-900 mb-2">Basisgroep</h3>
              <p>
                Aan het eind van blok 2 beheerst <strong>90%</strong> van de basisgroep de werkwoordspelling (tegenwoordige
                tijd) op <strong>D-niveau</strong>, gemeten met de methodetoets spelling.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-900 mb-2">Intensieve groep</h3>
              <p>
                Aan het eind van blok 2 beheerst <strong>80%</strong> van de intensieve groep de klankgroepenregel (open/gesloten
                lettergrepen) op <strong>E-niveau</strong> door intensieve herhaling en extra instructie met visuele stappenplannen.
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
              <h3 className="font-semibold text-gray-900 mb-2">Meer-groep</h3>
              <p>
                <strong>Alle leerlingen</strong> passen aan het eind van de periode de spellingregels van blok 1 en 2 toe in een
                creatieve tekst (min. 10 regels) met <strong>maximaal 3 fouten</strong> op die regels.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Didactische en Pedagogische Aanpak */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">3. Didactische en Pedagogische Aanpak</h2>
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-3 font-semibold">Basisgroep</div>
              <div className="p-4 space-y-2">
                <p>
                  <strong>Instructie:</strong> Directe instructie 20 min, 4x/week. Heldere uitleg met voorbeelden.
                </p>
                <p>
                  <strong>Verwerking:</strong> Methode blz. 24-28. Leerkracht geeft gerichte feedback tijdens rondes.
                </p>
                <p>
                  <strong>Materiaal:</strong> Werkwoordkaarten, basisstappenplan (A4).
                </p>
              </div>
            </div>
            <div className="border border-blue-300 rounded-lg overflow-hidden">
              <div className="bg-blue-100 p-3 font-semibold">Intensieve groep</div>
              <div className="p-4 space-y-2">
                <p>
                  <strong>Instructie:</strong> Verlengde instructie <strong>35 min</strong> (20 + 15), ma/wo/vr 8:30-9:05.
                </p>
                <p>
                  <strong>Verwerking:</strong> Compacte oefenstof (blz. 24-25); vaste plek bij de leerkracht.
                </p>
                <p>
                  <strong>Materiaal:</strong> Visueel stappenplan, kleurgecodeerde woordkaarten, extra oefenbladen.
                </p>
                <p>
                  <strong>Herhaling:</strong> Dagelijks 10 min herhaling aan het begin van de dag.
                </p>
              </div>
            </div>
            <div className="border border-amber-300 rounded-lg overflow-hidden">
              <div className="bg-amber-100 p-3 font-semibold">Meer-groep</div>
              <div className="p-4 space-y-2">
                <p>
                  <strong>Instructie:</strong> Compacte instructie 10 min; check op basisdoelen.
                </p>
                <p>
                  <strong>Verwerking:</strong> Verrijkingsopdracht: Spelling Detective (fouten zoeken en verbeteren).
                </p>
                <p>
                  <strong>Presentatie:</strong> Eind van blok presenteren bevindingen aan de klas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Samenwerking en Afstemming */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">4. Samenwerking en Afstemming</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">IB'er</h3>
              <p className="text-sm">Groepsbespreking week 6. Focus: effectiviteit verlengde instructie.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Ouders</h3>
              <p className="text-sm">Ouderbrief over spelling-focus. Intensieve groep: kort gesprek in week 3.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Leerlingen</h3>
              <p className="text-sm">Klassengesprek week 1; leermeters voor eigen doelen en reflectie.</p>
            </div>
          </div>
        </section>

        {/* 5. Evaluatie en Vervolg */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">5. Evaluatie en Vervolg</h2>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="mb-3">
              <strong>Tussenevaluatie:</strong> Week 6 – korte toets werkwoordspelling. Zijn doelen haalbaar?
            </p>
            <p className="mb-3">
              <strong>Eindevaluatie:</strong> Week 12 – methodetoets spelling blok 2. Analyse: % doelbehaald.
            </p>
            <p className="mb-3">
              <strong>Bij niet-behalen:</strong> Aanpak aanpassen (frequentie/materialen); evt. niveau 2 ondersteuning.
            </p>
            <p className="mb-0">
              <strong>Bij behalen:</strong> Doorgaan; nieuwe uitdaging Meer-groep: complexere regels (samenstellingen).
            </p>
          </div>
        </section>

        {/* Compliance Badge */}
        <div className="mt-2 p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span role="img" aria-label="check" className="text-green-600">
              ✔
            </span>
            <span className="text-lg font-bold text-green-800">Passend Onderwijs 2024 Compliant</span>
          </div>
          <p className="text-sm text-green-700">✓ SMARTI doelen • ✓ Handelingsgericht • ✓ Mickey Mouse model • ✓ Evaluatie gepland</p>
        </div>
      </div>
    </div>
  );
}

