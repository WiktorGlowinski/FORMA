import Link from 'next/link'
import { connection } from 'next/server'
import { getCoordinatorEvaluationAction } from '@/app/actions/teams'

export const instant = false

export const metadata = {
  title: 'Szczegóły oceny | FORMA',
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

export default async function CoordinatorEvaluationPage({
  params,
}: PageProps<'/koordynator/ocena/[evaluationId]'>) {
  await connection()
  const { evaluationId } = await params
  const result = await getCoordinatorEvaluationAction(evaluationId)

  if (!result.success) {
    return (
      <section role="alert" className="rounded-2xl border-2 border-red-300 bg-card p-6">
        <p>{result.error}</p>
        <Link href="/koordynator" className="mt-3 inline-block underline">Wróć do dashboardu</Link>
      </section>
    )
  }

  const { evaluation } = result
  const status = evaluation.isPresent
    ? `Obecny · ${evaluation.score || 'bez oceny'}`
    : `Nieobecny · ${absenceLabel(evaluation.absenceReason)}`

  return (
    <div className="space-y-6">
      <Link
        href={`/koordynator/trening/${evaluation.trainingId}`}
        className="text-sm font-semibold underline underline-offset-4"
      >
        ← Wróć do treningu
      </Link>

      <header className="border-b-2 border-foreground/15 pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Pojedyncza ocena</p>
        <h1 className="mt-1 font-heading text-4xl uppercase">{evaluation.playerName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {evaluation.jerseyNumber ? `Numer ${evaluation.jerseyNumber} · ` : ''}
          {evaluation.teamName} {evaluation.ageGroup && `· ${evaluation.ageGroup}`} · {formatDate(evaluation.date)}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Obecność / ocena" value={status} />
        <Metric label="Trening" value={evaluation.topic || 'Bez tematu'} />
        <Metric label="Status treningu" value={evaluation.trainingStatus} />
      </section>

      <section className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
        <h2 className="font-heading text-2xl uppercase">Dane oceny</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wynik</dt>
            <dd className="mt-1 text-lg font-semibold">{evaluation.isPresent ? evaluation.score || 'Nie wystawiono' : 'Nie dotyczy — zawodnik nieobecny'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Powód nieobecności</dt>
            <dd className="mt-1 text-lg font-semibold">{evaluation.isPresent ? '—' : absenceLabel(evaluation.absenceReason)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Komentarz trenera</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">{evaluation.comment || 'Brak komentarza.'}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-foreground/10 pt-4 text-sm">
          <Link
            href={`/koordynator/zawodnik/${evaluation.playerId}`}
            className="font-semibold underline decoration-primary underline-offset-2"
          >
            Historia zawodnika
          </Link>
          <Link
            href={`/koordynator/trening/${evaluation.trainingId}`}
            className="font-semibold underline decoration-primary underline-offset-2"
          >
            Wszystkie oceny z treningu
          </Link>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-foreground/15 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl">{value}</p>
    </div>
  )
}
