"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase-server";
import type { Mark } from "@/components/coach/data";

export interface DbTrainingCard {
  id: string;
  teamId: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  status: string;
  topic?: string;
  mainGoal?: string;
  trainingType?: string;
  organizationalNote?: string;
  evaluatedCount: number;
  totalPlayers: number;
}

/**
 * 1. Pobiera listę jednostek treningowych i zespołów przypisanych do trenera (RLS)
 */
export async function getCoachTrainingsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak aktywnej sesji użytkownika.", trainings: [], teams: [] };
    }

    // Dzięki RLS otrzymujemy tylko zespoły przypisane do zalogowanego trenera
    const { data: teams, error: teamsErr } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");

    if (teamsErr) throw teamsErr;

    // Dzięki RLS pobieramy jednostki tylko dla zespołów trenera
    const { data: trainings, error: trErr } = await supabase
      .from("trainings")
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
        teams ( id, name )
      `)
      .order("date", { ascending: false });

    if (trErr) throw trErr;

    const trainingIds = (trainings || []).map((t: any) => t.id);

    // Zliczenie liczby ocen per jednostka
    let evalsByTraining: Record<string, number> = {};
    if (trainingIds.length > 0) {
      const { data: evals } = await supabase
        .from("evaluations")
        .select("training_id")
        .in("training_id", trainingIds);

      (evals || []).forEach((e: any) => {
        evalsByTraining[e.training_id] = (evalsByTraining[e.training_id] || 0) + 1;
      });
    }

    // Zliczenie liczby zawodników w kadrze poszczególnych drużyn
    const teamIds = (teams || []).map((t: any) => t.id);
    let playersCountByTeam: Record<string, number> = {};
    if (teamIds.length > 0) {
      const { data: squad } = await supabase
        .from("players")
        .select("current_team_id")
        .in("current_team_id", teamIds);

      (squad || []).forEach((p: any) => {
        if (p.current_team_id) {
          playersCountByTeam[p.current_team_id] = (playersCountByTeam[p.current_team_id] || 0) + 1;
        }
      });
    }

    const formattedTrainings: DbTrainingCard[] = (trainings || []).map((t: any) => {
      const tId = t.team_id;
      const teamObj = Array.isArray(t.teams) ? t.teams[0] : t.teams;
      return {
        id: t.id,
        teamId: tId,
        teamName: teamObj?.name || "Brak nazwy",
        date: t.date,
        startTime: t.start_time?.slice(0, 5) || "17:30",
        endTime: t.end_time?.slice(0, 5) || "18:45",
        place: t.location || "Boisko główne",
        topic: t.topic || undefined,
        mainGoal: t.main_goal || undefined,
        trainingType: t.training_type || undefined,
        organizationalNote: t.organizational_note || undefined,
        status: t.status || "planned",
        evaluatedCount: evalsByTraining[t.id] || 0,
        totalPlayers: playersCountByTeam[tId] || 0,
      };
    });

    return {
      success: true,
      trainings: formattedTrainings,
      teams: (teams || []).map((t: any) => ({ id: t.id, name: t.name })),
    };
  } catch (err: any) {
    return { success: false, error: err.message, trainings: [], teams: [] };
  }
}

/**
 * 2. Tworzy nową jednostkę treningową (RLS: status 'scheduled' lub 'completed')
 */
export async function createTrainingAction(payload: {
  teamId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topic?: string;
  mainGoal?: string;
  trainingType?: string;
  organizationalNote?: string;
  status: "completed" | "scheduled";
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak aktywnej sesji trenera." };
    }

    // Pobranie club_id drużyny
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("club_id")
      .eq("id", payload.teamId)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Nie masz uprawnień do dodawania jednostek dla tej drużyny." };
    }

    // Wstawianie rekordu ze statusem 'scheduled' / 'completed' bez wymuszania evaluation_status
    const { data, error } = await supabase
      .from("trainings")
      .insert({
        club_id: team.club_id,
        team_id: payload.teamId,
        lead_coach_id: user.id,
        date: payload.date,
        start_time: payload.startTime,
        end_time: payload.endTime,
        location: payload.location,
        topic: payload.topic || null,
        main_goal: payload.mainGoal || null,
        training_type: payload.trainingType || null,
        organizational_note: payload.organizationalNote || null,
        status: payload.status,
        survey_enabled: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/trener");
    return { success: true, trainingId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Pobiera dane jednostki, kadrę oraz dotychczas wystawione oceny
 */
export async function getTrainingEvaluationDataAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak autoryzacji." };
    }

    const { data: training, error: trErr } = await supabase
      .from("trainings")
      .select(`
        id,
        date,
        start_time,
        end_time,
        location,
        topic,
        status,
        team_id,
        teams ( id, name )
      `)
      .eq("id", trainingId)
      .single();

    if (trErr || !training) {
      return { success: false, error: "Nie znaleziono jednostki lub brak do niej uprawnień." };
    }

    const teamObj = Array.isArray(training.teams) ? training.teams[0] : training.teams;

    // Pobranie tylko istniejących kolumn z tabeli players
    const { data: rawPlayers, error: plErr } = await supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number")
      .eq("current_team_id", training.team_id)
      .order("jersey_number", { ascending: true, nullsFirst: false });

    if (plErr) throw plErr;

    const squad = (rawPlayers || []).map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      jerseyNumber: p.jersey_number || 0,
      role: "Zawodnik",
    }));

    // Pobranie wpisów ocen (kolumna oceny to score, notatki w comment)
    const { data: rawEvals, error: evErr } = await supabase
      .from("evaluations")
      .select("player_id, score, is_present, absence_reason, comment")
      .eq("training_id", trainingId);

    if (evErr) throw evErr;

    const initialMarks: Record<string, Mark> = {};
    (rawEvals || []).forEach((row: any) => {
      if (!row.is_present) {
        initialMarks[row.player_id] = {
          type: "absence",
          reason: row.absence_reason || "unexcused",
          injury: row.comment?.startsWith("Uraz: ") ? row.comment.replace("Uraz: ", "") : undefined,
        };
      } else if (row.score) {
        initialMarks[row.player_id] = {
          type: "score",
          score: row.score,
        };
      }
    });

    return {
      success: true,
      training: {
        id: training.id,
        teamName: teamObj?.name || "Drużyna",
        date: training.date,
        startTime: training.start_time?.slice(0, 5) || "17:30",
        endTime: training.end_time?.slice(0, 5) || "18:45",
        place: training.location || "Boisko główne",
        topic: training.topic || undefined,
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
 * 4. Zapisuje pojedynczą ocenę zawodnika w locie (upsert)
 */
export async function savePlayerMarkAction(trainingId: string, playerId: string, mark: Mark) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: tr } = await supabase
      .from("trainings")
      .select("club_id")
      .eq("id", trainingId)
      .single();

    if (!tr) return { success: false, error: "Nie znaleziono jednostki." };

    const isPresent = mark.type === "score";
    const scoreVal = mark.type === "score" ? mark.score : null;
    const absenceReason = mark.type === "absence" ? mark.reason : null;
    const commentVal = mark.type === "absence" && mark.reason === "injury" && mark.injury 
      ? `Uraz: ${mark.injury}` 
      : null;

    const { error } = await supabase
      .from("evaluations")
      .upsert(
        {
          club_id: tr.club_id,
          training_id: trainingId,
          player_id: playerId,
          evaluator_id: user.id,
          is_present: isPresent,
          score: scoreVal,
          absence_reason: absenceReason,
          comment: commentVal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "training_id,player_id" }
      );

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Resetuje oceny jednostki treningowej (DELETE)
 */
export async function resetTrainingEvaluationsAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { error } = await supabase
      .from("evaluations")
      .delete()
      .eq("training_id", trainingId);

    if (error) throw error;

    revalidatePath(`/trener/${trainingId}`);
    revalidatePath("/trener");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 6. Aktywuje ankietę RPE i oznacza jednostkę jako zrealizowaną
 */
export async function enableTrainingSurveyAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: training, error: trErr } = await supabase
      .from("trainings")
      .select("id, club_id")
      .eq("id", trainingId)
      .single();

    if (trErr || !training) return { success: false, error: "Trening nie istnieje lub brak dostępu." };

    // Pobranie tylko obecnych zawodników na jednostce
    const { data: presentEvals, error: evErr } = await supabase
      .from("evaluations")
      .select("player_id")
      .eq("training_id", trainingId)
      .eq("is_present", true);

    if (evErr) throw evErr;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const surveyRows = (presentEvals || []).map((e: any) => ({
      club_id: training.club_id,
      training_id: trainingId,
      player_id: e.player_id,
      token: randomUUID(),
      recipient: "player",
      expires_at: expiresAt.toISOString(),
      is_completed: false,
    }));

    if (surveyRows.length > 0) {
      await supabase
        .from("post_training_surveys")
        .upsert(surveyRows, { onConflict: "training_id,player_id" });
    }

    // Aktualizacja statusu jednostki i włączenie flagi ankiety
    const { error: updateErr } = await supabase
      .from("trainings")
      .update({
        survey_enabled: true,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", trainingId);

    if (updateErr) throw updateErr;

    revalidatePath(`/trener/${trainingId}`);
    revalidatePath("/trener");

    return {
      success: true,
      surveyUrl: `/ankieta/${trainingId}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}