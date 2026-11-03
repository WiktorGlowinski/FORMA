'use client'

import { useState } from 'react'
import { createCoordinatorTeamAction } from '@/app/actions/teams'

export function CoordinatorTeamForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setMessage(null)

    try {
      const result = await createCoordinatorTeamAction({ name, ageGroup })
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Nie udało się utworzyć zespołu.' })
        return
      }

      setName('')
      setAgeGroup('')
      setMessage({ type: 'success', text: 'Zespół został utworzony.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Nie udało się utworzyć zespołu.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-xl border-2 border-foreground bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]"
      >
        {isOpen ? 'Zamknij formularz' : 'Dodaj zespół'}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 rounded-xl border-2 border-foreground/15 bg-card p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Nazwa zespołu
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 font-normal"
              placeholder="np. Młodzicy"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Rocznik / kategoria
            <input
              required
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value)}
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 font-normal"
              placeholder="np. U13 (Młodzik)"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-50 sm:col-span-2"
          >
            {isPending ? 'Zapisywanie…' : 'Zapisz zespół'}
          </button>
          {message && (
            <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm sm:col-span-2 ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {message.text}
            </p>
          )}
        </form>
      )}
    </div>
  )
}