export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { MasterAdminNavbar } from "@/components/master-admin/master-admin-navbar";

export default async function MasterAdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "master_admin") redirect("/admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MasterAdminNavbar name={profile.full_name || "Master Admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
