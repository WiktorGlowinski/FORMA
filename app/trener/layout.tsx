import { CoachShell } from "@/components/coach/coach-shell";

export default function TrenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoachShell>{children}</CoachShell>;
}