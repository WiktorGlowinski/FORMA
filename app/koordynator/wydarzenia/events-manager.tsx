'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock3, MapPin, Users, XCircle } from 'lucide-react'
import { cancelClubEventAction, createClubEventAction } from '@/app/actions/events'

type EventType = 'grill' | 'trip' | 'friendly' | 'tournament' | 'other'

type ClubEvent = {
  id: string
  team_id: string | null
  title: string
  event_type: EventType
  event_date: string
  start_time: string | null
  end_time: string | null
  location: string
  opponent_name: string | null
  description: string | null
  status: 'planned' | 'cancelled'
  teamName: string
}

type TeamOption = {
  id: string
  name: string
  age_group: string | null
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  grill: 'Spotkanie / grill',
  trip: 'Wyjazd',
  friendly: 'Mecz lub trening z innym klubem',
  tournament: 'Turniej',
  other: 'Inne',
}

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  grill: 'bg-orange-100 text-orange-900',
  trip: 'bg-sky-100 text-sky-900',
  friendly: 'bg-emerald-100 text-emerald-900',
  tournament: 'bg-violet-100 text-violet-900',
  other: 'bg-muted text-foreground',
}

export function EventsManager({
  initialEvents,
  teams,
}: {
  initialEvents: ClubEvent[]
  teams: TeamOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'cancelled'>('upcoming')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const visibleEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (filter === 'cancelled') return initialEvents.filter((event) => event.status === 'cancelled')
    if (filter === 'upcoming') {
      return initialEvents.filter((event) => event.status === 'planned' && event.event_date >= today)
    }
    return initialEvents
  }, [filter, initialEvents])

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') || ''),
      eventType: String(formData.get('eventType') || 'other') as EventType,
      eventDate: String(formData.get('eventDate') || ''),
      startTime: String(formData.get('startTime') || ''),
      endTime: String(formData.get('endTime') || ''),
      location: String(formData.get('location') || ''),
      teamId: String(formData.get('teamId') || ''),
      opponentName: String(formData.get('opponentName') || ''),
      description: String(formData.get('description') || ''),
    }

    startTransition(async () => {
      try {
        const result = await createClubEventAction(payload)
        if (!result.success) {
          setFeedback({ type: 'error', message: result.error || 'Nie udało się dodać wydarzenia.' })
          return
        }
        setFeedback({ type: 'success', message: 'Wydarzenie zostało dodane.' })
        setIsFormOpen(false)
        router.refresh()
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Nie udało się dodać wydarzenia.',
        })
      }
    })
  }

  function handleCancel(eventId: string) {
    if (!window.confirm('Anulować to wydarzenie?')) return
    setFeedback(null)

    startTransition(async () => {
      try {
        const result = await cancelClubEventAction(eventId)
        if (!result.success) {
          setFeedback({ type: 'error', message: result.error || 'Nie udało się anulować wydarzenia.' })
          return
        }
        setFeedback({ type: 'success', message: 'Wydarzenie zostało anulowane.' })
        router.refresh()
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Nie udało się anulować wydarzenia.',
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b-2 border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Organizacja klubu</p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">Wydarzenia</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Planuj spotkania, wyjazdy, turnieje i wspólne treningi lub mecze z innymi klubami.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsFormOpen((open) => !open)
            setFeedback(null)
          }}
          className="rounded-xl border-2 border-foreground bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]"
        >
          {isFormOpen ? 'Zamknij formularz' : '＋ Dodaj wydarzenie'}
        </button>
      </header>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-3 text-sm ${feedback.type === 'error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-green-300 bg-green-50 text-green-800'}`}
        >
          {feedback.message}
        </p>
      )}

      {isFormOpen && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl border-2 border-foreground/15 bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-semibold">
            Nazwa wydarzenia
            <input name="title" required maxLength={120} className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" placeholder="np. Grill na zakończenie sezonu" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Rodzaj
            <select name="eventType" className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal">
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Zespół
            <select name="teamId" defaultValue="" className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal">
              <option value="">Cały klub</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}{team.age_group ? ` · ${team.age_group}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Data
            <input name="eventDate" type="date" required className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Godzina rozpoczęcia
            <input name="startTime" type="time" className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Godzina zakończenia
            <input name="endTime" type="time" className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
            Miejsce
            <input name="location" required maxLength={200} className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" placeholder="Adres lub nazwa obiektu" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Rywal / klub (opcjonalnie)
            <input name="opponentName" maxLength={120} className="rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" placeholder="np. UKS Przykład" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2 lg:col-span-3">
            Informacje organizacyjne
            <textarea name="description" rows={3} maxLength={2000} className="resize-y rounded-lg border border-foreground/20 bg-background px-3 py-2 font-normal" placeholder="Zbiórka, transport, co zabrać…" />
          </label>
          <button type="submit" disabled={isPending} className="rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background disabled:opacity-50 sm:col-span-2 lg:col-span-3">
            {isPending ? 'Zapisywanie…' : 'Zapisz wydarzenie'}
          </button>
        </form>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl uppercase">Plan wydarzeń</h2>
            <p className="text-sm text-muted-foreground">{visibleEvents.length} {visibleEvents.length === 1 ? 'wydarzenie' : 'wydarzeń'}</p>
          </div>
          <div aria-label="Filtruj wydarzenia" className="flex rounded-lg border border-foreground/15 p-1">
            {([
              ['upcoming', 'Nadchodzące'],
              ['all', 'Wszystkie'],
              ['cancelled', 'Anulowane'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${filter === value ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-foreground/20 bg-card p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Brak wydarzeń w tym widoku</p>
            <p className="mt-1 text-sm text-muted-foreground">Dodaj pierwsze wydarzenie, aby udostępnić plan klubowi.</p>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {visibleEvents.map((event) => (
              <li key={event.id} className={`rounded-2xl border-2 border-foreground/15 bg-card p-5 ${event.status === 'cancelled' ? 'opacity-65' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${EVENT_TYPE_COLORS[event.event_type]}`}>
                      {EVENT_TYPE_LABELS[event.event_type]}
                    </span>
                    <h3 className="font-heading text-2xl uppercase">{event.title}</h3>
                  </div>
                  {event.status === 'cancelled' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-900">
                      <XCircle className="size-3.5" /> Anulowane
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleCancel(event.id)}
                      className="text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-destructive disabled:opacity-50"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" />{formatEventDate(event.event_date)}</p>
                  <p className="flex items-center gap-2"><Clock3 className="size-4 shrink-0 text-primary" />{formatEventTime(event.start_time, event.end_time)}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-primary" />{event.location}</p>
                  <p className="flex items-center gap-2"><Users className="size-4 shrink-0 text-primary" />{event.teamName}</p>
                </div>
                {event.opponent_name && <p className="mt-3 text-sm"><span className="font-semibold">Rywal:</span> {event.opponent_name}</p>}
                {event.description && <p className="mt-3 whitespace-pre-wrap border-t border-foreground/10 pt-3 text-sm text-muted-foreground">{event.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatEventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEventTime(start: string | null, end: string | null) {
  const format = (value: string) => value.slice(0, 5)
  if (start && end) return `${format(start)}–${format(end)}`
  if (start) return `od ${format(start)}`
  return 'Godzina do ustalenia'
}
