"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Check, ArrowRight, Users, Zap, Smartphone, Clock, ChevronDown, Menu, X, ChevronUp, Star } from 'lucide-react';
import { track } from "@/lib/utils/analytics";
import PreviewModal from "@/components/PreviewModal";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const loginHref = (process?.env?.NEXT_PUBLIC_LOGIN_URL as string) || '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [headlineVariant, setHeadlineVariant] = useState<'a'|'b'>('a');
  const [showVideo, setShowVideo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const demoUrl = (process?.env?.NEXT_PUBLIC_DEMO_VIDEO_URL as string) || '';
  const appStartTs = useMemo(() => Date.now(), []);

  const device: 'mobile' | 'desktop' | 'unknown' = useMemo(() => {
    try {
      if (typeof window === 'undefined') return 'unknown';
      const hasTouch = 'ontouchstart' in window || (navigator as any)?.maxTouchPoints > 0;
      return hasTouch ? 'mobile' : 'desktop';
    } catch { return 'unknown'; }
  }, []);

  function scrollToId(id: string) {
    try {
      if (typeof window !== 'undefined' && window.history && window.location) {
        const hash = `#${id}`;
        if (window.location.hash !== hash) {
          window.history.pushState(null, '', hash);
        }
      }
    } catch {}
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).id;
            setIsVisible((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Page view and testimonials view
  useEffect(() => {
    try {
      const vp = { w: window.innerWidth, h: window.innerHeight };
      const ref = document.referrer || '';
      track('page_view', { path: '/', device, vp_w: vp.w, vp_h: vp.h, ref });
    } catch {}

    try {
      const el = document.getElementById('testimonials');
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            track('section_view', { section: 'testimonials' });
            obs.disconnect();
          }
        });
      }, { threshold: 0.3 });
      obs.observe(el);
      return () => obs.disconnect();
    } catch {}
  }, [device]);

  useEffect(() => {
    const onScroll = () => {
      try { setShowBackToTop(window.scrollY > 400); } catch {}
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ab = params.get('ab');
      let v: 'a'|'b' | null = null;
      if (ab === 'headline_b') v = 'b';
      else if (ab === 'headline_a') v = 'a';
      else v = (localStorage.getItem('ab_headline_variant') as any);
      if (v !== 'a' && v !== 'b') v = Math.random() < 0.5 ? 'a' : 'b';
      localStorage.setItem('ab_headline_variant', v);
      setHeadlineVariant(v);
      track('ab_assign', { experiment: 'headline', variant: v });
    } catch {}
  }, []);

  useEffect(() => {
    const fired = new Set<number>();
    function onDepth() {
      try {
        const doc = document.documentElement;
        const height = doc.scrollHeight - doc.clientHeight;
        if (height <= 0) return;
        const pct = Math.min(100, Math.round((window.scrollY / height) * 100));
        [25, 50, 75, 100].forEach((t) => { if (pct >= t && !fired.has(t)) { fired.add(t); track('scroll_depth', { percent: t }); } });
      } catch {}
    }
    window.addEventListener('scroll', onDepth, { passive: true });
    onDepth();
    return () => window.removeEventListener('scroll', onDepth);
  }, []);

  // Time on page
  useEffect(() => {
    let sent = false;
    function send() {
      if (sent) return; sent = true;
      const ms = Math.max(0, Date.now() - appStartTs);
      track('time_on_page', { ms, device });
    }
    const onVis = () => { try { if (document.visibilityState === 'hidden') send(); } catch {} };
    const onUnload = () => { try { send(); } catch {} };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [appStartTs, device]);

  // Preview modal is now a separate component; lifecycle/scroll handling is inside it.

  // Exit/scroll intent popup (single use per session, after 20s)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (sessionStorage.getItem('exit_intent_shown') === '1') return;

      const minMs = 20000;
      const start = appStartTs;
      let reached80 = false;
      let lastY = window.scrollY || 0;
      let triggered = false;

      function canTrigger() { return !triggered && Date.now() - start >= minMs; }
      function fire(reason: 'desktop_exit' | 'mobile_scroll_up') {
        if (!canTrigger()) return;
        triggered = true;
        sessionStorage.setItem('exit_intent_shown', '1');
        setShowExitIntent(true);
        track('exit_intent_shown', { device, reason });
      }

      const onMouseMove = (e: MouseEvent) => {
        if (device !== 'desktop') return;
        if (e.clientY <= 10) fire('desktop_exit');
      };

      const onScroll = () => {
        if (device !== 'mobile') return;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const y = window.scrollY || 0;
        const pct = max > 0 ? y / max : 0;
        if (pct >= 0.8) reached80 = true;
        if (reached80 && lastY - y > 60) fire('mobile_scroll_up');
        lastY = y;
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true } as any);
      window.addEventListener('scroll', onScroll, { passive: true } as any);
      return () => {
        window.removeEventListener('mousemove', onMouseMove as any);
        window.removeEventListener('scroll', onScroll as any);
      };
    } catch {}
  }, [appStartTs, device]);

  function SamplePlan() {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Document Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 md:p-8 border-b-2 border-blue-700">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Groepsplan Groep 5 - Spelling</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <span><strong>Periode:</strong> Blok 2 (november - januari)</span>
            <span><strong>Schooljaar:</strong> 2024-2025</span>
            <span><strong>Aantal leerlingen:</strong> 28</span>
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
                  <tr className="bg-primary-50">
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
              <div className="bg-success-50 p-4 rounded-lg border-l-4 border-success-500">
                <h3 className="font-semibold text-gray-900 mb-2">Basisgroep</h3>
                <p>Aan het eind van blok 2 beheerst <strong>90%</strong> van de basisgroep de werkwoordspelling (tegenwoordige tijd) op <strong>D-niveau</strong>, gemeten met de methodetoets spelling.</p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg border-l-4 border-primary-500">
                <h3 className="font-semibold text-gray-900 mb-2">Intensieve groep</h3>
                <p>Aan het eind van blok 2 beheerst <strong>80%</strong> van de intensieve groep de klankgroepenregel (open/gesloten lettergrepen) op <strong>E-niveau</strong> door intensieve herhaling en extra instructie met visuele stappenplannen.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h3 className="font-semibold text-gray-900 mb-2">Meer-groep</h3>
                <p><strong>Alle leerlingen</strong> passen aan het eind van de periode de spellingregels van blok 1 en 2 toe in een creatieve tekst (min. 10 regels) met <strong>maximaal 3 fouten</strong> op die regels.</p>
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
                  <p><strong>Instructie:</strong> Directe instructie 20 min, 4x/week. Heldere uitleg met voorbeelden.</p>
                  <p><strong>Verwerking:</strong> Methode blz. 24-28. Leerkracht geeft gerichte feedback tijdens rondes.</p>
                  <p><strong>Materiaal:</strong> Werkwoordkaarten, basisstappenplan (A4).
                  </p>
                </div>
              </div>
              <div className="border border-blue-300 rounded-lg overflow-hidden">
                <div className="bg-primary-100 p-3 font-semibold">Intensieve groep</div>
                <div className="p-4 space-y-2">
                  <p><strong>Instructie:</strong> Verlengde instructie <strong>35 min</strong> (20 + 15), ma/wo/vr 8:30-9:05.</p>
                  <p><strong>Verwerking:</strong> Compacte oefenstof (blz. 24-25); vaste plek bij de leerkracht.</p>
                  <p><strong>Materiaal:</strong> Visueel stappenplan, kleurgecodeerde woordkaarten, extra oefenbladen.</p>
                  <p><strong>Herhaling:</strong> Dagelijks 10 min herhaling aan het begin van de dag.</p>
                </div>
              </div>
              <div className="border border-amber-300 rounded-lg overflow-hidden">
                <div className="bg-amber-100 p-3 font-semibold">Meer-groep</div>
                <div className="p-4 space-y-2">
                  <p><strong>Instructie:</strong> Compacte instructie 10 min; check op basisdoelen.</p>
                  <p><strong>Verwerking:</strong> Verrijkingsopdracht: Spelling Detective (fouten zoeken en verbeteren).</p>
                  <p><strong>Presentatie:</strong> Eind van blok presenteren bevindingen aan de klas.</p>
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
            <div className="bg-primary-50 p-6 rounded-lg border border-blue-200">
              <p className="mb-3"><strong>Tussenevaluatie:</strong> Week 6 â€“ korte toets werkwoordspelling. Zijn doelen haalbaar?</p>
              <p className="mb-3"><strong>Eindevaluatie:</strong> Week 12 â€“ methodetoets spelling blok 2. Analyse: % doelbehaald.</p>
              <p className="mb-3"><strong>Bij niet-behalen:</strong> Aanpak aanpassen (frequentie/materialen); evt. niveau 2 ondersteuning.</p>
              <p className="mb-0"><strong>Bij behalen:</strong> Doorgaan; nieuwe uitdaging Meer-groep: complexere regels (samenstellingen).</p>
            </div>
          </section>

          {/* Compliance Badge */}
          <div className="mt-2 p-6 bg-success-50 border-2 border-success-500 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span role="img" aria-label="check" className="text-green-600">âœ”</span>
              <span className="text-lg font-bold text-green-800">Passend Onderwijs 2024 Compliant</span>
            </div>
            <p className="text-sm text-green-700">âœ“ SMARTI doelen â€¢ âœ“ Handelingsgericht â€¢ âœ“ Mickey Mouse model â€¢ âœ“ Evaluatie gepland</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-700 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-6 h-6 bg-white rounded-full opacity-20" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Pebble</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollToId('features')} className="text-gray-700 hover:text-primary-700 transition-colors">Features</button>
            <button onClick={() => scrollToId('testimonials')} className="text-gray-700 hover:text-primary-700 transition-colors">Ervaringen</button>
            <a href={loginHref} className="text-primary-700 hover:text-primary-900 transition-colors">Inloggen</a>
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <a href={loginHref} className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors">Inloggen</a>
            <button aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-md border border-gray-200 hover:bg-gray-50">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 grid gap-2">
            <button onClick={() => { scrollToId('features'); setMobileOpen(false); track('nav_click', { target: 'features' }); }} className="text-left py-2 px-2 rounded-md hover:bg-primary-50">Features</button>
            <button onClick={() => { scrollToId('testimonials'); setMobileOpen(false); track('nav_click', { target: 'testimonials' }); }} className="text-left py-2 px-2 rounded-md hover:bg-primary-50">Ervaringen</button>
              <a onClick={() => setMobileOpen(false)} href={loginHref} className="py-2 px-2 rounded-md hover:bg-primary-50">Inloggen</a>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25px 25px, rgb(219, 234, 254) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgb(219, 234, 254) 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium border border-primary-100 mb-6 animate-fade-in">
            <Check size={16} strokeWidth={2.5} />
            <span>Gebruikt door 247 Nederlandse leerkrachten</span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {headlineVariant === 'a' ? (
              <>
                Het is woensdag.
                <br />
                Je maatwerk-opdrachten voor morgen zijn nog niet klaar.
                <br />
                Je wilt geen avond kopiëren en plakken.
              </>
            ) : (
              <>
                Morgen inspectie.
                <br />
                3–5 minuten voor goed maatwerk.
                <br />
                Kan dat? Met Pebble wel.
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {headlineVariant === 'a'
              ? 'Maak in 3-5 min maatwerk-opdrachten voor je klas. Upload een foto uit de methode of kies scenario\'s (dyslexie, traag tempo, NT2). Download als PDF of Word.'
              : 'Upload een werkblad -> wij passen het aan voor jouw leerlingen. Jij checkt, downloadt en gaat lesgeven. Minder kopiëren, meer tijd.'}
          </p>

                    {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <a
              href="/maatwerk/new"
              onClick={() => track('cta_click', { cta: 'start_plan', variant: headlineVariant, device })}
              className="group bg-gradient-to-r from-primary-700 to-primary-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 inline-flex items-center gap-2 animate-gentle-pulse hover:[animation:none] tracking-[0.01em]"
            >
              Probeer gratis
              <span className="hidden sm:inline group-hover:inline"> (10 min)</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <a href="/groepsplan/new" onClick={() => track('cta_click', { cta: 'start_groepsplan', variant: headlineVariant, device })} className="underline-offset-4 hover:underline">Groepsplan</a>
              <span className="hidden sm:inline">·</span>
              <a href="/opp/new" onClick={() => track('cta_click', { cta: 'start_opp', variant: headlineVariant, device })} className="underline-offset-4 hover:underline">OPP</a>
              <span className="hidden sm:inline">·</span>
              <button onClick={() => { track('cta_click', { cta: 'view_sample', variant: headlineVariant, device }); setShowPreview(true); }} className="underline-offset-4 hover:underline">Bekijk voorbeeld</button>
            </div>
            <div className="text-gray-500">Individueel vanaf €9,99/mnd • Schoollicenties beschikbaar</div>
          </div>

          {/* Product preview (video if available, otherwise placeholder) */}
          <div className="relative max-w-5xl mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            {demoUrl ? (
              <video className="w-full rounded-xl shadow-xl border border-gray-200" src={demoUrl} autoPlay muted loop playsInline />
            ) : (
              <div className="w-full rounded-xl shadow-xl border border-gray-200 bg-white p-4 text-left">
                <div className="h-8 w-40 bg-gray-100 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-24 bg-gray-50 rounded border" />
                  <div className="h-24 bg-gray-50 rounded border" />
                </div>
                <div className="mt-4 text-sm text-gray-500">Product preview</div>
              </div>
            )}
          </div>

          {/* Hero microcopy + social proof */}
          <div className="text-center text-sm text-gray-600 space-y-1 mb-8 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div>Geen account nodig. Geen leerlingen-accounts. Gewoon maken, downloaden, klaar.</div>
            <div className="text-gray-500">Gebruikt door 247 leerkrachten â€¢ 4.8/5
              <span className="inline-flex align-middle ml-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>â˜…</span>
                ))}
              </span>
            </div>
          </div>

          {/* Trust signals */}
          <div
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-medium animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="flex items-center gap-2">
              <Check size={16} className="text-success-500" strokeWidth={2.5} />
              14 dagen gratis
            </span>
            <span className="flex items-center gap-2">
              <Check size={16} className="text-success-500" strokeWidth={2.5} />
              Geen creditcard
            </span>
            <span className="flex items-center gap-2">
              <Check size={16} className="text-success-500" strokeWidth={2.5} />
              Inspectie-OK
            </span>
          </div>
          {/* Scroll chevron */}
          <button
            aria-label="Scroll naar features"
            onClick={() => { scrollToId('features'); track('nav_scroll', { target: 'features' }); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-primary-700 hover:text-primary-900 transition-transform hover:translate-y-0.5"
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Wat je krijgt</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900 mb-1">Groepsplan</div>
              <div className="text-gray-600">Inspectie‑proof: SMARTI, handelingsgericht, Mickey Mouse‑model.</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900 mb-1">OPP</div>
              <div className="text-gray-600">Met uitstroomprofiel, realistische doelen en aanpak.</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900 mb-1">Differentiatie</div>
              <div className="text-gray-600">Scenario’s: dyslexie, NT2, traag tempo – direct inzetbaar.</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900 mb-1">Export</div>
              <div className="text-gray-600">Download als PDF of Word. Geen leerlingen‑accounts nodig.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Inspectie reassurance */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 md:p-8">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">âš ï¸</span>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Maar de inspectie dan?</h3>
            </div>
            <ul className="grid md:grid-cols-2 gap-3 text-sm md:text-base text-gray-700">
              <li className="flex items-start gap-2"><Check size={18} className="text-success-500 mt-0.5" /> Automatische check op Passend Onderwijs 2024</li>
              <li className="flex items-start gap-2"><Check size={18} className="text-success-500 mt-0.5" /> SMARTI doelen, handelingsgericht, Mickey Mouse</li>
              <li className="flex items-start gap-2"><Check size={18} className="text-success-500 mt-0.5" /> 247 leerkrachten gebruiken het â€“ 0 problemen</li>
              <li className="flex items-start gap-2"><Check size={18} className="text-success-500 mt-0.5" /> Niet goed? We helpen gratis bijschaven</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          aria-label="Terug naar boven"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); track('nav_scroll', { target: 'top' }); }}
          className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-lg rounded-full p-3 text-primary-700 hover:text-primary-900 hover:shadow-xl transition-all"
        >
          <ChevronUp size={22} />
        </button>
      )}

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowVideo(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Voorbeeldvideo</h3>
              <button onClick={() => setShowVideo(false)} className="text-gray-500 hover:text-gray-700">Sluiten</button>
            </div>
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {demoUrl.includes('youtube.com') || demoUrl.includes('youtu.be') ? (
                <iframe
                  title="Demo Video"
                  src={demoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                  className="w-full h-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={demoUrl} controls playsInline className="w-full h-full" preload="metadata" />
              )}
            </div>
          </div>
        </div>
      )}

      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} />

      {/* Exit-Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 md:left-auto md:right-6 md:bottom-6 md:inset-x-auto">
          <div className="mx-auto md:mx-0 max-w-xl bg-white border border-gray-200 shadow-xl rounded-2xl p-4 md:p-5 flex items-start gap-4">
            <div className="hidden md:block text-2xl">ðŸ‘‹</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">Wacht! Zie eerst hoe het eruitziet â†’</div>
              <div className="text-sm text-gray-600 mb-3">30 seconden: bekijk een voorbeeldgroepsplan voordat je gaat.</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowExitIntent(false); setShowPreview(true); track('exit_intent_cta_click', { action: 'open_preview' }); }}
                  className="flex-1 bg-primary-700 hover:bg-primary-900 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Bekijk voorbeeld (30 sec)
                </button>
                <button
                  onClick={() => { setShowExitIntent(false); track('exit_intent_dismiss'); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                  aria-label="Sluiten"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-200 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '247', label: 'leerkrachten' },
              { number: '1.247', label: 'groepsplannen' },
              { number: '4.8/5', label: 'beoordeling' },
              { number: '2.1u', label: 'gemiddeld bespaard' },
            ].map((stat, idx) => (
              <div key={idx} className="relative">
                <div className="text-4xl md:text-5xl font-bold text-primary-700 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                {idx < 3 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empathy Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div
            id="empathy"
            data-animate
            className={`bg-gradient-to-br from-amber-100 to-amber-50 border-l-4 border-amber-600 rounded-xl p-8 md:p-12 shadow-sm transition-all duration-700 ${
              isVisible['empathy'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Herkenbaar?</h2>
            <div className="space-y-4 mb-8">
              {[
                'Je kopiÃ«ert je vorige groepsplan en past de datums aan. Voelt als vals spelen, maar je hebt geen tijd.',
                'Je IB\'er zegt: "Dit is nog te algemeen, maak het specifieker." Nog een uur extra werk.',
                'Het is 22:30. Je zit op de bank met je laptop. Morgen weer vroeg op. Je bent moe.',
                'Je googlet "groepsplan voorbeeld" voor inspiratie. De templates zijn te algemeen of niet van dit jaar.',
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span className="text-2xl text-amber-600 flex-shrink-0 mt-1">â˜</span>
                  <span className="text-gray-700 text-base md:text-lg leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900 pt-6 border-t-2 border-amber-200">
              â†’ Pebble doet het zware werk. Jij checkt en downloadt.
            </p>
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
            <div
              id="time-before"
              data-animate
              className={`bg-gray-50 border-2 border-gray-300 rounded-xl p-8 text-center transition-all duration-700 ${
                isVisible['time-before'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-gray-700 font-semibold mb-4 uppercase text-sm tracking-wide">Normaal</div>
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <div className="text-5xl font-bold text-gray-900 mb-2">22:00</div>
              <div className="text-gray-500 mb-4">Start</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-gray-500 h-3 rounded-full" style={{ width: '100%' }} />
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">00:00</div>
              <div className="text-gray-500 mb-4">Klaar</div>
              <div className="text-3xl mb-2">ðŸ˜«</div>
              <div className="text-lg font-semibold text-gray-700">2 uur werk</div>
              <div className="text-sm text-gray-500 mt-2">Naar bed, moe</div>
            </div>

            {/* After */}
            <div
              id="time-after"
              data-animate
              className={`bg-gradient-to-br from-green-50 to-white border-2 border-success-500 rounded-xl p-8 text-center transition-all duration-700 ${
                isVisible['time-after'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-green-700 font-semibold mb-4 uppercase text-sm tracking-wide">Met Pebble</div>
              <Clock className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <div className="text-5xl font-bold text-gray-900 mb-2">22:00</div>
              <div className="text-gray-500 mb-4">Start</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-success-500 h-3 rounded-full transition-all duration-1000" style={{ width: '8%' }} />
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">22:10</div>
              <div className="text-gray-500 mb-4">Klaar</div>
              <div className="text-3xl mb-2">âœ¨</div>
              <div className="text-lg font-semibold text-green-700">10 minuten werk</div>
              <div className="text-sm text-gray-500 mt-2">Netflix kijken</div>
            </div>
          </div>
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
              {
                icon: <Check size={24} />,
                bg: 'bg-green-100',
                color: 'text-green-600',
                title: 'Inspectie-proof',
                desc: 'Automatische check op Passend Onderwijs 2024 richtlijnen. SMARTI doelen, handelingsgericht, alles erin.',
              },
              {
                icon: <Users size={24} />,
                bg: 'bg-primary-100',
                color: 'text-primary-600',
                title: 'Leert van jouw stijl',
                desc: 'Upload je oude groepsplan. Wij leren van je aanpak en maken een nieuw plan in jouw stijl.',
              },
              {
                icon: <Zap size={24} />,
                bg: 'bg-warm-100',
                color: 'text-warm-600',
                title: 'Geen algemene onzin',
                desc: 'Concrete tijden, specifieke materialen, realistische doelen. Geen "maatwerk bieden".',
              },
              {
                icon: <Smartphone size={24} />,
                bg: 'bg-gray-100',
                color: 'text-gray-600',
                title: 'Werkt op je telefoon',
                desc: '22:00 op de bank? Start op je telefoon, maak af op je laptop. Of andersom.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                id={`feature-${idx}`}
                data-animate
                className={`flex items-start gap-5 p-6 md:p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${
                  isVisible[`feature-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`${feature.bg} ${feature.color} p-3 rounded-lg flex-shrink-0`}>{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Wat andere leerkrachten zeggen</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                initial: 'M',
                name: 'Marieke',
                role: 'Groep 5, Rotterdam',
                text:
                  'Eindelijk een tool die begrijpt hoe het Ã©cht is. Geen onnodige functies, gewoon: snel een goed groepsplan. Scheelt me 2 uur per keer.',
                bg: 'bg-primary-100',
                color: 'text-blue-700',
              },
              {
                initial: 'T',
                name: 'Tim',
                role: 'Groep 3, Utrecht',
                text:
                  'Ik was sceptisch. Maar het groepsplan was beter dan wat ik zelf had gemaakt. Mijn IB\'er zei: "Dit is goed uitgewerkt!" Ik zei niks ðŸ˜…',
                bg: 'bg-green-100',
                color: 'text-green-700',
              },
              {
                initial: 'L',
                name: 'Lisa',
                role: 'Groep 7, Amsterdam',
                text:
                  'Het fijne: het leert van je oude plan. Dus het voelt als mÃ­jn plan, niet als een generieke template. Precies wat ik nodig had.',
                bg: 'bg-amber-100',
                color: 'text-amber-700',
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                id={`testimonial-${idx}`}
                data-animate
                className={`bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${
                  isVisible[`testimonial-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex text-yellow-400 mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size="16" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed line-clamp-2-mobile">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 ${testimonial.bg} ${testimonial.color} rounded-full flex items-center justify-center font-semibold text-xl`}
                  >
                    {testimonial.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-r from-primary-700 to-primary-600 py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Klaar om je weekend terug te krijgen?</h2>
          <p className="text-xl text-blue-100 mb-8">Start gratis. Geen creditcard nodig. Opzeggen wanneer je wilt.</p>
                    <div className="flex flex-col items-center justify-center gap-3 mb-6"> 
            <a
              href="/maatwerk/new"
              className="bg-white text-blue-700 px-12 py-5 rounded-xl font-semibold text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-200 inline-flex items-center gap-3"
            >
              Krijg je weekend terug
              <ArrowRight size={24} />
            </a>
            <div className="flex items-center justify-center gap-4 text-blue-100 text-sm font-medium">
              <a href="/groepsplan/new" className="underline-offset-4 hover:underline">Groepsplan</a>
              <span className="hidden sm:inline">·</span>
              <a href="/opp/new" className="underline-offset-4 hover:underline">OPP</a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-blue-100 text-sm font-medium mb-4">
            <span>Geen account nodig</span>
            <span className="hidden sm:inline">â€¢</span>
            <span>Geen creditcard</span>
            <span className="hidden sm:inline">â€¢</span>
            <span>Gewoon doen</span>
          </div>
          <p className="text-sm text-blue-200">14 dagen gratis, daarna â‚¬9,99/maand</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-700 to-primary-600 rounded-lg" />
            <span className="text-xl font-bold text-white">Pebble</span>
          </div>
          <p className="text-sm mb-4">Gemaakt voor Nederlandse leerkrachten</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Voorwaarden
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
          animation-fill-mode: both;
        }
        @media (max-width: 640px) {
          .line-clamp-2-mobile {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}


