import StepFlow from "./components/StepFlow";

export default function NewGroepsplanPage() {
  return (
    <main className="space-y-4">
      <div>
        <h1>Nieuw Groepsplan</h1>
        <p className="text-muted">Maak een keuze om te starten.</p>
      </div>
      <StepFlow />
    </main>
  );
}
