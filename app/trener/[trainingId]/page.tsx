import { Suspense } from "react";
import { QuickEvaluation } from "@/components/coach/quick-evaluation";

async function EvaluationContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await paramsPromise;
  return <QuickEvaluation trainingId={trainingId} />;
}

export default function TrainingEvaluationPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-6 font-mono text-xs text-muted-foreground animate-pulse">
          Ładowanie protokołu jednostki…
        </p>
      }
    >
      <EvaluationContent paramsPromise={params} />
    </Suspense>
  );
}