'use server';

import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface SurveyPublicData {
  token: string;
  trainingDate: string;
  trainingTopic: string | null;
  playerName: string;
  clubId: string;
}

export interface SubmitSurveyPayload {
  token: string;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
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
    const { data: training, error: trErr } = await supabaseAdmin
      .from('trainings')
      .select('id, date, topic, survey_enabled, club_id')
      .eq('id', trainingId)
      .single();

    if (trErr || !training) {
      return { success: false, error: 'Nie znaleziono jednostki treningowej.' };
    }

    // 1. Sprawdzenie terminu ważności ankiety dla tej jednostki
    const { data: anySurvey } = await supabaseAdmin
      .from('post_training_surveys')
      .select('expires_at')
      .eq('training_id', trainingId)
      .limit(1)
      .maybeSingle();

    if (anySurvey?.expires_at && new Date(anySurvey.expires_at) < new Date()) {
      return {
        success: false,
        isExpired: true,
        error: 'Czas na przesłanie ankiety dla tego treningu upłynął (link wygasł).',
      };
    }

    // 2. Pobieramy obecności i flagi gości z evaluations
    const { data: evals } = await supabaseAdmin
      .from('evaluations')
      .select('player_id, is_guest, is_present, club_id')
      .eq('training_id', trainingId);

    const evalMap = new Map<string, { isGuest: boolean; isPresent: boolean }>();
    const presentPlayerIds = new Set<string>();

    (evals || []).forEach((e: any) => {
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

    const existingSurveyPlayerIds = new Set((existingSurveys || []).map((s: any) => s.player_id));

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

      await supabaseAdmin
        .from('post_training_surveys')
        .upsert(newSurveyRows, { onConflict: 'training_id,player_id' });
    }

    // 5. Pobieramy aktualną listę nieukończonych ankiet dla obecnych zawodników
    const { data: freshSurveys } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        player_id,
        is_completed,
        expires_at,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq('training_id', trainingId)
      .eq('is_completed', false);

    const now = new Date();
    const activeSurveys = (freshSurveys || []).filter((s: any) => {
      // Wykluczamy ankiety wygasłe
      if (s.expires_at && new Date(s.expires_at) < now) return false;
      // Wykluczamy zawodników, którzy zostali oznaczeni jako nieobecni w evaluations
      const ev = evalMap.get(s.player_id);
      if (ev && !ev.isPresent) return false;
      return true;
    });

    const pendingPlayers = activeSurveys
      .map((s: any) => {
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Zapisuje odpowiedź z weryfikacją tożsamości (rokiem urodzenia) oraz twardym sprawdzeniem ważności
 */
export async function submitGroupSurveyResponse(payload: {
  trainingId: string;
  playerId: string;
  birthYear: number;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
}) {
  try {
    const { trainingId, playerId, birthYear, fatigue, satisfaction, feedbackNote } = payload;

    if (!birthYear || isNaN(birthYear)) {
      return { success: false, error: 'Podaj poprawny rok urodzenia (np. 2008).' };
    }

    if (fatigue < 1 || fatigue > 5 || satisfaction < 1 || satisfaction > 5) {
      return { success: false, error: 'Oceny muszą mieścić się w przedziale 1–5.' };
    }

    let { data: targetSurvey, error: survCheckErr } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, expires_at, is_completed')
      .eq('training_id', trainingId)
      .eq('player_id', playerId)
      .maybeSingle();

    // Zabezpieczenie dla gościa: jeśli rekord ankiety nie został wcześniej utworzony,
    // a zawodnik jest obecny w evaluations, tworzymy go w locie
    if (!targetSurvey) {
      const { data: evalRecord } = await supabaseAdmin
        .from('evaluations')
        .select('club_id, is_present')
        .eq('training_id', trainingId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (evalRecord && evalRecord.is_present) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data: createdSurvey } = await supabaseAdmin
          .from('post_training_surveys')
          .insert({
            club_id: evalRecord.club_id,
            training_id: trainingId,
            player_id: playerId,
            token: randomUUID(),
            recipient: 'player',
            expires_at: expiresAt.toISOString(),
            is_completed: false,
          })
          .select('id, expires_at, is_completed')
          .single();

        targetSurvey = createdSurvey;
      }
    }

    if (survCheckErr || !targetSurvey) {
      return { success: false, error: 'Nie znaleziono formularza ankiety dla tego zawodnika.' };
    }

    if (targetSurvey.is_completed) {
      return { success: false, error: 'Ta ankieta została już wcześniej wypełniona.' };
    }

    if (targetSurvey.expires_at && new Date(targetSurvey.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Czas na wypełnienie ankiety upłynął (termin ważności wygasł).',
      };
    }

    const { data: player, error: plErr } = await supabaseAdmin
      .from('players')
      .select('id, birth_year, birth_date')
      .eq('id', playerId)
      .single();

    if (plErr || !player) {
      return { success: false, error: 'Nie znaleziono wybranego zawodnika.' };
    }

    let expectedYear: number | null = null;
    if (player.birth_year) {
      expectedYear = Number(player.birth_year);
    } else if (player.birth_date) {
      const parsedDate = new Date(player.birth_date);
      if (!isNaN(parsedDate.getTime())) {
        expectedYear = parsedDate.getFullYear();
      }
    }

    if (expectedYear !== null && expectedYear !== birthYear) {
      return {
        success: false,
        error: 'Podany rok urodzenia nie zgadza się z danymi zawodnika. Sprawdź, czy na pewno wybrałeś swoje nazwisko.',
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from('post_training_surveys')
      .update({
        fatigue,
        satisfaction,
        feedback_note: feedbackNote?.trim() || null,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('training_id', trainingId)
      .eq('player_id', playerId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}