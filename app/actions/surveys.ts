'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export interface SurveyPublicData {
  token: string;
  trainingDate: string;
  trainingTopic: string | null;
  playerName: string;
  clubId: string;
}

export interface SubmitSurveyPayload {
  token: string;
  fatigueRating: number;      // skala 1-5 (BR-036)
  satisfactionRating: number; // skala 1-5 (BR-036)
  comment?: string;
}

/**
 * 1. Generuje unikalne tokeny ankiet dla wszystkich zawodników obecnych na treningu
 * Czas ważności (TTL): 24 godziny
 */
export async function generateTrainingSurveys(trainingId: string) {
  try {
    // Pobierz trening
    const { data: training, error: trError } = await supabaseAdmin
      .from('trainings')
      .select('id, club_id')
      .eq('id', trainingId)
      .single();

    if (trError || !training) {
      return { success: false, error: 'Nie znaleziono treningu' };
    }

    // Pobierz obecnych zawodników z ocen tego treningu
    const { data: evaluations, error: evError } = await supabaseAdmin
      .from('evaluations')
      .select('player_id')
      .eq('training_id', trainingId)
      .eq('is_present', true);

    if (evError || !evaluations || evaluations.length === 0) {
      return { success: false, error: 'Brak obecnych zawodników do wygenerowania ankiet' };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Przygotuj rekordy ankiet
    const surveysToInsert = evaluations.map((ev) => ({
      club_id: training.club_id,
      training_id: training.id,
      player_id: ev.player_id,
      token: randomUUID(),
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    }));

    const { data: insertedSurveys, error: insertError } = await supabaseAdmin
      .from('post_training_surveys')
      .upsert(surveysToInsert, { onConflict: 'training_id,player_id' })
      .select('token, player_id');

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      count: insertedSurveys.length, 
      surveys: insertedSurveys 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Pobiera dane ankiety na podstawie tokenu z URL (dla ekranu bez logowania)
 * Weryfikuje czy token nie wygasł i nie został już wypełniony
 */
export async function getSurveyByToken(token: string): Promise<{
  success: boolean;
  data?: SurveyPublicData;
  error?: string;
  isExpiredOrCompleted?: boolean;
}> {
  try {
    const { data: survey, error } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        token,
        status,
        expires_at,
        completed_at,
        club_id,
        players!inner ( first_name, last_name ),
        trainings!inner ( date, topic )
      `)
      .eq('token', token)
      .single();

    if (error || !survey) {
      return { success: false, error: 'Nieprawidłowy lub nieistniejący link ankiety.' };
    }

    // Weryfikacja czy ankieta została już odesłana
    if (survey.completed_at || survey.status === 'completed') {
      return { 
        success: false, 
        isExpiredOrCompleted: true, 
        error: 'Ta ankieta została już wcześniej wypełniona.' 
      };
    }

    // Weryfikacja TTL
    if (new Date(survey.expires_at) < new Date()) {
      return { 
        success: false, 
        isExpiredOrCompleted: true, 
        error: 'Link do tej ankiety wygasł (czas na wypełnienie minął).' 
      };
    }

    const player: any = survey.players;
    const training: any = survey.trainings;

    return {
      success: true,
      data: {
        token: survey.token,
        clubId: survey.club_id,
        playerName: `${player.first_name} ${player.last_name}`,
        trainingDate: training.date,
        trainingTopic: training.topic,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Zapisuje odpowiedź zawodnika / rodzica i natychmiast unieważnia token
 */
export async function submitSurveyResponse(payload: SubmitSurveyPayload) {
  try {
    const { token, fatigueRating, satisfactionRating, comment } = payload;

    // Walidacja biznesowa zakresu ocen 1-5
    if (fatigueRating < 1 || fatigueRating > 5 || satisfactionRating < 1 || satisfactionRating > 5) {
      return { success: false, error: 'Oceny muszą mieścić się w przedziale od 1 do 5.' };
    }

    // Sprawdź stan tokenu przed aktualizacją
    const { data: survey, error: checkError } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, status, expires_at, completed_at')
      .eq('token', token)
      .single();

    if (checkError || !survey) {
      return { success: false, error: 'Nieprawidłowy token.' };
    }

    if (survey.completed_at || survey.status === 'completed') {
      return { success: false, error: 'Ankieta została już wysłana.' };
    }

    if (new Date(survey.expires_at) < new Date()) {
      return { success: false, error: 'Czas na wypełnienie ankiety upłynął.' };
    }

    // Zapis odpowiedzi
    const { error: updateError } = await supabaseAdmin
      .from('post_training_surveys')
      .update({
        fatigue_rating: fatigueRating,
        satisfaction_rating: satisfactionRating,
        comment: comment?.trim() || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', survey.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}