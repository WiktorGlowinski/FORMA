import { Suspense } from "react";
import { connection } from "next/server";
import { getCoachAnalyticsAction } from "@/app/actions/coach";
import { TeamAnalytics } from "@/components/coach/team-analytics";

async function CoachAnalyticsContent() {
  await connection();
  const result = await getCoachAnalyticsAction();

  if (!result.success || !result.data) {
    return (
      <section className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6" role="alert">
        <h1 className="font-heading text-2xl uppercase">Nie można otworzyć analizy</h1>
        <p className="mt-2 text-sm text-destructive">{result.error || "Brak danych."}</p>
      </section>
    );
  }

  return <TeamAnalytics data={result.data} />;
}

export default function CoachAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <section className="rounded-2xl border-2 border-foreground/20 bg-card p-6 text-sm text-muted-foreground">
          Ładowanie analizy zespołu…
        </section>
      }
    >
      <CoachAnalyticsContent />
    </Suspense>
  );
}
