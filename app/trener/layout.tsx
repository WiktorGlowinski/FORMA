export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CoachShell } from "@/components/coach/coach-shell";

export default async function TrenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CoachShell userId={user.id}>{children}</CoachShell>;
}