"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const prepareSession = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("Link resetujący wygasł. Poproś o nowy.");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      setSessionReady(Boolean(data.session));
      if (!data.session) setError("Link resetujący wygasł. Poproś o nowy.");
    };
    void prepareSession();
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") || "").trim();
      const confirmation = String(formData.get("confirmation") || "").trim();
      if (password.length < 6) {
        setError("Hasło musi mieć co najmniej 6 znaków.");
        return;
      }
      if (password !== confirmation) {
        setError("Hasła muszą być identyczne.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)]">
        <h1 className="font-heading text-3xl uppercase">Ustaw nowe hasło</h1>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {done ? <p className="text-sm text-primary">Hasło zapisane. Przekierowanie do logowania...</p> : (
          <>
            <input name="password" type="password" minLength={6} required placeholder="Nowe hasło" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3" />
            <input name="confirmation" type="password" minLength={6} required placeholder="Powtórz nowe hasło" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3" />
            <button disabled={isPending || !sessionReady} className="h-11 w-full rounded-xl border-2 border-foreground bg-primary font-heading uppercase text-primary-foreground">
              {!sessionReady ? "Weryfikowanie linku..." : isPending ? "Zapisywanie..." : "Zapisz nowe hasło"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
