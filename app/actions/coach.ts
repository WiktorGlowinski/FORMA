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
  evaluatedPlayerIds: string[];
  totalPlayers: number;
  guestCount: number;
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
  feedbackNote?: string | null;
  surveyUrl: string;
}

export interface SurveySummary {
  isExpired: boolean;
  expiresAt: string | null;
  totalSurveys: number;
  completedSurveys: number;
  responseRate: number;
  avgFatigue: number | null;
  avgSatisfaction: number | null;
  notes: Array<{
    playerName: string;
    jerseyNumber: number | null;
    fatigue: number;
    satisfaction: number;
    feedbackNote: string;
  }>;
}

export interface CoachAlertItem {
  playerId: string;
  playerName: string;
  jerseyNumber: number | null;
  teamName: string;
  type: "negative_streak" | "high_fatigue" | "injury";
  badgeText: string;
  description: string;
  severity: "danger" | "warning";
}

export interface GuestCandidatePlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  avatarUrl: string | null;
  teamName: string;
  ageGroup: string | null;
}

/**
 * 1. Pobiera listę jednostek treningowych i zespołów przypisanych do zalogowanego trenera
 */
export async function getCoachTrainingsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak aktywnej sesji użytkownika.", trainings: [], teams: [] };
    }

    const { data: assignments, error: assignErr } = await supabase
      .from("team_coaches")
      .select(`
        team_id,
        is_primary,
        teams (
          id,
          name,
          age_group,
          is_active
        )
      `)
      .eq("coach_id", user.id)
      .is("revoked_at", null);

    if (assignErr) {
      console.error("Błąd zapytania team_coaches:", assignErr.message);
    }

    const assignedTeams = (assignments || [])
      .map((item: any) => {
        const team = Array.isArray(item.teams) ? item.teams[0] : item.teams;
        return team && team.is_active ? { id: team.id, name: team.name } : null;
      })
      .filter((t): t is { id: string; name: string } => t !== null);

    const teamIds = assignedTeams.map((t) => t.id);

    if (teamIds.length === 0) {
      return {
        success: true,
        currentCoachId: user.id,
        trainings: [],
        teams: [],
      };
    }

    const [trainingsRes, squadRes] = await Promise.all([
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
        .in("team_id", teamIds)
        .order("date", { ascending: false })
        .limit(40),
      supabase
        .from("players")
        .select("current_team_id")
        .in("current_team_id", teamIds)
        .eq("is_active", true),
    ]);

    if (trainingsRes.error) throw trainingsRes.error;
    if (squadRes.error) throw squadRes.error;

    const trainings = trainingsRes.data || [];
    const trainingIds = trainings.map((t: any) => t.id);

    const evalsRes = trainingIds.length > 0
      ? await supabase
          .from("evaluations")
        .select("training_id, player_id, is_present, score, absence_reason, is_guest")
          .in("training_id", trainingIds)
      : { data: [], error: null };

    if (evalsRes.error) throw evalsRes.error;

    const allEvaluations = evalsRes.data || [];

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

      const trainingEvals = allEvaluations.filter((e: any) => e.training_id === t.id);
      const guestCount = trainingEvals.filter((e: any) => e.is_guest).length;
      const baseTeamCount = playersCountByTeam[tId] || 0;
      const totalPlayers = baseTeamCount + guestCount;

      const evaluatedCount = trainingEvals.filter(
        (e: any) => e.score !== null || (!e.is_present && e.absence_reason !== null)
      ).length;
      const evaluatedPlayerIds = trainingEvals
        .filter((e: any) => e.score !== null || (!e.is_present && e.absence_reason !== null))
        .map((e: any) => e.player_id);

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
        evaluatedCount,
        evaluatedPlayerIds,
        totalPlayers,
        guestCount,
        leadCoachId: t.lead_coach_id,
        leadCoachName,
        isOwner,
      };
    });

    return {
      success: true,
      currentCoachId: user.id,
      trainings: formattedTrainings,
      teams: assignedTeams,
    };
  } catch (err: any) {
    console.error("Błąd getCoachTrainingsAction:", err);
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      return { success: false, error: "Data treningu jest nieprawidłowa." };
    }

    const [year, month, day] = payload.date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return { success: false, error: "Data treningu jest nieprawidłowa." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Brak aktywnej sesji trenera." };
    }

    const { data: assignment } = await supabase
      .from("team_coaches")
      .select("id")
      .eq("team_id", payload.teamId)
      .eq("coach_id", user.id)
      .maybeSingle();

    if (!assignment) {
      return { success: false, error: "Nie masz uprawnień do planowania jednostek dla tej drużyny." };
    }

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("club_id")
      .eq("id", payload.teamId)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Nie znaleziono drużyny." };
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
 * 3. Pobiera dane pojedynczej jednostki, kadrę oraz status ocen i ankiet RPE
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

    const [coachProfileRes, playersRes, evalsRes, surveysRes] = await Promise.all([
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
        .eq("is_active", true)
        .order("jersey_number", { ascending: true, nullsFirst: false }),
      supabase
        .from("evaluations")
        .select("player_id, score, is_present, absence_reason, comment, is_guest")
        .eq("training_id", trainingId),
      supabaseAdmin
        .from("post_training_surveys")
        .select(`
          id,
          token,
          is_completed,
          fatigue,
          satisfaction,
          feedback_note,
          expires_at,
          player_id,
          players ( first_name, last_name, jersey_number )
        `)
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

    const guestEvaluations = (evalsRes.data || []).filter((e: any) => e.is_guest);
    const guestPlayerIds = Array.from(new Set(guestEvaluations.map((e: any) => e.player_id)));

    let guestPlayers: any[] = [];
    if (guestPlayerIds.length > 0) {
      const { data: guests } = await supabase
        .from("players")
        .select("id, first_name, last_name, jersey_number, avatar_url, parent_name, parent_phone, phone")
        .in("id", guestPlayerIds);

      if (guests) {
        guestPlayers = guests.map((g: any) => ({
          id: g.id,
          firstName: g.first_name,
          lastName: g.last_name,
          jerseyNumber: g.jersey_number || 0,
          role: "Zawodnik",
          avatarUrl: g.avatar_url || null,
          parentName: g.parent_name || null,
          parentPhone: g.parent_phone || null,
          phone: g.phone || null,
          isGuest: true,
        }));
      }
    }

    const regularPlayers = (playersRes.data || []).map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      jerseyNumber: p.jersey_number || 0,
      role: "Zawodnik",
      avatarUrl: p.avatar_url || null,
      parentName: p.parent_name || null,
      parentPhone: p.parent_phone || null,
      phone: p.phone || null,
      isGuest: false,
    }));

    const regularIds = new Set(regularPlayers.map((p) => p.id));
    const squad = [
      ...regularPlayers,
      ...guestPlayers.filter((g) => !regularIds.has(g.id)),
    ];

    const initialMarks: Record<string, Mark> = {};
    (evalsRes.data || []).forEach((row: any) => {
      if (!row.is_present && row.absence_reason) {
        initialMarks[row.player_id] = {
          type: "absence",
          reason: row.absence_reason,
          injury: row.comment?.startsWith("Uraz: ") ? row.comment.replace("Uraz: ", "") : undefined,
        };
      } else if (row.score) {
        initialMarks[row.player_id] = {
          type: "score",
          score: row.score,
        };
      }
    });

    let surveySummary: SurveySummary | null = null;
    const surveyRows = surveysRes.data || [];
    const isSurveyEnabled = Boolean(training.survey_enabled) || surveyRows.length > 0;

    if (surveyRows.length > 0) {
      const firstExpiresAt = surveyRows[0]?.expires_at || null;
      const isExpired = firstExpiresAt ? new Date(firstExpiresAt).getTime() <= Date.now() : false;
      const completedList = surveyRows.filter((s: any) => s.is_completed);
      const totalCount = surveyRows.length;
      const completedCount = completedList.length;

      const avgFatigue = completedCount > 0
        ? Number((completedList.reduce((acc: number, cur: any) => acc + (cur.fatigue || 0), 0) / completedCount).toFixed(1))
        : null;

      const avgSatisfaction = completedCount > 0
        ? Number((completedList.reduce((acc: number, cur: any) => acc + (cur.satisfaction || 0), 0) / completedCount).toFixed(1))
        : null;

      const notes = completedList
        .filter((s: any) => Boolean(s.feedback_note))
        .map((s: any) => {
          const p = Array.isArray(s.players) ? s.players[0] : s.players;
          return {
            playerName: p ? `${p.first_name} ${p.last_name}` : "Zawodnik",
            jerseyNumber: p?.jersey_number ?? null,
            fatigue: s.fatigue || 0,
            satisfaction: s.satisfaction || 0,
            feedbackNote: s.feedback_note,
          };
        });

      surveySummary = {
        isExpired,
        expiresAt: firstExpiresAt,
        totalSurveys: totalCount,
        completedSurveys: completedCount,
        responseRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        avgFatigue,
        avgSatisfaction,
        notes,
      };
    }

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
        surveyEnabled: isSurveyEnabled,
        isOwner,
        leadCoachName,
      },
      squad,
      initialMarks,
      surveySummary,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Zapisuje pojedynczą ocenę zawodnika w locie i aktualizuje status jednostki
 */
