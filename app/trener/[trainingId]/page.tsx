import { Suspense } from "react";
import { CoachShell } from "@/components/coach/coach-shell";
import { TrainingScreen } from "@/components/coach/training-screen";

export default function TrainingPage() {
  return (
    <CoachShell>
      <Suspense fallback={<p className="text-sm text-muted-foreground">OdczytujÄ™ jednostkÄ™â€¦</p>}>
        <TrainingScreen />
      </Suspense>
    </CoachShell>
  );
}