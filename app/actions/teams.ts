'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

export async function createCoordinatorTeamAction(payload: { name: string; ageGroup: string }) {
  try {
    if (
      !payload ||
      typeof payload.name !== 'string' ||
      typeof payload.ageGroup !== 'string' ||
      !payload.name.trim() ||
      !payload.ageGroup.trim()
    ) {
      return { success: false, error: 'Podaj nazwę drużyny i rocznik.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Zaloguj się, aby zapisać drużynę.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    if (
      !profile ||
      (profile.role !== 'club_admin' && profile.role !== 'master_admin') ||
      !profile.club_id
    ) {
      return { success: false, error: 'Brak uprawnień administratora klubu.' };
    }

    const { data: currentSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .eq('club_id', profile.club_id)
      .eq('is_current', true)
      .maybeSingle();

    if (seasonError) {
      return { success: false, error: seasonError.message };
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        club_id: profile.club_id,
        season_id: currentSeason?.id || null,
        name: payload.name.trim(),
        age_group: payload.ageGroup.trim(),
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/koordynator');
    return { success: true, teamId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany błąd zapisu.',
    };
  }
}

type CoordinatorTrainingSummary = {
  id: string;
  date: string;
  topic: string | null;
  status: string;
  coachName: string;
  evaluatedCount: number;
  expectedCount: number;
  completionRate: number | null;
  attendanceRate: number | null;
  scores: { plus: number; zero: number; minus: number };
};

type CoordinatorPlayerSummary = {
  id: string;
  name: string;
  jerseyNumber: number | null;
  evaluationCount: number;
  attendanceRate: number | null;
  recentScores: string[];
};

type CoachProcessSummary = {
  name: string;
  completedTrainings: number;
  evaluatedPlayers: number;
  expectedEvaluations: number;
  completionRate: number | null;
};

export async function getCoordinatorDashboardAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false as const, error: 'Zaloguj się, aby zobaczyć panel koordynatora.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { success: false as const, error: profileError.message };
    }

    const permittedRoles = ['coordinator', 'club_admin', 'master_admin'];
    if (!profile || !permittedRoles.includes(profile.role) || !profile.club_id) {
      return {
        success: false as const,
        error: 'To konto nie ma przypisanego klubu ani uprawnień do panelu koordynatora.',
      };
    }

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', profile.club_id)
      .maybeSingle();
    if (clubError) throw clubError;

    const [teamsResult, playersResult, coachesResult] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, age_group, is_active')
        .eq('club_id', profile.club_id)
        .order('name')
        .limit(2000),
      supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, current_team_id, is_active')
        .eq('club_id', profile.club_id)
        .limit(10000),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('club_id', profile.club_id)
        .eq('role', 'coach')
        .limit(2000),
    ]);

    if (teamsResult.error) throw teamsResult.error;
    if (playersResult.error) throw playersResult.error;
    if (coachesResult.error) throw coachesResult.error;

    const teams = teamsResult.data || [];
    const players = playersResult.data || [];
    const teamIds = teams.map((team) => team.id);
    const teamIdSet = new Set(teamIds);
    const activePlayers = players.filter(
      (player) => player.current_team_id && teamIdSet.has(player.current_team_id) && player.is_active !== false
    );

    const coachesById = new Map((coachesResult.data || []).map((coach) => [coach.id, coach.full_name || 'Trener']));
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [assignmentsResult, trainingsResult] = await Promise.all([
      teamIds.length > 0
        ? supabase
            .from('team_coaches')
            .select('team_id, coach_id, is_primary')
            .in('team_id', teamIds)
            .limit(5000)
        : Promise.resolve({ data: [], error: null }),
      teamIds.length > 0
        ? supabase
            .from('trainings')
            .select('id, team_id, date, topic, status, lead_coach_id')
            .in('team_id', teamIds)
            .gte('date', cutoff)
            .lte('date', today)
            .order('date', { ascending: false })
            .limit(2000)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (assignmentsResult.error) throw assignmentsResult.error;
    if (trainingsResult.error) throw trainingsResult.error;

    const trainings = trainingsResult.data || [];
    const trainingIds = trainings.map((training) => training.id);
    const [evaluationsResult, surveysResult] = await Promise.all([
      trainingIds.length > 0
        ? supabase
            .from('evaluations')
            .select('id, training_id, player_id, score, is_present, absence_reason')
            .in('training_id', trainingIds)
            .limit(10000)
        : Promise.resolve({ data: [], error: null }),
      trainingIds.length > 0
        ? supabase
            .from('post_training_surveys')
            .select('training_id, player_id, is_completed, fatigue, satisfaction')
            .in('training_id', trainingIds)
            .eq('club_id', profile.club_id)
            .limit(10000)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (evaluationsResult.error) throw evaluationsResult.error;
    if (surveysResult.error) throw surveysResult.error;

    const evaluations = evaluationsResult.data || [];
    const surveys = surveysResult.data || [];
    const rosterByTeam = new Map<string, typeof activePlayers>();
    for (const teamId of teamIds) {
      rosterByTeam.set(teamId, activePlayers.filter((player) => player.current_team_id === teamId));
    }

    const evaluationsByTraining = new Map<string, typeof evaluations>();
    for (const evaluation of evaluations) {
      const current = evaluationsByTraining.get(evaluation.training_id) || [];
      current.push(evaluation);
      evaluationsByTraining.set(evaluation.training_id, current);
    }

    const surveysByTraining = new Map<string, typeof surveys>();
    for (const survey of surveys) {
      const current = surveysByTraining.get(survey.training_id) || [];
      current.push(survey);
      surveysByTraining.set(survey.training_id, current);
    }

    const summaries = teams.map((team) => {
      const roster = rosterByTeam.get(team.id) || [];
      const rosterPlayerIds = new Set(roster.map((player) => player.id));
      const teamTrainings = trainings.filter((training) => training.team_id === team.id);
      const teamAssignments = (assignmentsResult.data || []).filter((assignment) => assignment.team_id === team.id);
      const teamSummaries: CoordinatorTrainingSummary[] = teamTrainings.map((training) => {
        const trainingEvaluations = (evaluationsByTraining.get(training.id) || [])
          .filter((evaluation) => rosterPlayerIds.has(evaluation.player_id));
        const presentCount = trainingEvaluations.filter((evaluation) => evaluation.is_present).length;
        const expectedCount = roster.length;
        const scoreCounts = {
          plus: trainingEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '+').length,
          zero: trainingEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '0').length,
          minus: trainingEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '-').length,
        };
        const coachName = training.lead_coach_id
          ? coachesById.get(training.lead_coach_id) || 'Trener'
          : 'Nieprzypisany';

        return {
          id: training.id,
          date: training.date,
          topic: training.topic,
          status: training.status || 'scheduled',
          coachName,
          evaluatedCount: trainingEvaluations.length,
          expectedCount,
          completionRate: expectedCount > 0
            ? Math.min(100, Math.round((trainingEvaluations.length / expectedCount) * 100))
            : null,
          attendanceRate: trainingEvaluations.length > 0
            ? Math.round((presentCount / trainingEvaluations.length) * 100)
            : null,
          scores: scoreCounts,
        };
      });

      const completedTrainings = teamSummaries.filter((training) => training.status === 'completed');
      const completedTrainingIds = new Set(completedTrainings.map((training) => training.id));
      const completedEvaluations = completedTrainings.flatMap((training) =>
        (evaluationsByTraining.get(training.id) || [])
          .filter((evaluation) => rosterPlayerIds.has(evaluation.player_id))
      );
      const presentEvaluations = completedEvaluations.filter((evaluation) => evaluation.is_present);
      const teamSurveys = surveys.filter((survey) => completedTrainingIds.has(survey.training_id));
      const completedSurveys = teamSurveys.filter((survey) => survey.is_completed);
      const expectedEvaluations = completedTrainings.length * roster.length;
      const completedSurveyRatings = completedSurveys.filter(
        (survey) => survey.fatigue != null || survey.satisfaction != null
      );
      const fatigueRatings = completedSurveyRatings.filter((survey) => survey.fatigue != null);
      const satisfactionRatings = completedSurveyRatings.filter((survey) => survey.satisfaction != null);
      const sum = (values: Array<number | null>) =>
        values.reduce<number>((total, value) => total + (value ?? 0), 0);
      const scoreTotals = {
        plus: completedEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '+').length,
        zero: completedEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '0').length,
        minus: completedEvaluations.filter((evaluation) => evaluation.is_present && evaluation.score === '-').length,
      };
      const absenceReasons = {
        injury: completedEvaluations.filter((evaluation) => !evaluation.is_present && evaluation.absence_reason === 'injury').length,
        sick: completedEvaluations.filter((evaluation) => !evaluation.is_present && evaluation.absence_reason === 'sick').length,
        excused: completedEvaluations.filter((evaluation) => !evaluation.is_present && evaluation.absence_reason === 'excused').length,
        unexcused: completedEvaluations.filter((evaluation) => !evaluation.is_present && evaluation.absence_reason === 'unexcused').length,
      };

      const teamPlayers: CoordinatorPlayerSummary[] = roster.map((player) => {
        const history = evaluations
          .filter((evaluation) => evaluation.player_id === player.id)
          .map((evaluation) => ({
            ...evaluation,
            date: trainings.find((training) => training.id === evaluation.training_id)?.date || '',
          }))
          .sort((a, b) => b.date.localeCompare(a.date));
        const presentHistory = history.filter((evaluation) => evaluation.is_present);

        return {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
          jerseyNumber: player.jersey_number,
          evaluationCount: history.length,
          attendanceRate: history.length > 0
            ? Math.round((presentHistory.length / history.length) * 100)
            : null,
          recentScores: presentHistory.slice(0, 3).map((evaluation) => evaluation.score || '—'),
        };
      });

      const coachNames = [...new Set(teamAssignments.map((assignment) => coachesById.get(assignment.coach_id)).filter(Boolean))];
      const coachProcess: CoachProcessSummary[] = [...new Set(
        completedTrainings.map((training) => training.coachName)
      )].map((coachName) => {
        const coachTrainings = completedTrainings.filter((training) => training.coachName === coachName);
        const evaluatedPlayers = coachTrainings.reduce((total, training) => total + training.evaluatedCount, 0);
        const expected = coachTrainings.reduce((total, training) => total + training.expectedCount, 0);
        return {
          name: coachName,
          completedTrainings: coachTrainings.length,
          evaluatedPlayers,
          expectedEvaluations: expected,
          completionRate: expected > 0 ? Math.min(100, Math.round((evaluatedPlayers / expected) * 100)) : null,
        };
      });
      const average = (values: Array<number | null>) =>
        values.length > 0 ? Math.round((sum(values) / values.length) * 10) / 10 : null;

      return {
        id: team.id,
        name: team.name,
        ageGroup: team.age_group,
        isActive: team.is_active,
        playersCount: roster.length,
        coaches: coachNames,
        coachProcess,
        trainings: teamSummaries.slice(0, 8),
        metrics: {
          completedTrainings: completedTrainings.length,
          completedTrainingEvaluations: completedEvaluations.length,
          presentEvaluationCount: presentEvaluations.length,
          expectedEvaluations,
          completionRate: expectedEvaluations > 0
            ? Math.min(100, Math.round((completedEvaluations.length / expectedEvaluations) * 100))
            : null,
          attendanceRate: completedEvaluations.length > 0
            ? Math.round((presentEvaluations.length / completedEvaluations.length) * 100)
            : null,
          surveyResponseRate: teamSurveys.length > 0
            ? Math.round((completedSurveys.length / teamSurveys.length) * 100)
            : null,
          surveyCompletedCount: completedSurveys.length,
          surveyIssuedCount: teamSurveys.length,
          averageFatigue: average(fatigueRatings.map((survey) => survey.fatigue)),
          averageSatisfaction: average(satisfactionRatings.map((survey) => survey.satisfaction)),
          scoreTotals,
          absenceReasons,
        },
        scoreTrend: completedTrainings
          .slice(0, 8)
          .reverse()
          .map((training) => ({
            id: training.id,
            date: training.date,
            topic: training.topic,
            scores: training.scores,
          })),
        players: teamPlayers,
      };
    });

    const totalExpected = summaries.reduce((total, team) => total + team.metrics.expectedEvaluations, 0);
    const totalEvaluated = summaries.reduce((total, team) => total + team.metrics.completedTrainingEvaluations, 0);
    const totalPresent = summaries.reduce((total, team) => total + team.metrics.presentEvaluationCount, 0);

    return {
      success: true as const,
      clubName: club?.name || 'Klub',
      role: profile.role,
      periodStart: cutoff,
      teams: summaries,
      metrics: {
        activeTeams: summaries.filter((team) => team.isActive).length,
        activePlayers: activePlayers.length,
        completedTrainings: summaries.reduce((total, team) => total + team.metrics.completedTrainings, 0),
        completionRate: totalExpected > 0 ? Math.min(100, Math.round((totalEvaluated / totalExpected) * 100)) : null,
        attendanceRate: totalEvaluated > 0 ? Math.round((totalPresent / totalEvaluated) * 100) : null,
        completedSurveys: summaries.reduce((total, team) => total + team.metrics.surveyCompletedCount, 0),
        surveyResponseRate: summaries.some((team) => team.metrics.surveyIssuedCount > 0)
          ? Math.round(
              summaries.reduce((total, team) => total + team.metrics.surveyCompletedCount, 0) /
              summaries.reduce((total, team) => total + team.metrics.surveyIssuedCount, 0) * 100
            )
          : null,
        teamsNeedingEvaluation: summaries.filter((team) =>
          team.metrics.expectedEvaluations > 0 && team.metrics.completionRate !== 100
        ).length,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się pobrać danych dashboardu.',
    };
  }
}

