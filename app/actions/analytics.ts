'use server';

import { createClient } from '@/lib/supabase-server';

export interface TeamAlert {
  playerId: string;
  playerName: string;
  jerseyNumber: number | null;
  type: 'negative_streak' | 'rpe_overload' | 'injury_risk' | 'attendance_drop';
  message: string;
  severity: 'warning' | 'danger';
  trainingDate?: string;
}

export interface PlayerTrendPoint {
  trainingId: string;
  date: string;
  topic: string | null;
  isPresent: boolean;
  score: '-' | '0' | '+' | null;
  absenceReason: string | null;
  fatigueRating: number | null;
  satisfactionRating: number | null;
}

export interface PlayerAnalyticsData {
  player: {
    id: string;
    name: string;
    jerseyNumber: number | null;
    status: string;
  };
  metrics: {
    totalTrainings: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number; // np. 85.5%
    plusCount: number;
    zeroCount: number;
    minusCount: number;
    avgFatigue: number | null;      // 1.0 - 5.0
    avgSatisfaction: number | null; // 1.0 - 5.0
  };
  trendHistory: PlayerTrendPoint[];
}

export interface TeamMicrocycleReport {
  teamId: string;
  period: {
    trainingsCount: number;
    firstTrainingDate: string | null;
    lastTrainingDate: string | null;
  };
  metrics: {
    averageAttendanceRate: number;
    totalEvaluations: number;
    scoreDistribution: {
      plusCount: number;
      zeroCount: number;
      minusCount: number;
      plusPercentage: number;
      zeroPercentage: number;
      minusPercentage: number;
    };
    absencesBreakdown: {
      injury: number;
      sick: number;
      excused: number;
      unexcused: number;
    };
  };
  activeAlertsCount: number;
}

/**
 * 1. Pobiera alerty dla sztabu szkoleniowego (Reguła 3 minusów, przeciążenia RPE, seria absencji)
 */
