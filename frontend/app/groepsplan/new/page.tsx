import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewGroepsplanPage() {
  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1>Nieuw Groepsplan</h1>
        <Link href="/dashboard"><Button variant="outline">Terug</Button></Link>
      </header>
      <p className="text-muted">Lege shell — wordt ingevuld in volgende stappen.</p>
      <div className="rounded-lg border border-border p-4">Formulier volgt…</div>
    </main>
  );
}

