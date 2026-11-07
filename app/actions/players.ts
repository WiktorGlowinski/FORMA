'use server';

import { createClient } from '@/lib/supabase-server';
import { getErrorMessage } from '@/lib/error-message';

export interface CsvPlayerRecord {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  birthYear?: number;
  primaryPosition?: string;
}

export async function importPlayersBatch(
  clubId: string,
  teamId: string,
  records: CsvPlayerRecord[]
) {
  try {
    if (!records || records.length === 0) {
      return { success: false, error: 'Przekazano pustą listę zawodników.' };
    }

    const supabase = await createClient();

    const rowsToInsert = records.map((p) => {
      if (!p.firstName?.trim() || !p.lastName?.trim()) {
        throw new Error('Każdy zawodnik musi posiadać imię i nazwisko.');
      }

      return {
        club_id: clubId,
        current_team_id: teamId,
        first_name: p.firstName.trim(),
        last_name: p.lastName.trim(),
        jersey_number: p.jerseyNumber ? Number(p.jerseyNumber) : null,
        birth_year: p.birthYear ? Number(p.birthYear) : null,
        primary_position: p.primaryPosition?.trim() || null,
        status: 'active',
      };
    });

    const { data, error } = await supabase
      .from('players')
      .insert(rowsToInsert)
      .select('id, first_name, last_name, jersey_number');

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      importedCount: data.length, 
      players: data 
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Nie udało się wykonać operacji.') };
  }
}
export interface CoachPlayerItem {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  avatarUrl: string | null;
  parentName: string | null;
  parentPhone: string | null;
  teamName: string;
  ageGroup: string | null;
}

export interface PlayerHistoryRecord {
  id: string;
  isPresent: boolean;
  score: string | null;
  absenceReason: string | null;
  note: string | null;
  date: string | null;
  topic: string | null;
  trainingType: string | null;
  fatigue: number | null;
  satisfaction: number | null;
}

export interface PlayerAnalyticsData {
  player: CoachPlayerItem;
  history: PlayerHistoryRecord[];
  totalTrainings: number;
  attendedCount: number;
  attendancePct: number;
  ratingsBreakdown: { plus: number; zero: number; minus: number; total: number };
  ratingsPct: { plus: number; zero: number; minus: number };
  absencesBreakdown: { injury: number; illness: number; excused: number; unexcused: number };
  avgFatigue: string | null;
  avgSatisfaction: string | null;
}