export async function getTeamAlerts(teamId: string): Promise<{
  success: boolean;
  alerts: TeamAlert[];
  error?: string;
}> {
  try {
    if (!teamId) {
      return { success: false, error: 'Nie podano identyfikatora drużyny.', alerts: [] };
    }

    const supabase = await createClient();

    // Pobierz ostatnie 6 treningów drużyny
    const { data: recentTrainings, error: trErr } = await supabase
      .from('trainings')
      .select('id, date')
      .eq('team_id', teamId)
      .order('date', { ascending: false })
      .limit(6);

    if (trErr || !recentTrainings || recentTrainings.length === 0) {
      return { success: true, alerts: [] };
    }

    const trainingIds = recentTrainings.map((t) => t.id);
    const latestTraining = recentTrainings[0];

    // Pobierz oceny i powiązanych zawodników
    const { data: evals, error: evErr } = await supabase
      .from('evaluations')
      .select(`
        *,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .in('training_id', trainingIds);

    if (evErr) {
      return { success: false, error: evErr.message, alerts: [] };
    }

    // Pobierz ankiety RPE z tych jednostek
    const { data: surveys } = await supabase
      .from('post_training_surveys')
      .select('training_id, player_id, fatigue_rating, satisfaction_rating')
      .in('training_id', trainingIds);

    const alerts: TeamAlert[] = [];

    // Porządkowanie ocen per zawodnik chronologicznie
    const playerMap: Record<
      string,
      {
        name: string;
        jerseyNumber: number | null;
        history: Array<{
          trainingId: string;
          date: string;
          isPresent: boolean;
          score: string | null;
          absenceReason: string | null;
        }>;
      }
    > = {};

    (evals || []).forEach((e: any) => {
      const p = Array.isArray(e.players) ? e.players[0] : e.players;
      if (!playerMap[e.player_id]) {
        playerMap[e.player_id] = {
          name: p ? `${p.first_name} ${p.last_name}` : 'Zawodnik',
          jerseyNumber: p?.jersey_number ?? null,
          history: [],
        };
      }

      const tr = recentTrainings.find((t) => t.id === e.training_id);
      const markValue = e.score ?? e.mark ?? null;

      playerMap[e.player_id].history.push({
        trainingId: e.training_id,
        date: tr?.date || '',
        isPresent: Boolean(e.is_present),
        score: markValue,
        absenceReason: e.absence_reason || null,
      });
    });

    // Analiza reguł biznesowych
    for (const [playerId, data] of Object.entries(playerMap)) {
      data.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // REGUŁA A: Trzy minusy z rzędu na obecnych treningach
      const scoredUnits = data.history.filter((h) => h.isPresent && h.score);
      const recentThreeScores = scoredUnits.slice(0, 3).map((h) => h.score);

      if (recentThreeScores.length === 3 && recentThreeScores.every((s) => s === '-')) {
        alerts.push({
          playerId,
          playerName: data.name,
          jerseyNumber: data.jerseyNumber,
          type: 'negative_streak',
          message: '3 jednostki z rzędu poniżej oczekiwań (-). Wskazana rozmowa motywacyjna.',
          severity: 'danger',
          trainingDate: scoredUnits[0]?.date,
        });
      }

      // REGUŁA B: Ryzyko przeciążenia RPE (zmęczenie >= 4 w ostatnim treningu)
      const lastSurvey = (surveys || []).find(
        (s: any) => s.training_id === latestTraining.id && s.player_id === playerId
      );

      if (lastSurvey && lastSurvey.fatigue_rating >= 4) {
        const lastEval = data.history.find((h) => h.trainingId === latestTraining.id);
        const isHighPerformance = lastEval?.score === '+';

        alerts.push({
          playerId,
          playerName: data.name,
          jerseyNumber: data.jerseyNumber,
          type: 'rpe_overload',
          message: isHighPerformance
            ? `Wysokie zmęczenie (${lastSurvey.fatigue_rating}/5) przy intensywnej ocenie (+). Ryzyko naciągnięcia mięśniowego.`
            : `Zgłoszone wysokie zmęczenie potreningowe (${lastSurvey.fatigue_rating}/5). Monitoruj obciążenia.`,
          severity: isHighPerformance ? 'danger' : 'warning',
          trainingDate: latestTraining.date,
        });
      }

      // REGUŁA C: Przewlekła kontuzja / absencje (2+ opuszczone z powodu kontuzji)
      const injuryCount = data.history.filter(
        (h) => !h.isPresent && h.absenceReason === 'injury'
      ).length;

      if (injuryCount >= 2) {
        alerts.push({
          playerId,
          playerName: data.name,
          jerseyNumber: data.jerseyNumber,
          type: 'injury_risk',
          message: `Zawodnik opuścił ${injuryCount} z ostatnich jednostek z powodu kontuzji.`,
          severity: 'warning',
        });
      }
    }

    return { success: true, alerts };
  } catch (err: any) {
    return { success: false, error: err.message, alerts: [] };
  }
}

/**
 * 2. Pobiera pełen profil analityczny konkretnego zawodnika
 */
export async function getPlayerAnalytics(playerId: string): Promise<{
  success: boolean;
  data?: PlayerAnalyticsData;
  error?: string;
}> {
  try {
    if (!playerId) {
      return { success: false, error: 'Brak identyfikatora zawodnika.' };
    }

    const supabase = await createClient();

    // 1. Pobierz dane zawodnika
    const { data: player, error: pErr } = await supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, status')
      .eq('id', playerId)
      .single();

    if (pErr || !player) {
      return { success: false, error: 'Nie znaleziono zawodnika.' };
    }

    // 2. Pobierz historię ocen wraz z treningami
    const { data: evals, error: evErr } = await supabase
      .from('evaluations')
      .select(`
        *,
        trainings!inner ( id, date, topic, status )
      `)
      .eq('player_id', playerId);

    if (evErr) {
      return { success: false, error: evErr.message };
    }

    // Bezpieczne sortowanie po dacie treningu w pamięci
    const sortedEvals = (evals || []).sort((a: any, b: any) => {
      const trA = Array.isArray(a.trainings) ? a.trainings[0] : a.trainings;
      const trB = Array.isArray(b.trainings) ? b.trainings[0] : b.trainings;
      const dateA = trA?.date ? new Date(trA.date).getTime() : 0;
      const dateB = trB?.date ? new Date(trB.date).getTime() : 0;
      return dateB - dateA;
    });

    // 3. Pobierz ankiety tego gracza
    const { data: surveys } = await supabase
      .from('post_training_surveys')
      .select('training_id, fatigue_rating, satisfaction_rating')
      .eq('player_id', playerId);

    const surveyMap = new Map<string, { fatigue: number; satisfaction: number }>();
    (surveys || []).forEach((s: any) => {
      if (s.fatigue_rating != null && s.satisfaction_rating != null) {
        surveyMap.set(s.training_id, {
          fatigue: s.fatigue_rating,
          satisfaction: s.satisfaction_rating,
        });
      }
    });

    let presentCount = 0;
    let absentCount = 0;
    let plusCount = 0;
    let zeroCount = 0;
    let minusCount = 0;
    let totalFatigue = 0;
    let totalSatisfaction = 0;
    let surveyCount = 0;

    const trendHistory: PlayerTrendPoint[] = [];

    sortedEvals.forEach((item: any) => {
      const tr = Array.isArray(item.trainings) ? item.trainings[0] : item.trainings;
      const s = surveyMap.get(item.training_id);
      const isPresent = Boolean(item.is_present);
      const markValue = item.score ?? item.mark ?? null;

      if (isPresent) {
        presentCount++;
        if (markValue === '+') plusCount++;
        if (markValue === '0') zeroCount++;
        if (markValue === '-') minusCount++;
      } else {
        absentCount++;
      }

      if (s) {
        totalFatigue += s.fatigue;
        totalSatisfaction += s.satisfaction;
        surveyCount++;
      }

      trendHistory.push({
        trainingId: tr?.id || item.training_id,
        date: tr?.date || '',
        topic: tr?.topic || null,
        isPresent,
        score: markValue,
        absenceReason: item.absence_reason || null,
        fatigueRating: s ? s.fatigue : null,
        satisfactionRating: s ? s.satisfaction : null,
      });
    });

    const totalTrainings = presentCount + absentCount;
    const attendanceRate = totalTrainings > 0 
      ? Math.round((presentCount / totalTrainings) * 1000) / 10 
      : 0;

    return {
      success: true,
      data: {
        player: {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
          jerseyNumber: player.jersey_number,
          status: player.status,
        },
        metrics: {
          totalTrainings,
          presentCount,
          absentCount,
          attendanceRate,
          plusCount,
          zeroCount,
          minusCount,
          avgFatigue: surveyCount > 0 ? Math.round((totalFatigue / surveyCount) * 10) / 10 : null,
          avgSatisfaction: surveyCount > 0 ? Math.round((totalSatisfaction / surveyCount) * 10) / 10 : null,
        },
        trendHistory,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Pobiera zagregowany raport jednostek dla danej drużyny (mikrocykl / miesiąc)
 */
export async function getTeamMicrocycleReport(
  teamId: string,
  limitTrainings: number = 8
): Promise<{
  success: boolean;
  report?: TeamMicrocycleReport;
  error?: string;
}> {
  try {
    if (!teamId) {
      return { success: false, error: 'Nie podano identyfikatora drużyny.' };
    }

    const supabase = await createClient();

    const { data: trainings, error: trErr } = await supabase
      .from('trainings')
      .select('id, date')
      .eq('team_id', teamId)
      .order('date', { ascending: false })
      .limit(limitTrainings);

    if (trErr || !trainings || trainings.length === 0) {
      return {
        success: true,
        report: {
          teamId,
          period: { trainingsCount: 0, firstTrainingDate: null, lastTrainingDate: null },
          metrics: {
            averageAttendanceRate: 0,
            totalEvaluations: 0,
            scoreDistribution: {
              plusCount: 0,
              zeroCount: 0,
              minusCount: 0,
              plusPercentage: 0,
              zeroPercentage: 0,
              minusPercentage: 0,
            },
            absencesBreakdown: { injury: 0, sick: 0, excused: 0, unexcused: 0 },
          },
          activeAlertsCount: 0,
        },
      };
    }

    const trainingIds = trainings.map((t) => t.id);

    const { data: evals, error: evErr } = await supabase
      .from('evaluations')
      .select('*')
      .in('training_id', trainingIds);

    if (evErr) return { success: false, error: evErr.message };

    let present = 0;
    let absent = 0;
    let plus = 0;
    let zero = 0;
    let minus = 0;
    const absences = { injury: 0, sick: 0, excused: 0, unexcused: 0 };

    (evals || []).forEach((e: any) => {
      const isPresent = Boolean(e.is_present);
      const markValue = e.score ?? e.mark ?? null;

      if (isPresent) {
        present++;
        if (markValue === '+') plus++;
        if (markValue === '0') zero++;
        if (markValue === '-') minus++;
      } else {
        absent++;
        if (e.absence_reason && e.absence_reason in absences) {
          absences[e.absence_reason as keyof typeof absences]++;
        }
      }
    });

    const totalEvaluations = present + absent;
    const scoredTotal = plus + zero + minus;

    const alertsResult = await getTeamAlerts(teamId);

    return {
      success: true,
      report: {
        teamId,
        period: {
          trainingsCount: trainings.length,
          firstTrainingDate: trainings[trainings.length - 1].date,
          lastTrainingDate: trainings[0].date,
        },
        metrics: {
          averageAttendanceRate: totalEvaluations > 0 ? Math.round((present / totalEvaluations) * 100) : 0,
          totalEvaluations,
          scoreDistribution: {
            plusCount: plus,
            zeroCount: zero,
            minusCount: minus,
            plusPercentage: scoredTotal > 0 ? Math.round((plus / scoredTotal) * 100) : 0,
            zeroPercentage: scoredTotal > 0 ? Math.round((zero / scoredTotal) * 100) : 0,
            minusPercentage: scoredTotal > 0 ? Math.round((minus / scoredTotal) * 100) : 0,
          },
          absencesBreakdown: absences,
        },
        activeAlertsCount: alertsResult.alerts?.length || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}