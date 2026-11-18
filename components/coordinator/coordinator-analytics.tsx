"use client";

import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ArrowDownToLine,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Filter,
  Gauge,
  LayoutDashboard,
  Users,
} from "lucide-react";
import type { getCoordinatorDashboardAction } from "@/app/actions/teams";
import * as React from "react";

type DashboardData = Extract<Awaited<ReturnType<typeof getCoordinatorDashboardAction>>, { success: true }>;
type Team = DashboardData["teams"][number];

const chartColors = { plus: "#22c55e", zero: "#94a3b8", minus: "#f43f5e", accent: "#0f766e" };

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

function formatRate(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function scoreLabel(value: string | null) {
  return value === "+" ? "Powyżej poziomu" : value === "-" ? "Poniżej poziomu" : value === "0" ? "Typowy poziom" : "Brak danych";
}

function downloadCsv(team: Team) {
  const rows = [[
    "Zawodnik",
    "Numer",
    "Frekwencja",
    "Treningi w okresie",
    "Obecności",
    "Nieobecności",
    "Oceny +",
    "Oceny 0",
    "Oceny -",
    "Śr. zmęczenie RPE",
    "ACWR",
    "Monotonia",
    "Strain",
    "Seria wysokiego zmęczenia",
  ]];
  team.players.forEach((player) => {
    const present = player.history.filter((item) => item.present);
    const absences = player.history.length - present.length;
    rows.push([
      player.name,
      player.jerseyNumber?.toString() || "",
      formatRate(player.attendanceRate),
      player.history.length.toString(),
      present.length.toString(),
      absences.toString(),
      present.filter((item) => item.score === "+").length.toString(),
      present.filter((item) => item.score === "0").length.toString(),
      present.filter((item) => item.score === "-").length.toString(),
      player.load.recentFatigue?.toString() || "",
      player.load.acwr?.toString() || "",
      player.load.monotony?.toString() || "",
      player.load.strain?.toString() || "",
      player.load.fatigueStreak.toString(),
    ]);
  });
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `podsumowanie-zawodnikow-${team.name.toLowerCase().replaceAll(/\s+/g, "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Panel({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-foreground/15 bg-card p-5 sm:p-6 ${className}`}>{children}</section>;
}

function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-heading text-2xl uppercase tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-foreground/15 text-sm text-muted-foreground">{text}</div>;
}

