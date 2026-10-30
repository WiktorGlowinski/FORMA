"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
  leadCoachId: string | null;
  leadCoachName: string;
  isOwner: boolean;
}

export interface SurveyStatusItem {
  id: string;
  playerId: string;
  playerName: string;
  jerseyNumber: number | null;
  isCompleted: boolean;
  fatigue: number | null;
  satisfaction: number | null;
  surveyUrl: string;
}

/**
 * 1. Pobiera listę jednostek treningowych i zespołów (zoptymalizowane równolegle)
 */
export async function getCoachTrainingsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak aktywnej sesji użytkownika.", trainings: [], teams: [] };
    }

    // Faza 1: Równoległe pobranie zespołów oraz ostatnich jednostek treningowych
    const [teamsRes, trainingsRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .order("name"),
      supabase
        .from("trainings")
        .select(`
          id,
          team_id,
          lead_coach_id,
          date,
          start_time,
          end_time,
          location,
          topic,
          main_goal,
          training_type,
          organizational_note,
          status,
          teams ( id, name ),
          lead_coach:profiles!trainings_lead_coach_id_fkey ( full_name )
        `)
        .order("date", { ascending: false })
        .limit(40), // Zabezpieczenie przed pobieraniem tysięcy rekordów historycznych
    ]);

    if (teamsRes.error) throw teamsRes.error;
    if (trainingsRes.error) throw trainingsRes.error;

    const teams = teamsRes.data || [];
    const trainings = trainingsRes.data || [];

    const trainingIds = trainings.map((t: any) => t.id);
    const teamIds = teams.map((t: any) => t.id);

    // Faza 2: Równoległe pobranie liczby ocen i liczebności kadr w jednym zapytaniu
    const [evalsRes, squadRes] = await Promise.all([
      trainingIds.length > 0
        ? supabase
            .from("evaluations")
            .select("training_id")
            .in("training_id", trainingIds)
        : Promise.resolve({ data: [], error: null }),
      teamIds.length > 0
        ? supabase
            .from("players")
            .select("current_team_id")
            .in("current_team_id", teamIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (evalsRes.error) throw evalsRes.error;
    if (squadRes.error) throw squadRes.error;

    const evalsByTraining: Record<string, number> = {};
    (evalsRes.data || []).forEach((e: any) => {
      evalsByTraining[e.training_id] = (evalsByTraining[e.training_id] || 0) + 1;
    });

    const playersCountByTeam: Record<string, number> = {};
    (squadRes.data || []).forEach((p: any) => {
      if (p.current_team_id) {
        playersCountByTeam[p.current_team_id] = (playersCountByTeam[p.current_team_id] || 0) + 1;
      }
    });

    const formattedTrainings: DbTrainingCard[] = trainings.map((t: any) => {
      const tId = t.team_id;
      const teamObj = Array.isArray(t.teams) ? t.teams[0] : t.teams;
      const coachProfile = Array.isArray(t.lead_coach) ? t.lead_coach[0] : t.lead_coach;

      const isOwner = !t.lead_coach_id || t.lead_coach_id === user.id;
      const leadCoachName = coachProfile?.full_name || (isOwner ? "Twój profil" : "Inny trener");

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
        status: t.status || "scheduled",
        evaluatedCount: evalsByTraining[t.id] || 0,
        totalPlayers: playersCountByTeam[tId] || 0,
        leadCoachId: t.lead_coach_id,
        leadCoachName,
        isOwner,
      };
    });

    return {
      success: true,
      trainings: formattedTrainings,
      teams: teams.map((t: any) => ({ id: t.id, name: t.name })),
    };
  } catch (err: any) {
    return { success: false, error: err.message, trainings: [], teams: [] };
  }
}

/**
 * 2. Tworzy nową jednostkę treningową
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

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("club_id")
      .eq("id", payload.teamId)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Nie masz uprawnień do dodawania jednostek dla tej drużyny." };
    }

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
 * 3. Pobiera dane pojedynczej jednostki, kadrę oraz status ocen (zoptymalizowane równolegle)
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
        lead_coach_id,
        survey_enabled,
        teams ( id, name )
      `)
      .eq("id", trainingId)
      .single();

    if (trErr || !training) {
      return { success: false, error: "Nie znaleziono jednostki lub brak do niej uprawnień." };
    }

    // Równoległe pobranie profilu trenera, listy zawodników i istniejących ocen
    const [coachProfileRes, playersRes, evalsRes] = await Promise.all([
      training.lead_coach_id
        ? supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", training.lead_coach_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("players")
        .select("id, first_name, last_name, jersey_number, avatar_url, parent_name, parent_phone, phone")
        .eq("current_team_id", training.team_id)
        .order("jersey_number", { ascending: true, nullsFirst: false }),
      supabase
        .from("evaluations")
        .select("player_id, score, is_present, absence_reason, comment")
        .eq("training_id", trainingId),
    ]);

    if (playersRes.error) throw playersRes.error;
    if (evalsRes.error) throw evalsRes.error;

    let leadCoachName = "Trener prowadzący";
    if (coachProfileRes.data?.full_name) {
      leadCoachName = coachProfileRes.data.full_name;
    }

    const isOwner = !training.lead_coach_id || training.lead_coach_id === user.id;
    const teamObj = Array.isArray(training.teams) ? training.teams[0] : training.teams;

    const squad = (playersRes.data || []).map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      jerseyNumber: p.jersey_number || 0,
      role: "Zawodnik",
      avatarUrl: p.avatar_url || null,
      parentName: p.parent_name || null,
      parentPhone: p.parent_phone || null,
      phone: p.phone || null,
    }));

    const initialMarks: Record<string, Mark> = {};
    (evalsRes.data || []).forEach((row: any) => {
      if (!row.is_present) {
        initialMarks[row.player_id] = {
          type: "absence",
          reason: row.absence_reason || "nieusprawiedliwiona",
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
        surveyEnabled: Boolean(training.survey_enabled),
        isOwner,
        leadCoachName,
      },
      squad,
      initialMarks,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Zapisuje pojedynczą ocenę zawodnika w locie (blokada obcego trenera)
 */