export async function savePlayerMarkAction(trainingId: string, playerId: string, mark: Mark) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji." };

    const { data: tr } = await supabase
      .from("trainings")
      .select("club_id, lead_coach_id, status")
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

    if (tr.status === "scheduled" || tr.status === "planned") {
      await supabase
        .from("trainings")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", trainingId);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Resetuje oceny jednostki treningowej
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
 * 6. Aktywuje ankietę RPE i zwraca link
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
 * 7. Oblicza alerty dla zawodników wymagających uwagi
 */
export async function getCoachAlertsAction(): Promise<{
  success: boolean;
  alerts?: CoachAlertItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: coachTeams, error: ctError } = await supabase
      .from("team_coaches")
      .select("team_id")
      .eq("coach_id", user.id)
      .is("revoked_at", null);

    if (ctError) throw ctError;

    const teamIds = (coachTeams || []).map((ct: { team_id: string }) => ct.team_id);
    if (teamIds.length === 0) return { success: true, alerts: [] };

    const { data: players, error: pError } = await supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        jersey_number,
        current_team_id,
        teams!current_team_id ( name )
      `)
      .in("current_team_id", teamIds)
      .eq("is_active", true);

    if (pError) throw pError;
    const playerList = players || [];
    if (playerList.length === 0) return { success: true, alerts: [] };

    const playerIds = playerList.map((p) => p.id);

    const { data: evaluations, error: eError } = await supabase
      .from("evaluations")
      .select(`
        id,
        player_id,
        is_present,
        score,
        absence_reason,
        created_at
      `)
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    if (eError) throw eError;

    const { data: surveys, error: sError } = await supabase
      .from("post_training_surveys")
      .select(`
        id,
        player_id,
        fatigue,
        satisfaction,
        created_at
      `)
      .in("player_id", playerIds)
      .eq("is_completed", true)
      .order("created_at", { ascending: false });

    if (sError) throw sError;

    const evMap = new Map<string, typeof evaluations>();
    (evaluations || []).forEach((ev) => {
      const arr = evMap.get(ev.player_id) || [];
      arr.push(ev);
      evMap.set(ev.player_id, arr);
    });

    const svMap = new Map<string, typeof surveys>();
    (surveys || []).forEach((sv) => {
      const arr = svMap.get(sv.player_id) || [];
      arr.push(sv);
      svMap.set(sv.player_id, arr);
    });

    const alerts: CoachAlertItem[] = [];

    for (const player of playerList) {
      const pEvaluations = evMap.get(player.id) || [];
      const pSurveys = svMap.get(player.id) || [];
      const teamData = Array.isArray(player.teams) ? player.teams[0] : player.teams;
      const teamName = teamData?.name || "Brak drużyny";
      const playerName = `${player.first_name} ${player.last_name}`;

      if (pEvaluations.length > 0) {
        const latestEv = pEvaluations[0];
        if (!latestEv.is_present && latestEv.absence_reason === "injury") {
          alerts.push({
            playerId: player.id,
            playerName,
            jerseyNumber: player.jersey_number,
            teamName,
            type: "injury",
            badgeText: "Kontuzja",
            description: "Ostatnia jednostka opuszczona z powodu urazu",
            severity: "danger",
          });
          continue;
        }
      }

      const scoredEvaluations = pEvaluations.filter((e) => e.is_present && e.score);
      if (scoredEvaluations.length >= 2) {
        const streakCount = scoredEvaluations.slice(0, 3).filter((e) => e.score === "-").length;
        if (streakCount >= 2 && scoredEvaluations[0].score === "-") {
          alerts.push({
            playerId: player.id,
            playerName,
            jerseyNumber: player.jersey_number,
            teamName,
            type: "negative_streak",
            badgeText: `${streakCount}x ocena '-'`,
            description: "Spadek formy względem własnej normy",
            severity: "danger",
          });
          continue;
        }
      }

      if (pSurveys.length > 0) {
        const latestSurvey = pSurveys[0];
        if (latestSurvey.fatigue != null && latestSurvey.fatigue >= 5) {
          alerts.push({
            playerId: player.id,
            playerName,
            jerseyNumber: player.jersey_number,
            teamName,
            type: "high_fatigue",
            badgeText: "Zmęczenie 5/5",
            description: "Zawodnik zadeklarował maksymalne obciążenie",
            severity: "warning",
          });
        }
      }
    }

    return { success: true, alerts };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd pobierania alertów" };
  }
}

/**
 * 8. Odwołuje jednostkę treningową
 */
export async function cancelTrainingAction(
  trainingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: training, error: fetchError } = await supabase
      .from("trainings")
      .select("id, status, team_id, lead_coach_id, organizational_note")
      .eq("id", trainingId)
      .single();

    if (fetchError || !training) {
      return { success: false, error: "Jednostka treningowa nie istnieje" };
    }

    if (training.status === "completed") {
      return { success: false, error: "Nie można odwołać zrealizowanego i zamkniętego treningu" };
    }

    const { data: assignment } = await supabase
      .from("team_coaches")
      .select("id")
      .eq("team_id", training.team_id)
      .eq("coach_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    const isAuthorized =
      training.lead_coach_id === user.id ||
      Boolean(assignment) ||
      user.user_metadata?.role === "admin";

    if (!isAuthorized) {
      return { success: false, error: "Brak uprawnień do odwołania tej jednostki" };
    }

    let updatedNote = training.organizational_note || "";
    if (reason?.trim()) {
      updatedNote = updatedNote
        ? `${updatedNote} | [ODWOŁANO]: ${reason.trim()}`
        : `[ODWOŁANO]: ${reason.trim()}`;
    }

    const { error: updateError } = await supabase
      .from("trainings")
      .update({
        status: "cancelled",
        organizational_note: updatedNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trainingId);

    if (updateError) throw updateError;

    revalidatePath("/trener");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd podczas odwoływania treningu" };
  }
}

/**
 * 9. Wyszukiwanie zawodników z innych roczników tego samego klubu
 */
export async function searchClubPlayersForGuestAction(
  trainingId: string,
  query: string
): Promise<{
  success: boolean;
  candidates?: GuestCandidatePlayer[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: training, error: tError } = await supabase
      .from("trainings")
      .select("id, club_id, team_id")
      .eq("id", trainingId)
      .single();

    if (tError || !training) {
      return { success: false, error: "Jednostka treningowa nie istnieje" };
    }

    let targetClubId = training.club_id;
    if (!targetClubId) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("club_id")
        .eq("id", training.team_id)
        .single();
      targetClubId = teamData?.club_id;
    }

    // 1. Wykluczamy stałych zawodników drużyny tego treningu
    const { data: teamPlayers } = await supabase
      .from("players")
      .select("id")
      .eq("current_team_id", training.team_id);

    const teamPlayerIds = (teamPlayers || []).map((p: any) => p.id);

    // 2. Wykluczamy zawodników już zapisanych w ocenach jednostki (np. dodani wcześniej goście)
    const { data: existingEvaluations } = await supabase
      .from("evaluations")
      .select("player_id")
      .eq("training_id", trainingId);

    const evaluatedPlayerIds = (existingEvaluations || []).map((e: any) => e.player_id);

    const excludedIds = Array.from(new Set([...teamPlayerIds, ...evaluatedPlayerIds]));

    let dbQuery = supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        jersey_number,
        avatar_url,
        current_team_id,
        teams!current_team_id (
          name,
          age_group
        )
      `)
      .eq("is_active", true)
      .neq("current_team_id", training.team_id)
      .limit(60);

    if (targetClubId) {
      dbQuery = dbQuery.eq("club_id", targetClubId);
    }

    if (excludedIds.length > 0) {
      dbQuery = dbQuery.not("id", "in", `(${excludedIds.join(",")})`);
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 0) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%`
      );
    }

    const { data: players, error: pError } = await dbQuery;
    if (pError) throw pError;

    const candidates: GuestCandidatePlayer[] = (players || []).map((p: any) => {
      const team = Array.isArray(p.teams) ? p.teams[0] : p.teams;
      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        jerseyNumber: p.jersey_number,
        avatarUrl: p.avatar_url,
        teamName: team?.name || "Brak zespołu",
        ageGroup: team?.age_group || null,
      };
    });

    return { success: true, candidates };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd wyszukiwania zawodników" };
  }
}

/**
 * 10. Dodanie rekordu gościa do jednostki w tabeli evaluations
 */
export async function addGuestPlayerToTrainingAction(
  trainingId: string,
  playerId: string
): Promise<{
  success: boolean;
  evaluationId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: training, error: tError } = await supabase
      .from("trainings")
      .select("id, club_id, team_id, status, survey_enabled")
      .eq("id", trainingId)
      .single();

    if (tError || !training) return { success: false, error: "Jednostka nie istnieje" };
    if (training.status === "cancelled") {
      return { success: false, error: "Nie można dodać zawodnika do odwołanego treningu" };
    }

    // Blokada dodania, jeśli gracz jest już w evaluations (zapobiega duplikatom)
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id")
      .eq("training_id", trainingId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (existingEval) {
      return { success: false, error: "Ten zawodnik jest już dopisany do tej jednostki" };
    }

    // Blokada dodania, jeśli to stały zawodnik tej samej drużyny
    const { data: playerInfo } = await supabase
      .from("players")
      .select("current_team_id")
      .eq("id", playerId)
      .single();

    if (playerInfo?.current_team_id === training.team_id) {
      return { success: false, error: "Ten zawodnik jest już w składzie tej drużyny" };
    }

    let targetClubId = training.club_id;
    if (!targetClubId) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("club_id")
        .eq("id", training.team_id)
        .single();
      targetClubId = teamData?.club_id;
    }

    const { data: evaluation, error: insertError } = await supabase
      .from("evaluations")
      .insert({
        training_id: trainingId,
        player_id: playerId,
        club_id: targetClubId,
        evaluator_id: user.id,
        is_present: true,
        is_guest: true,
        score: null,
        absence_reason: null,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, error: "Ten zawodnik jest już na liście tej jednostki" };
      }
      throw insertError;
    }

    if (training.survey_enabled && targetClubId) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabaseAdmin.from("post_training_surveys").insert({
        club_id: targetClubId,
        training_id: trainingId,
        player_id: playerId,
        token: randomUUID(),
        recipient: "player",
        expires_at: expiresAt.toISOString(),
        is_completed: false,
      });
    }

    revalidatePath(`/trener/${trainingId}`);
    revalidatePath("/trener");

    return { success: true, evaluationId: evaluation.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd dodawania gościa" };
  }
}

/**
 * 11. Pobiera listę ankiet RPE i status wygaśnięcia
 */
export async function getTrainingSurveysStatusAction(trainingId: string): Promise<{
  success: boolean;
  surveys: SurveyStatusItem[];
  summary?: SurveySummary;
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
        expires_at,
        player_id,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq("training_id", trainingId);

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let expiresAt: string | null = null;
    let isExpired = false;

    const surveys: SurveyStatusItem[] = (data || []).map((s: any) => {
      if (!expiresAt && s.expires_at) {
        expiresAt = s.expires_at;
        if (new Date(s.expires_at) < new Date()) {
          isExpired = true;
        }
      }

      const p = Array.isArray(s.players) ? s.players[0] : s.players;
      return {
        id: s.id,
        playerId: s.player_id,
        playerName: p ? `${p.first_name} ${p.last_name}` : "Zawodnik",
        jerseyNumber: p?.jersey_number ?? null,
        isCompleted: Boolean(s.is_completed),
        fatigue: s.fatigue,
        satisfaction: s.satisfaction,
        feedbackNote: s.feedback_note || null,
        surveyUrl: `${baseUrl}/ankieta/${trainingId}`,
      };
    });

    const completedList = surveys.filter((s) => s.isCompleted);
    const totalCount = surveys.length;
    const completedCount = completedList.length;

    const avgFatigue = completedCount > 0
      ? Number((completedList.reduce((acc, cur) => acc + (cur.fatigue || 0), 0) / completedCount).toFixed(1))
      : null;

    const avgSatisfaction = completedCount > 0
      ? Number((completedList.reduce((acc, cur) => acc + (cur.satisfaction || 0), 0) / completedCount).toFixed(1))
      : null;

    const notes = completedList
      .filter((s) => Boolean(s.feedbackNote))
      .map((s) => ({
        playerName: s.playerName,
        jerseyNumber: s.jerseyNumber,
        fatigue: s.fatigue || 0,
        satisfaction: s.satisfaction || 0,
        feedbackNote: s.feedbackNote!,
      }));

    const summary: SurveySummary = {
      isExpired,
      expiresAt,
      totalSurveys: totalCount,
      completedSurveys: completedCount,
      responseRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      avgFatigue,
      avgSatisfaction,
      notes,
    };

    const trainingHeader = training?.date 
      ? ` (${training.date}${training.topic ? ` - ${training.topic}` : ""})` 
      : "";

    const shareText = `FORMA — Ankieta potreningowa${trainingHeader}\nLink do wypełnienia oceny samopoczucia:\n${baseUrl}/ankieta/${trainingId}\n\nLink ważny 24h.`;

    return { success: true, surveys, summary, shareText };
  } catch (err: any) {
    return { success: false, error: err.message, surveys: [] };
  }
}