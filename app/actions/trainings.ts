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