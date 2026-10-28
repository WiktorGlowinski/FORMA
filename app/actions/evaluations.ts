'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export interface EvaluationItem {
  playerId: string;
  isPresent: boolean;
  score?: '-' | '0' | '+';
  absenceReason?: 'injury' | 'sick' | 'excused' | 'unexcused';
  comment?: string;
}

/**
 * 1. Pobiera szczegóły treningu, listę powiązanych graczy oraz zapisane dotąd oceny
 */
export async function getTrainingWithPlayers(trainingId: string) {
  try {
    if (!trainingId) {
      return { 
        success: false, 
        error: 'Nie podano identyfikatora treningu.', 
        training: null, 
        players: [], 
        existingEvaluations: [] 
      };
    }

    // Pobierz jednostkę treningową
    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('id, club_id, team_id, date, topic, status')
      .eq('id', trainingId)
      .single();

    if (trainingError || !training) {
      return { 
        success: false, 
        error: 'Nie znaleziono jednostki treningowej w bazie.', 
        training: null, 
        players: [], 
        existingEvaluations: [] 
      };
    }

    // Pobierz zawodników przypisanych do drużyny realizującej ten trening
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number')
      .eq('current_team_id', training.team_id)
      .order('jersey_number', { ascending: true, nullsFirst: false });

    if (playersError) {
      return { 
        success: false, 
        error: `Błąd pobierania składu drużyny: ${playersError.message}`, 
        training: null, 
        players: [], 
        existingEvaluations: [] 
      };
    }

    // Pobierz istniejące już wpisy ocen (zapobiega resetowaniu stanu formularza po odświeżeniu)
    const { data: existingEvals, error: evalsError } = await supabaseAdmin
      .from('evaluations')
      .select('player_id, is_present, score, absence_reason, comment')
      .eq('training_id', trainingId);

    if (evalsError) {
      return { 
        success: false, 
        error: `Błąd odczytu zapisanych ocen: ${evalsError.message}`, 
        training: null, 
        players: [], 
        existingEvaluations: [] 
      };
    }

    return {
      success: true,
      training,
      players: players || [],
      existingEvaluations: existingEvals || [],
    };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || 'Wystąpił nieoczekiwany błąd serwera.', 
      training: null, 
      players: [], 
      existingEvaluations: [] 
    };
  }
}

/**
 * 2. Zapisuje (lub aktualizuje) oceny zawodników w bazie danych.
 * 
 * Uwaga: Parametry `clubId` i `coachId` są opcjonalne. Jeśli frontend ich nie przekaże,
 * serwer automatycznie ustali właściwy `club_id` bezpośrednio z tabeli `trainings`,
 * chroniąc bazę przed zapisem pustych wartości (null).
 */
export async function submitTrainingEvaluations(
  trainingId: string,
  clubId?: string | null,
  coachId?: string | null,
  items: EvaluationItem[] = []
) {
  try {
    if (!trainingId) {
      return { success: false, error: 'Brak identyfikatora treningu.' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Brak ocen do zapisania.' };
    }

    // Zabezpieczenie: jeśli clubId nie dotarł z frontu, pobieramy go bezpośrednio z jednostki
    let targetClubId = clubId;
    if (!targetClubId) {
      const { data: trData, error: trErr } = await supabaseAdmin
        .from('trainings')
        .select('club_id')
        .eq('id', trainingId)
        .single();

      if (trErr || !trData?.club_id) {
        return { success: false, error: 'Nie udało się przypisać jednostki do właściwego klubu.' };
      }
      targetClubId = trData.club_id;
    }

    // Formatowanie payloadu z zachowaniem reguł biznesowych FORMA:
    // - Zawodnik obecny: otrzymuje notę ('-' | '0' | '+'), absence_reason zostaje wyczyszczone
    // - Zawodnik nieobecny: nota to null, zapisywany jest powód absencji ('injury' itp.)
    const payload = items.map((item) => ({
      club_id: targetClubId,
      training_id: trainingId,
      player_id: item.playerId,
      evaluator_id: coachId || null,
      is_present: item.isPresent,
      score: item.isPresent ? item.score || '0' : null,
      absence_reason: !item.isPresent ? item.absenceReason || 'excused' : null,
      comment: item.comment?.trim() || null,
    }));

    const { error } = await supabaseAdmin
      .from('evaluations')
      .upsert(payload, { onConflict: 'training_id,player_id' });

    if (error) {
      console.error('Błąd upsert evaluations w Supabase:', error);
      return { success: false, error: error.message };
    }

    // Inwalidacja pamięci podręcznej Next.js – gwarantuje, że podsumowanie (/summary)
    // oraz formularz (/evaluate) natychmiast odczytają świeże dane z bazy
    revalidatePath(`/trainings/${trainingId}/evaluate`);
    revalidatePath(`/trainings/${trainingId}/summary`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Wystąpił błąd podczas zapisu ocen.' };
  }
}