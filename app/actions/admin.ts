"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

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
    !profile.club_id ||
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

    const [clubRes, seasonRes, teamsRes, activeTeamsRes, playersRes, activePlayersRes, coachesRes] = await Promise.all([
      supabase.from("clubs").select("name, logo_url").eq("id", clubId).single(),
      supabase.from("seasons").select("id, name").eq("club_id", clubId).eq("is_current", true).maybeSingle(),
      supabase.from("teams").select("id", { count: "exact", head: true }).eq("club_id", clubId),
      supabase.from("teams").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("is_active", true),
      supabase.from("players").select("id", { count: "exact", head: true }).eq("club_id", clubId),
      supabase.from("players").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("is_active", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .in("role", ["coach", "coordinator"]),
    ]);

    return {
      success: true,
      club: clubRes.data,
      currentSeason: seasonRes.data?.name || "Brak aktywnego sezonu",
      metrics: {
        totalTeams: teamsRes.count || 0,
        activeTeams: activeTeamsRes.count || 0,
        totalPlayers: playersRes.count || 0,
        activePlayers: activePlayersRes.count || 0,
        totalCoaches: coachesRes.count || 0,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Nie udalo sie wykonac operacji."),
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji."), teams: [] };
  }
}

export async function getClubFieldsAction() {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const { data: fields, error } = await supabase
      .from("club_fields")
      .select("id, name, is_active")
      .eq("club_id", clubId)
      .order("name");

    if (error) throw error;
    return { success: true, fields: fields || [] };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Nie udało się pobrać boisk."),
      fields: [],
    };
  }
}

export async function createClubFieldAction(name: string) {
  try {
    const { clubId } = await requireAdmin();
    if (typeof name !== "string") {
      return { success: false, error: "Podaj prawidłową nazwę boiska." };
    }

    const normalizedName = name.trim();

    if (!normalizedName || normalizedName.length > 100) {
      return { success: false, error: "Nazwa boiska musi mieć od 1 do 100 znaków." };
    }

    const supabase = await createClient();
    const { data: field, error } = await supabase
      .from("club_fields")
      .insert({ club_id: clubId, name: normalizedName })
      .select("id, name, is_active")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Boisko o tej nazwie już istnieje." };
      }
      throw error;
    }

    revalidatePath("/admin/boiska");
    revalidatePath("/trener");
    return { success: true, field };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Nie udało się dodać boiska."),
    };
  }
}

export async function updateClubFieldAction(
  fieldId: string,
  payload: { name: string; isActive: boolean }
) {
  try {
    const { clubId } = await requireAdmin();
    if (!fieldId) {
      return { success: false, error: "Nie wskazano boiska do edycji." };
    }

    const normalizedName = payload.name.trim();
    if (!normalizedName || normalizedName.length > 100) {
      return { success: false, error: "Nazwa boiska musi mieć od 1 do 100 znaków." };
    }

    const { data: field, error: fieldError } = await supabaseAdmin
      .from("club_fields")
      .select("id")
      .eq("id", fieldId)
      .eq("club_id", clubId)
      .maybeSingle();
    if (fieldError) throw fieldError;
    if (!field) {
      return { success: false, error: "Boisko nie należy do tego klubu." };
    }

    const { error } = await supabaseAdmin
      .from("club_fields")
      .update({
        name: normalizedName,
        is_active: payload.isActive,
      })
      .eq("id", fieldId)
      .eq("club_id", clubId);
    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Boisko o tej nazwie już istnieje." };
      }
      throw error;
    }

    revalidatePath("/admin/boiska");
    revalidatePath("/trener");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Nie udało się zaktualizować boiska."),
    };
  }
}

