"use client";
import React from "react";
import ScenarioSelector from "./components/ScenarioSelector";
import LoadingScreen from "@/app/groepsplan/new/components/LoadingScreen";
import { SCENARIOS } from "@/lib/maatwerk/scenarios";

type Context = { groep: number | null; vak: string; onderwerp: string; week?: string; methode?: string };

export default function MaatwerkNewPage() {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [ctx, setCtx] = React.useState<Context>({ groep: null, vak: "Rekenen", onderwerp: "" });
  const [showLoading, setShowLoading] = React.useState(false);
  const [results, setResults] = React.useState<any[] | null>(null);
  const [compareIdx, setCompareIdx] = React.useState<number | null>(null);
  const [recent, setRecent] = React.useState<any[]>([]);

  React.useEffect(() => {
    try { const raw = localStorage.getItem("maatwerk_recent"); if (raw) setRecent(JSON.parse(raw)); } catch {}
    try {
      const pf = localStorage.getItem('maatwerk_prefill');
      if (pf) {
        const obj = JSON.parse(pf);
        setCtx((c) => ({ ...c, groep: obj.groep ?? c.groep, vak: obj.vak ?? c.vak, onderwerp: obj.onderwerp ?? c.onderwerp }));
        localStorage.removeItem('maatwerk_prefill');
      }
    } catch {}
  }, []);

  function saveRecent(entry: any) {
    try {
      const list = [entry, ...recent].slice(0, 3);
      setRecent(list);
      localStorage.setItem("maatwerk_recent", JSON.stringify(list));
    } catch {}
  }

  const canGenerate = selected.length > 0 && selected.length <= 10 && ctx.groep && ctx.onderwerp.trim().length >= 2;

  async function startGenerate() {
    if (!canGenerate) return null;
    const startBody = { scenarios: selected, context: { groep: Number(ctx.groep), vak: ctx.vak, onderwerp: ctx.onderwerp, week: ctx.week || null, methode: ctx.methode || null }, options: { format: 'pdf', include_answer_key: true, include_teaching_notes: true } };
    // Proxy to spec-compliant job start
    const startResp = await fetch('/api/maatwerk/worksheets/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(startBody) });
    const startJson = await startResp.json().catch(() => ({}));
    if (!startResp.ok || !startJson?.job_id) return { ok: false, json: startJson };
    const jobId = startJson.job_id as string;
    const statusUrl = (startJson.status_url as string) || `/api/maatwerk/worksheets/generate/${jobId}/status`;

    // Poll until completed (simple loop: up to 60s)
    const started = Date.now();
    let last: any = null;
    while (Date.now() - started < 60000) {
      const s = await fetch(statusUrl, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
      last = s;
      if (s && (s.status === 'completed' || s.worksheets)) break;
      await new Promise(res => setTimeout(res, 1500));
    }
    return { ok: true, json: { status: 'completed', ...(last || {}) } } as any;
  }

  return (
    <main className="theme-warmbath wb-plain-bg min-h-screen space-y-6">
      <header>
        <h1 className="wb-title">Maatwerk-opdrachten Generator</h1>
        <p className="wb-subtle">Kies 1-10 scenario's en vul de lescontext in. Klaar in 3 minuten.</p>
        <div className="mt-2">
          <a href="/maatwerk/upload" className="wb-btn wb-btn-secondary">Upload werkblad uit methode</a>
        </div>
        {recent.length > 0 && (
          <div className="mt-2">
            <button className="wb-btn wb-btn-secondary" onClick={() => { const last = recent[0]; setSelected(last.selected || []); setCtx(last.ctx || {}); }}>Laatst gebruikt: {recent[0]?.ctx?.vak} · Groep {recent[0]?.ctx?.groep} · {recent[0]?.ctx?.onderwerp}</button>
          </div>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="wb-h2">Scenarios</h2>
        <ScenarioSelector value={selected} onChange={setSelected} />
        <div className="text-sm wb-subtle">{selected.length} scenario(s) geselecteerd</div>
      </section>

      <section className="space-y-3">
        <h2 className="wb-h2">Lescontext</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="wb-text-field">
            <span className="wb-text-field-label">Groep</span>
            <div className="wb-text-field-wrapper">
              <select className="wb-text-field-input" value={ctx.groep ?? ""} onChange={(e) => setCtx((c) => ({ ...c, groep: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">Kies...</option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <div className="wb-text-field-underline" />
            </div>
          </label>
          <label className="wb-text-field">
            <span className="wb-text-field-label">Vak</span>
            <div className="wb-text-field-wrapper">
              <select className="wb-text-field-input" value={ctx.vak} onChange={(e) => setCtx((c) => ({ ...c, vak: e.target.value }))}>
                {["Rekenen","Taal","Spelling","Begrijpend lezen","Schrijven","Wereldoriëntatie"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <div className="wb-text-field-underline" />
            </div>
          </label>
          <label className="wb-text-field sm:col-span-1 col-span-1">
            <span className="wb-text-field-label">Onderwerp</span>
            <div className="wb-text-field-wrapper">
              <input className="wb-text-field-input" maxLength={50} placeholder="Vermenigvuldigen" value={ctx.onderwerp} onChange={(e) => setCtx((c) => ({ ...c, onderwerp: e.target.value }))} />
              <div className="wb-text-field-underline" />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="wb-text-field">
            <span className="wb-text-field-label">Week/Periode (optioneel)</span>
            <div className="wb-text-field-wrapper">
              <input className="wb-text-field-input" maxLength={40} placeholder="Week 12" value={ctx.week || ""} onChange={(e) => setCtx((c) => ({ ...c, week: e.target.value }))} />
              <div className="wb-text-field-underline" />
            </div>
          </label>
          <label className="wb-text-field">
            <span className="wb-text-field-label">Methode (optioneel)</span>
            <div className="wb-text-field-wrapper">
              <input className="wb-text-field-input" maxLength={60} placeholder="Wereld in Getallen" value={ctx.methode || ""} onChange={(e) => setCtx((c) => ({ ...c, methode: e.target.value }))} />
              <div className="wb-text-field-underline" />
            </div>
          </label>
        </div>
      </section>

      <section className="flex items-center gap-3">
        <button className={`wb-btn wb-btn-primary ${!canGenerate ? 'opacity-60 pointer-events-none' : ''}`} onClick={() => { if (!canGenerate) return; setShowLoading(true); }}>
          Genereer {selected.length || ''} werkbladen
        </button>
        <div className="wb-subtle text-sm">Geen namen nodig. AVG-proof.</div>
      </section>

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
                const ws = res?.json?.worksheets || res?.json?.items || [];
                setResults(ws);
                saveRecent({ selected, ctx });
              }}
              onRetry={() => setShowLoading(false)}
            />
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <section className="space-y-3">
          <h2 className="wb-h2">{results.length} Aangepaste werkbladen</h2>
          <div className="grid gap-3">
            {results.map((it, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base" style={{ fontWeight: 600 }}>{SCENARIOS.find(s => s.id === it.scenarioId)?.label || it.scenarioId}</div>
                    <div className="text-sm wb-subtle">{ctx.vak} · Groep {ctx.groep} · {ctx.onderwerp}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="wb-btn wb-btn-secondary" onClick={() => {
                      const w = window.open("", "_blank");
                      if (w) w.document.write(`<pre style=\"white-space: pre-wrap; font-family: system-ui, sans-serif; padding: 16px\">${it.content.replaceAll("<","&lt;")}</pre>`);
                    }}>Bekijk</button>
                    <button className="wb-btn wb-btn-primary" onClick={async () => {
                      const body = { content: String(it.content || ''), metadata: { groep: ctx.groep, vak: ctx.vak, periode: ctx.week || '' } };
                      const resp = await fetch('/api/export-word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `Maatwerk_${it.label}_${ctx.vak}_G${ctx.groep}.docx`;
                      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                    }}>Download als Word</button>
                    <button className="wb-btn wb-btn-secondary" onClick={() => setCompareIdx(idx)}>Vergelijk met origineel</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {compareIdx !== null && results && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="wb-h2">Vergelijk met origineel</h3>
              <button className="wb-btn wb-btn-secondary" onClick={() => setCompareIdx(null)}>Sluiten</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ maxHeight: 600, overflow: 'auto' }}>
              <div>
                <div className="wb-section-header" style={{ fontSize: 16 }}>Origineel</div>
                {(() => {
                  let src: string | null = null;
                  try { src = localStorage.getItem('maatwerk_upload_preview'); } catch {}
                  if (!src) return <div className="wb-subtle text-sm">Geen originele foto beschikbaar.</div>;
                  return <img src={src} alt="origineel" className="w-full h-auto rounded border border-border" />;
                })()}
              </div>
              <div>
                <div className="wb-section-header" style={{ fontSize: 16 }}>Aangepast</div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif' }}>{String(results[compareIdx!]?.content || '')}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