export async function getCoordinatorPlayerAction(playerId: string) {
  try {
    if (!playerId) return { success: false as const, error: 'Nie podano zawodnika.' };

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false as const, error: 'Zaloguj się, aby zobaczyć profil zawodnika.' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.club_id || !['coordinator', 'club_admin', 'master_admin'].includes(profile.role)) {
      return { success: false as const, error: 'Brak uprawnień do profilu zawodnika.' };
    }

    const [playerResult, teamsResult] = await Promise.all([
      supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, current_team_id')
        .eq('id', playerId)
        .eq('club_id', profile.club_id)
        .maybeSingle(),
      supabase
        .from('teams')
        .select('id, name, age_group')
        .eq('club_id', profile.club_id),
    ]);
    if (playerResult.error) throw playerResult.error;
    if (teamsResult.error) throw teamsResult.error;
    if (!playerResult.data) return { success: false as const, error: 'Nie znaleziono zawodnika w Twoim klubie.' };

    const { data: evaluations, error: evaluationsError } = await supabase
      .from('evaluations')
      .select('training_id, score, is_present, absence_reason, trainings!inner(id, team_id, date, topic, status)')
      .eq('player_id', playerId)
      .eq('club_id', profile.club_id)
      .limit(200);
    if (evaluationsError) throw evaluationsError;

    const evaluationRows = evaluations || [];
    const trainingIds = evaluationRows.map((evaluation) => evaluation.training_id);
    const surveysResult = trainingIds.length > 0
      ? await supabase
          .from('post_training_surveys')
          .select('training_id, is_completed, fatigue, satisfaction')
          .eq('player_id', playerId)
          .eq('club_id', profile.club_id)
          .in('training_id', trainingIds)
      : { data: [], error: null };
    if (surveysResult.error) throw surveysResult.error;

    const teamNames = new Map((teamsResult.data || []).map((team) => [team.id, `${team.name} (${team.age_group})`]));
    const surveyByTraining = new Map((surveysResult.data || []).map((survey) => [survey.training_id, survey]));
    const history = evaluationRows.map((evaluation) => {
      const training = Array.isArray(evaluation.trainings) ? evaluation.trainings[0] : evaluation.trainings;
      const survey = surveyByTraining.get(evaluation.training_id);
      return {
        trainingId: evaluation.training_id,
        date: training?.date || '',
        topic: training?.topic || null,
        teamName: training ? teamNames.get(training.team_id) || 'Drużyna' : 'Drużyna',
        status: training?.status || '',
        score: evaluation.is_present ? evaluation.score : null,
        isPresent: evaluation.is_present,
        absenceReason: evaluation.absence_reason,
        surveyCompleted: Boolean(survey?.is_completed),
        fatigue: survey?.fatigue ?? null,
        satisfaction: survey?.satisfaction ?? null,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return {
      success: true as const,
      player: {
        id: playerResult.data.id,
        name: `${playerResult.data.first_name} ${playerResult.data.last_name}`,
        jerseyNumber: playerResult.data.jersey_number,
        teamName: playerResult.data.current_team_id
          ? teamNames.get(playerResult.data.current_team_id) || 'Brak przypisanej drużyny'
          : 'Brak przypisanej drużyny',
      },
      history,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się pobrać profilu zawodnika.',
    };
  }
}

export async function getCoordinatorTrainingAction(trainingId: string) {
  try {
    if (!trainingId) return { success: false as const, error: 'Nie podano treningu.' };

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false as const, error: 'Zaloguj się, aby zobaczyć trening.' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.club_id || !['coordinator', 'club_admin', 'master_admin'].includes(profile.role)) {
      return { success: false as const, error: 'Brak uprawnień do treningu.' };
    }

    const { data: training, error: trainingError } = await supabase
      .from('trainings')
      .select('id, club_id, team_id, date, topic, status, lead_coach_id, teams(id, name, age_group)')
      .eq('id', trainingId)
      .eq('club_id', profile.club_id)
      .maybeSingle();
    if (trainingError) throw trainingError;
    if (!training) return { success: false as const, error: 'Nie znaleziono treningu w Twoim klubie.' };

    const [playersResult, evaluationsResult, surveysResult, coachResult] = await Promise.all([
      supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number')
        .eq('club_id', profile.club_id)
        .eq('current_team_id', training.team_id)
        .order('jersey_number', { ascending: true, nullsFirst: false }),
      supabase
        .from('evaluations')
        .select('id, player_id, score, is_present, absence_reason, comment, players!inner(id, first_name, last_name, jersey_number)')
        .eq('training_id', trainingId)
        .eq('club_id', profile.club_id),
      supabase
        .from('post_training_surveys')
        .select('player_id, is_completed, fatigue, satisfaction')
        .eq('training_id', trainingId)
        .eq('club_id', profile.club_id),
      training.lead_coach_id
        ? supabase.from('profiles').select('full_name').eq('id', training.lead_coach_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (playersResult.error) throw playersResult.error;
    if (evaluationsResult.error) throw evaluationsResult.error;
    if (surveysResult.error) throw surveysResult.error;
    if (coachResult.error) throw coachResult.error;

    const evaluationByPlayer = new Map((evaluationsResult.data || []).map((evaluation) => [evaluation.player_id, evaluation]));
    const surveyByPlayer = new Map((surveysResult.data || []).map((survey) => [survey.player_id, survey]));
    const team = Array.isArray(training.teams) ? training.teams[0] : training.teams;
    const playersById = new Map((playersResult.data || []).map((player) => [player.id, player]));

    for (const evaluation of evaluationsResult.data || []) {
      const evaluatedPlayer = Array.isArray(evaluation.players) ? evaluation.players[0] : evaluation.players;
      if (evaluatedPlayer) {
        playersById.set(evaluatedPlayer.id, evaluatedPlayer);
      }
    }

    return {
      success: true as const,
      training: {
        id: training.id,
        date: training.date,
        topic: training.topic,
        status: training.status,
        teamName: team?.name || 'Drużyna',
        ageGroup: team?.age_group || '',
        coachName: coachResult.data?.full_name || 'Nieprzypisany',
      },
      evaluations: [...playersById.values()].map((player) => {
        const evaluation = evaluationByPlayer.get(player.id);
        const survey = surveyByPlayer.get(player.id);
        return {
          playerId: player.id,
          evaluationId: evaluation?.id ?? null,
          playerName: `${player.first_name} ${player.last_name}`,
          jerseyNumber: player.jersey_number,
          isEvaluated: Boolean(evaluation),
          isPresent: evaluation?.is_present ?? null,
          score: evaluation?.score ?? null,
          absenceReason: evaluation?.absence_reason ?? null,
          comment: evaluation?.comment ?? null,
          surveyCompleted: Boolean(survey?.is_completed),
          fatigue: survey?.fatigue ?? null,
          satisfaction: survey?.satisfaction ?? null,
        };
      }).sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się pobrać szczegółów treningu.',
    };
  }
}

export async function getCoordinatorEvaluationAction(evaluationId: string) {
  try {
    if (!evaluationId) return { success: false as const, error: 'Nie podano oceny.' };

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false as const, error: 'Zaloguj się, aby zobaczyć ocenę.' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.club_id || !['coordinator', 'club_admin', 'master_admin'].includes(profile.role)) {
      return { success: false as const, error: 'Brak uprawnień do oceny.' };
    }

    const { data: evaluation, error: evaluationError } = await supabase
      .from('evaluations')
      .select(`
        id,
        training_id,
        player_id,
        score,
        is_present,
        absence_reason,
        comment,
        trainings!inner(id, date, topic, status, club_id, teams(name, age_group)),
        players!inner(first_name, last_name, jersey_number)
      `)
      .eq('id', evaluationId)
      .eq('club_id', profile.club_id)
      .eq('trainings.club_id', profile.club_id)
      .maybeSingle();
    if (evaluationError) throw evaluationError;
    if (!evaluation) return { success: false as const, error: 'Nie znaleziono oceny w Twoim klubie.' };

    const training = Array.isArray(evaluation.trainings) ? evaluation.trainings[0] : evaluation.trainings;
    const team = Array.isArray(training?.teams) ? training.teams[0] : training?.teams;
    const player = Array.isArray(evaluation.players) ? evaluation.players[0] : evaluation.players;
    if (!training || !player) {
      return { success: false as const, error: 'Brakuje powiązanego treningu lub zawodnika dla tej oceny.' };
    }

    return {
      success: true as const,
      evaluation: {
        id: evaluation.id,
        trainingId: evaluation.training_id,
        playerId: evaluation.player_id,
        playerName: `${player.first_name} ${player.last_name}`,
        jerseyNumber: player.jersey_number,
        date: training.date,
        topic: training.topic,
        trainingStatus: training.status,
        teamName: team?.name || 'Drużyna',
        ageGroup: team?.age_group || '',
        isPresent: evaluation.is_present,
        score: evaluation.score,
        absenceReason: evaluation.absence_reason,
        comment: evaluation.comment,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Nie udało się pobrać oceny.',
    };
  }
}

export interface TeamItem {
  id: string;
  name: string;
  ageCategory?: string;
  playersCount?: number;
}

export async function getClubTeams(clubId: string): Promise<{
  success: boolean;
  teams: TeamItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        age_category,
        players (count)
      `)
      .eq('club_id', clubId)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message, teams: [] };
    }

    const teams = (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      ageCategory: t.age_category,
      playersCount: t.players?.[0]?.count || 0,
    }));

    return { success: true, teams };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany błąd pobierania drużyn.',
      teams: [],
    };
  }
}