export async function deleteClubFieldAction(fieldId: string) {
  try {
    const { clubId } = await requireAdmin();
    if (!fieldId) {
      return { success: false, error: "Nie wskazano boiska do usunięcia." };
    }

    const { data: field, error: fieldError } = await supabaseAdmin
      .from("club_fields")
      .select("id")
      .eq("id", fieldId)
      .eq("club_id", clubId)
      .maybeSingle();
    if (fieldError) throw fieldError;
    if (!field) {
      return { success: false, error: "Boisko nie należy do tego klubu." };
    }

    const { error } = await supabaseAdmin
      .from("club_fields")
      .update({ is_active: false })
      .eq("id", fieldId)
      .eq("club_id", clubId);
    if (error) throw error;

    revalidatePath("/admin/boiska");
    revalidatePath("/trener");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Nie udało się usunąć boiska."),
    };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
        role,
        created_at,
        team_coaches (
          is_primary,
          teams:team_id ( id, name, age_group )
        )
      `)
      .eq("club_id", clubId)
      .in("role", ["coach", "coordinator"])
      .order("full_name");

    if (error) throw error;

    const formattedCoaches = (coaches || []).map((c: {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      avatar_url: string | null;
      is_active: boolean;
      role: "coach" | "coordinator";
      created_at: string;
      team_coaches: Array<{
        is_primary: boolean;
        teams: { id: string; name: string; age_group: string | null }[] | null;
      }> | null;
    }) => ({
      id: c.id,
      fullName: c.full_name,
      email: c.email,
      phone: c.phone,
      avatarUrl: c.avatar_url,
      isActive: c.is_active,
      role: c.role,
      createdAt: c.created_at,
      assignedTeams: (c.team_coaches || []).flatMap((tc) => {
        const t = Array.isArray(tc.teams) ? tc.teams[0] : tc.teams;
        return t ? [{
          id: t?.id,
          name: t?.name,
          ageGroup: t?.age_group,
          isPrimary: tc.is_primary,
        }] : [];
      }),
    }));

    return { success: true, coaches: formattedCoaches };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji."), coaches: [] };
  }
}

/**
 * Aktualizuje dane członka sztabu w profiles oraz email w auth.users
 */
export async function updateCoachAction(payload: {
  coachId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
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

    const authUpdatePayload: Parameters<typeof supabaseAdmin.auth.admin.updateUserById>[1] = {
      email,
      user_metadata: { full_name: fullName, avatar_url: avatarUrl },
    };

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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
  }
}

/**
 * Trwale usuwa konto trenera (z modułu Auth oraz kaskadowo z bazy)
 */
export async function deleteCoachAction(coachId: string) {
  try {
    const { user, clubId } = await requireAdmin();

    if (!coachId || coachId === user.id) {
      return { success: false, error: "Nie można usunąć własnego konta administratora." };
    }

    const { data: coach } = await supabaseAdmin
      .from("profiles")
      .select("id, club_id, role")
      .eq("id", coachId)
      .eq("club_id", clubId)
      .in("role", ["coach", "coordinator"])
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Błąd podczas zapisu herbu.") };
  }
}

/**
 * Bezpieczne tworzenie trenera w auth.users, profiles i opcjonalnie team_coaches
 */
export async function createCoachAccountAction(payload: {
  fullName: string;
  email: string;
  password: string;
  role?: "coach" | "coordinator";
  phone?: string;
  avatarUrl?: string;
}) {
  try {
    const { clubId } = await requireAdmin();

    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    const phone = payload.phone?.trim() || null;
    const avatarUrl = payload.avatarUrl?.trim() || null;
    const requestedRole = payload.role ?? "coach";
    if (requestedRole !== "coach" && requestedRole !== "coordinator") {
      return { success: false, error: "Nieprawidłowa rola konta." };
    }
    const role = requestedRole;

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
        must_change_password: true,
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
        role,
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
        role,
      } 
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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

    const { data: coach, error: coachError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", payload.coachId)
      .eq("club_id", clubId)
      .eq("role", "coach")
      .maybeSingle();

    if (coachError) throw coachError;
    if (!coach) {
      return { success: false, error: "Do drużyny można przypisać wyłącznie trenera z tego klubu." };
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("id", payload.teamId)
      .eq("club_id", clubId)
      .eq("is_active", true)
      .maybeSingle();
    if (teamError) throw teamError;
    if (!team) {
      return { success: false, error: "Wybrana drużyna nie należy do tego klubu." };
    }

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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
  }
}

export async function removeCoachFromTeamAction(teamId: string, coachId: string) {
  try {
    const { clubId } = await requireAdmin();
    const supabase = await createClient();

    const [{ data: team, error: teamError }, { data: coach, error: coachError }] =
      await Promise.all([
        supabase
          .from("teams")
          .select("id")
          .eq("id", teamId)
          .eq("club_id", clubId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id")
          .eq("id", coachId)
          .eq("club_id", clubId)
          .maybeSingle(),
      ]);
    if (teamError) throw teamError;
    if (coachError) throw coachError;
    if (!team || !coach) {
      return { success: false, error: "Trener lub drużyna nie należy do tego klubu." };
    }

    const { error } = await supabase
      .from("team_coaches")
      .delete()
      .eq("team_id", teamId)
      .eq("coach_id", coachId);

    if (error) throw error;

    revalidatePath("/admin/druzyny");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji."), players: [] };
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

    if (payload.currentTeamId) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("id", payload.currentTeamId)
        .eq("club_id", clubId)
        .eq("is_active", true)
        .maybeSingle();
      if (teamError) throw teamError;
      if (!team) return { success: false, error: "Wybrana drużyna nie należy do tego klubu." };
    }

    const currentYear = new Date().getFullYear();
    const isJunior = (currentYear - payload.birthYear) < 18;
    if (
      payload.jerseyNumber !== null &&
      (!Number.isInteger(payload.jerseyNumber) || payload.jerseyNumber < 1 || payload.jerseyNumber > 99)
    ) {
      return { success: false, error: "Numer na koszulce musi być liczbą od 1 do 99." };
    }
    if (payload.birthDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(payload.birthDate);
      if (!match) return { success: false, error: "Niepoprawna data urodzenia." };
      const [, year, month, day] = match;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (
        date.getUTCFullYear() !== Number(year) ||
        date.getUTCMonth() !== Number(month) - 1 ||
        date.getUTCDate() !== Number(day)
      ) {
        return { success: false, error: "Niepoprawna data urodzenia." };
      }
    }

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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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

    if (payload.currentTeamId) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("id", payload.currentTeamId)
        .eq("club_id", clubId)
        .eq("is_active", true)
        .maybeSingle();
      if (teamError) throw teamError;
      if (!team) return { success: false, error: "Wybrana drużyna nie należy do tego klubu." };
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("id", payload.playerId)
      .eq("club_id", clubId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return { success: false, error: "Zawodnik nie należy do tego klubu." };

    const currentYear = new Date().getFullYear();
    const isJunior = (currentYear - payload.birthYear) < 18;
    if (
      payload.jerseyNumber !== null &&
      (!Number.isInteger(payload.jerseyNumber) || payload.jerseyNumber < 1 || payload.jerseyNumber > 99)
    ) {
      return { success: false, error: "Numer na koszulce musi być liczbą od 1 do 99." };
    }
    if (payload.birthDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(payload.birthDate);
      if (!match) return { success: false, error: "Niepoprawna data urodzenia." };
      const [, year, month, day] = match;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (
        date.getUTCFullYear() !== Number(year) ||
        date.getUTCMonth() !== Number(month) - 1 ||
        date.getUTCDate() !== Number(day)
      ) {
        return { success: false, error: "Niepoprawna data urodzenia." };
      }
    }

    if (isJunior) {
      if (!payload.parentName?.trim() || !payload.parentPhone?.trim() || !payload.parentEmail?.trim()) {
        return {
          success: false,
          error: "Dla juniora wymagane jest imię rodzica, numer alarmowy SOS oraz e-mail rodzica.",
        };
      }
    } else if (!payload.phone?.trim() || !payload.email?.trim()) {
      return {
        success: false,
        error: "Dla seniora wymagany jest bezpośredni numer telefonu oraz adres e-mail zawodnika.",
      };
    }

    const contactUpdate = isJunior
      ? {
          phone: null,
          email: null,
          parent_name: payload.parentName?.trim() || null,
          parent_phone: payload.parentPhone?.trim() || null,
          parent_email: payload.parentEmail?.trim().toLowerCase() || null,
        }
      : {
          phone: payload.phone?.trim() || null,
          email: payload.email?.trim().toLowerCase() || null,
          parent_name: null,
          parent_phone: null,
          parent_email: null,
        };

    const updateData: Record<string, unknown> = {
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      jersey_number: payload.jerseyNumber,
      birth_year: payload.birthYear,
      birth_date: payload.birthDate || null,
      avatar_url: payload.avatarUrl?.trim() || null,
      current_team_id: payload.currentTeamId || null,
      preferred_survey_recipient: isJunior ? "parent" : "player",
      updated_at: new Date().toISOString(),
      ...contactUpdate,
    };
    if (payload.isActive !== undefined) {
      updateData.is_active = payload.isActive;
    }

    const { error } = await supabaseAdmin
      .from("players")
      .update(updateData)
      .eq("id", payload.playerId)
      .eq("club_id", clubId);

    if (error) throw error;

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udało się zaktualizować zawodnika.") };
  }
}

export async function deletePlayerAction(playerId: string) {
  try {
    const { clubId } = await requireAdmin();

    const { data: player, error: playerError } = await supabaseAdmin
      .from("players")
      .select("id")
      .eq("id", playerId)
      .eq("club_id", clubId)
      .maybeSingle();
    if (playerError) throw playerError;
    if (!player) return { success: false, error: "Zawodnik nie należy do tego klubu." };

    const { error } = await supabaseAdmin
      .from("players")
      .update({
        is_active: false,
        current_team_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", playerId)
      .eq("club_id", clubId);
    if (error) throw error;

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udało się usunąć zawodnika.") };
  }
}

export async function transferPlayerToTeamAction(playerId: string, teamId: string) {
  try {
    const { clubId } = await requireAdmin();
    if (!playerId || !teamId) {
      return { success: false, error: "Wybierz zawodnika i drużynę docelową." };
    }

    const [{ data: player }, { data: team }] = await Promise.all([
      supabaseAdmin
        .from("players")
        .select("id")
        .eq("id", playerId)
        .eq("club_id", clubId)
        .maybeSingle(),
      supabaseAdmin
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("club_id", clubId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    if (!player) return { success: false, error: "Zawodnik nie należy do tego klubu." };
    if (!team) return { success: false, error: "Drużyna nie należy do tego klubu." };

    const { error } = await supabaseAdmin.rpc("transfer_player_to_team", {
      p_club_id: clubId,
      p_player_id: playerId,
      p_team_id: teamId,
    });

    if (error) throw error;

    revalidatePath("/admin/zawodnicy");
    revalidatePath("/admin/druzyny");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udało się przenieść zawodnika.") };
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

    if (!Array.isArray(records) || records.length === 0) {
      return { success: false, error: "Brak danych do zaimportowania." };
    }
    if (records.length > 500) {
      return { success: false, error: "Jednorazowo można zaimportować maksymalnie 500 zawodników." };
    }

    if (teamId) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("club_id", clubId)
        .eq("is_active", true)
        .maybeSingle();
      if (teamError) throw teamError;
      if (!team) return { success: false, error: "Wybrana drużyna nie należy do tego klubu." };
    }

    const currentYear = new Date().getFullYear();

    for (const p of records) {
      const firstName = typeof p.firstName === "string" ? p.firstName.trim() : "";
      const lastName = typeof p.lastName === "string" ? p.lastName.trim() : "";
      if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
        return { success: false, error: "Każdy zawodnik musi mieć poprawne imię i nazwisko." };
      }
      if (!Number.isInteger(p.birthYear) || p.birthYear < 1940 || p.birthYear > currentYear) {
        return { success: false, error: `Nieprawidłowy rocznik dla zawodnika ${firstName} ${lastName}.` };
      }
      if (
        p.jerseyNumber !== null &&
        p.jerseyNumber !== undefined &&
        (!Number.isInteger(p.jerseyNumber) || p.jerseyNumber < 1 || p.jerseyNumber > 99)
      ) {
        return { success: false, error: `Nieprawidłowy numer na koszulce dla zawodnika ${firstName} ${lastName}.` };
      }
    }

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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji."), seasons: [] };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
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
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Nie udalo sie wykonac operacji.") };
  }
}