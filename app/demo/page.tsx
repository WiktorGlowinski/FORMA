import type { Metadata } from "next";
import { EvalDemo } from "@/components/landing/eval-demo";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "Wypróbuj demo — Forma",
  description: "Podgląd szybkiej oceny po treningu. Ten skład jest wymyślony i nie zapisuje się na serwerze.",
};

export default function DemoPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Podgląd</p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
          Wypróbuj szybką ocenę
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Skład jest wymyślony.
        </p>
        <div className="mt-10">
          <EvalDemo />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}