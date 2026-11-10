import { createClient } from "@/lib/supabase-server";

export const STAFF_ROLES = ["master_admin", "club_admin", "coordinator", "coach"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export async function getActiveStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, club_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false || !isStaffRole(profile.role)) return null;
  return { user, profile };
}