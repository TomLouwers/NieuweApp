"use client";
import React from "react";
import { ArrowRight, Check, FileText, ListChecks, Sparkles } from "lucide-react";
import { track } from "@/lib/utils/analytics";

function Card({ title, desc, href, icon }: { title: string; desc: string; href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={() => track("feature_pick", { feature: title })}
      className="group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-600"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-1">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-primary-700 font-medium">
        Start <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}

export default function StartPickerPage() {
  return (
    <main className="theme-warmbath wb-plain-bg min-h-screen">
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Waar wil je mee starten?</h1>
        <p className="text-gray-600 mb-8">Kies wat je nu nodig hebt. Je kunt later altijd wisselen.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Groepsplan"
            desc="Inspectie‑proof groepsplan in ±10 minuten."
            href="/groepsplan/new"
            icon={<ListChecks size={18} />}
          />
          <Card
            title="OPP"
            desc="Ontwikkelingsperspectief met uitstroomprofiel in ±10 minuten."
            href="/opp/new"
            icon={<FileText size={18} />}
          />
          <Card
            title="Differentiatie"
            desc="Maatwerk‑opdrachten met scenario’s (dyslexie, NT2, traag tempo) in 5–10 min."
            href="/maatwerk/new"
            icon={<Sparkles size={18} />}
          />
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Geen account nodig</span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Geen creditcard</span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> 14 dagen gratis</span>
        </div>
      </section>
    </main>
  );
}
