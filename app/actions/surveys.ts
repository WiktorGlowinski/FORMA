'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getErrorMessage } from '@/lib/error-message';

export interface PublicSurveyInfo {
  trainingDate: string;
  trainingTopic: string | null;
  playerName: string;
}

export interface TrainingSurveyInfo {
  trainingId: string;
  date: string;
  topic: string | null;
  pendingPlayers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
    isGuest: boolean;
  }>;
}

interface SurveyTrainingAuthorization {
  id: string;
  club_id: string;
  team_id: string;
  lead_coach_id: string | null;
}

type SurveyPlayerJoin = {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
};

type PendingSurveyRow = {
  player_id: string;
  is_completed: boolean;
  expires_at: string | null;
  players: SurveyPlayerJoin | SurveyPlayerJoin[];
};

async function isAuthorizedSurveyCoach(userId: string, training: SurveyTrainingAuthorization) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('club_id, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.is_active === false) return false;
  if (profile.role === 'master_admin') return true;
  if (profile.club_id !== training.club_id) return false;
  if (profile.role === 'club_admin' || profile.role === 'coordinator') return true;
  if (training.lead_coach_id === userId) return true;

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from('team_coaches')
    .select('id')
    .eq('team_id', training.team_id)
    .eq('coach_id', userId)
    .is('revoked_at', null)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  return Boolean(assignment);
}

/**
 * 1. Pobiera dane treningu i listę obecnych zawodników (w tym gości),
 *    automatycznie synchronizując brakujące rekordy w post_training_surveys.
 */
