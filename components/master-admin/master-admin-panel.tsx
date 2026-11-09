"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronDown, Plus, ShieldCheck } from "lucide-react";
import { createClubWithAdminAction } from "@/app/actions/master-admin";
import { updateMasterBugReportAction } from "@/app/actions/bug-reports";

type Club = { id: string; name: string; slug: string; is_active: boolean; created_at: string };
type AuditLog = {
  id: string; clubName: string; action: string; entityType: string; entityId: string | null;
  oldData: unknown; newData: unknown; createdAt: string; authorName: string; authorEmail: string | null;
};
type BugReport = {
  id: string; title: string; description: string; category: string; priority: string; status: string;
  page_url: string | null; screenshot_url: string | null; created_at: string;
};

function pretty(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return "Nie można odczytać danych"; }
}

export function MasterAdminPanel({ initialClubs, initialLogs, initialReports, error }: { initialClubs: Club[]; initialLogs: AuditLog[]; initialReports: BugReport[]; error: string | null }) {
  const [clubs, setClubs] = useState(initialClubs);
  const [clubName, setClubName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportStatuses, setReportStatuses] = useState<Record<string, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [paidClubIds, setPaidClubIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("forma-master-admin-paid-clubs");
      return saved ? JSON.parse(saved) as string[] : [];
    } catch {
      return [];
    }
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createClubWithAdminAction({ clubName, slug, adminName, adminEmail, adminPassword });
      if (!result.success || !result.club) {
        setFormError(result.error || "Nie udało się utworzyć klubu.");
        return;
      }
      setClubs((current) => [{
        ...result.club,
        is_active: true,
        created_at: new Date().toISOString(),
      }, ...current]);
      setClubName(""); setSlug(""); setAdminName(""); setAdminEmail(""); setAdminPassword("");
    });
  }

  function toggleLicense(clubId: string) {
    setPaidClubIds((current) => {
      const next = current.includes(clubId)
        ? current.filter((id) => id !== clubId)
        : [...current, clubId];
      window.localStorage.setItem("forma-master-admin-paid-clubs", JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="border-b-2 border-foreground/15 pb-6">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Platforma FORMA</p>
        <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">Master Admin</h1>
        <p className="mt-2 max-w-2xl font-mono text-xs text-muted-foreground">Zarządzaj klubami, pierwszymi administratorami i globalnym dziennikiem audytu.</p>
      </div>
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Plus className="size-5 text-primary" /><h2 className="font-heading text-2xl uppercase">Nowy klub</h2></div>
          {formError && <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{formError}</p>}
          <form onSubmit={submit} className="space-y-3">
            <input required value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Nazwa klubu" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm" />
            <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-klubu" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm" />
            <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Imię i nazwisko pierwszego admina" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm" />
            <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@klub.pl" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm" />
            <input required minLength={6} type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Hasło startowe" className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-sm" />
            <button disabled={isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-black uppercase text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]">{isPending ? "Tworzenie..." : "Utwórz klub i konto admina"}</button>
          </form>
        </section>
        <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="font-heading text-2xl uppercase">Zgłoszenia błędów ({initialReports.length})</h2></div>
          <div className="space-y-2">{initialReports.length === 0 ? <p className="font-mono text-xs text-muted-foreground">Brak zgłoszeń.</p> : initialReports.map((report) => <details key={report.id} className="rounded-xl border border-foreground/15 bg-background p-3"><summary className="cursor-pointer font-bold">{report.title} <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{report.priority} · {report.status}</span></summary><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report.description}</p><div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_auto]"><select value={reportStatuses[report.id] || report.status} onChange={(event) => setReportStatuses((current) => ({ ...current, [report.id]: event.target.value }))} className="rounded-lg border border-border bg-background px-2 py-1 text-xs"><option value="new">Nowe</option><option value="in_progress">W toku</option><option value="resolved">Rozwiązane</option><option value="rejected">Odrzucone</option></select><input value={reportNotes[report.id] || ""} onChange={(event) => setReportNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Notatka administratora" className="rounded-lg border border-border bg-background px-2 py-1 text-xs" /><button type="button" onClick={() => startTransition(async () => { const result = await updateMasterBugReportAction(report.id, reportStatuses[report.id] || report.status, reportNotes[report.id] || ""); if (!result.success) setFormError(result.error || "Nie udało się zapisać."); })} className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Zapisz</button></div><p className="mt-2 font-mono text-[10px] text-muted-foreground">{new Date(report.created_at).toLocaleString("pl-PL")} · {report.category}</p>{report.page_url && <a href={report.page_url} className="mt-2 block text-xs text-primary underline" target="_blank" rel="noreferrer">Adres strony</a>}{report.screenshot_url && <a href={report.screenshot_url} className="mt-2 block text-xs font-bold text-primary underline" target="_blank" rel="noreferrer">Otwórz zrzut ekranu</a>}</details>)}</div>
        </section>
        <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Building2 className="size-5 text-primary" /><h2 className="font-heading text-2xl uppercase">Kluby ({clubs.length})</h2></div>
          <div className="space-y-2">{clubs.map((club) => { const isPaid = paidClubIds.includes(club.id); return <div key={club.id} className="flex items-center justify-between gap-3 rounded-xl border border-foreground/15 bg-background p-3"><div><p className="font-bold">{club.name}</p><p className="font-mono text-[11px] text-muted-foreground">{club.slug}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{isPaid ? "Licencja oznaczona jako opłacona" : "Licencja nieoznaczona"}</p></div><div className="flex items-center gap-2"><span className="font-mono text-[10px] uppercase text-primary">{club.is_active ? "Aktywny" : "Wyłączony"}</span><button type="button" onClick={() => toggleLicense(club.id)} className={`rounded-lg border-2 px-3 py-2 font-mono text-[10px] font-bold uppercase transition ${isPaid ? "border-primary bg-primary text-primary-foreground" : "border-foreground/20 bg-card hover:border-primary hover:text-primary"}`}>{isPaid ? "Opłacona" : "Oznacz opłaconą"}</button></div></div>; })}</div>
        </section>
      </div>
      <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="font-heading text-2xl uppercase">Globalny audit log ({initialLogs.length})</h2></div>
        <div className="space-y-2">{initialLogs.length === 0 ? <p className="font-mono text-xs text-muted-foreground">Brak wpisów audytowych.</p> : initialLogs.map((log) => <div key={log.id} className="rounded-xl border border-foreground/15 bg-background">
          <button type="button" onClick={() => setExpanded(expanded === log.id ? null : log.id)} className="flex w-full items-center justify-between gap-3 p-3 text-left">
            <span><span className="font-bold">{log.action}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{log.entityType} · {log.clubName}</span><span className="block font-mono text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString("pl-PL")} · {log.authorName}</span></span><ChevronDown className={`size-4 transition-transform ${expanded === log.id ? "rotate-180" : ""}`} />
          </button>
          {expanded === log.id && <div className="grid gap-3 border-t border-border p-3 text-xs md:grid-cols-2"><div><p className="mb-1 font-bold uppercase text-muted-foreground">Stan poprzedni</p><pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 whitespace-pre-wrap">{pretty(log.oldData)}</pre></div><div><p className="mb-1 font-bold uppercase text-muted-foreground">Stan nowy</p><pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 whitespace-pre-wrap">{pretty(log.newData)}</pre></div></div>}
        </div>)}</div>
      </section>
    </div>
  );
}
