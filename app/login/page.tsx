"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PitchMark } from "@/components/landing/mark";
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
        setErrorMsg(result.error || "Nie udało się zalogować. Sprawdź dane.");
        return;
      }

      // Po zalogowaniu przekierowujemy do jednostek lub panelu oceniania
      router.push("/trainings");
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Powrót na stronę główną */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Strona główna
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo i nagłówek */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <PitchMark className="size-8 text-primary" />
            <span className="font-heading text-4xl leading-none tracking-wide uppercase">
              Forma
            </span>
          </Link>
          <p className="mt-3 text-sm font-medium tracking-[0.14em] text-primary uppercase">
            Strefa sztabu szkoleniowego
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Logowanie do klubu
          </h1>
        </div>

        {/* Karta formularza */}
        <div className="print-card overflow-hidden rounded-md border-2 border-foreground/20 bg-card p-6 shadow-[4px_4px_0_0_var(--foreground)] sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="rounded-md border-2 border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase"
              >
                Adres e-mail
              </label>
              <div className="relative mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="trener@klub.pl"
                  className="h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3.5 pr-10 text-sm transition focus:border-foreground focus:outline-none"
                />
                <Mail className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase"
              >
                Hasło dostępu
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3.5 pr-10 text-sm transition focus:border-foreground focus:outline-none"
                />
                <Lock className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="mt-2 h-12 w-full text-base font-medium transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
            >
              {isPending ? "Weryfikacja danych..." : "Zaloguj się"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Dostęp jest przydzielany przez koordynatora akademii.
              <br />
              Zawodnicy i rodzice wypełniają ankiety przez linki jednorazowe bez logowania.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}