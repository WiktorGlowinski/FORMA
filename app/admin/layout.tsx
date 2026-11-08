export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PitchArt } from "@/components/landing/mark";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { BugReportWidget } from "@/components/bug-reports/bug-report-widget";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Weryfikacja ról zarządczych z bazy
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, clubs(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "club_admin" && profile.role !== "master_admin")) {
    redirect("/trener");
  }

  const clubObj = Array.isArray(profile.clubs) ? profile.clubs[0] : profile.clubs;
  const clubName = clubObj?.name || "Klub Partnerski";

  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-x-clip bg-background text-foreground">
      {/* LINIE BOISKA FORMY W TLE */}
      <PitchArt className="pointer-events-none fixed top-16 -right-[15%] w-[680px] text-foreground/10 select-none opacity-60 block" />
      <PitchArt className="pointer-events-none fixed bottom-0 -left-[20%] w-[600px] text-foreground/10 select-none opacity-40 hidden md:block rotate-180" />

      {/* RESPONSYWNY GÓRNY PASEK */}
      <AdminNavbar clubName={clubName} isMasterAdmin={profile.role === "master_admin"} />

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <AssistantWidget key={user.id} userId={user.id} />
      <BugReportWidget />
    </div>
  );
}