export function CoordinatorAnalytics({ data }: { data: DashboardData }) {
  const [selectedTeamId, setSelectedTeamId] = React.useState(data.teams.find((team) => team.isActive)?.id || data.teams[0]?.id || "");
  const [range, setRange] = React.useState<"30" | "14">("30");
  const team = data.teams.find((item) => item.id === selectedTeamId) || data.teams[0];

  if (!team) {
    return <EmptyChart text="Brak zespołów do pokazania." />;
  }

  const trend = team.scoreTrend.slice(range === "14" ? -4 : -8).map((item) => {
    const total = item.scores.plus + item.scores.zero + item.scores.minus;
    return {
      date: shortDate(item.date),
      fullDate: item.date,
      index: total ? Math.round(((item.scores.plus - item.scores.minus) / total) * 100) / 100 : 0,
      plus: item.scores.plus,
      zero: item.scores.zero,
      minus: item.scores.minus,
    };
  });
  const heatmapTrainings = team.scoreTrend.slice(range === "14" ? -4 : -8);
  const heatmapPlayers = team.players.filter((player) => player.history.some((item) => heatmapTrainings.some((training) => training.id === item.trainingId))).slice(0, 12);
  const alertPlayers = team.players.filter((player) =>
    player.load.status !== "ready" ||
    player.load.fatigueStreak >= 2 ||
    player.recentScores.filter((score) => score === "-").length >= 2 ||
    (player.attendanceRate != null && player.attendanceRate < 75)
  );
  const loadData = team.players
    .filter((player) => player.load.acwr != null || player.load.monotony != null)
    .sort((a, b) => (b.load.acwr || 0) - (a.load.acwr || 0))
    .slice(0, 10)
    .map((player) => ({
      name: player.name.split(" ").slice(-1)[0],
      acwr: player.load.acwr,
      monotony: player.load.monotony,
      strain: player.load.strain ? Math.round(player.load.strain / 100) / 10 : null,
    }));
  const absenceData = [
    { name: "Kontuzja", value: team.metrics.absenceReasons.injury, color: "#f97316" },
    { name: "Choroba", value: team.metrics.absenceReasons.sick, color: "#eab308" },
    { name: "Usprawiedliwiona", value: team.metrics.absenceReasons.excused, color: "#38bdf8" },
    { name: "Nieusprawiedliwiona", value: team.metrics.absenceReasons.unexcused, color: "#f43f5e" },
  ];
  const scoreDistribution = [
    { name: "Powyżej", value: team.metrics.scoreTotals.plus, color: chartColors.plus },
    { name: "Typowy", value: team.metrics.scoreTotals.zero, color: chartColors.zero },
    { name: "Poniżej", value: team.metrics.scoreTotals.minus, color: chartColors.minus },
  ];
  const maxAbsence = Math.max(...absenceData.map((item) => item.value), 0);

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip pb-16">
      <header className="print-card relative overflow-hidden rounded-2xl border-2 border-foreground bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div className="mow-stripes absolute inset-x-0 bottom-0 h-1 opacity-70" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary"><LayoutDashboard className="size-4" /><p className="text-[10px] font-black uppercase tracking-[0.2em]">Pulpit analityczny · ostatnie 30 dni</p></div>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl uppercase leading-[0.9] tracking-tight sm:text-6xl">Kontroluj rytm.<br /><span className="text-primary">Reaguj wcześniej.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Widok klubu {data.clubName}. Dane pokazują zmiany względem własnego poziomu zawodnika — nie ranking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="rounded-md border-2 border-foreground/20 bg-background px-3 py-2 text-sm font-bold outline-none">
              {data.teams.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.ageGroup}</option>)}
            </select>
            <button type="button" title="Eksportuj jedno podsumowanie na zawodnika" onClick={() => downloadCsv(team)} className="inline-flex items-center gap-2 rounded-md border-2 border-foreground bg-primary px-3 py-2 text-sm font-black text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"><ArrowDownToLine className="size-4" /> CSV zawodnicy</button>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Zawodnicy aktywni" value={data.metrics.activePlayers} icon={<Users className="size-4" />} tone="green" />
        <Kpi label="Frekwencja klubu" value={formatRate(data.metrics.attendanceRate)} icon={<CheckCircle2 className="size-4" />} tone="blue" />
        <Kpi label="Kompletność ocen" value={formatRate(data.metrics.completionRate)} icon={<Gauge className="size-4" />} tone="lime" />
        <Kpi label="Do reakcji" value={data.metrics.teamsNeedingEvaluation} detail="zespołów z niepełnymi ocenami" icon={<BellRing className="size-4" />} tone="orange" />
      </div>

      <div id="analiza" className="grid min-w-0 scroll-mt-6 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel>
          <PanelHeading eyebrow="Trend funkcjonowania" title="Krzywa dyspozycji zespołu" action={<RangeToggle value={range} onChange={setRange} />} />
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CircleHelp className="size-3" /> Indeks pokazuje relację ocen + i − w kolejnych treningach.</p>
          {trend.length === 0 ? <EmptyChart text="Brak ukończonych treningów w tym okresie." /> : (
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
                  <defs><linearGradient id="formFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <ReferenceArea y1={-0.15} y2={0.4} fill="#d6f36b" fillOpacity={0.15} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="index" name="Indeks" stroke="#0f766e" strokeWidth={3} fill="url(#formFill)" />
                  <Line type="monotone" dataKey="index" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: "#d6f36b", stroke: "#0f766e", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-[#d6f36b]" />strefa stabilna</span><span>+ = powyżej własnego poziomu</span><span>− = sygnał do obserwacji</span></div>
        </Panel>

        <Panel>
          <PanelHeading eyebrow="Skład ocen" title="Profil ostatnich ocen" />
          <div className="relative mt-3 h-56">
            {scoreDistribution.some((item) => item.value > 0) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={scoreDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4}>{scoreDistribution.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyChart text="Brak ocen" />}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-heading text-3xl">{team.metrics.completedTrainingEvaluations}</span><span className="text-[10px] uppercase text-muted-foreground">obserwacji</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">{scoreDistribution.map((item) => <div key={item.name} className="rounded-xl bg-muted/60 p-2 text-center"><div className="text-lg font-black" style={{ color: item.color }}>{item.value}</div><div className="text-[10px] text-muted-foreground">{item.name}</div></div>)}</div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel>
          <PanelHeading eyebrow="Obciążenie i ryzyko" title="ACWR · monotonia · strain" />
          <p className="mt-1 text-xs text-muted-foreground">Obciążenie sesyjne = czas treningu × RPE zawodnika. ACWR porównuje ostatnie 7 dni ze średnią z 28 dni.</p>
          {loadData.length === 0 ? <EmptyChart text="Za mało odpowiedzi RPE do obliczenia obciążenia." /> : (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis yAxisId="left" domain={[0, "dataMax + 0.3"]} tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="acwr" name="ACWR" fill="#3f6212" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="monotony" name="Monotonia" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="strain" name="Strain / 100" fill="#be123c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-lime-700" />ACWR ≤ 1,2 bezpiecznie</span><span><i className="mr-1 inline-block size-2 rounded-full bg-yellow-500" />1,2–1,5 obserwuj</span><span><i className="mr-1 inline-block size-2 rounded-full bg-rose-700" />&gt; 1,5 alert</span></div>
        </Panel>

        <Panel>
          <PanelHeading eyebrow="Plan kontra odczucie" title="Ostatnia jednostka" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile label="Plan RPE" value={team.metrics.load.plannedRpe ?? "—"} />
            <StatTile label="RPE zawodników" value={team.metrics.load.actualRpe ?? "—"} />
            <StatTile label="ACWR średni" value={team.metrics.load.averageAcwr ?? "—"} />
            <StatTile label="Monotonia śr." value={team.metrics.load.averageMonotony ?? "—"} />
          </div>
          <div className={`mt-4 rounded-xl border p-3 text-sm ${team.metrics.load.rpeDelta != null && Math.abs(team.metrics.load.rpeDelta) >= 1 ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
            <p className="font-bold">{team.metrics.load.rpeDelta == null ? "Brak porównania" : team.metrics.load.rpeDelta > 0 ? "Jednostka odczuta ciężej niż plan" : "Jednostka odczuta zgodnie z planem"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{team.metrics.load.rpeDelta == null ? "Potrzebny plan RPE i minimum jedna odpowiedź." : `Różnica względem planu: ${team.metrics.load.rpeDelta > 0 ? "+" : ""}${team.metrics.load.rpeDelta}`}</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Zawodnicy z wysokim zmęczeniem przez co najmniej dwa kolejne treningi: <strong className="text-foreground">{team.metrics.load.highFatiguePlayers}</strong></p>
        </Panel>
      </div>

      <div id="mikrocykl" className="grid min-w-0 scroll-mt-6 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel>
          <PanelHeading eyebrow="Obciążenie obserwacją" title="Heatmapa mikrocyklu" action={<span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">{heatmapTrainings.length} treningów</span>} />
          <p className="mt-1 text-xs text-muted-foreground">Szybko znajdź serie minusów, absencji i brakujących danych.</p>
          {heatmapPlayers.length === 0 ? <EmptyChart text="Brak historii ocen dla tego zespołu." /> : (
            <div className="mt-5 w-full max-w-full overflow-x-auto"><div className="min-w-[560px]">
              <div className="grid grid-cols-[minmax(130px,1fr)_repeat(8,minmax(34px,1fr))] gap-1 text-center text-[10px] text-muted-foreground"><span className="text-left">Zawodnik</span>{heatmapTrainings.map((item) => <span key={item.id}>{shortDate(item.date)}</span>)}</div>
              {heatmapPlayers.map((player) => <div key={player.id} className="mt-1 grid grid-cols-[minmax(130px,1fr)_repeat(8,minmax(34px,1fr))] gap-1"><Link href={`/koordynator/zawodnik/${player.id}`} className="truncate py-2 text-xs font-bold underline decoration-primary underline-offset-2">{player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}{player.name}</Link>{heatmapTrainings.map((training) => { const item = player.history.find((entry) => entry.trainingId === training.id); return <span key={training.id} title={`${player.name}: ${scoreLabel(item?.score || null)}`} className={`flex aspect-square items-center justify-center rounded-md text-xs font-black ${item?.score === "+" ? "bg-emerald-500/80 text-white" : item?.score === "-" ? "bg-rose-500/80 text-white" : item?.score === "0" ? "bg-slate-400/70 text-white" : item?.present === false ? "bg-amber-400/50 text-amber-950" : "bg-muted"}`}>{item?.score || (item?.present === false ? "·" : "—")}</span>; })}</div>)}
              <div className="mt-4 flex gap-3 text-[10px] text-muted-foreground"><span>+ powyżej</span><span>0 typowo</span><span>− poniżej</span><span>· nieobecny</span></div>
            </div></div>
          )}
        </Panel>

        <Panel id="reakcja">
          <PanelHeading eyebrow="Absencje" title="Powody nieobecności" />
          <div className="mt-5 space-y-3">{absenceData.map((item) => <div key={item.name}><div className="flex justify-between text-xs"><span>{item.name}</span><strong>{item.value}</strong></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: maxAbsence ? `${(item.value / maxAbsence) * 100}%` : "0%", background: item.color }} /></div></div>)}</div>
          <div className="mt-6 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground"><strong className="text-foreground">{team.metrics.averageFatigue ?? "—"}/5</strong> średnie zmęczenie · <strong className="text-foreground">{team.metrics.averageSatisfaction ?? "—"}/5</strong> satysfakcja</div>
        </Panel>
      </div>

      <Panel>
        <PanelHeading eyebrow="Alerty i reakcja" title="Lista priorytetów" action={<Link href="#team-details" className="inline-flex items-center gap-1 text-xs font-bold text-primary">Pełny raport <ChevronRight className="size-3" /></Link>} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {team.metrics.completionRate !== 100 && <AlertCard icon={<AlertTriangle className="size-4" />} title="Uzupełnij oceny" detail={`${formatRate(team.metrics.completionRate)} kompletności w zespole`} tone="orange" />}
          {alertPlayers.slice(0, 4).map((player) => <AlertCard key={player.id} icon={<Users className="size-4" />} title={player.name} detail={player.attendanceRate != null && player.attendanceRate < 75 ? `Frekwencja ${player.attendanceRate}%` : "Powtarzające się oceny −"} tone="red" href={`/koordynator/zawodnik/${player.id}`} />)}
          {alertPlayers.length === 0 && team.metrics.completionRate === 100 && <AlertCard icon={<CheckCircle2 className="size-4" />} title="Brak pilnych alertów" detail="Zespół ma stabilny status danych." tone="green" />}
        </div>
      </Panel>

      <section id="team-details" className="scroll-mt-6 rounded-2xl border-2 border-foreground/15 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Operacje</p>
            <h2 className="mt-1 font-heading text-2xl uppercase">Zespoły i realizacja pracy</h2>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Filter className="size-3" /> {data.teams.length} zespołów w klubie</span>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
          {data.teams.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedTeamId(item.id);
                window.setTimeout(() => document.getElementById("selected-team")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
              }}
              className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary ${item.id === team.id ? "border-primary/50 bg-primary/5" : "border-foreground/10"}`}
            >
              <div className="flex items-center justify-between">
                <div><h3 className="font-heading text-xl uppercase">{item.name}</h3><p className="text-xs text-muted-foreground">{item.ageGroup} · {item.playersCount} zawodników</p></div>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <span><strong className="block text-base">{formatRate(item.metrics.completionRate)}</strong> oceny</span>
                <span><strong className="block text-base">{formatRate(item.metrics.attendanceRate)}</strong> frekw.</span>
                <span><strong className="block text-base">{item.metrics.completedTrainings}</strong> treningów</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="selected-team" className="scroll-mt-6 rounded-2xl border-2 border-foreground/15 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Szczegóły zespołu</p>
            <h2 className="mt-1 font-heading text-2xl uppercase">{team.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{team.ageGroup} · zawodnicy, treningi i pełna historia</p>
          </div>
          <span className="rounded-md border-2 border-foreground/15 bg-muted px-3 py-1 font-mono text-xs font-bold">{team.playersCount} zawodników</span>
        </div>
        <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0">
            <h3 className="font-heading text-lg uppercase">Zawodnicy</h3>
            {team.players.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Brak aktywnych zawodników.</p> : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {team.players.map((player) => (
                  <Link key={player.id} href={`/koordynator/zawodnik/${player.id}`} className="min-w-0 rounded-xl border-2 border-foreground/10 p-3 transition hover:border-primary hover:bg-muted/50">
                    <p className="truncate text-sm font-bold">{player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}{player.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Frekwencja {formatRate(player.attendanceRate)} · ACWR {player.load.acwr ?? "—"}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-primary">Otwórz historię zawodnika →</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-lg uppercase">Treningi w okresie</h3>
            {team.trainings.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Brak zarejestrowanych treningów.</p> : (
              <div className="mt-3 max-w-full overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead><tr className="border-b-2 border-foreground/15 text-[10px] uppercase text-muted-foreground"><th className="py-2 pr-3">Data / temat</th><th className="py-2 pr-3">Trener</th><th className="py-2 pr-3">Oceny</th><th className="py-2">Frekwencja</th></tr></thead>
                  <tbody>{team.trainings.map((training) => <tr key={training.id} className="border-b border-foreground/10"><td className="py-3 pr-3"><Link href={`/koordynator/trening/${training.id}`} className="font-semibold underline decoration-primary underline-offset-2">{shortDate(training.date)}</Link><span className="block text-xs text-muted-foreground">{training.topic || "Bez tematu"}</span></td><td className="py-3 pr-3">{training.coachName}</td><td className="py-3 pr-3">{training.evaluatedCount}/{training.expectedCount} ({formatRate(training.completionRate)})</td><td className="py-3">{formatRate(training.attendanceRate)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, detail, icon, tone }: { label: string; value: string | number; detail?: string; icon: React.ReactNode; tone: string }) {
  const toneStyles = {
    green: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-sky-500/10 text-sky-600",
    lime: "bg-lime-500/10 text-lime-700",
    orange: "bg-orange-500/10 text-orange-600",
  }[tone] || "bg-primary/10 text-primary";
  return <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm"><div className={`mb-4 flex size-8 items-center justify-center rounded-lg ${toneStyles}`}>{icon}</div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-heading text-3xl">{value}</p>{detail && <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>}</div>;
}

function RangeToggle({ value, onChange }: { value: "30" | "14"; onChange: (value: "30" | "14") => void }) {
  return <div className="flex rounded-lg bg-muted p-1 text-[10px] font-bold"><button type="button" onClick={() => onChange("30")} className={`rounded-md px-2 py-1 ${value === "30" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>30 DNI</button><button type="button" onClick={() => onChange("14")} className={`rounded-md px-2 py-1 ${value === "14" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>14 DNI</button></div>;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-foreground/10 bg-muted/50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-heading text-2xl">{value}</p></div>;
}

function AlertCard({ icon, title, detail, tone, href }: { icon: React.ReactNode; title: string; detail: string; tone: "orange" | "red" | "green"; href?: string }) {
  const content = <div className={`flex gap-3 rounded-xl border p-3 ${tone === "green" ? "border-emerald-500/20 bg-emerald-500/5" : tone === "orange" ? "border-amber-500/20 bg-amber-500/5" : "border-rose-500/20 bg-rose-500/5"}`}><div className={tone === "green" ? "text-emerald-600" : tone === "orange" ? "text-amber-600" : "text-rose-600"}>{icon}</div><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></div>;
  return href ? <Link href={href} className="transition hover:-translate-y-0.5">{content}</Link> : content;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-foreground/10 bg-card px-3 py-2 text-xs shadow-lg"><p className="font-bold">{label}</p><p className="mt-1 text-muted-foreground">Indeks: <strong className="text-foreground">{payload[0].value}</strong></p></div>;
}

