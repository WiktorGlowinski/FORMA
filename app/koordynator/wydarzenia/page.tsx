import Link from 'next/link'
import { connection } from 'next/server'
import { CalendarDays } from 'lucide-react'
import { getClubEventsPageDataAction } from '@/app/actions/events'
import { EventsManager } from './events-manager'

export const instant = false

export const metadata = {
  title: 'Wydarzenia klubu | FORMA',
}

export default async function CoordinatorEventsPage() {
  await connection()
  const result = await getClubEventsPageDataAction()

  if (!result.success) {
    return (
      <section role="alert" className="rounded-2xl border-2 border-red-300 bg-card p-6">
        <h1 className="font-heading text-2xl uppercase">Nie można pobrać wydarzeń</h1>
        <p className="mt-2 text-sm text-red-700">{result.error}</p>
        <Link className="mt-4 inline-block underline" href="/koordynator">Wróć do panelu koordynatora</Link>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <Link href="/koordynator" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        <CalendarDays className="size-4" /> Panel koordynatora
      </Link>
      <EventsManager initialEvents={result.events} teams={result.teams} />
    </div>
  )
}
