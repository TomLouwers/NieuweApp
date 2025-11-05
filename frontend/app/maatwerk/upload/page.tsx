"use client";
import React from "react";
import LoadingScreen from "@/app/groepsplan/new/components/LoadingScreen";

type Analysis = {
  vak: string;
  onderwerp: string;
  groep: number;
  aantalOpgaven: number;
  niveau: string;
  opgaven: { nummer: number; type: string; tekst: string }[];
  confidence: number;
};

export default function MaatwerkUploadPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [uploadJob, setUploadJob] = React.useState<{ upload_id: string; status_url: string } | null>(null);
  const [edit, setEdit] = React.useState<Partial<Analysis> | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function onPick() { inputRef.current?.click(); }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    try {
      const reader = new FileReader();
      reader.onload = () => { const url = String(reader.result || ''); setPreview(url); };
      reader.readAsDataURL(f);
    } catch {}
  }

  async function startAnalyze() {
    if (!file) return;
    setProcessing(true);
    // Try job-based upload first
    const fdUpload = new FormData();
    fdUpload.append('image', file);
    const upResp = await fetch('/api/maatwerk/worksheets/upload', { method: 'POST', body: fdUpload });
    if (upResp.status === 202) {
      const job = await upResp.json().catch(() => ({}));
      if (job?.upload_id && job?.status_url) {
        setUploadJob({ upload_id: job.upload_id, status_url: job.status_url });
        // poll until awaiting_validation
        const started = Date.now();
        let status: any = null;
        while (Date.now() - started < 30000) {
          status = await fetch(job.status_url, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
          if (status && (status.status === 'awaiting_validation' || status.recognized_content)) break;
          await new Promise(res => setTimeout(res, 1500));
        }
        setProcessing(false);
        if (status?.recognized_content) {
          const rc = status.recognized_content;
          const mapped: Analysis = {
            vak: rc.vak, onderwerp: rc.onderwerp, groep: rc.groep,
            aantalOpgaven: rc.aantal_opgaven, niveau: rc.niveau,
            opgaven: (rc.opgaven_preview || []).map((o: any) => ({ nummer: o.nummer, type: o.type, tekst: o.tekst })),
            confidence: rc.overall_confidence || 0.7,
          };
          setAnalysis(mapped); setEdit(mapped);
          try { if (preview) localStorage.setItem('maatwerk_upload_preview', preview); localStorage.setItem('maatwerk_upload_analysis', JSON.stringify(mapped)); } catch {}
          return;
        }
      }
    }
    // Fallback: local analyze
    const fd = new FormData(); fd.append('file', file);
    const resp = await fetch('/api/maatwerk/analyze', { method: 'POST', body: fd });
    const json = await resp.json().catch(() => ({}));
    setProcessing(false);
    if (resp.ok && json?.ok) {
      const rc = json.recognized_content as any;
      const ana = json.analysis as any;
      const mapped: Analysis | null = rc ? {
        vak: rc.vak,
        onderwerp: rc.onderwerp,
        groep: rc.groep,
        aantalOpgaven: rc.aantal_opgaven,
        niveau: rc.niveau,
        opgaven: (rc.opgaven_preview || []).map((o: any) => ({ nummer: o.nummer, type: o.type, tekst: o.tekst })),
        confidence: rc.overall_confidence || 0.7,
      } : (ana || null);
      if (!mapped) { alert('Analyseren mislukt. Probeer opnieuw.'); return; }
      setAnalysis(mapped);
      setEdit(mapped);
      try { if (preview) localStorage.setItem('maatwerk_upload_preview', preview); localStorage.setItem('maatwerk_upload_analysis', JSON.stringify(mapped)); } catch {}
    } else {
      alert('Analyseren mislukt. Probeer opnieuw.');
    }
  }

  function confirmAndContinue() {
    if (!edit) return;
    // If job exists, attempt validate; otherwise just proceed to generator
    if (uploadJob) {
      (async () => {
        const corrections = { vak: edit.vak, onderwerp: edit.onderwerp, groep: edit.groep, aantal_opgaven: edit.aantalOpgaven } as any;
        await fetch(`/api/maatwerk/worksheets/upload/${uploadJob.upload_id}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ corrections, confirmed: true }) });
        // Poll until completed
        const started = Date.now();
        let status: any = null;
        while (Date.now() - started < 60000) {
          status = await fetch(uploadJob.status_url, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
          if (status && status.status === 'completed' && status.worksheets) break;
          await new Promise(res => setTimeout(res, 1500));
        }
        if (status?.worksheets?.length) {
          // Show results inline by writing to local storage for preview page, or navigate back to generator
          try { localStorage.setItem('maatwerk_upload_result', JSON.stringify(status)); } catch {}
          const pf = { groep: edit.groep, vak: edit.vak, onderwerp: edit.onderwerp } as any;
          try { localStorage.setItem('maatwerk_prefill', JSON.stringify(pf)); } catch {}
          location.href = '/maatwerk/new?source=upload';
          return;
        }
      })();
    } else {
      const pf = { groep: edit.groep, vak: edit.vak, onderwerp: edit.onderwerp } as any;
      try { localStorage.setItem('maatwerk_prefill', JSON.stringify(pf)); } catch {}
      location.href = '/maatwerk/new?source=upload';
    }
  }

  return (
    <main className="theme-warmbath wb-plain-bg min-h-screen space-y-6">
      <header>
        <h1 className="wb-title">Upload uit methode</h1>
        <p className="wb-subtle">Maak een foto of upload een PDF van een werkblad. We herkennen vak/onderwerp/groep en vullen het formulier voor je in. AVG-proof.</p>
      </header>

      {!file && (
        <section className="wb-paper paper-texture rounded-xl p-6">
          <div className="text-center space-y-3">
            <div className="text-2xl" aria-hidden>📷</div>
            <div className="wb-subtle">Leg je boek plat, goede verlichting, camera recht</div>
            <div className="flex items-center justify-center gap-3">
              <button className="wb-btn wb-btn-primary" onClick={onPick}>Upload bestand</button>
              <input ref={inputRef} type="file" accept="image/*,.pdf,.heic" className="hidden" onChange={onFile} />
            </div>
          </div>
        </section>
      )}

      {file && !processing && !analysis && (
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start gap-3">
              {preview ? <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded" /> : <div className="w-24 h-24 rounded bg-gray-100" />}
              <div>
                <div className="text-base" style={{ fontWeight: 600 }}>{file.name}</div>
                <div className="text-sm wb-subtle">{Math.round(file.size/1024)} KB</div>
                <div className="mt-2">
                  <button className="wb-btn wb-btn-primary" onClick={startAnalyze}>Analyseren</button>
                  <button className="wb-btn wb-btn-secondary ml-2" onClick={() => { setFile(null); setPreview(null); }}>Andere foto</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {processing && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-md">
            <LoadingScreen start={async () => ({ ok: true })} onDone={() => {}} onRetry={() => setProcessing(false)} />
          </div>
        </div>
      )}

      {analysis && edit && (
        <section className="space-y-4">
          <div className="wb-paper paper-texture rounded-xl p-6">
            <h2 className="wb-h2">Herkend van je foto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <label className="wb-text-field">
                <span className="wb-text-field-label">Vak</span>
                <div className="wb-text-field-wrapper">
                  <select className="wb-text-field-input" value={edit.vak} onChange={(e) => setEdit({ ...edit, vak: e.target.value })}>
                    {["Rekenen","Taal","Spelling","Begrijpend lezen","Schrijven","Wereldoriëntatie"].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <div className="wb-text-field-underline" />
                </div>
              </label>
              <label className="wb-text-field">
                <span className="wb-text-field-label">Onderwerp</span>
                <div className="wb-text-field-wrapper">
                  <input className="wb-text-field-input" value={edit.onderwerp} onChange={(e) => setEdit({ ...edit, onderwerp: e.target.value })} />
                  <div className="wb-text-field-underline" />
                </div>
              </label>
              <label className="wb-text-field">
                <span className="wb-text-field-label">Groep</span>
                <div className="wb-text-field-wrapper">
                  <select className="wb-text-field-input" value={String(edit.groep)} onChange={(e) => setEdit({ ...edit, groep: Number(e.target.value) })}>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div className="wb-text-field-underline" />
                </div>
              </label>
              <label className="wb-text-field">
                <span className="wb-text-field-label">Aantal opgaven</span>
                <div className="wb-text-field-wrapper">
                  <input type="number" className="wb-text-field-input" value={edit.aantalOpgaven} onChange={(e) => setEdit({ ...edit, aantalOpgaven: Number(e.target.value) })} />
                  <div className="wb-text-field-underline" />
                </div>
              </label>
            </div>
            <div className="mt-4">
              <div className="text-sm wb-subtle">Preview opgaven (eerste 3):</div>
              <ul className="mt-1 text-sm">
                {edit.opgaven?.slice(0, 3).map((o) => (<li key={o.nummer}>• Opgave {o.nummer}: {o.tekst}</li>))}
              </ul>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button className="wb-btn wb-btn-primary" onClick={confirmAndContinue}>Dit klopt, ga verder</button>
              <a className="wb-btn wb-btn-secondary" href="/maatwerk/new">Start vanaf nul</a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
