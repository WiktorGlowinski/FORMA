import Link from 'next/link'
import { connection } from 'next/server'
import { getCoordinatorDashboardAction } from '@/app/actions/teams'
import { CoordinatorTeamForm } from './team-form'

export const instant = false

export const metadata = {
  title: 'Panel koordynatora | FORMA',
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pl-PL')
}

function formatRate(value: number | null) {
  return value == null ? 'Brak danych' : `${value}%`
}

function formatAbsenceShare(
  count: number,
  reasons: { injury: number; sick: number; excused: number; unexcused: number }
) {
  const total = reasons.injury + reasons.sick + reasons.excused + reasons.unexcused
  const share = total > 0 ? ` (${Math.round((count / total) * 100)}%)` : ''
  return `${count}${share}`
}

export default async function CoordinatorPage() {
  await connection()
  const result = await getCoordinatorDashboardAction()

  if (!result.success) {
    return (
      <section className="rounded-2xl border-2 border-red-300 bg-white p-6" role="alert">
        <h1 className="text-2xl font-bold">Nie można otworzyć panelu koordynatora</h1>
        <p className="mt-2 text-red-700">{result.error}</p>
        <Link className="mt-4 inline-block underline" href="/login">Przejdź do logowania</Link>
      </section>
    )
  }

  const canManageTeams = result.role === 'club_admin' || result.role === 'master_admin'
  const { metrics, teams } = result

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 border-b-2 border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Panel koordynatora · ostatnie 30 dni</p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">{result.clubName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Zakres: cały klub · dane od {formatDate(result.periodStart)}. Oceny `- / 0 / +` opisują zmianę względem własnego poziomu zawodnika, nie ranking.
          </p>
        </div>
        {canManageTeams && <CoordinatorTeamForm />}
      </header>

      {teams.length > 0 && (
        <nav aria-label="Przejdź do raportu zespołu" className="flex flex-wrap gap-2">
          {teams.map((team) => (
            <a
              key={team.id}
              href={`#team-${team.id}`}
              className="rounded-full border border-foreground/20 px-3 py-1.5 text-sm font-semibold underline-offset-2 hover:bg-muted hover:underline"
            >
              {team.name} <span className="text-muted-foreground">{team.ageGroup}</span>
            </a>
          ))}
        </nav>
      )}

      <section aria-label="Podsumowanie klubu" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Aktywne zespoły" value={metrics.activeTeams} />
        <MetricCard label="Aktywni zawodnicy" value={metrics.activePlayers} />
        <MetricCard label="Zrealizowane treningi" value={metrics.completedTrainings} />
        <MetricCard label="Kompletność ocen" value={formatRate(metrics.completionRate)} detail={`${metrics.teamsNeedingEvaluation} zespołów ma niepełne oceny`} />
        <MetricCard label="Frekwencja" value={formatRate(metrics.attendanceRate)} detail="Na podstawie zapisanych ocen obecności" />
        <MetricCard label="Odpowiedzi ankiet" value={metrics.completedSurveys} detail={formatRate(metrics.surveyResponseRate)} />
      </section>

      {teams.length === 0 ? (
        <section className="rounded-2xl border-2 border-foreground/15 bg-card p-8 text-center">
          <h2 className="font-heading text-2xl uppercase">Brak zespołów w klubie</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gdy administrator doda zespół i przypisze mu zawodników, pojawią się tu raporty.
          </p>
        </section>
      ) : (
        <section aria-label="Raporty zespołów" className="space-y-4">
          <div>
            <h2 className="font-heading text-3xl uppercase">Zespoły i realizacja pracy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kompletność liczona względem obecnego składu zespołu i zrealizowanych treningów w okresie.
            </p>
          </div>

          {teams.map((team) => (
            <details id={`team-${team.id}`} key={team.id} className="group scroll-mt-6 rounded-2xl border-2 border-foreground/15 bg-card">
              <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-2xl uppercase">{team.name}</h3>
                      <span className="rounded-md border border-foreground/20 bg-muted px-2 py-1 font-mono text-xs font-bold">{team.ageGroup}</span>
                      {!team.isActive && <span className="text-xs font-bold text-muted-foreground">Nieaktywny</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.playersCount} zawodników · trenerzy: {team.coaches.length > 0 ? team.coaches.join(', ') : 'brak przypisania'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                    <TeamStat label="Treningi" value={team.metrics.completedTrainings} />
                    <TeamStat label="Kompletność" value={formatRate(team.metrics.completionRate)} />
                    <TeamStat label="Frekwencja" value={formatRate(team.metrics.attendanceRate)} />
                    <TeamStat label="Ankiety" value={formatRate(team.metrics.surveyResponseRate)} />
                  </div>
                </div>
                <span className="mt-3 block text-xs font-semibold text-primary group-open:hidden">Rozwiń raport zespołu ↓</span>
                <span className="mt-3 hidden text-xs font-semibold text-primary group-open:block">Zwiń raport zespołu ↑</span>
              </summary>

              <div className="space-y-6 border-t border-foreground/10 p-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h4 className="font-bold">Oceny z ostatnich treningów</h4>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span>+ {team.metrics.scoreTotals.plus}</span>
                      <span>0 {team.metrics.scoreTotals.zero}</span>
                      <span>− {team.metrics.scoreTotals.minus}</span>
                    </div>
                    <h4 className="mt-4 font-bold">Powody nieobecności</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kontuzja {formatAbsenceShare(team.metrics.absenceReasons.injury, team.metrics.absenceReasons)} ·
                      choroba {formatAbsenceShare(team.metrics.absenceReasons.sick, team.metrics.absenceReasons)} ·
                      usprawiedliwione {formatAbsenceShare(team.metrics.absenceReasons.excused, team.metrics.absenceReasons)} ·
                      nieusprawiedliwione {formatAbsenceShare(team.metrics.absenceReasons.unexcused, team.metrics.absenceReasons)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold">Ankiety po treningu</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Wypełniono {team.metrics.surveyCompletedCount} z {team.metrics.surveyIssuedCount} wysłanych ankiet.
                      Średnie: zmęczenie {team.metrics.averageFatigue ?? '—'}/5, zadowolenie {team.metrics.averageSatisfaction ?? '—'}/5.
                    </p>
                    <h4 className="mt-4 font-bold">Sztab</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.coaches.length > 0 ? team.coaches.join(', ') : 'Nie przypisano trenerów do zespołu.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Trend ocen na zrealizowanych treningach</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ostatnie {team.scoreTrend.length} treningów; słupki pokazują udział ocen + / 0 / −. Brak słupka oznacza brak zarejestrowanych ocen.
                  </p>
                  {team.scoreTrend.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak zrealizowanych treningów w okresie.</p>
                  ) : (
                    <ol className="mt-3 space-y-3">
                      {team.scoreTrend.map((training) => {
                        const total = training.scores.plus + training.scores.zero + training.scores.minus
                        return (
                          <li key={training.id} className="grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                            <Link
                              href={`/koordynator/trening/${training.id}`}
                              className="text-sm font-semibold underline decoration-primary underline-offset-2"
                            >
                              {formatDate(training.date)}
                            </Link>
                            <ScoreTrendBar scores={training.scores} total={total} />
                            <span className="text-xs text-muted-foreground">
                              + {training.scores.plus} · 0 {training.scores.zero} · − {training.scores.minus}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground" aria-hidden="true">
                    <span><span className="text-emerald-500">■</span> +</span>
                    <span><span className="text-slate-400">■</span> 0</span>
                    <span><span className="text-rose-500">■</span> −</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Regularność ocen według trenera</h4>
                  {team.coachProcess.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak zrealizowanych treningów w okresie.</p>
                  ) : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {team.coachProcess.map((coach) => (
                        <li key={coach.name} className="rounded-lg border border-foreground/10 p-3 text-sm">
                          <span className="font-semibold">{coach.name}</span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {coach.completedTrainings} treningów · oceny {coach.evaluatedPlayers}/{coach.expectedEvaluations} · kompletność {formatRate(coach.completionRate)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="font-bold">Treningi i kompletność ocen</h4>
                  {team.trainings.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak treningów w wybranym okresie.</p>
                  ) : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-foreground/15 text-xs uppercase text-muted-foreground">
                            <th className="py-2 pr-3">Data / temat</th>
                            <th className="py-2 pr-3">Trener</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">Oceny</th>
                            <th className="py-2 pr-3">Frekwencja</th>
                            <th className="py-2">Rozkład + / 0 / −</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.trainings.map((training) => (
                            <tr key={training.id} className="border-b border-foreground/10">
                              <td className="py-3 pr-3">
                                <Link className="font-semibold underline decoration-primary underline-offset-2" href={`/koordynator/trening/${training.id}`}>
                                  {formatDate(training.date)}
                                </Link>
                                <span className="block text-xs text-muted-foreground">{training.topic || 'Bez tematu'}</span>
                              </td>
                              <td className="py-3 pr-3">{training.coachName}</td>
                              <td className="py-3 pr-3">{training.status === 'completed' ? 'Zrealizowany' : training.status}</td>
                              <td className="py-3 pr-3">{training.evaluatedCount}/{training.expectedCount} ({formatRate(training.completionRate)})</td>
                              <td className="py-3 pr-3">{formatRate(training.attendanceRate)}</td>
                              <td className="py-3">{training.scores.plus} / {training.scores.zero} / {training.scores.minus}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold">Zawodnicy i przejście do historii</h4>
                  {team.players.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak aktywnych zawodników w aktualnym składzie.</p>
                  ) : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {team.players.map((player) => (
                        <li key={player.id} className="rounded-lg border border-foreground/10 p-3 text-sm">
                          <Link className="font-semibold underline decoration-primary underline-offset-2" href={`/koordynator/zawodnik/${player.id}`}>
                            {player.jerseyNumber ? `#${player.jerseyNumber} ` : ''}{player.name}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Frekwencja: {formatRate(player.attendanceRate)} · ostatnie oceny: {player.recentScores.join(' / ') || 'brak'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-4xl">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}

function TeamStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-background/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  )
}

function ScoreTrendBar({
  scores,
  total,
}: {
  scores: { plus: number; zero: number; minus: number }
  total: number
}) {
  const percent = (count: number) => total > 0 ? `${(count / total) * 100}%` : '0%'

  return (
    <div
      role="img"
      aria-label={`Rozkład ocen: plus ${scores.plus}, zero ${scores.zero}, minus ${scores.minus}`}
      className="flex h-3 overflow-hidden rounded-full bg-muted"
    >
      {total > 0 && (
        <>
          <span className="bg-emerald-500" style={{ width: percent(scores.plus) }} />
          <span className="bg-slate-400" style={{ width: percent(scores.zero) }} />
          <span className="bg-rose-500" style={{ width: percent(scores.minus) }} />
        </>
      )}
    </div>
  )
}
