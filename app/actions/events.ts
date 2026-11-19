'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

const EVENT_TYPES = ['grill', 'trip', 'friendly', 'tournament', 'other'] as const
type EventType = (typeof EVENT_TYPES)[number]

type EventPayload = {
  title: string
  eventType: EventType
  eventDate: string
  startTime: string
  endTime: string
  location: string
  teamId: string
  opponentName: string
  description: string
}

async function getEventActor() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false as const, error: 'Zaloguj się, aby zarządzać wydarzeniami.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('club_id, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { success: false as const, error: profileError.message }
  }

  if (
    !profile ||
    profile.is_active === false ||
    !profile.club_id ||
    !['coordinator', 'club_admin', 'master_admin'].includes(profile.role)
  ) {
    return { success: false as const, error: 'Brak uprawnień do zarządzania wydarzeniami.' }
  }

  let assignedTeamIds: string[] = []
  if (profile.role === 'coordinator') {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('team_coaches')
      .select('team_id')
      .eq('club_id', profile.club_id)
      .eq('coach_id', user.id)
      .is('revoked_at', null)

    if (assignmentsError) {
      return { success: false as const, error: assignmentsError.message }
    }

    assignedTeamIds = (assignments || []).map((assignment) => assignment.team_id)
  }

  return {
    success: true as const,
    supabase,
    user,
    clubId: profile.club_id,
    role: profile.role,
    assignedTeamIds,
  }
}

export async function getClubEventsPageDataAction() {
  try {
    const actor = await getEventActor()
    if (!actor.success) return actor

    const [teamsResult, eventsResult] = await Promise.all([
      actor.supabase
        .from('teams')
        .select('id, name, age_group')
        .eq('club_id', actor.clubId)
        .eq('is_active', true)
        .order('name')
        .limit(500),
      actor.supabase
        .from('club_events')
        .select('id, team_id, title, event_type, event_date, start_time, end_time, location, opponent_name, description, status')
        .eq('club_id', actor.clubId)
        .order('event_date', { ascending: true })
        .limit(500),
    ])

    if (teamsResult.error) throw teamsResult.error
    if (eventsResult.error) throw eventsResult.error

    const visibleTeams = actor.role === 'coordinator'
      ? (teamsResult.data || []).filter((team) => actor.assignedTeamIds.includes(team.id))
      : teamsResult.data || []
    const teamNames = new Map((teamsResult.data || []).map((team) => [team.id, `${team.name}${team.age_group ? ` · ${team.age_group}` : ''}`]))
    const visibleTeamIds = new Set(visibleTeams.map((team) => team.id))
    const events = (eventsResult.data || [])
      .filter((event) =>
        actor.role !== 'coordinator' ||
        event.team_id === null ||
        visibleTeamIds.has(event.team_id)
      )
      .map((event) => ({
        ...event,
        teamName: event.team_id ? teamNames.get(event.team_id) || 'Zespół' : 'Cały klub',
      }))

    return { success: true as const, teams: visibleTeams, events }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się pobrać wydarzeń.',
    }
  }
}

export async function createClubEventAction(payload: EventPayload) {
  try {
    if (!payload || typeof payload !== 'object') {
      return { success: false as const, error: 'Nieprawidłowe dane wydarzenia.' }
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    const location = typeof payload.location === 'string' ? payload.location.trim() : ''
    const description = typeof payload.description === 'string' ? payload.description.trim() : ''
    const opponentName = typeof payload.opponentName === 'string' ? payload.opponentName.trim() : ''
    const eventDate = typeof payload.eventDate === 'string' ? payload.eventDate : ''
    const startTime = typeof payload.startTime === 'string' ? payload.startTime : ''
    const endTime = typeof payload.endTime === 'string' ? payload.endTime : ''
    const teamId = typeof payload.teamId === 'string' ? payload.teamId : ''
    const eventType = payload.eventType

    if (!title || title.length > 120 || !location || location.length > 200) {
      return { success: false as const, error: 'Podaj nazwę (do 120 znaków) i miejsce wydarzenia (do 200 znaków).' }
    }
    if (description.length > 2000 || opponentName.length > 120) {
      return { success: false as const, error: 'Opis może mieć do 2000 znaków, a nazwa rywala do 120.' }
    }
    if (!EVENT_TYPES.includes(eventType)) {
      return { success: false as const, error: 'Wybierz prawidłowy rodzaj wydarzenia.' }
    }
    const dateParts = eventDate.split('-').map(Number)
    const parsedDate = dateParts.length === 3 ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])) : null
    const isValidDate = Boolean(
      parsedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(eventDate) &&
      parsedDate.getUTCFullYear() === dateParts[0] &&
      parsedDate.getUTCMonth() === dateParts[1] - 1 &&
      parsedDate.getUTCDate() === dateParts[2]
    )
    if (!isValidDate) {
      return { success: false as const, error: 'Podaj prawidłową datę wydarzenia.' }
    }
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
    if ((startTime && !timePattern.test(startTime)) || (endTime && !timePattern.test(endTime))) {
      return { success: false as const, error: 'Podaj prawidłową godzinę.' }
    }
    if (startTime && endTime && endTime < startTime) {
      return { success: false as const, error: 'Godzina zakończenia nie może być wcześniejsza niż rozpoczęcia.' }
    }

    const actor = await getEventActor()
    if (!actor.success) return actor

    if (teamId) {
      const { data: team, error: teamError } = await actor.supabase
        .from('teams')
        .select('id')
        .eq('id', teamId)
        .eq('club_id', actor.clubId)
        .eq('is_active', true)
        .maybeSingle()

      if (teamError) throw teamError
      if (!team) return { success: false as const, error: 'Wybrany zespół nie należy do klubu lub jest nieaktywny.' }

      if (actor.role === 'coordinator' && !actor.assignedTeamIds.includes(teamId)) {
        return { success: false as const, error: 'Możesz tworzyć wydarzenia tylko dla przypisanych zespołów.' }
      }
    }

    const { error } = await actor.supabase.from('club_events').insert({
      club_id: actor.clubId,
      team_id: teamId || null,
      created_by: actor.user.id,
      title,
      event_type: eventType,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location,
      opponent_name: opponentName || null,
      description: description || null,
      status: 'planned',
    })

    if (error) throw error

    revalidatePath('/koordynator/wydarzenia')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się zapisać wydarzenia.',
    }
  }
}

export async function cancelClubEventAction(eventId: string) {
  try {
    if (!eventId || typeof eventId !== 'string') {
      return { success: false as const, error: 'Nie podano wydarzenia do anulowania.' }
    }

    const actor = await getEventActor()
    if (!actor.success) return actor

    const { data: event, error: eventError } = await actor.supabase
      .from('club_events')
      .select('id, team_id')
      .eq('id', eventId)
      .eq('club_id', actor.clubId)
      .maybeSingle()

    if (eventError) throw eventError
    if (!event) return { success: false as const, error: 'Nie znaleziono wydarzenia.' }
    if (actor.role === 'coordinator' && event.team_id && !actor.assignedTeamIds.includes(event.team_id)) {
      return { success: false as const, error: 'Brak uprawnień do anulowania wydarzenia poza Twoim zakresem.' }
    }

    const { error } = await actor.supabase
      .from('club_events')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('club_id', actor.clubId)

    if (error) throw error

    revalidatePath('/koordynator/wydarzenia')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się anulować wydarzenia.',
    }
  }
}
