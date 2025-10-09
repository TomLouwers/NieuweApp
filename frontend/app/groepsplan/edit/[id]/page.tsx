"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PageProps { params: { id: string } }

export default function EditGroepsplanPage({ params }: PageProps) {
  const router = useRouter();
  const id = params?.id || "draft";

  // Mock fetch document by id
  const [title, setTitle] = React.useState<string>(`Groepsplan (concept) — ${id}`);
  const [content, setContent] = React.useState<string>(
    "# Groepsplan rekenen — Groep 5 — Periode Q2\n\n" +
      "## Beginsituatie\nKorte schets (mock).\n\n" +
      "## Doelen (SLO)\n- REK-G5-1\n- REK-G5-2\n\n" +
      "## Aanpak\nPlaceholder aanpak.\n\n" +
      "## Differentiatie\nPlaceholder differentiatie.\n\n" +
      "## Evaluatie\nPlaceholder evaluatie.\n"
  );
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [assist, setAssist] = React.useState<string>("");

  function fmtTime(ts: number) {
    try { return new Date(ts).toLocaleTimeString(); } catch { return ""; }
  }

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSavedAt(Date.now());
    setSaving(false);
  }

  async function download() {
    try {
      const resp = await fetch(`/api/groepsplan/${encodeURIComponent(id)}/download?format=docx`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${title.replace(/[^a-z0-9_-]+/gi,'_') || 'Groepsplan'}.docx`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {}
  }

  return (
    <main className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={() => router.back()}>← Terug</Button>
          <Button variant="primary" onClick={save} disabled={saving}>Opslaan</Button>
          <Button variant="secondary" onClick={download}>📥 Downloaden</Button>
        </div>
        <div className="text-sm text-muted">
          {saving ? "Bezig met opslaan…" : savedAt ? `Automatisch opgeslagen om ${fmtTime(savedAt)}` : "Nog niet opgeslagen"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <section className="lg:col-span-3 space-y-3">
          <input
            className="w-full border border-border rounded-md px-3 py-2 text-lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Titel"
          />
          <div className="rounded-md border border-border">
            <textarea
              className="w-full min-h-[420px] p-3 outline-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-label="Documentinhoud"
            />
          </div>
        </section>

        <aside className="lg:col-span-1 space-y-3">
          <div className="rounded-md border border-border p-3">
            <div className="font-medium mb-2">AI-assist (preview)</div>
            <label className="text-sm">Wat wil je aanpassen?</label>
            <input
              className="mt-1 w-full border border-border rounded-md px-3 py-2"
              placeholder="Bijv. korter maken, meer differentiatie…"
              value={assist}
              onChange={(e) => setAssist(e.target.value)}
            />
            <div className="mt-2 text-xs text-muted">Nog geen backend — concept UI.</div>
          </div>
          {saving ? <Progress value={65} label="Bezig met opslaan…" /> : null}
        </aside>
      </div>
    </main>
  );
}

