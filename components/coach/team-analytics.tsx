"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CoachAnalyticsData } from "@/app/actions/coach";
import { AlertCircle, ClipboardCheck, Gauge } from "lucide-react";

const statusStyles = {
  ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  danger: "border-red-500/40 bg-red-500/10 text-red-700",
};

const statusLabels = { ready: "Gotowy", warning: "Uwaga", danger: "Zagrożenie" };

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

export function TeamAnalytics({ data }: { data: CoachAnalyticsData }) {
  const planData = data.planVsReality.plannedRpe != null && data.planVsReality.actualRpe != null
    ? [
        { name: "Plan trenera", value: data.planVsReality.plannedRpe },
        { name: "Odczute RPE", value: data.planVsReality.actualRpe },
      ]
    : [];

  return (
    <div className="space-y-6 pb-16">
      <header className="border-b-2 border-foreground/15 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Panel szkoleniowy</p>
        <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight">Analiza na dziś</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.teams.map((team) => team.name).join(", ") || "Brak przypisanych zespołów"}
        </p>
      </header>

      <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <h2 className="font-heading text-xl uppercase">Sygnalizator szatniowy</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">ACWR i RPE z ostatnich 3 dni</p>
        {data.lockerStatuses.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">Brak aktywnych zawodników lub ankiet RPE.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {data.lockerStatuses.map((player) => (
              <Link
                key={player.playerId}
                href={`/trener/zawodnicy/${player.playerId}`}
                className={`rounded-xl border-2 p-3 transition hover:border-foreground/60 ${statusStyles[player.status]}`}
              >
                <p className="truncate text-sm font-bold">{player.playerName}</p>
                <p className="mt-2 text-xs font-black uppercase">{statusLabels[player.status]}</p>
                <p className="mt-1 font-mono text-[10px]">ACWR {player.acwr ?? "—"} · RPE {player.recentRpe ?? "—"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <h2 className="font-heading text-xl uppercase">Plan vs Realia</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Ostatnia jednostka {data.planVsReality.date ? shortDate(data.planVsReality.date) : "—"}
        </p>
        {planData.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">Brak planowanego lub odczutego RPE dla ostatniej jednostki.</p>
        ) : (
          <>
            <div className="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5]} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm font-bold">
              Delta: {data.planVsReality.delta != null ? `${data.planVsReality.delta > 0 ? "+" : ""}${data.planVsReality.delta}` : "—"}
            </p>
          </>
        )}
      </section>

      <section className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" />
          <h2 className="font-heading text-xl uppercase">Status wypełnienia ankiet</h2>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <p className="font-heading text-5xl">{data.surveyCompletion.completed}/{data.surveyCompletion.issued}</p>
          <div className="flex-1">
            <div className="h-4 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${data.surveyCompletion.rate}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{data.surveyCompletion.rate}% ankiet wypełnionych</p>
          </div>
        </div>
        {data.surveyCompletion.completed < data.surveyCompletion.issued && (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-amber-700">
            <AlertCircle className="size-4" /> Wyślij przypomnienie o brakujących ankietach.
          </p>
        )}
      </section>
    </div>
  );
}
