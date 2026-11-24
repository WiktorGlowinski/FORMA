import Link from 'next/link'
import { connection } from 'next/server'
import { getCoordinatorPlayerAction } from '@/app/actions/teams'

export const instant = false

export const metadata = {
  title: 'Historia zawodnika | FORMA',
}

function formatDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pl-PL') : '—'
}

function absenceLabel(reason: string | null) {
  const labels: Record<string, string> = {
    injury: 'kontuzja',
    sick: 'choroba',
    excused: 'usprawiedliwiona',
    unexcused: 'nieusprawiedliwiona',
  }
  return reason ? labels[reason] || reason : 'brak powodu'
}

export default async function CoordinatorPlayerPage({
  params,
  searchParams,
}: PageProps<'/koordynator/zawodnik/[playerId]'>) {
  await connection()
  const { playerId } = await params
  const query = await searchParams
  const filters = {
    startDate: typeof query.start === 'string' ? query.start : undefined,
    endDate: typeof query.end === 'string' ? query.end : undefined,
  }
  const result = await getCoordinatorPlayerAction(playerId, filters)

  if (!result.success) {
    return (
      <section role="alert" className="rounded-2xl border-2 border-red-300 bg-card p-6">
        <p>{result.error}</p>
        <Link href="/koordynator" className="mt-3 inline-block underline">Wróć do dashboardu</Link>
      </section>
    )
  }

  const { aggregates } = result
  const absenceShare = (count: number) =>
    aggregates.absentCount > 0 ? ` (${Math.round((count / aggregates.absentCount) * 100)}%)` : ''
  const formatMetric = (value: number | null) => value == null ? 'Brak danych' : `${value}%`
  const formatAverage = (value: number | null) => value == null ? 'Brak danych' : `${value}/5`

  return (
    <div className="space-y-6">
      <Link href="/koordynator" className="text-sm font-semibold underline underline-offset-4">← Wróć do dashboardu</Link>
      <header className="border-b-2 border-foreground/15 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Profil zawodnika</p>
        <h1 className="mt-1 font-heading text-4xl uppercase">{result.player.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.player.jerseyNumber ? `Numer ${result.player.jerseyNumber} · ` : ''}{result.player.teamName}
        </p>
      </header>

      <form className="grid gap-3 rounded-2xl border-2 border-foreground/15 bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="space-y-1 text-xs font-bold uppercase text-muted-foreground">
          Okres od
          <input name="start" type="date" max="9999-12-31" defaultValue={filters.startDate || ''} className="h-10 w-full rounded-lg border border-foreground/20 bg-background px-3 text-sm text-foreground" />
        </label>
        <label className="space-y-1 text-xs font-bold uppercase text-muted-foreground">
          Okres do
          <input name="end" type="date" max="9999-12-31" defaultValue={filters.endDate || ''} className="h-10 w-full rounded-lg border border-foreground/20 bg-background px-3 text-sm text-foreground" />
        </label>
        <button type="submit" className="h-10 rounded-lg border-2 border-foreground bg-primary px-4 text-xs font-bold uppercase text-primary-foreground">
          Zastosuj
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Zarejestrowane treningi" value={aggregates.registeredTrainings} />
        <Metric label="Obecności" value={`${aggregates.presentCount}/${aggregates.registeredTrainings}`} />
        <Metric label="Nieobecności" value={aggregates.absentCount} />
        <Metric label="Frekwencja" value={formatMetric(aggregates.attendanceRate)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Oceny +" value={`${aggregates.scoreCounts.plus} · ${formatMetric(aggregates.scoreShares.plus)}`} />
        <Metric label="Oceny 0" value={`${aggregates.scoreCounts.zero} · ${formatMetric(aggregates.scoreShares.zero)}`} />
        <Metric label="Oceny -" value={`${aggregates.scoreCounts.minus} · ${formatMetric(aggregates.scoreShares.minus)}`} />
        <Metric label="Średnia zmęczenia" value={formatAverage(aggregates.fatigueAverage)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Mediana zmęczenia" value={formatAverage(aggregates.fatigueMedian)} />
        <Metric label="Średnia zadowolenia" value={formatAverage(aggregates.satisfactionAverage)} />
        <Metric label="Mediana zadowolenia" value={formatAverage(aggregates.satisfactionMedian)} />
      </section>

      <section className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
        <h2 className="font-heading text-2xl uppercase">Powody nieobecności</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kontuzja {aggregates.absenceReasons.injury}{absenceShare(aggregates.absenceReasons.injury)} ·
          choroba {aggregates.absenceReasons.sick}{absenceShare(aggregates.absenceReasons.sick)} ·
          usprawiedliwione {aggregates.absenceReasons.excused}{absenceShare(aggregates.absenceReasons.excused)} ·
          nieusprawiedliwione {aggregates.absenceReasons.unexcused}{absenceShare(aggregates.absenceReasons.unexcused)}
        </p>
      </section>

      <section className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
        <h2 className="font-heading text-2xl uppercase">Historia ocen i ankiet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Oceny odnoszą się do własnego, typowego poziomu zawodnika. Brak oceny nie jest oceną ujemną.
        </p>
        {result.history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Brak zapisanych ocen dla tego zawodnika.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/15 text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Trening</th>
                  <th className="py-2 pr-3">Zespół</th>
                  <th className="py-2 pr-3">Ocena / obecność</th>
                  <th className="py-2 pr-3">Ankieta</th>
                </tr>
              </thead>
              <tbody>
                {result.history.map((item) => (
                  <tr key={item.trainingId} className="border-b border-foreground/10 align-top">
                    <td className="py-3 pr-3">
                      <Link href={`/koordynator/trening/${item.trainingId}`} className="font-semibold underline decoration-primary underline-offset-2">
                        {formatDate(item.date)}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{item.topic || 'Bez tematu'}</span>
                    </td>
                    <td className="py-3 pr-3">{item.teamName}</td>
                    <td className="py-3 pr-3">
                      {item.isPresent ? `Obecny · ${item.score || 'bez oceny'}` : `Nieobecny · ${absenceLabel(item.absenceReason)}`}
                    </td>
                    <td className="py-3 pr-3">
                      {item.surveyCompleted
                        ? `Wypełniona · zmęczenie ${item.fatigue ?? '—'}/5 · zadowolenie ${item.satisfaction ?? '—'}/5`
                        : 'Brak wypełnionej ankiety'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl">{value}</p>
    </div>
  )
}