export async function getTrainingSurveySession(trainingId: string): Promise<{
  success: boolean;
  data?: TrainingSurveyInfo;
  isExpired?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Brak autoryzacji.' };

    const { data: training, error: trErr } = await supabaseAdmin
      .from('trainings')
      .select('id, date, topic, survey_enabled, club_id, team_id, lead_coach_id')
      .eq('id', trainingId)
      .single();

    if (trErr || !training) {
      return { success: false, error: 'Nie znaleziono jednostki treningowej.' };
    }
    if (!(await isAuthorizedSurveyCoach(user.id, training))) {
      return { success: false, error: 'Brak uprawnień do ankiet tej jednostki.' };
    }

    // 1. Sprawdzenie terminu ważności ankiety dla tej jednostki
    const { data: anySurvey, error: anySurveyError } = await supabaseAdmin
      .from('post_training_surveys')
      .select('expires_at')
      .eq('training_id', trainingId)
      .limit(1)
      .maybeSingle();
    if (anySurveyError) throw anySurveyError;

    if (anySurvey?.expires_at && new Date(anySurvey.expires_at) < new Date()) {
      return {
        success: false,
        isExpired: true,
        error: 'Czas na przesłanie ankiety dla tego treningu upłynął (link wygasł).',
      };
    }

    // 2. Pobieramy obecności i flagi gości z evaluations
    const { data: evals, error: evalError } = await supabaseAdmin
      .from('evaluations')
      .select('player_id, is_guest, is_present, club_id')
      .eq('training_id', trainingId);
    if (evalError) throw evalError;

    const evalMap = new Map<string, { isGuest: boolean; isPresent: boolean }>();
    const presentPlayerIds = new Set<string>();

    (evals || []).forEach((e: {
      player_id: string;
      is_guest: boolean;
      is_present: boolean;
    }) => {
      evalMap.set(e.player_id, {
        isGuest: Boolean(e.is_guest),
        isPresent: Boolean(e.is_present),
      });
      if (e.is_present) {
        presentPlayerIds.add(e.player_id);
      }
    });

    // 3. Pobieramy istniejące ankiety dla tej jednostki
    const { data: existingSurveys, error: survErr } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        player_id,
        is_completed,
        expires_at,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq('training_id', trainingId);

    if (survErr) throw survErr;

    const existingSurveyPlayerIds = new Set((existingSurveys || []).map((s: { player_id: string }) => s.player_id));

    // 4. AUTO-HEALING: Jeśli gość lub zawodnik był obecny w evaluations, ale nie ma rekordu w ankietach
    const missingAttendeeIds = Array.from(presentPlayerIds).filter(
      (pid) => !existingSurveyPlayerIds.has(pid)
    );

    if (missingAttendeeIds.length > 0) {
      const defaultExpiresAt =
        anySurvey?.expires_at ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const newSurveyRows = missingAttendeeIds.map((pid) => ({
        club_id: training.club_id,
        training_id: trainingId,
        player_id: pid,
        token: randomUUID(),
        recipient: 'player',
        expires_at: defaultExpiresAt,
        is_completed: false,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('post_training_surveys')
        .upsert(newSurveyRows, { onConflict: 'training_id,player_id' });
      if (insertError) throw insertError;
    }

    // 5. Pobieramy aktualną listę nieukończonych ankiet dla obecnych zawodników
    const { data: freshSurveys, error: freshError } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        player_id,
        is_completed,
        expires_at,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq('training_id', trainingId)
      .eq('is_completed', false);
    if (freshError) throw freshError;

    const now = new Date();
    const activeSurveys = (freshSurveys || []).filter((s: PendingSurveyRow) => {
      // Wykluczamy ankiety wygasłe
      if (s.expires_at && new Date(s.expires_at) < now) return false;
      // Wykluczamy zawodników, którzy zostali oznaczeni jako nieobecni w evaluations
      const ev = evalMap.get(s.player_id);
      if (ev && !ev.isPresent) return false;
      return true;
    });

    const pendingPlayers = activeSurveys
      .map((s: PendingSurveyRow) => {
        const p = Array.isArray(s.players) ? s.players[0] : s.players;
        const isGuest = evalMap.get(p.id)?.isGuest ?? false;
        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          jerseyNumber: p.jersey_number ?? null,
          isGuest,
        };
      })
      .sort((a, b) => {
        // Najpierw sortujemy po numerze, a w razie braku po nazwisku
        if (a.jerseyNumber !== null && b.jerseyNumber !== null) {
          return a.jerseyNumber - b.jerseyNumber;
        }
        if (a.jerseyNumber !== null) return -1;
        if (b.jerseyNumber !== null) return 1;
        return a.lastName.localeCompare(b.lastName);
      });

    return {
      success: true,
      data: {
        trainingId: training.id,
        date: training.date,
        topic: training.topic,
        pendingPlayers,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Nie udało się obsłużyć ankiety.') };
  }
}

const SURVEY_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPublicSurveySession(token: string): Promise<{
  success: boolean;
  data?: PublicSurveyInfo;
  isExpired?: boolean;
  error?: string;
}> {
  try {
    if (typeof token !== 'string' || !SURVEY_TOKEN_PATTERN.test(token)) {
      return { success: false, error: 'Link do ankiety jest nieprawidłowy.' };
    }

    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, training_id, player_id, expires_at, is_completed')
      .eq('token', token)
      .maybeSingle();

    if (surveyError) throw surveyError;
    if (!survey) return { success: false, error: 'Nie znaleziono ankiety.' };
    if (survey.is_completed) return { success: false, error: 'Ta ankieta została już wypełniona.' };
    if (!survey.expires_at || new Date(survey.expires_at) <= new Date()) {
      return { success: false, isExpired: true, error: 'Ankieta wygasła.' };
    }

    const [{ data: training, error: trainingError }, { data: player, error: playerError }] =
      await Promise.all([
        supabaseAdmin
          .from('trainings')
          .select('date, topic')
          .eq('id', survey.training_id)
          .maybeSingle(),
        supabaseAdmin
          .from('players')
          .select('first_name, last_name')
          .eq('id', survey.player_id)
          .maybeSingle(),
      ]);

    if (trainingError) throw trainingError;
    if (playerError) throw playerError;
    if (!training || !player) return { success: false, error: 'Nie znaleziono danych ankiety.' };

    return {
      success: true,
      data: {
        trainingDate: training.date,
        trainingTopic: training.topic,
        playerName: `${player.first_name} ${player.last_name}`,
      },
    };
  } catch (err: unknown) {
    console.error('Failed to load public survey session:', err);
    return {
      success: false,
      error: 'Nie udało się załadować ankiety.',
    };
  }
}

export async function submitPublicSurveyResponse(payload: {
  token: string;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
}) {
  try {
    const { token, fatigue, satisfaction, feedbackNote } = payload;
    if (typeof token !== 'string' || !SURVEY_TOKEN_PATTERN.test(token)) {
      return { success: false, error: 'Link do ankiety jest nieprawidłowy.' };
    }
    if (
      !Number.isInteger(fatigue) || fatigue < 1 || fatigue > 5 ||
      !Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5
    ) {
      return { success: false, error: 'Oceny muszą mieścić się w przedziale 1–5.' };
    }
    if (feedbackNote !== undefined && (typeof feedbackNote !== 'string' || feedbackNote.length > 1000)) {
      return { success: false, error: 'Wiadomość może mieć maksymalnie 1000 znaków.' };
    }

    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, expires_at, is_completed')
      .eq('token', token)
      .maybeSingle();

    if (surveyError) throw surveyError;
    if (!survey) return { success: false, error: 'Nie znaleziono ankiety.' };
    if (survey.is_completed) return { success: false, error: 'Ta ankieta została już wypełniona.' };

    const now = new Date().toISOString();
    const { data: updatedSurvey, error: updateError } = await supabaseAdmin
      .from('post_training_surveys')
      .update({
        fatigue,
        satisfaction,
        feedback_note: feedbackNote?.trim() || null,
        is_completed: true,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', survey.id)
      .eq('token', token)
      .eq('is_completed', false)
      .gt('expires_at', now)
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedSurvey) {
      return { success: false, error: 'Ankieta wygasła lub została już wypełniona.' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to submit public survey response:', err);
    return {
      success: false,
      error: 'Nie udało się zapisać ankiety.',
    };
  }
}

export async function submitInPersonSurveyResponse(payload: {
  trainingId: string;
  playerId: string;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
}) {
  try {
    const { trainingId, playerId, fatigue, satisfaction, feedbackNote } = payload;

    if (!trainingId || !playerId) {
      return { success: false, error: 'Nieprawidłowa jednostka lub zawodnik.' };
    }
    if (
      !Number.isInteger(fatigue) || fatigue < 1 || fatigue > 5 ||
      !Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5
    ) {
      return { success: false, error: 'Oceny muszą mieścić się w przedziale 1–5.' };
    }
    if (feedbackNote !== undefined && (typeof feedbackNote !== 'string' || feedbackNote.length > 1000)) {
      return { success: false, error: 'Wiadomość może mieć maksymalnie 1000 znaków.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Brak autoryzacji.' };

    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('id, club_id, team_id, lead_coach_id')
      .eq('id', trainingId)
      .maybeSingle();

    if (trainingError || !training) {
      return { success: false, error: 'Nie znaleziono jednostki treningowej.' };
    }

    if (!(await isAuthorizedSurveyCoach(user.id, training))) {
      return { success: false, error: 'Brak uprawnień do tej jednostki.' };
    }

    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('evaluations')
      .select('is_present')
      .eq('training_id', trainingId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (attendanceError) throw attendanceError;
    if (!attendance?.is_present) {
      return { success: false, error: 'Ankietę może wypełnić tylko obecny zawodnik.' };
    }

    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, expires_at, is_completed')
      .eq('training_id', trainingId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (surveyError) throw surveyError;
    if (!survey) return { success: false, error: 'Nie znaleziono ankiety dla tego zawodnika.' };
    if (survey.is_completed) {
      return { success: false, error: 'Ta ankieta została już wypełniona.' };
    }
    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return { success: false, error: 'Czas na wypełnienie ankiety upłynął.' };
    }

    const now = new Date().toISOString();
    const { data: updatedSurvey, error: updateError } = await supabaseAdmin
      .from('post_training_surveys')
      .update({
        fatigue,
        satisfaction,
        feedback_note: feedbackNote?.trim() || null,
        is_completed: true,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', survey.id)
      .eq('is_completed', false)
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedSurvey) {
      return { success: false, error: 'Ankieta wygasła lub została już wypełniona.' };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Nie udało się zapisać ankiety na miejscu.',
    };
  }
}