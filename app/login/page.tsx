"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerFlag, PitchArt, PitchMark } from "@/components/landing/mark";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);

      if (!result.success) {
        setErrorMsg(result.error || "Nieprawidłowe dane logowania. Sprawdź e-mail i hasło.");
        return;
      }

      router.push("/trainings");
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 select-none">
      {/* Tło taktyczne z motywami boiska ze strony głównej */}
      <PitchArt className="pointer-events-none absolute -top-16 -right-24 w-[520px] text-foreground/5 sm:w-[680px]" />
      <PitchArt className="pointer-events-none absolute -bottom-20 -left-20 w-[440px] text-foreground/5 rotate-180" />

      {/* Przycisk powrotu na landing page */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-md border-2 border-foreground/15 bg-card px-3.5 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground hover:text-foreground hover:shadow-[3px_3px_0_0_var(--foreground)]"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Strona główna
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand i nagłówek sekcji */}
        <div className="mb-6 text-center">
          <Link href="/" className="group inline-flex items-center gap-2.5">
            <PitchMark className="size-8 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-heading text-4xl leading-none tracking-wide text-foreground uppercase sm:text-5xl">
              Forma
            </span>
          </Link>
          <p className="mt-2 text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Strefa sztabu szkoleniowego
          </p>
        </div>

        {/* Główna karta logowania w stylu print-card */}
        <div className="print-card overflow-hidden rounded-md border-2 border-foreground/25 bg-card shadow-[6px_6px_0_0_var(--foreground)] transition-shadow duration-200">
          
          {/* Górna belka stylizowana na trawę boiskową (mow-stripes) */}
          <div className="mow-stripes flex items-center justify-between border-b-2 border-foreground/20 px-5 py-3 text-chalk">
            <span className="text-xs font-medium tracking-[0.14em] uppercase">
              Autoryzacja sztabu
            </span>
            <span className="text-[0.7rem] font-medium tracking-wider opacity-80 uppercase">
              Protokół meczowy
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground uppercase sm:text-4xl">
                Wejście do bazy
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Zaloguj się, aby zarządzać rocznikami i ocenami po jednostkach.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-md border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <ShieldAlert className="size-5 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                >
                  Adres e-mail trenera
                </label>
                <div className="relative mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="trener@klub.pl"
                    className="h-11 w-full rounded-md border-2 border-foreground/20 bg-background/50 px-3.5 pr-10 text-sm font-medium transition duration-150 placeholder:text-muted-foreground/60 focus:border-foreground focus:bg-background focus:shadow-[2px_2px_0_0_var(--foreground)] focus:outline-none"
                  />
                  <Mail className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                  >
                    Hasło klubowe
                  </label>
                </div>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 w-full rounded-md border-2 border-foreground/20 bg-background/50 px-3.5 pr-10 text-sm font-medium transition duration-150 placeholder:text-muted-foreground/60 focus:border-foreground focus:bg-background focus:shadow-[2px_2px_0_0_var(--foreground)] focus:outline-none"
                  />
                  <Lock className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Przycisk logowania zachowujący pełne reguły buttonVariants */}
              <Button
                type="submit"
                disabled={isPending}
                size="lg"
                className="group/btn relative mt-2 h-12 w-full border-2 border-foreground/30 text-base font-semibold tracking-wide uppercase transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)] active:translate-y-0 active:shadow-[1px_1px_0_0_var(--foreground)]"
              >
                <span>{isPending ? "Sprawdzanie uprawnień..." : "Przejdź do sztabu"}</span>
                <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </form>

            <div className="mt-7 border-t-2 border-foreground/10 pt-4">
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Konta przydziela administrator akademii.
                <br />
                Zawodnicy i rodzice nie wymagają logowania — wypełniają ankiety przez linki jednorazowe.
              </p>
            </div>
          </div>
        </div>

        {/* Dodatkowy drobny detal meczowy pod kartą */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CornerFlag className="size-4 text-primary" />
          <span>System monitorowania postępów i zmęczenia zawodników</span>
        </div>
      </div>
    </div>
  );
}