"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error("Brak aktywnej sesji użytkownika.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.is_active === false ||
    (profile.role !== "club_admin" && profile.role !== "master_admin")
  ) {
    throw new Error("Brak uprawnień administratora klubu.");
  }

  return { user, clubId: profile.club_id, role: profile.role, adminName: profile.full_name };
}

/**
 * 1. Główny pulpit KPI
 */
export async function getAdminDashboardAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const [clubRes, seasonRes, teamsRes, playersRes, coachesRes] = await Promise.all([
      supabase.from("clubs").select("name, logo_url").eq("id", clubId).single(),
      supabase.from("seasons").select("id, name").eq("club_id", clubId).eq("is_current", true).maybeSingle(),
      supabase.from("teams").select("id, name, is_active").eq("club_id", clubId),
      supabase.from("players").select("id, is_active").eq("club_id", clubId),
      supabase.from("profiles").select("id").eq("club_id", clubId).eq("role", "coach"),
    ]);

    const teams = teamsRes.data || [];
    const players = playersRes.data || [];

    return {
      success: true,
      club: clubRes.data,
      currentSeason: seasonRes.data?.name || "Brak aktywnego sezonu",
      metrics: {
        totalTeams: teams.length,
        activeTeams: teams.filter((t) => t.is_active).length,
        totalPlayers: players.length,
        activePlayers: players.filter((p) => p.is_active).length,
        totalCoaches: (coachesRes.data || []).length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      club: null,
      currentSeason: "Brak danych",
      metrics: { totalTeams: 0, activeTeams: 0, totalPlayers: 0, activePlayers: 0, totalCoaches: 0 },
    };
  }
}

/**
 * 2. Drużyny i sztab szkoleniowy
 */
export async function getAdminTeamsAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        age_group,
        is_active,
        created_at,
        team_coaches (
          coach_id,
          is_primary,
          profiles:coach_id ( full_name, email )
        )
      `)
      .eq("club_id", clubId)
      .order("name");

    if (error) throw error;
    return { success: true, teams: teams || [] };
  } catch (err: any) {
    return { success: false, error: err.message, teams: [] };
  }
}

export async function createTeamAction(payload: { name: string; ageGroup: string }) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: currentSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("club_id", clubId)
      .eq("is_current", true)
      .maybeSingle();

    const { data, error } = await supabase
      .from("teams")
      .insert({
        club_id: clubId,
        season_id: currentSeason?.id || null,
        name: payload.name.trim(),
        age_group: payload.ageGroup.trim(),
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");
    return { success: true, teamId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getClubCoachesAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: coaches, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        is_active,
        created_at,
        team_coaches (
          is_primary,
          teams:team_id ( id, name, age_group )
        )
      `)
      .eq("club_id", clubId)
      .eq("role", "coach")
      .order("full_name");

    if (error) throw error;

    const formattedCoaches = (coaches || []).map((c: any) => ({
      id: c.id,
      fullName: c.full_name,
      email: c.email,
      phone: c.phone,
      avatarUrl: c.avatar_url,
      isActive: c.is_active,
      createdAt: c.created_at,
      assignedTeams: (c.team_coaches || []).map((tc: any) => {
        const t = Array.isArray(tc.teams) ? tc.teams[0] : tc.teams;
        return {
          id: t?.id,
          name: t?.name,
          ageGroup: t?.age_group,
          isPrimary: tc.is_primary,
        };
      }),
    }));

    return { success: true, coaches: formattedCoaches };
  } catch (err: any) {
    return { success: false, error: err.message, coaches: [] };
  }
}

/**
 * Aktualizuje dane trenera w profiles oraz (opcjonalnie) hasło/email w auth.users
 */
