"use client";
import React from "react";
import { useOppStore } from "@/lib/stores/oppStore";

export default function UploadProcessing({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const upload = useOppStore((s) => s.upload);
  const doUpload = useOppStore((s) => s.uploadDocument);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function start() {
    if (!file) return;
    setError(null);
    await doUpload(file);
  }

  React.useEffect(() => {
    if (upload.status === 'done') onDone();
  }, [upload.status]);

  return (
    <div className="space-y-3">
      <h2>Upload vorig OPP</h2>
      <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-md bg-teal-600 text-white" disabled={!file || upload.status === 'uploading'} onClick={start}>
          {upload.status === 'uploading' ? 'Analyseren…' : 'Uploaden'}
        </button>
        <button className="px-4 py-2 rounded-md border" onClick={onCancel}>Annuleren</button>
      </div>
      {upload.status === 'error' && <div className="text-sm text-red-600">Upload mislukt</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}

