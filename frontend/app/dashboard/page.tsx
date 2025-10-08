import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentDocuments } from "@/lib/stores/groepsplanStore";

export const dynamic = "force-static";

export default async function DashboardPage() {
  const docs = await getRecentDocuments();
  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1>Dashboard</h1>
        <Link href="/groepsplan/new">
          <Button className="btn-primary">+ Maak Groepsplan</Button>
        </Link>
      </header>

      <section className="space-y-3">
        <h2>Recente documenten</h2>
        <div className="grid gap-4">
          {docs.length === 0 ? (
            <p className="text-muted">Nog geen documenten.</p>
          ) : (
            docs.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle className="text-base">{d.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted">{d.subtitle}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

