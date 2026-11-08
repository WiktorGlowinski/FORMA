"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "@/app/actions/auth";

export default function SetPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.success) {
        setError(result.error || "Nie udało się ustawić hasła.");
        return;
      }
      router.push("/trener");
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)]">
        <div>
          <p className="font-mono text-xs font-bold uppercase text-primary">Pierwsze logowanie</p>
          <h1 className="mt-1 font-heading text-3xl uppercase">Ustaw swoje hasło</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hasło startowe administratora jest jednorazowe.</p>
        </div>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <input name="password" type="password" minLength={6} required placeholder="Nowe hasło" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3" />
        <input name="confirmation" type="password" minLength={6} required placeholder="Powtórz nowe hasło" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3" />
        <button disabled={isPending} className="h-11 w-full rounded-xl border-2 border-foreground bg-primary font-heading uppercase text-primary-foreground">
          {isPending ? "Zapisywanie..." : "Ustaw hasło"}
        </button>
      </form>
    </main>
  );
}
