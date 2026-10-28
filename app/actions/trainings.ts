'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface TrainingSummaryData {
  training: {
    id: string;
    date: string;
    topic: string | null;
    status: string;
  };
  metrics: {
    totalEvaluated: number;
    presentCount: number;
    absentCount: number;
    plusCount: number;
    zeroCount: number;
    minusCount: number;
  };
  absentPlayers: Array<{
    name: string;
    reason: string | null;
  }>;
}

/**
 * Pobiera podsumowanie i statystyki ocen po zakończonym treningu
 */
export async function getTrainingSummary(trainingId: string): Promise<{
  success: boolean;
  summary?: TrainingSummaryData;
  error?: string;
}> {
  try {
    // 1. Pobierz trening
    const { data: training, error: trError } = await supabaseAdmin
      .from('trainings')
      .select('id, date, topic, status')
      .eq('id', trainingId)
      .single();

    if (trError || !training) {
      return { success: false, error: 'Nie odnaleziono jednostki treningowej.' };
    }

    // 2. Pobierz oceny wraz z danymi zawodnika
    const { data: evals, error: evError } = await supabaseAdmin
      .from('evaluations')
      .select(`
        is_present,
        score,
        absence_reason,
        players!inner ( first_name, last_name )
      `)
      .eq('training_id', trainingId);

    if (evError) {
      return { success: false, error: evError.message };
    }

    let plusCount = 0;
    let zeroCount = 0;
    let minusCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    const absentPlayers: Array<{ name: string; reason: string | null }> = [];

    (evals || []).forEach((item: any) => {
      if (item.is_present) {
        presentCount++;
        if (item.score === '+') plusCount++;
        if (item.score === '0') zeroCount++;
        if (item.score === '-') minusCount++;
      } else {
        absentCount++;
        absentPlayers.push({
          name: `${item.players.first_name} ${item.players.last_name}`,
          reason: item.absence_reason,
        });
      }
    });

    return {
      success: true,
      summary: {
        training,
        metrics: {
          totalEvaluated: (evals || []).length,
          presentCount,
          absentCount,
          plusCount,
          zeroCount,
          minusCount,
        },
        absentPlayers,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Pobiera listę jednostek danej drużyny wraz ze statusem (do listy w panelu trenera)
 */
export async function getTeamTrainings(teamId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('trainings')
      .select(`
        id,
        date,
        topic,
        status,
        evaluations (count)
      `)
      .eq('team_id', teamId)
      .order('date', { ascending: false });

    if (error) {
      return { success: false, error: error.message, trainings: [] };
    }

    const trainings = (data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      topic: t.topic,
      status: t.status,
      // jeśli w tabeli evaluations są wpisy, trening został już oceniony
      isEvaluated: (t.evaluations?.[0]?.count || 0) > 0,
      evaluatedCount: t.evaluations?.[0]?.count || 0,
    }));

    return { success: true, trainings };
  } catch (err: any) {
    return { success: false, error: err.message, trainings: [] };
  }
}

/**
 * 3. Utworzenie nowego treningu z poziomu panelu trenera
 */
export async function createTraining(payload: {
  teamId: string;
  clubId: string;
  date: string;       // YYYY-MM-DD
  topic?: string;
}) {
  try {
    if (!payload.teamId || !payload.clubId || !payload.date) {
      return { success: false, error: 'Brak wymaganych danych (drużyna, klub, data).' };
    }

    const { data, error } = await supabaseAdmin
      .from('trainings')
      .insert({
        team_id: payload.teamId,
        club_id: payload.clubId,
        date: payload.date,
        topic: payload.topic?.trim() || null,
        status: 'planned',
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, trainingId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Pobiera listę wygenerowanych linków ankiet dla danego treningu
 * Do wykorzystania na ekranie podsumowania (przycisk "Kopiuj linki na WhatsApp")
 */
export async function getTrainingSurveyLinks(trainingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        token,
        status,
        player_id,
        players!inner ( first_name, last_name, jersey_number )
      `)
      .eq('training_id', trainingId);

    if (error) {
      return { success: false, error: error.message, links: [] };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forma.app';

    const links = (data || []).map((s: any) => ({
      playerId: s.player_id,
      playerName: `${s.players.first_name} ${s.players.last_name}`,
      jerseyNumber: s.players.jersey_number,
      status: s.status,
      surveyUrl: `${baseUrl}/survey/${s.token}`,
    }));

    return { success: true, links };
  } catch (err: any) {
    return { success: false, error: err.message, links: [] };
  }
}