// 1. Pobieranie listy kadry (dla głównego i asystenta)
export async function getCoachRosterAction(): Promise<{
  success: boolean;
  roster?: CoachPlayerItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    // Pobieramy aktywne przypisania trenera (zarówno is_primary = true jak i false)
    const { data: coachTeams, error: ctError } = await supabase
      .from("team_coaches")
      .select("team_id")
      .eq("coach_id", user.id)
      .is("revoked_at", null);

    if (ctError) throw ctError;

    const teamIds = (coachTeams || []).map((ct: { team_id: string }) => ct.team_id);
    if (teamIds.length === 0) return { success: true, roster: [] };

    // Używamy właściwej kolumny current_team_id
    const { data: players, error: pError } = await supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        jersey_number,
        avatar_url,
        parent_name,
        parent_phone,
        current_team_id,
        teams!current_team_id (
          name,
          age_group
        )
      `)
      .in("current_team_id", teamIds)
      .eq("is_active", true)
      .order("jersey_number", { ascending: true, nullsFirst: false });

    if (pError) throw pError;

    const roster: CoachPlayerItem[] = (players || []).map((p: {
      id: string;
      first_name: string;
      last_name: string;
      jersey_number: number | null;
      avatar_url: string | null;
      parent_name: string | null;
      parent_phone: string | null;
      teams: { name: string; age_group: string | null } | { name: string; age_group: string | null }[] | null;
    }) => {
      const team = Array.isArray(p.teams) ? p.teams[0] : p.teams;
      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        jerseyNumber: p.jersey_number,
        avatarUrl: p.avatar_url,
        parentName: p.parent_name,
        parentPhone: p.parent_phone,
        teamName: team?.name || "Brak drużyny",
        ageGroup: team?.age_group || null,
      };
    });

    return { success: true, roster };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Błąd pobierania kadry") };
  }
}

// 2. Pobieranie profilu analitycznego zawodnika
export async function getPlayerAnalyticsAction(playerId: string): Promise<{
  success: boolean;
  data?: PlayerAnalyticsData;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: player, error: pError } = await supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        jersey_number,
        avatar_url,
        parent_name,
        parent_phone,
        current_team_id,
        teams!current_team_id (
          name,
          age_group
        )
      `)
      .eq("id", playerId)
      .single();

    if (pError || !player) return { success: false, error: "Nie znaleziono zawodnika" };

    // Weryfikacja uprawnień: czy zalogowany trener prowadzi ten zespół
    const { data: coachAssignment } = await supabase
      .from("team_coaches")
      .select("id")
      .eq("team_id", player.current_team_id)
      .eq("coach_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    if (!coachAssignment && user.user_metadata?.role !== "admin") {
      return { success: false, error: "Brak uprawnień do kartoteki tego zawodnika" };
    }

    // Pobranie ocen z tabeli evaluations
    const { data: evaluations, error: eError } = await supabase
      .from("evaluations")
      .select(`
        id,
        training_id,
        is_present,
        score,
        absence_reason,
        comment,
        created_at,
        trainings (
          id,
          date,
          topic,
          training_type,
          status
        )
      `)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false });

    if (eError) throw eError;

    // Pobranie ankiet z tabeli post_training_surveys
    const { data: surveys, error: sError } = await supabase
      .from("post_training_surveys")
      .select("training_id, fatigue, satisfaction")
      .eq("player_id", playerId)
      .eq("is_completed", true);

    if (sError) throw sError;

    // Połączenie ankiet z treningami w pamięci
    const surveyMap = new Map<string, { fatigue: number; satisfaction: number }>();
    (surveys || []).forEach((s: { training_id: string; fatigue: number; satisfaction: number }) => {
      surveyMap.set(s.training_id, { fatigue: s.fatigue, satisfaction: s.satisfaction });
    });

    const rawList = evaluations || [];
    const history: PlayerHistoryRecord[] = rawList.map((r: {
      id: string;
      training_id: string;
      is_present: boolean;
      score: string | null;
      absence_reason: string | null;
      comment: string | null;
      trainings: {
        date: string;
        topic: string | null;
        training_type: string | null;
      } | {
        date: string;
        topic: string | null;
        training_type: string | null;
      }[] | null;
    }) => {
      const tr = Array.isArray(r.trainings) ? r.trainings[0] : r.trainings;
      const sv = surveyMap.get(r.training_id);
      return {
        id: r.id,
        isPresent: Boolean(r.is_present),
        score: r.score,
        absenceReason: r.absence_reason,
        note: r.comment?.includes("Notatka: ")
          ? r.comment.slice(r.comment.indexOf("Notatka: ") + "Notatka: ".length).trim()
          : null,
        date: tr?.date || null,
        topic: tr?.topic || null,
        trainingType: tr?.training_type || null,
        fatigue: sv?.fatigue ?? null,
        satisfaction: sv?.satisfaction ?? null,
      };
    });

    const totalTrainings = history.length;
    const attendedCount = history.filter((r) => r.isPresent).length;
    const attendancePct = totalTrainings > 0 ? Math.round((attendedCount / totalTrainings) * 100) : 0;

    const ratings = history.filter((r) => r.isPresent && r.score).map((r) => r.score);
    const countPlus = ratings.filter((s) => s === "+").length;
    const countZero = ratings.filter((s) => s === "0").length;
    const countMinus = ratings.filter((s) => s === "-").length;
    const ratedTotal = ratings.length;

    const absences = history.filter((r) => !r.isPresent);
    const countInjury = absences.filter((r) => r.absenceReason === "injury").length;
    const countIllness = absences.filter((r) => r.absenceReason === "illness").length;
    const countExcused = absences.filter((r) => r.absenceReason === "excused").length;
    const countUnexcused = absences.filter((r) => r.absenceReason === "unexcused").length;

    const validSurveys = history.filter((r) => r.fatigue != null && r.satisfaction != null);
    const avgFatigue =
      validSurveys.length > 0
        ? (validSurveys.reduce((acc, s) => acc + (s.fatigue || 0), 0) / validSurveys.length).toFixed(1)
        : null;
    const avgSatisfaction =
      validSurveys.length > 0
        ? (validSurveys.reduce((acc, s) => acc + (s.satisfaction || 0), 0) / validSurveys.length).toFixed(1)
        : null;

    const teamData = Array.isArray(player.teams) ? player.teams[0] : player.teams;

    return {
      success: true,
      data: {
        player: {
          id: player.id,
          firstName: player.first_name,
          lastName: player.last_name,
          jerseyNumber: player.jersey_number,
          avatarUrl: player.avatar_url,
          parentName: player.parent_name,
          parentPhone: player.parent_phone,
          teamName: teamData?.name || "Brak drużyny",
          ageGroup: teamData?.age_group || null,
        },
        history,
        totalTrainings,
        attendedCount,
        attendancePct,
        ratingsBreakdown: { plus: countPlus, zero: countZero, minus: countMinus, total: ratedTotal },
        ratingsPct: {
          plus: ratedTotal > 0 ? Math.round((countPlus / ratedTotal) * 100) : 0,
          zero: ratedTotal > 0 ? Math.round((countZero / ratedTotal) * 100) : 0,
          minus: ratedTotal > 0 ? Math.round((countMinus / ratedTotal) * 100) : 0,
        },
        absencesBreakdown: {
          injury: countInjury,
          illness: countIllness,
          excused: countExcused,
          unexcused: countUnexcused,
        },
        avgFatigue,
        avgSatisfaction,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Błąd pobierania profilu") };
  }
}

export async function getTeamPlayersList(teamId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, birth_year, status')
      .eq('current_team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false })
      .order('last_name', { ascending: true });

    if (error) {
      return { success: false, error: error.message, players: [] };
    }

    return { success: true, players: data };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udało się pobrać zawodników."), players: [] };
  }
}