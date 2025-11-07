"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, Smartphone, Users, Zap } from "lucide-react";
import { track } from "@/lib/utils/analytics";
import PreviewModal from "@/components/PreviewModal";

export default function LandingPage() {
  const [showPreview, setShowPreview] = useState(false);
  const demoUrl = (process?.env?.NEXT_PUBLIC_DEMO_VIDEO_URL as string) || "";

  const device: "mobile" | "desktop" | "unknown" = useMemo(() => {
    try {
      if (typeof window === "undefined") return "unknown";
      const hasTouch = "ontouchstart" in window || (navigator as any)?.maxTouchPoints > 0;
      return hasTouch ? "mobile" : "desktop";
    } catch {
      return "unknown";
    }
  }, []);

  useEffect(() => {
    try { track("page_view", { path: "/", device }); } catch {}
  }, [device]);

  function CTAButton(props: { href?: string; onClick?: () => void; children: React.ReactNode; variant?: "primary" | "secondary" }) {
    const { href, onClick, children, variant = "primary" } = props;
    const clsPrimary = "group bg-gradient-to-r from-primary-700 to-primary-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 inline-flex items-center gap-2 tracking-[0.01em]";
    const clsSecondary = "border-2 border-primary-600 text-primary-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all duration-200 inline-flex items-center gap-2";
    const cls = variant === "primary" ? clsPrimary : clsSecondary;
    if (href) return <a href={href} className={cls}>{children}</a>;
    return <button onClick={onClick} className={cls}>{children}</button>;
  }

  return (
    <main className="theme-warmbath wb-plain-bg">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-16 md:py-20">
        <div className="relative max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Het is woensdag.
              <br />
              Je maatwerk-opdrachten zijn nog niet klaar.
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Upload een foto uit je methode, kies een scenario, download als Word. Klaar in 3–5 minuten.
            </p>

            <div className="flex flex-col items-start gap-3 mb-4">
              <CTAButton href="/start" onClick={() => track("cta_click", { cta: "start_plan", device })}>
                Probeer nu (10 min)
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </CTAButton>
              <div className="text-sm text-gray-600">Geen account nodig · Geen creditcard · 14 dagen gratis</div>
              <div className="text-sm text-gray-500">Vanaf €9,99/mnd (individueel) · Schoollicenties beschikbaar</div>
              {/* Secondary navigation: direct deep links (subtle) */}
              <div className="text-[15px] text-gray-700 font-medium mt-1">
                <span className="mr-2">Direct naar:</span>
                <a
                  href="/groepsplan/new"
                  className="underline-offset-4 hover:underline"
                  onClick={() => track('cta_click', { cta: 'direct_groepsplan', device })}
                >
                  ðŸ“‹ Groepsplan
                </a>
                <span className="mx-2">â€¢</span>
                <a
                  href="/opp/new"
                  className="underline-offset-4 hover:underline"
                  onClick={() => track('cta_click', { cta: 'direct_opp', device })}
                >
                  ðŸ“ OPP
                </a>
                <span className="mx-2">â€¢</span>
                <a
                  href="/maatwerk/new"
                  className="underline-offset-4 hover:underline"
                  onClick={() => track('cta_click', { cta: 'direct_differentiatie', device })}
                >
                  âœï¸ Differentiatie
                </a>
              </div>
            </div>
            {/* Stats moved further down for focus */}
          </div>

          {/* Product preview */}
          <div className="relative">
            {demoUrl ? (
              <video className="w-full rounded-xl shadow-2xl border border-gray-200" src={demoUrl} autoPlay muted loop playsInline />
            ) : (
              <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="bg-white rounded p-4 shadow-sm mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Foto geÃ¼pload</span>
                    </div>
                    <div className="bg-gray-50 h-28 rounded flex items-center justify-center text-gray-400 text-sm">[Voorbeeld: rekensom uit methode]</div>
                  </div>
                  <div className="bg-white rounded p-4 shadow-sm mb-3">
                    <div className="text-sm font-medium mb-2">Kies scenario</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Dyslexie</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Traag tempo</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">NT2</span>
                    </div>
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium">Download Word</button>
                </div>
                <div className="text-center text-sm text-gray-500 mt-3">â±ï¸ Klaar in 3â€“5 minuten</div>
              </div>
            )}
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">Inspectieâ€‘proof âœ“</div>
          </div>
        </div>
      </section>

      {/* Empathy */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div id="empathy" className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-6 md:p-10 shadow-sm">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">Herkenbaar?</h2>
            <div className="space-y-3 md:space-y-4 mb-8">
              {[
                { text: "Je kopieert je vorige groepsplan en past de datums aan. Voelt als vals spelen, maar je hebt geen tijd.", icon: "â°" },
                { text: "Je IB'er zegt: 'Dit is nog te algemeen, maak het specifieker.' Nog een uur extra werk.", icon: "ðŸ’»" },
                { text: "Het is 22:30. Je zit op de bank met je laptop. Morgen weer vroeg op. Je bent moe.", icon: "â˜•" },
                { text: "Je googelt 'groepsplan voorbeeld' â€“ templates zijn te algemeen of verouderd.", icon: "ðŸ”" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl border-l-4 ${idx % 2 === 0 ? "bg-white/70 border-amber-300" : "bg-white border-amber-500"}`}
                >
                  <span className="text-xl md:text-2xl" aria-hidden>{item.icon}</span>
                  <span className="text-gray-800 text-[17px] md:text-lg leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
            {/* No mid-page CTA here to keep flow focused */}
          </div>
        </div>
      </section>

      {/* Time Comparison */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Normaal vs. Met Pebble</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center relative">
              <div className="absolute -top-3 left-6 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Zonder Pebble</div>
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <div className="text-5xl font-bold text-gray-900 mb-2">22:00</div>
              <div className="text-gray-500 mb-4">Start</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4" />
              <div className="text-5xl font-bold text-red-600 mb-2">00:00</div>
              <div className="text-gray-500 mb-4">Klaar</div>
              <div className="text-lg font-semibold text-gray-700">2 uur werk</div>
              <div className="text-sm text-gray-500 mt-1">Naar bed, moe</div>
            </div>

            {/* After */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-500 rounded-xl p-8 text-center relative">
              <div className="absolute -top-3 left-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Met Pebble</div>
              <Clock className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
              <div className="text-5xl font-bold text-gray-900 mb-2">22:00</div>
              <div className="text-gray-500 mb-4">Start</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4"><div className="bg-emerald-500 h-3 rounded-full" style={{ width: "8%" }} /></div>
              <div className="text-5xl font-bold text-emerald-600 mb-2">22:10</div>
              <div className="text-gray-500 mb-4">Klaar</div>
              <div className="text-lg font-semibold text-emerald-700">10 minuten werk</div>
              <div className="text-sm text-gray-500 mt-1">Netflix kijken</div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get (benefit-first) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Wat je krijgt</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="font-semibold text-gray-900 mb-1">Groepsplan in 10 minuten</div><div className="text-gray-600">Inspectieâ€‘proof, handelingsgericht met SMARTIâ€‘doelen.</div></div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="font-semibold text-gray-900 mb-1">OPP in 10 minuten</div><div className="text-gray-600">Met uitstroomprofiel en concrete aanpak.</div></div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="font-semibold text-gray-900 mb-1">Differentiatie in 5â€“10 minuten</div><div className="text-gray-600">Scenarioâ€™s: dyslexie, NT2, traag tempo â€“ direct inzetbaar.</div></div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="font-semibold text-gray-900 mb-1">Download zonder gedoe</div><div className="text-gray-600">Word of PDF. Geen leerlingenâ€‘accounts nodig.</div></div>
          </div>
        </div>
      </section>

      {/* Contextual stats */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-700">
          <div>247 leerkrachten gebruiken Pebble al. Samen maakten ze 1.247 opdrachten met een gemiddelde beoordeling van <span className="font-semibold">4.8/5</span>.</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Waarom leerkrachten voor Pebble kiezen</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Check size={24} />, bg: "bg-green-100", color: "text-green-600", title: "Inspectie-proof", desc: "Automatische check op Passend Onderwijs 2024 richtlijnen. SMARTI doelen, handelingsgericht, alles erin." },
              { icon: <Users size={24} />, bg: "bg-primary-100", color: "text-primary-600", title: "Leert van jouw stijl", desc: "Upload je oude groepsplan. Wij leren van je aanpak en maken een nieuw plan in jouw stijl." },
              { icon: <Zap size={24} />, bg: "bg-warm-100", color: "text-warm-600", title: "Geen algemene onzin", desc: "Concrete tijden, specifieke materialen, realistische doelen. Geen 'maatwerk bieden'." },
              { icon: <Smartphone size={24} />, bg: "bg-gray-100", color: "text-gray-600", title: "Werkt op je telefoon", desc: "22:00 op de bank? Start op telefoon, maak op je laptop. Of andersom." },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-200">
                <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-full flex items-center justify-center`}>{f.icon}</div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{f.title}</div>
                  <div className="text-sm text-gray-600">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Wat leerkrachten zeggen</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: 'Het kostte me 8 minuten voor een groepsplan waar ik anders 3 uur aan kwijt ben. Ik hoefde alleen de naam van de IB\'er aan te passen.', n: 'Marieke', meta: 'Groep 5 â€¢ Rotterdam', bg: 'bg-blue-100', color: 'text-blue-600', init: 'M' },
              { q: 'Eindelijk concrete suggesties. Niet â€œbied extra uitlegâ€, maar â€œ2x per week 15 min met rekenblokjes in de instructiehoekâ€.', n: 'Tim', meta: 'Groep 7 â€¢ Utrecht', bg: 'bg-purple-100', color: 'text-purple-600', init: 'T' },
              { q: 'Voor het eerst sinds jaren weer een vrije woensdagavond. Geen laptop op schoot. Dit is wat ik nodig had.', n: 'Lisa', meta: 'Groep 3 â€¢ Amsterdam', bg: 'bg-emerald-100', color: 'text-emerald-600', init: 'L' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex gap-1 mb-4 text-yellow-400"><span>â˜…</span><span>â˜…</span><span>â˜…</span><span>â˜…</span><span>â˜…</span></div>
                <p className="text-gray-700 mb-6">â€œ{t.q}â€</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.bg} ${t.color} rounded-full flex items-center justify-center font-semibold`}>{t.init}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.n}</div>
                    <div className="text-xs text-gray-500">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-r from-primary-700 to-primary-600 py-16 md:py-20 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Klaar om je weekend terug te krijgen?</h2>
          <p className="text-xl text-blue-100 mb-8">Start gratis. Geen creditcard nodig. Opzeggen wanneer je wilt.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <CTAButton href="/start">Probeer nu â€“ gratis <ArrowRight size={22} /></CTAButton>
            <CTAButton variant="secondary" onClick={() => { setShowPreview(true); track("cta_click", { cta: "view_sample", device }); }}>Bekijk voorbeelden</CTAButton>
          </div>
          <div className="text-blue-100 text-sm">ðŸ”’ Geen data in de cloud Â· AVGâ€‘proof Â· Fireâ€‘andâ€‘forget</div>
        </div>
      </section>

      {showPreview && <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} />}
    </main>
  );
}



