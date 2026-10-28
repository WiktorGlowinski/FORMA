import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel trenera — Forma",
  description: "Szybka ocena składu po treningu. Minus, zero i plus względem własnego poziomu zawodnika.",
};

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return children;
}