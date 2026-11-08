"use client";

import { useState, useTransition } from "react";
import { Bug, X } from "lucide-react";
import { submitBugReportAction } from "@/app/actions/bug-reports";

export function BugReportWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("pageUrl", window.location.href);
    data.set("browserInfo", navigator.userAgent);
    setMessage(null);
    startTransition(async () => {
      const result = await submitBugReportAction(data);
      setMessage(result.success ? "Zgłoszenie wysłane. Dziękujemy!" : result.error || "Nie udało się wysłać zgłoszenia.");
      if (result.success) form.reset();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-xl border-2 border-r-0 border-foreground bg-primary px-2 py-4 text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]" aria-label="Zgłoś błąd">
        <Bug className="size-5" />
        <span className="mt-2 block [writing-mode:vertical-rl] font-mono text-[10px] font-bold uppercase">Zgłoś błąd</span>
      </button>
      {open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)]">
          <div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase text-primary">Wsparcie FORMA</p><h2 className="font-heading text-3xl uppercase">Zgłoś błąd</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Zamknij"><X /></button></div>
          <form onSubmit={submit} className="space-y-3">
            <input name="title" required placeholder="Krótki tytuł problemu" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3" />
            <div className="grid grid-cols-2 gap-3"><select name="category" className="h-11 rounded-xl border-2 border-foreground/20 bg-background px-3"><option value="bug">Błąd</option><option value="suggestion">Sugestia</option><option value="login">Logowanie</option></select><select name="priority" className="h-11 rounded-xl border-2 border-foreground/20 bg-background px-3"><option value="normal">Normalny</option><option value="high">Wysoki</option><option value="low">Niski</option></select></div>
            <textarea name="description" required minLength={10} placeholder="Opisz, co się stało i jak odtworzyć problem..." className="min-h-32 w-full rounded-xl border-2 border-foreground/20 bg-background p-3" />
            <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" className="w-full text-sm" />
            {message && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</p>}
            <button disabled={isPending} className="h-11 w-full rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-black uppercase text-primary-foreground">{isPending ? "Wysyłanie..." : "Wyślij zgłoszenie"}</button>
          </form>
        </div>
      </div>}
    </>
  );
}
