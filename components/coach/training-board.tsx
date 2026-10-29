"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, Target, Info, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTrainingDate } from "@/components/coach/data";
import {
  getCoachTrainingsAction,
  createTrainingAction,
  type DbTrainingCard,
} from "@/app/actions/coach";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Zaplanowany",
  completed: "Zrealizowany",
  cancelled: "Odwołany",
};

const TRAINING_TYPES = [
  "Taktyczny",
  "Motoryczny",
  "Techniczny",
  "Regeneracyjny",
  "Mecz kontrolny",
];

export function TrainingBoard() {
  const [trainings, setTrainings] = useState<DbTrainingCard[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stan formularza jednostki
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("17:30");
  const [formEnd, setFormEnd] = useState("18:45");
  const [formPlace, setFormPlace] = useState("Boisko główne");
  const [formTopic, setFormTopic] = useState("");
  const [formMainGoal, setFormMainGoal] = useState("");
  const [formTrainingType, setFormTrainingType] = useState("Taktyczny");
  const [formOrgNote, setFormOrgNote] = useState("");
  const [formTeamId, setFormTeamId] = useState("");
  const [formStatus, setFormStatus] = useState<"completed" | "scheduled">("completed");

  async function loadData() {
    setLoading(true);
    const res = await getCoachTrainingsAction();
    if (!res.success) {
      setError(res.error || "Nie udało się załadować jednostek.");
    } else {
      setTrainings(res.trainings);
      setTeams(res.teams);
      if (res.teams.length > 0) {
        setFormTeamId(res.teams[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    setFormDate(new Date().toISOString().split("T")[0]);
  }, []);

  function handleOpenModal() {
    if (!formDate) {
      setFormDate(new Date().toISOString().split("T")[0]);
    }
    setIsModalOpen(true);
  }

  async function handleCreateTraining(e: React.FormEvent) {
    e.preventDefault();
    if (!formTeamId) return;

    setSubmitting(true);
    const currentDate = formDate || new Date().toISOString().split("T")[0];

    const res = await createTrainingAction({
      teamId: formTeamId,
      date: currentDate,
      startTime: `${formStart}:00`,
      endTime: `${formEnd}:00`,
      location: formPlace,
      topic: formTopic,
      mainGoal: formMainGoal,
      trainingType: formTrainingType,
      organizationalNote: formOrgNote,
      status: formStatus,
    });

    if (res.success) {
      setIsModalOpen(false);
      setFormTopic("");
      setFormMainGoal("");
      setFormOrgNote("");
      await loadData();
    } else {
      alert(res.error || "Nie udało się utworzyć jednostki.");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Panel trenera</p>
          <h1 className="mt-2 max-w-3xl font-heading text-5xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-6xl">
            Jednostki do oceny
          </h1>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={handleOpenModal}
          className="h-11 gap-2 shadow-[3px_3px_0_0_var(--foreground)] transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-5" />
          Dodaj jednostkę
        </Button>
      </div>

      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Po zakończonym treningu przechodzisz skład nazwisko po nazwisku. Minus, zero i plus są względem
        własnego poziomu zawodnika. Wpisy zapisują się bezpośrednio w bazie klubu.
      </p>

      {/* MODAL Z PEŁNYMI POLAMI BAZY DANYCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="print-card relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--foreground)]">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="font-heading text-2xl uppercase">Nowa jednostka treningowa</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-sm p-1 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTraining} className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground">Drużyna</label>
                  <select
                    value={formTeamId}
                    onChange={(e) => setFormTeamId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 font-medium outline-none focus:border-foreground"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground">Typ jednostki</label>
                  <select
                    value={formTrainingType}
                    onChange={(e) => setFormTrainingType(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                  >
                    {TRAINING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground">Data</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                  >
                    <option value="completed">Zrealizowany (do oceny)</option>
                    <option value="scheduled">Zaplanowany</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground">Start</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground">Koniec</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    required
                    className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground">Lokalizacja</label>
                <input
                  type="text"
                  value={formPlace}
                  onChange={(e) => setFormPlace(e.target.value)}
                  placeholder="np. Boisko główne, Hala Sportowa"
                  required
                  className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground">Temat / Akcent</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="np. Gra w przewadze po odbiorze piłki"
                  className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground">Cel główny mikrocyklu</label>
                <input
                  type="text"
                  value={formMainGoal}
                  onChange={(e) => setFormMainGoal(e.target.value)}
                  placeholder="np. Poprawa szybkości reakcji w fazie negatywnej"
                  className="mt-1 h-11 w-full rounded-md border-2 border-foreground/20 bg-background px-3 outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground">Notatki organizacyjne dla sztabu</label>
                <textarea
                  rows={2}
                  value={formOrgNote}
                  onChange={(e) => setFormOrgNote(e.target.value)}
                  placeholder="np. Zabrać małe bramki; zawodnicy w ochraniaczach"
                  className="mt-1 w-full rounded-md border-2 border-foreground/20 bg-background p-3 outline-none focus:border-foreground"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Zapisuję w bazie…" : "Utwórz jednostkę"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Łączenie z bazą danych klubu…</p>
      ) : error ? (
        <div className="mt-6 rounded-md border-2 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : trainings.length === 0 ? (
        <div className="print-card mt-8 rounded-md border-2 border-foreground/15 p-6 text-center text-muted-foreground">
          Brak zaplanowanych jednostek dla Twoich zespołów.
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {trainings.map((t) => {
            const finished = t.status === "completed" && t.evaluatedCount === t.totalPlayers && t.totalPlayers > 0;
            const started = t.status === "completed" && t.evaluatedCount > 0 && !finished;
            const open = t.status === "completed";

            return (
              <li key={t.id} className="print-card overflow-hidden rounded-md border-2 border-foreground/15 bg-card">
                <div className="mow-stripes flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-chalk sm:px-5">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium capitalize">{formatTrainingDate(t.date)}</p>
                    {t.trainingType && (
                      <span className="inline-flex items-center gap-1 rounded bg-chalk/20 px-2 py-0.5 text-xs font-semibold tracking-wide uppercase text-chalk">
                        <Tag className="size-3" />
                        {t.trainingType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {t.teamName} · {t.startTime}–{t.endTime}
                  </p>
                </div>

                <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-primary">{t.place}</span>
                    </div>

                    <h2 className="font-heading text-3xl tracking-tight">
                      {t.topic ?? "Trening bez zadanego tematu"}
                    </h2>

                    {t.mainGoal && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground/90">
                        <Target className="size-4 text-primary" />
                        Cel: {t.mainGoal}
                      </p>
                    )}

                    {t.organizationalNote && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info className="size-3.5" />
                        Notatka: {t.organizationalNote}
                      </p>
                    )}

                    {open ? (
                      <p className="pt-1 text-sm">
                        Oceniono <span className="font-medium tabular-nums">{t.evaluatedCount} / {t.totalPlayers}</span>
                        {t.evaluatedCount === 0 ? ". Brak oceny nie jest zerem." : ""}
                      </p>
                    ) : (
                      <p className="pt-1 text-sm text-muted-foreground">
                        {t.status === "cancelled"
                          ? "Odwołana jednostka nie prosi o ocenę."
                          : "Ocenę uruchomisz po zakończeniu treningu."}
                      </p>
                    )}
                  </div>

                  {open ? (
                    <Link
                      href={`/trener/${t.id}`}
                      className={cn(buttonVariants({ size: "lg", variant: finished ? "outline" : "default" }), "h-11 px-4 shrink-0")}
                    >
                      {finished ? "Popraw zapis" : started ? "Dokończ ocenę" : "Oceń skład"}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}