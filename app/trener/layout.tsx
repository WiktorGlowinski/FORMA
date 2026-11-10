export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getActiveStaff } from "@/lib/access";
import { CoachShell } from "@/components/coach/coach-shell";

export default async function TrenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const staff = await getActiveStaff();
  if (!staff) redirect("/login");

  return <CoachShell userId={staff.user.id}>{children}</CoachShell>;
}