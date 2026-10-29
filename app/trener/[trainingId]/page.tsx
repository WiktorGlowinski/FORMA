import { Suspense } from "react";
import { CoachShell } from "@/components/coach/coach-shell";
import { QuickEvaluation } from "@/components/coach/quick-evaluation";

interface PageProps {
  params: Promise<{ trainingId: string }>;
}

export default function TrainingEvaluationPage({ params }: PageProps) {
  return (
    <CoachShell>
      <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Ładowanie jednostki…</p>}>
        <EvaluationContent params={params} />
      </Suspense>
    </CoachShell>
  );
}

async function EvaluationContent({ params }: { params: Promise<{ trainingId: string }> }) {
  const resolved = await params;
  return <QuickEvaluation trainingId={resolved.trainingId} />;
}