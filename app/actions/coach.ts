'use server';

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import type { Mark } from '@/components/coach/data';

export interface DbTrainingCard {
  id: string;
  teamId: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  topic?: string;
  mainGoal?: string;
  trainingType?: string;
  organizationalNote?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  totalPlayers: number;
  evaluatedCount: number;
}

/**
 * 1. Pobiera listę jednostek wraz ze wszystkimi szczegółami metodycznymi
 */
export async function getCoachTrainingsAction(): Promise<{
  success: boolean;
  trainings: DbTrainingCard[];
  teams: { id: string; name: string }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Brak aktywnej sesji.', trainings: [], teams: [] };
    }

    const { data: coachTeams, error: ctErr } = await supabaseAdmin
      .from('team_coaches')
      .select('team_id, teams ( id, name )')
      .eq('coach_id', user.id);

    if (ctErr) throw ctErr;

    const teams = (coachTeams || []).map((ct: any) => ({
      id: ct.team_id,
      name: ct.teams?.name || 'Grupa',
    }));

    const teamIds = teams.map((t) => t.id);

    if (teamIds.length === 0) {
      return { success: true, trainings: [], teams: [] };
    }

    // Pobieramy wszystkie kolumny schematu
    const { data: trainings, error: trErr } = await supabaseAdmin
      .from('trainings')
      .select(`
        id,
        team_id,
        date,
        start_time,
        end_time,
        location,
        topic,
        main_goal,
        training_type,
        organizational_note,
        status,
        teams ( name )
      `)
      .in('team_id', teamIds)
      .order('date', { ascending: false });

    if (trErr) throw trErr;

    const trainingCards: DbTrainingCard[] = await Promise.all(
      (trainings || []).map(async (t: any) => {
        const { count: totalPlayers } = await supabaseAdmin
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('current_team_id', t.team_id)
          .eq('is_active', true);

        const { count: evaluatedCount } = await supabaseAdmin
          .from('evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('training_id', t.id);

        return {
          id: t.id,
          teamId: t.team_id,
          teamName: t.teams?.name || 'Grupa',
          date: t.date,
          startTime: t.start_time?.slice(0, 5) || '17:30',
          endTime: t.end_time?.slice(0, 5) || '18:45',
          place: t.location || 'Boisko',
          topic: t.topic || undefined,
          mainGoal: t.main_goal || undefined,
          trainingType: t.training_type || undefined,
          organizationalNote: t.organizational_note || undefined,
          status: t.status,
          totalPlayers: totalPlayers || 0,
          evaluatedCount: evaluatedCount || 0,
        };
      })
    );

    return { success: true, trainings: trainingCards, teams };
  } catch (err: any) {
    return { success: false, error: err.message, trainings: [], teams: [] };
  }
}

/**
 * 2. Tworzy nową jednostkę treningową z kompletem danych do bazy
 */
