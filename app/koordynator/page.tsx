import Link from 'next/link'
import { connection } from 'next/server'
import { getCoordinatorDashboardAction } from '@/app/actions/teams'
import { CoordinatorAnalytics } from '@/components/coordinator/coordinator-analytics'
import { CoordinatorTeamForm } from './team-form'

export const instant = false

export const metadata = {
  title: 'Panel koordynatora | FORMA',
}

export default async function CoordinatorPage() {
  await connection()
  const result = await getCoordinatorDashboardAction()

  if (!result.success) {
    return (
      <section className="rounded-2xl border-2 border-red-300 bg-card p-6" role="alert">
        <h1 className="font-heading text-2xl uppercase">Nie można otworzyć panelu koordynatora</h1>
        <p className="mt-2 text-red-700">{result.error}</p>
        <Link className="mt-4 inline-block underline" href="/login">Przejdź do logowania</Link>
      </section>
    )
  }

  const canManageTeams = result.role === 'club_admin' || result.role === 'master_admin'

  return (
    <div id="analiza" className="scroll-mt-6 space-y-5">
      {canManageTeams && (
        <div className="flex justify-end">
          <CoordinatorTeamForm />
        </div>
      )}
      <CoordinatorAnalytics data={result} />
    </div>
  )
}
