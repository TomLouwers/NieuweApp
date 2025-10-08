"use client";
import React from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const ACCEPT = [
  ".pdf",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
];

function isValidExt(name: string) {
  const lower = name.toLowerCase();
  return ACCEPT.some((ext) => lower.endsWith(ext));
}

export default function DecisionPoint() {
  const router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [warning, setWarning] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  function onOpenPicker() {
    setError("");
    setWarning("");
    fileInputRef.current?.click();
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const resp = await fetch("/api/groepsplan/upload", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) {
        setError(String(json?.error || "Upload mislukt"));
        return;
      }
      const id = json.id || "";
      if (id) router.push(`/groepsplan/edit/${id}`);
    } catch (e: any) {
      setError("Upload mislukt");
    }
  }

  function toScratch() {
    router.push("/groepsplan/new?flow=scratch");
  }

  function onSample() {
    setShowSample(true);
  }

  function handleFiles(files: FileList) {
    setError("");
    setWarning("");
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setWarning("1 bestand tegelijk");
    }
    const file = files[0];
    if (!isValidExt(file.name)) {
      setError("Ongeldig bestandstype. Toegestaan: .pdf, .docx, .jpg, .png");
      return;
    }
    // Start Upload Flow (A1)
    uploadFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
  }

  function onCardKey(e: React.KeyboardEvent, action: () => void) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files) handleFiles(files);
  }

  const [showSample, setShowSample] = React.useState(false);

  const cardBase = "border-2 border-gray-200 rounded-xl p-6 transition-colors duration-200 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500";
  const cardHover = "hover:border-blue-500";

  return (
    <div className="space-y-4" aria-labelledby="dp-title">
      <h1 id="dp-title">Kies een startpunt</h1>
      <p className="text-muted">Upload een document, begin vanaf nul of bekijk eerst een voorbeeld.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Upload */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload een document"
          data-testid="card-upload"
          className={clsx(cardBase, cardHover, isDragOver && "border-blue-500 bg-blue-50/30")}
          onClick={onOpenPicker}
          onKeyDown={(e) => onCardKey(e, onOpenPicker)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <h2 className="mb-2">Upload</h2>
          <p className="text-sm text-muted">Sleep hierheen of klik om een bestand te kiezen (.pdf, .docx, .jpg, .png).</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            multiple={false}
            onChange={onInputChange}
          />
        </div>

        {/* Scratch */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Start vanaf nul"
          data-testid="card-scratch"
          className={clsx(cardBase, cardHover)}
          onClick={toScratch}
          onKeyDown={(e) => onCardKey(e, toScratch)}
        >
          <h2 className="mb-2">Start vanaf nul</h2>
          <p className="text-sm text-muted">Begin met een leeg groepsplan en vul stap voor stap in.</p>
        </div>

        {/* Sample */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Bekijk eerst een voorbeeld"
          data-testid="card-sample"
          className={clsx(cardBase, cardHover)}
          onClick={onSample}
          onKeyDown={(e) => onCardKey(e, onSample)}
        >
          <h2 className="mb-2">Bekijk eerst een voorbeeld</h2>
          <p className="text-sm text-muted">Zie een korte, statische preview van een groepsplan.</p>
        </div>
      </div>

      {/* Inline messages */}
      <div className="space-y-2" aria-live="polite">
        {warning ? (
          <div className="text-sm" role="alert">{warning}</div>
        ) : null}
        {error ? (
          <div className="text-sm text-red-600" role="alert">{error}</div>
        ) : null}
      </div>

      {/* Back link below cards for keyboard order */}
      <div>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">Terug</a>
      </div>

      {/* Sample Modal (static mock) */}
      {showSample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Voorbeeld groepsplan"
          onClick={() => setShowSample(false)}
        >
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Voorbeeld</h3>
              <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowSample(false)}>
                Sluiten
              </button>
            </div>
            <div className="prose max-w-none">
              <h1>Groepsplan rekenen — Groep 5 — Periode Q2</h1>
              <h2>Beginsituatie</h2>
              <p>Korte schets van de beginsituatie…</p>
              <h2>Doelen (SLO)</h2>
              <ul>
                <li>REK-G5-1</li>
                <li>REK-G5-2</li>
              </ul>
              <h2>Aanpak</h2>
              <p>EDM, begeleide inoefening, differentiatie…</p>
            </div>
          </div>
        </div>
      )}

      {/**
       * Unit test placeholders:
       * - validates keyboard activation (Enter/Space) on each card
       * - rejects invalid file ext and shows role="alert"
       * - warns on multiple files dropped: "1 bestand tegelijk"
       * - opens and closes sample modal
       */}
    </div>
  );
}
