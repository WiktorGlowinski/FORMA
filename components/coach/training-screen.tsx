"use client";

import { useParams } from "next/navigation";
import { QuickEvaluation } from "@/components/coach/quick-evaluation";

export function TrainingScreen() {
  const params = useParams<{ trainingId: string }>();
  const raw = params.trainingId;
  const trainingId = Array.isArray(raw) ? raw[0] : raw;

  if (!trainingId) {
    return <p className="text-sm text-muted-foreground">Brak numeru jednostki.</p>;
  }

  return <QuickEvaluation trainingId={trainingId} />;
}