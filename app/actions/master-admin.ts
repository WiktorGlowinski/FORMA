"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getErrorMessage } from "@/lib/error-message";

async function requireMasterAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Brak aktywnej sesji użytkownika.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile || profile.is_active === false || profile.role !== "master_admin") {
    throw new Error("Ta operacja wymaga uprawnień master admina.");
  }
  return user;
}

export async function createClubWithAdminAction(payload: {
  clubName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  try {
    const masterAdmin = await requireMasterAdmin();
    const clubName = payload.clubName.trim();
    const slug = payload.slug.trim().toLowerCase();
    const adminName = payload.adminName.trim();
    const adminEmail = payload.adminEmail.trim().toLowerCase();

    if (!clubName || !adminName || !adminEmail || !slug) {
      return { success: false, error: "Uzupełnij wszystkie wymagane pola." };
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { success: false, error: "Slug może zawierać małe litery, cyfry i myślniki." };
    }
    if (payload.adminPassword.length < 6) {
      return { success: false, error: "Hasło startowe musi mieć co najmniej 6 znaków." };
    }

    const { data: club, error: clubError } = await supabaseAdmin
      .from("clubs")
      .insert({ name: clubName, slug, is_active: true })
      .select("id, name, slug")
      .single();
    if (clubError || !club) {
      return { success: false, error: `Nie udało się utworzyć klubu: ${clubError?.message || "brak danych"}` };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: payload.adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        must_change_password: true,
      },
    });
    if (authError || !authData.user) {
      await supabaseAdmin.from("clubs").delete().eq("id", club.id);
      return { success: false, error: `Nie udało się utworzyć konta admina: ${authError?.message || "brak danych"}` };
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      club_id: club.id,
      email: adminEmail,
      full_name: adminName,
      role: "club_admin",
      is_active: true,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("clubs").delete().eq("id", club.id);
      return { success: false, error: `Nie udało się utworzyć profilu admina: ${profileError.message}` };
    }

    await supabaseAdmin.from("audit_logs").insert({
      club_id: club.id,
      user_id: masterAdmin.id,
      action: "club_created",
      table_name: "clubs",
      record_id: club.id,
      old_data: null,
      new_data: { club_id: club.id, name: clubName, slug, admin_email: adminEmail },
      created_at: new Date().toISOString(),
    });

    revalidatePath("/master-admin");
    return { success: true, club };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, "Nie udało się utworzyć klubu.") };
  }
}

export async function getMasterAdminDataAction() {
  try {
    await requireMasterAdmin();
    const supabase = await createClient();
    const [clubsResult, logsResult] = await Promise.all([
      supabase.from("clubs").select("id, name, slug, is_active, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("audit_logs").select(`
        id, club_id, user_id, action, table_name, record_id, old_data, new_data, created_at
      `).order("created_at", { ascending: false }).limit(300),
    ]);
    if (clubsResult.error) throw clubsResult.error;
    if (logsResult.error) throw logsResult.error;

    const clubNames = new Map((clubsResult.data || []).map((club) => [club.id, club.name]));

    return {
      success: true,
      clubs: clubsResult.data || [],
      logs: (logsResult.data || []).map((log) => ({
          id: log.id,
          clubId: log.club_id,
          clubName: clubNames.get(log.club_id) || "Bez klubu",
          action: log.action,
          entityType: log.table_name,
          entityId: log.record_id,
          oldData: log.old_data,
          newData: log.new_data,
          createdAt: log.created_at,
          authorName: log.user_id || "System",
          authorEmail: null,
        })),
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, "Nie udało się pobrać danych master admina."), clubs: [], logs: [] };
  }
}
