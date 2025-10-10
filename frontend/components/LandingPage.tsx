"use client";
import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, Users, Zap, Smartphone, Clock, ChevronDown, Menu, X, ChevronUp } from 'lucide-react';
import { track } from "@/lib/utils/analytics";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const loginHref = (process?.env?.NEXT_PUBLIC_LOGIN_URL as string) || '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [headlineVariant, setHeadlineVariant] = useState<'a'|'b'>('a');
  const [showVideo, setShowVideo] = useState(false);
  const demoUrl = (process?.env?.NEXT_PUBLIC_DEMO_VIDEO_URL as string) || '';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-6 h-6 bg-white rounded-full opacity-20" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Pebble</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollToId('features')} className="text-gray-700 hover:text-blue-700 transition-colors">Features</button>
            <button onClick={() => scrollToId('testimonials')} className="text-gray-700 hover:text-blue-700 transition-colors">Ervaringen</button>
            <a href={loginHref} className="text-blue-700 hover:text-blue-800 transition-colors">Inloggen</a>
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <a href={loginHref} className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">Inloggen</a>
            <button aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-md border border-gray-200 hover:bg-gray-50">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 grid gap-2">
            <button onClick={() => { scrollToId('features'); setMobileOpen(false); track('nav_click', { target: 'features' }); }} className="text-left py-2 px-2 rounded-md hover:bg-blue-50">Features</button>
            <button onClick={() => { scrollToId('testimonials'); setMobileOpen(false); track('nav_click', { target: 'testimonials' }); }} className="text-left py-2 px-2 rounded-md hover:bg-blue-50">Ervaringen</button>
              <a onClick={() => setMobileOpen(false)} href={loginHref} className="py-2 px-2 rounded-md hover:bg-blue-50">Inloggen</a>
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
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 mb-6 animate-fade-in">
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
                Je groepsplan moet vrijdag klaar.
                <br />
                Je hebt er nog geen letter van geschreven.
              </>
            ) : (
              <>
                Morgen inspectie.
                <br />
                10 minuten voor een goed groepsplan.
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
              ? 'Pebble maakt je groepsplan in 10 minuten. Upload je oude plan, of beantwoord 5 vragen. Download als Word. Klaar.'
              : 'Upload je oude plan of beantwoord 5 vragen. Jij checkt, downloadt en bent klaar. Minder gedoe, meer tijd.'}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <a
              href="/groepsplan/new"
              onClick={() => track('cta_click', { cta: 'start_plan', variant: headlineVariant })}
              className="group bg-gradient-to-r from-blue-700 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Maak je groepsplan
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => { track('cta_click', { cta: 'view_sample', variant: headlineVariant }); if (demoUrl) setShowVideo(true); else window.location.href = '/groepsplan/new?flow=scratch'; }}
              className="bg-white text-gray-700 px-10 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 hover:border-blue-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 text-center"
            >
              Bekijk voorbeeld
            </button>
          </div>

          {/* Trust signals */}
          <div
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-medium animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="flex items-center gap-2">
              <Check size={16} className="text-green-500" strokeWidth={2.5} />
              14 dagen gratis
            </span>
            <span className="flex items-center gap-2">
              <Check size={16} className="text-green-500" strokeWidth={2.5} />
              Geen creditcard
            </span>
            <span className="flex items-center gap-2">
              <Check size={16} className="text-green-500" strokeWidth={2.5} />
              Inspectie-OK
            </span>
          </div>
          {/* Scroll chevron */}
          <button
            aria-label="Scroll naar features"
            onClick={() => { scrollToId('features'); track('nav_scroll', { target: 'features' }); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-blue-700 hover:text-blue-800 transition-transform hover:translate-y-0.5"
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </section>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          aria-label="Terug naar boven"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); track('nav_scroll', { target: 'top' }); }}
          className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-lg rounded-full p-3 text-blue-700 hover:text-blue-800 hover:shadow-xl transition-all"
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
                <div className="text-4xl md:text-5xl font-bold text-blue-700 mb-2">{stat.number}</div>
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
                'Je kopiëert je vorige groepsplan en past de datums aan. Voelt als vals spelen, maar je hebt geen tijd.',
                'Je IB\'er zegt: "Dit is nog te algemeen, maak het specifieker." Nog een uur extra werk.',
                'Het is 22:30. Je zit op de bank met je laptop. Morgen weer vroeg op. Je bent moe.',
                'Je googlet "groepsplan voorbeeld" voor inspiratie. De templates zijn te algemeen of niet van dit jaar.',
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span className="text-2xl text-amber-600 flex-shrink-0 mt-1">☐</span>
                  <span className="text-gray-700 text-base md:text-lg leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900 pt-6 border-t-2 border-amber-200">
              → Pebble doet het zware werk. Jij checkt en downloadt.
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
              <div className="text-3xl mb-2">😫</div>
              <div className="text-lg font-semibold text-gray-700">2 uur werk</div>
              <div className="text-sm text-gray-500 mt-2">Naar bed, moe</div>
            </div>

            {/* After */}
            <div
              id="time-after"
              data-animate
              className={`bg-gradient-to-br from-green-50 to-white border-2 border-green-500 rounded-xl p-8 text-center transition-all duration-700 ${
                isVisible['time-after'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-green-700 font-semibold mb-4 uppercase text-sm tracking-wide">Met Pebble</div>
              <Clock className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <div className="text-5xl font-bold text-gray-900 mb-2">22:00</div>
              <div className="text-gray-500 mb-4">Start</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-green-500 h-3 rounded-full transition-all duration-1000" style={{ width: '8%' }} />
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">22:10</div>
              <div className="text-gray-500 mb-4">Klaar</div>
              <div className="text-3xl mb-2">✨</div>
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
                bg: 'bg-blue-100',
                color: 'text-blue-600',
                title: 'Leert van jouw stijl',
                desc: 'Upload je oude groepsplan. Wij leren van je aanpak en maken een nieuw plan in jouw stijl.',
              },
              {
                icon: <Zap size={24} />,
                bg: 'bg-orange-100',
                color: 'text-orange-600',
                title: 'Geen generiek gezwam',
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
                  'Eindelijk een tool die begrijpt hoe het écht is. Geen onnodige functies, gewoon: snel een goed groepsplan. Scheelt me 2 uur per keer.',
                bg: 'bg-blue-100',
                color: 'text-blue-700',
              },
              {
                initial: 'T',
                name: 'Tim',
                role: 'Groep 3, Utrecht',
                text:
                  'Ik was sceptisch. Maar het groepsplan was beter dan wat ik zelf had gemaakt. Mijn IB\'er zei: "Dit is goed uitgewerkt!" Ik zei niks 😅',
                bg: 'bg-green-100',
                color: 'text-green-700',
              },
              {
                initial: 'L',
                name: 'Lisa',
                role: 'Groep 7, Amsterdam',
                text:
                  'Het fijne: het leert van je oude plan. Dus het voelt als míjn plan, niet als een generieke template. Precies wat ik nodig had.',
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
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
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
      <section className="relative bg-gradient-to-r from-blue-700 to-blue-600 py-16 md:py-20 overflow-hidden">
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
          <a
            href="/groepsplan/new"
            className="bg-white text-blue-700 px-12 py-5 rounded-xl font-semibold text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-200 inline-flex items-center gap-3 mb-6"
          >
            Maak je groepsplan - 100% gratis starten
            <ArrowRight size={24} />
          </a>
          <div className="flex flex-wrap justify-center gap-4 text-blue-100 text-sm font-medium mb-4">
            <span>Geen account nodig</span>
            <span className="hidden sm:inline">•</span>
            <span>Geen creditcard</span>
            <span className="hidden sm:inline">•</span>
            <span>Gewoon doen</span>
          </div>
          <p className="text-sm text-blue-200">14 dagen gratis, daarna €9,99/maand</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg" />
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
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
