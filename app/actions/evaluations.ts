'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface EvaluationItem {
  playerId: string;
  isPresent: boolean;
  score?: '-' | '0' | '+';
  absenceReason?: 'injury' | 'sick' | 'excused' | 'unexcused';
  comment?: string;
}

export async function getTrainingWithPlayers(trainingId: string) {
  try {
    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('id, club_id, team_id, date, topic, status')
      .eq('id', trainingId)
      .single();

    if (trainingError || !training) {
      return { success: false, error: 'Nie znaleziono treningu', training: null, players: [], existingEvaluations: [] };
    }

    // Pobierz graczy
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number')
      .eq('current_team_id', training.team_id)
      .order('jersey_number', { ascending: true, nullsFirst: false });

    if (playersError) {
      return { success: false, error: 'Błąd pobierania graczy', training: null, players: [], existingEvaluations: [] };
    }

    // Pobierz już istniejące oceny z bazy
    const { data: existingEvals } = await supabaseAdmin
      .from('evaluations')
      .select('player_id, is_present, score, absence_reason, comment')
      .eq('training_id', trainingId);

    return {
      success: true,
      training,
      players: players || [],
      existingEvaluations: existingEvals || [],
    };
  } catch (err: any) {
    return { success: false, error: err.message, training: null, players: [], existingEvaluations: [] };
  }
}

export async function submitTrainingEvaluations(
  trainingId: string,
  clubId: string,
  coachId: string | null,
  items: EvaluationItem[]
) {
  try {
    if (!items || items.length === 0) {
      return { success: false, error: 'Brak ocen do zapisania.' };
    }

    const payload = items.map((item) => ({
      club_id: clubId,
      training_id: trainingId,
      player_id: item.playerId,
      evaluator_id: coachId || null,
      is_present: item.isPresent,
      score: item.isPresent ? item.score || '0' : null,
      absence_reason: !item.isPresent ? item.absenceReason || 'excused' : null,
      comment: item.comment || null,
    }));

    const { error } = await supabaseAdmin
      .from('evaluations')
      .upsert(payload, { onConflict: 'training_id,player_id' });

    if (error) {
      console.error('Błąd upsert evaluations:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}