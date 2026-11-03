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
}: PageProps<'/koordynator/zawodnik/[playerId]'>) {
  await connection()
  const { playerId } = await params
  const result = await getCoordinatorPlayerAction(playerId)

  if (!result.success) {
    return (
      <section role="alert" className="rounded-2xl border-2 border-red-300 bg-card p-6">
        <p>{result.error}</p>
        <Link href="/koordynator" className="mt-3 inline-block underline">Wróć do dashboardu</Link>
      </section>
    )
  }

  const attendanceCount = result.history.filter((item) => item.isPresent).length
  const attendanceRate = result.history.length
    ? Math.round((attendanceCount / result.history.length) * 100)
    : null

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

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Zarejestrowane treningi" value={result.history.length} />
        <Metric label="Obecności" value={`${attendanceCount}/${result.history.length}`} />
        <Metric label="Frekwencja" value={attendanceRate == null ? 'Brak danych' : `${attendanceRate}%`} />
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
