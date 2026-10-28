"use client";

import { useParams } from "next/navigation";
import { CoachShell } from "@/components/coach/coach-shell";
import { QuickEvaluation } from "@/components/coach/quick-evaluation";

export default function TrainingPage() {
  const params = useParams<{ trainingId: string }>();
  const trainingId = Array.isArray(params.trainingId) ? params.trainingId[0] : params.trainingId;

  return (
    <CoachShell>
      <QuickEvaluation trainingId={trainingId} />
    </CoachShell>
  );
}