export async function savePlayerMarkAction(trainingId: string, playerId: string, mark: Mark) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: tr } = await supabase
      .from("trainings")
      .select("club_id, lead_coach_id")
      .eq("id", trainingId)
      .single();

    if (!tr) return { success: false, error: "Nie znaleziono jednostki." };

    if (tr.lead_coach_id && tr.lead_coach_id !== user.id) {
      return { success: false, error: "Nie możesz modyfikować ocen w jednostce innego trenera." };
    }

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
 * 5. Resetuje oceny jednostki treningowej (blokada obcego trenera)
 */
export async function resetTrainingEvaluationsAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: tr } = await supabase
      .from("trainings")
      .select("lead_coach_id")
      .eq("id", trainingId)
      .single();

    if (!tr) return { success: false, error: "Nie znaleziono jednostki." };

    if (tr.lead_coach_id && tr.lead_coach_id !== user.id) {
      return { success: false, error: "Brak uprawnień do resetowania ocen w tym treningu." };
    }

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
 * 6. Aktywuje ankietę RPE i zwraca link (dostępne dla sztabu)
 */
export async function enableTrainingSurveyAction(trainingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: training, error: trErr } = await supabase
      .from("trainings")
      .select("id, club_id, team_id, lead_coach_id, survey_enabled")
      .eq("id", trainingId)
      .single();

    if (trErr || !training) return { success: false, error: "Trening nie istnieje lub brak dostępu." };

    if (training.survey_enabled) {
      return {
        success: true,
        surveyUrl: `/ankieta/${trainingId}`,
      };
    }

    const isOwner = !training.lead_coach_id || training.lead_coach_id === user.id;
    if (!isOwner) {
      const { data: assignment } = await supabase
        .from("team_coaches")
        .select("id")
        .eq("team_id", training.team_id)
        .eq("coach_id", user.id)
        .maybeSingle();

      if (!assignment) {
        return { success: false, error: "Brak uprawnień do jednostek tej drużyny." };
      }
    }

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
      await supabaseAdmin
        .from("post_training_surveys")
        .upsert(surveyRows, { onConflict: "training_id,player_id" });
    }

    const { error: updateErr } = await supabaseAdmin
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

/**
 * 7. Pobiera listę ankiet RPE
 */
export async function getTrainingSurveysStatusAction(trainingId: string): Promise<{
  success: boolean;
  surveys: SurveyStatusItem[];
  shareText?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji.", surveys: [] };

    const { data: training } = await supabase
      .from("trainings")
      .select("date, topic")
      .eq("id", trainingId)
      .single();

    const { data, error } = await supabase
      .from("post_training_surveys")
      .select(`
        id,
        token,
        is_completed,
        fatigue,
        satisfaction,
        feedback_note,
        player_id,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq("training_id", trainingId);

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const surveys: SurveyStatusItem[] = (data || []).map((s: any) => {
      const p = Array.isArray(s.players) ? s.players[0] : s.players;
      return {
        id: s.id,
        playerId: s.player_id,
        playerName: p ? `${p.first_name} ${p.last_name}` : "Zawodnik",
        jerseyNumber: p?.jersey_number ?? null,
        isCompleted: Boolean(s.is_completed),
        fatigue: s.fatigue,
        satisfaction: s.satisfaction,
        surveyUrl: `${baseUrl}/ankieta/${s.token}`,
      };
    });

    const trainingHeader = training?.date 
      ? ` (${training.date}${training.topic ? ` - ${training.topic}` : ""})` 
      : "";

    const linksList = surveys
      .map((s, idx) => `${idx + 1}. ${s.playerName}: ${s.surveyUrl}`)
      .join("\n");

    const shareText = `FORMA — Ankieta potreningowa${trainingHeader}\nProśba o wypełnienie krótkiej oceny samopoczucia (30 sekund):\n\n${linksList}\n\nLink wygasa za 24h.`;

    return { success: true, surveys, shareText };
  } catch (err: any) {
    return { success: false, error: err.message, surveys: [] };
  }
}