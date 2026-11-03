import Link from 'next/link'
import { connection } from 'next/server'
import { getCoordinatorTrainingAction } from '@/app/actions/teams'

export const instant = false

export const metadata = {
  title: 'Szczegóły treningu | FORMA',
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

export default async function CoordinatorTrainingPage({
  params,
}: PageProps<'/koordynator/trening/[trainingId]'>) {
  await connection()
  const { trainingId } = await params
  const result = await getCoordinatorTrainingAction(trainingId)

  if (!result.success) {
    return (
      <section role="alert" className="rounded-2xl border-2 border-red-300 bg-card p-6">
        <p>{result.error}</p>
        <Link href="/koordynator" className="mt-3 inline-block underline">Wróć do dashboardu</Link>
      </section>
    )
  }

  const evaluated = result.evaluations.filter((item) => item.isEvaluated).length
  const present = result.evaluations.filter((item) => item.isPresent).length

  return (
    <div className="space-y-6">
      <Link href="/koordynator" className="text-sm font-semibold underline underline-offset-4">← Wróć do dashboardu</Link>
      <header className="border-b-2 border-foreground/15 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Szczegóły treningu</p>
        <h1 className="mt-1 font-heading text-4xl uppercase">{result.training.teamName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(result.training.date)} · {result.training.topic || 'Bez tematu'} · trener: {result.training.coachName}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Status" value={result.training.status} />
        <Metric label="Ocenieni" value={`${evaluated}/${result.evaluations.length}`} />
        <Metric label="Obecni" value={present} />
        <Metric label="Brak oceny" value={result.evaluations.length - evaluated} />
      </section>

      <section className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
        <h2 className="font-heading text-2xl uppercase">Ocena każdego zawodnika</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Widok jest tylko do odczytu. Koordynator monitoruje proces, a korekty wykonuje uprawniony trener lub administrator.
        </p>
        {result.evaluations.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Brak aktywnych zawodników w aktualnym składzie zespołu.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/15 text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Zawodnik</th>
                  <th className="py-2 pr-3">Ocena / obecność</th>
                  <th className="py-2 pr-3">Komentarz</th>
                  <th className="py-2">Ankieta</th>
                </tr>
              </thead>
              <tbody>
                {result.evaluations.map((item) => (
                  <tr key={item.playerId} className="border-b border-foreground/10 align-top">
                    <td className="py-3 pr-3">
                      <Link href={`/koordynator/zawodnik/${item.playerId}`} className="font-semibold underline decoration-primary underline-offset-2">
                        {item.jerseyNumber ? `#${item.jerseyNumber} ` : ''}{item.playerName}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      {!item.isEvaluated
                        ? 'Brak oceny'
                        : item.isPresent
                          ? `Obecny · ${item.score || 'bez oceny'}`
                          : `Nieobecny · ${absenceLabel(item.absenceReason)}`}
                      {item.evaluationId && (
                        <Link
                          href={`/koordynator/ocena/${item.evaluationId}`}
                          className="mt-1 block text-xs font-semibold underline decoration-primary underline-offset-2"
                        >
                          Szczegóły oceny
                        </Link>
                      )}
                    </td>
                    <td className="py-3 pr-3">{item.comment || '—'}</td>
                    <td className="py-3">
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
