import { CoachShell } from "@/components/coach/coach-shell";
import { TrainingBoard } from "@/components/coach/training-board";

export default function CoachPage() {
  return (
    <CoachShell>
      <TrainingBoard />
    </CoachShell>
  );
}