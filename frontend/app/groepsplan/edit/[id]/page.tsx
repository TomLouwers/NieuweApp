interface Props {
  params: { id: string };
}

export default function EditGroepsplanPage({ params }: Props) {
  return (
    <main className="space-y-6">
      <h1>Groepsplan bewerken</h1>
      <p className="text-muted">Document-ID: {params.id}</p>
      <div className="rounded-lg border border-border p-4">Editor volgt…</div>
    </main>
  );
}