export async function createTrainingAction(formData: {
  teamId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topic?: string;
  mainGoal?: string;
  trainingType?: string;
  organizationalNote?: string;
  status: 'scheduled' | 'completed';
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Brak autoryzacji.' };

    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('club_id')
      .eq('id', formData.teamId)
      .single();

    if (!team) return { success: false, error: 'Zespół nie istnieje.' };

    const { data, error } = await supabaseAdmin
      .from('trainings')
      .insert({
        club_id: team.club_id,
        team_id: formData.teamId,
        lead_coach_id: user.id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.location || 'Boisko',
        topic: formData.topic?.trim() || null,
        main_goal: formData.mainGoal?.trim() || null,
        training_type: formData.trainingType || 'Taktyczny',
        organizational_note: formData.organizationalNote?.trim() || null,
        status: formData.status,
        evaluation_status: 'unrated',
        survey_enabled: false,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/trener');
    return { success: true, trainingId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Pobiera dane jednostki, kadrę oraz oceny
 */
export async function getTrainingEvaluationDataAction(trainingId: string) {
  try {
    if (!trainingId) {
      return { success: false, error: 'Nie przekazano identyfikatora jednostki.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Brak aktywnej sesji użytkownika.' };
    }

    const { data: training, error: trErr } = await supabaseAdmin
      .from('trainings')
      .select(`
        id,
        club_id,
        team_id,
        date,
        start_time,
        end_time,
        location,
        topic,
        main_goal,
        training_type,
        organizational_note,
        status,
        teams ( id, name )
      `)
      .eq('id', trainingId)
      .maybeSingle();

    if (trErr) return { success: false, error: `Błąd zapytania trainings: ${trErr.message}` };
    if (!training) return { success: false, error: `Nie znaleziono treningu o ID: ${trainingId}` };

    const { data: players, error: plErr } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number')
      .eq('current_team_id', training.team_id)
      .eq('is_active', true)
      .order('jersey_number', { ascending: true });

    if (plErr) return { success: false, error: `Błąd pobierania kadry: ${plErr.message}` };

    const { data: evals, error: evErr } = await supabaseAdmin
      .from('evaluations')
      .select('player_id, score, is_present, absence_reason, comment')
      .eq('training_id', trainingId);

    if (evErr) return { success: false, error: `Błąd pobierania ocen: ${evErr.message}` };

    const initialMarks: Record<string, Mark> = {};
    (evals || []).forEach((e: any) => {
      if (e.is_present) {
        initialMarks[e.player_id] = { type: 'score', score: e.score };
      } else {
        initialMarks[e.player_id] = {
          type: 'absence',
          reason: e.absence_reason,
          injury: e.comment || undefined,
        };
      }
    });

    const squad = (players || []).map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      jerseyNumber: p.jersey_number,
      role: 'Zawodnik',
    }));

    return {
      success: true,
      training: {
        id: training.id,
        clubId: training.club_id,
        teamName: (training.teams as any)?.name || 'Grupa',
        date: training.date,
        startTime: training.start_time?.slice(0, 5) || '17:30',
        endTime: training.end_time?.slice(0, 5) || '18:45',
        place: training.location || 'Boisko',
        topic: training.topic,
        mainGoal: training.main_goal,
        trainingType: training.training_type,
        organizationalNote: training.organizational_note,
        status: training.status,
      },
      squad,
      initialMarks,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Zapis pojedynczej oceny
 */
export async function savePlayerMarkAction(
  trainingId: string,
  playerId: string,
  mark: Mark
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Brak autoryzacji.' };

    const { data: training } = await supabaseAdmin
      .from('trainings')
      .select('club_id')
      .eq('id', trainingId)
      .single();

    if (!training) return { success: false, error: 'Trening nie istnieje.' };

    const payload: any = {
      club_id: training.club_id,
      training_id: trainingId,
      player_id: playerId,
      evaluator_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (mark.type === 'score') {
      payload.is_present = true;
      payload.score = mark.score;
      payload.absence_reason = null;
      payload.comment = null;
    } else {
      payload.is_present = false;
      payload.score = null;
      payload.absence_reason = mark.reason;
      payload.comment = mark.injury || null;
    }

    const { error } = await supabaseAdmin
      .from('evaluations')
      .upsert(payload, { onConflict: 'training_id,player_id' });

    if (error) throw error;

    // Aktualizacja statusu jednostki na in_progress lub completed
    const { count: totalPlayers } = await supabaseAdmin
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('current_team_id', training.club_id) // Fallback check
      .eq('is_active', true);

    const { count: ratedCount } = await supabaseAdmin
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('training_id', trainingId);

    const isFullyRated = totalPlayers && ratedCount && ratedCount >= totalPlayers;

    await supabaseAdmin
      .from('trainings')
      .update({
        evaluation_status: isFullyRated ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', trainingId);

    revalidatePath(`/trener/${trainingId}`);
    revalidatePath('/trener');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Reset wszystkich ocen jednostki
 */
export async function resetTrainingEvaluationsAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Brak autoryzacji.' };

    const { error } = await supabaseAdmin
      .from('evaluations')
      .delete()
      .eq('training_id', trainingId);

    if (error) throw error;

    await supabaseAdmin
      .from('trainings')
      .update({
        evaluation_status: 'unrated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', trainingId);

    revalidatePath(`/trener/${trainingId}`);
    revalidatePath('/trener');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}