import { supabaseAdmin } from "@/lib/supabase-admin";

export interface TrainingAccessTarget {
  club_id: string;
  team_id: string;
  lead_coach_id: string | null;
}

export async function canManageTraining(
  userId: string,
  training: TrainingAccessTarget
): Promise<boolean> {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("club_id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.is_active === false) return false;
  if (profile.role === "master_admin") return true;
  if (profile.club_id !== training.club_id) return false;
  if (profile.role === "club_admin" || profile.role === "coordinator") return true;
  if (training.lead_coach_id === userId) return true;
  if (training.lead_coach_id !== null) return false;

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("team_coaches")
    .select("id")
    .eq("team_id", training.team_id)
    .eq("coach_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  return Boolean(assignment);
}

export async function canAccessTraining(
  userId: string,
  training: TrainingAccessTarget
): Promise<boolean> {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("club_id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.is_active === false) return false;
  if (profile.role === "master_admin") return true;
  if (profile.club_id !== training.club_id) return false;
  if (profile.role === "club_admin" || profile.role === "coordinator") return true;
  if (training.lead_coach_id === userId) return true;

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("team_coaches")
    .select("id")
    .eq("team_id", training.team_id)
    .eq("coach_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  return Boolean(assignment);
}