export async function updateCoachAction(payload: {
  coachId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  newPassword?: string;
  isActive?: boolean;
}) {
  try {
    const { clubId, role } = await requireAdmin();

    const { data: targetCoach, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, club_id, role")
      .eq("id", payload.coachId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (
      !targetCoach ||
      targetCoach.role !== "coach" ||
      (role !== "master_admin" && targetCoach.club_id !== clubId)
    ) {
      return { success: false, error: "Nie znaleziono trenera w zarządzanym klubie." };
    }

    const fullName = payload.fullName.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone?.trim() || null;
    const avatarUrl = payload.avatarUrl?.trim() || null;

    const authUpdatePayload: any = {
      email,
      user_metadata: { full_name: fullName, avatar_url: avatarUrl },
    };

    if (payload.newPassword && payload.newPassword.trim().length >= 6) {
      authUpdatePayload.password = payload.newPassword.trim();
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      payload.coachId,
      authUpdatePayload
    );

    if (authErr) {
      return { success: false, error: `Błąd Supabase Auth: ${authErr.message}` };
    }

    let profileUpdate = supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        phone,
        avatar_url: avatarUrl,
        is_active: payload.isActive !== undefined ? payload.isActive : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.coachId);
    if (role !== "master_admin") {
      profileUpdate = profileUpdate.eq("club_id", clubId);
    }

    const { error: profileErr } = await profileUpdate;

    if (profileErr) {
      return { success: false, error: `Błąd bazy: ${profileErr.message}` };
    }

    revalidatePath("/admin/sztab");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Trwale usuwa konto trenera (z modułu Auth oraz kaskadowo z bazy)
 */
export async function deleteCoachAction(coachId: string) {
  try {
    const { clubId } = await requireAdmin();

    const { data: coach } = await supabaseAdmin
      .from("profiles")
      .select("id, club_id")
      .eq("id", coachId)
      .eq("club_id", clubId)
      .maybeSingle();

    if (!coach) {
      return { success: false, error: "Nie znaleziono trenera w kadrze Twojego klubu." };
    }

    await supabaseAdmin
      .from("team_coaches")
      .delete()
      .eq("coach_id", coachId);

    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(coachId);

    if (authDeleteErr) {
      await supabaseAdmin.from("profiles").delete().eq("id", coachId);
    }

    revalidatePath("/admin/sztab");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Pomocnik rejestrujący zdarzenie audytowe w bazie
 */
export async function logAuditEvent(payload: {
  clubId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      club_id: payload.clubId,
      user_id: payload.userId || null,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId || null,
      old_data: payload.oldData || null,
      new_data: payload.newData || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Błąd zapisu do audit_logs:", err);
  }
}

/**
 * Pobieranie ostatnich wpisów audytowych dla klubu
 */
export async function getClubAuditLogsAction(limit = 100) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at,
        profiles:user_id ( full_name, email )
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const formattedLogs = (logs || []).map((l: any) => ({
      id: l.id,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldData: l.old_data,
      newData: l.new_data,
      createdAt: l.created_at,
      authorName: l.profiles?.full_name || "System",
      authorEmail: l.profiles?.email || null,
    }));

    return { success: true, logs: formattedLogs };
  } catch (err: any) {
    return { success: false, error: err.message, logs: [] };
  }
}

/**
 * Jednolita aktualizacja adresu logo / herbu klubu w bazie (z obsługą usuwania null)
 */
export async function updateClubLogoAction(logoUrl: string | null) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const finalLogoUrl = logoUrl && logoUrl.trim().length > 0 ? logoUrl.trim() : null;

    const { error } = await supabase
      .from("clubs")
      .update({
        logo_url: finalLogoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clubId);

    if (error) throw error;

    revalidatePath("/admin/seasons");
    revalidatePath("/admin/sezony");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd podczas zapisu herbu." };
  }
}

/**
 * Bezpieczne tworzenie trenera w auth.users, profiles i opcjonalnie team_coaches
 */
export async function createCoachAccountAction(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
}) {
  try {
    const { clubId } = await requireAdmin();

    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    const phone = payload.phone?.trim() || null;
    const avatarUrl = payload.avatarUrl?.trim() || null;

    if (payload.password.length < 6) {
      return { success: false, error: "Hasło musi mieć co najmniej 6 znaków." };
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });

    if (authErr || !authUser.user) {
      return { success: false, error: `Błąd rejestracji w Auth: ${authErr?.message}` };
    }

    const coachId = authUser.user.id;

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: coachId,
        club_id: clubId,
        email,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        role: "coach",
        is_active: true,
      });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(coachId);
      return { success: false, error: `Błąd tworzenia profilu: ${profileErr.message}` };
    }

    revalidatePath("/admin/druzyny");
    revalidatePath("/admin/sztab");
    revalidatePath("/admin");

    return { 
      success: true, 
      coach: { 
        id: coachId, 
        full_name: fullName, 
        email,
        phone,
        avatar_url: avatarUrl,
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function assignCoachToTeamAction(payload: {
  teamId: string;
  coachId: string;
  isPrimary: boolean;
}) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("team_coaches")
      .select("id")
      .eq("team_id", payload.teamId)
      .eq("coach_id", payload.coachId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Ten trener jest już przypisany do tej drużyny." };
    }

    const { error } = await supabase.from("team_coaches").insert({
      club_id: clubId,
      team_id: payload.teamId,
      coach_id: payload.coachId,
      is_primary: payload.isPrimary,
      assigned_at: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath("/admin/druzyny");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeCoachFromTeamAction(teamId: string, coachId: string) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_coaches")
      .delete()
      .eq("team_id", teamId)
      .eq("coach_id", coachId);

    if (error) throw error;

    revalidatePath("/admin/druzyny");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Kartoteka zawodników z obsługą avatar_url
 */
export async function getAdminPlayersAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: players, error } = await supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        jersey_number,
        birth_year,
        birth_date,
        avatar_url,
        phone,
        email,
        parent_name,
        parent_phone,
        parent_email,
        preferred_survey_recipient,
        is_active,
        current_team_id,
        teams:current_team_id ( id, name )
      `)
      .eq("club_id", clubId)
      .order("last_name");

    if (error) throw error;
    return { success: true, players: players || [] };
  } catch (err: any) {
    return { success: false, error: err.message, players: [] };
  }
}

export async function createPlayerAction(payload: {
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  birthYear: number;
  birthDate?: string;
  avatarUrl?: string;
  currentTeamId: string | null;
  phone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}) {
  try {
    const { clubId } = await requireAdmin();
    const currentYear = new Date().getFullYear();
    const isJunior = (currentYear - payload.birthYear) < 18;

    if (isJunior) {
      if (!payload.parentName?.trim() || !payload.parentPhone?.trim() || !payload.parentEmail?.trim()) {
        return { 
          success: false, 
          error: "Dla juniora wymagane jest imię rodzica, numer alarmowy SOS oraz e-mail rodzica." 
        };
      }
    } else {
      if (!payload.phone?.trim() || !payload.email?.trim()) {
        return { 
          success: false, 
          error: "Dla seniora wymagany jest bezpośredni numer telefonu oraz adres e-mail zawodnika." 
        };
      }
    }

    const { data: player, error: playerErr } = await supabaseAdmin
      .from("players")
      .insert({
        club_id: clubId,
        current_team_id: payload.currentTeamId || null,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        jersey_number: payload.jerseyNumber,
        birth_year: payload.birthYear,
        birth_date: payload.birthDate || null,
        avatar_url: payload.avatarUrl?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim().toLowerCase() || null,
        parent_name: payload.parentName?.trim() || null,
        parent_phone: payload.parentPhone?.trim() || null,
        parent_email: payload.parentEmail?.trim().toLowerCase() || null,
        preferred_survey_recipient: isJunior ? "parent" : "player",
        is_active: true,
      })
      .select("id")
      .single();

    if (playerErr || !player) throw playerErr;

    if (payload.currentTeamId) {
      await supabaseAdmin
        .from("player_team_history")
        .insert({
          club_id: clubId,
          player_id: player.id,
          team_id: payload.currentTeamId,
          joined_at: new Date().toISOString(),
        });
    }

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin");
    return { success: true, playerId: player.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePlayerAction(payload: {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  birthYear: number;
  birthDate?: string;
  avatarUrl?: string;
  currentTeamId: string | null;
  phone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  isActive?: boolean;
}) {
  try {
    const { clubId } = await requireAdmin();
    const currentYear = new Date().getFullYear();
    const isJunior = (currentYear - payload.birthYear) < 18;

    const { error } = await supabaseAdmin
      .from("players")
      .update({
        current_team_id: payload.currentTeamId || null,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        jersey_number: payload.jerseyNumber,
        birth_year: payload.birthYear,
        birth_date: payload.birthDate || null,
        avatar_url: payload.avatarUrl?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim().toLowerCase() || null,
        parent_name: payload.parentName?.trim() || null,
        parent_phone: payload.parentPhone?.trim() || null,
        parent_email: payload.parentEmail?.trim().toLowerCase() || null,
        preferred_survey_recipient: isJunior ? "parent" : "player",
        is_active: payload.isActive !== undefined ? payload.isActive : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.playerId)
      .eq("club_id", clubId);

    if (error) throw error;

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface CsvPlayerRecord {
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  birthYear: number;
  phone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  avatarUrl?: string;
}

export async function bulkImportPlayersAction(
  teamId: string | null,
  records: CsvPlayerRecord[]
) {
  try {
    const { clubId } = await requireAdmin();

    if (!records || records.length === 0) {
      return { success: false, error: "Brak danych do zaimportowania." };
    }

    const currentYear = new Date().getFullYear();

    const insertPayload = records.map((p) => {
      const isJunior = (currentYear - p.birthYear) < 18;
      return {
        club_id: clubId,
        current_team_id: teamId || null,
        first_name: p.firstName.trim(),
        last_name: p.lastName.trim(),
        jersey_number: p.jerseyNumber,
        birth_year: p.birthYear,
        avatar_url: p.avatarUrl?.trim() || null,
        phone: p.phone?.trim() || null,
        email: p.email?.trim().toLowerCase() || null,
        parent_name: p.parentName?.trim() || null,
        parent_phone: p.parentPhone?.trim() || null,
        parent_email: p.parentEmail?.trim().toLowerCase() || null,
        preferred_survey_recipient: isJunior ? "parent" : "player",
        is_active: true,
      };
    });

    const { data: insertedPlayers, error } = await supabaseAdmin
      .from("players")
      .insert(insertPayload)
      .select("id");

    if (error) throw error;

    if (teamId && insertedPlayers && insertedPlayers.length > 0) {
      const historyRows = insertedPlayers.map((p) => ({
        club_id: clubId,
        player_id: p.id,
        team_id: teamId,
        joined_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from("player_team_history").insert(historyRows);
    }

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");
    return { success: true, count: records.length };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Sezony i identyfikacja klubu
 */
export async function getClubSeasonsAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: seasons, error } = await supabase
      .from("seasons")
      .select("id, name, start_date, end_date, is_current")
      .eq("club_id", clubId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return { success: true, seasons: seasons || [] };
  } catch (err: any) {
    return { success: false, error: err.message, seasons: [] };
  }
}

export async function createAndActivateSeasonAction(payload: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    await supabase.from("seasons").update({ is_current: false }).eq("club_id", clubId);

    const { data, error } = await supabase
      .from("seasons")
      .insert({
        club_id: clubId,
        name: payload.name.trim(),
        start_date: payload.startDate,
        end_date: payload.endDate,
        is_current: true,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/seasons");
    revalidatePath("/admin/sezony");
    return { success: true, seasonId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
/**
 * Szybka aktualizacja zdjęcia / awatara zawodnika
 */
export async function updatePlayerAvatarAction(playerId: string, avatarUrl: string | null) {
  try {
    const { clubId } = await requireAdmin();

    const { error } = await supabaseAdmin
      .from("players")
      .update({
        avatar_url: avatarUrl && avatarUrl.trim().length > 0 ? avatarUrl.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", playerId)
      .eq("club_id", clubId);

    if (error) throw error;

    revalidatePath("/admin/zawodnicy");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function setCurrentSeasonAction(seasonId: string) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    await supabase.from("seasons").update({ is_current: false }).eq("club_id", clubId);

    const { error } = await supabase
      .from("seasons")
      .update({ is_current: true })
      .eq("id", seasonId)
      .eq("club_id", clubId);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/seasons");
    revalidatePath("/admin/sezony");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}