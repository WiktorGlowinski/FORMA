export const instant = false;

import { connection } from "next/server";
import { getClubCoachesAction } from "@/app/actions/admin";
import { CoachesManager } from "@/components/admin/coaches-manager";

export const metadata = {
  title: "Sztab | KS FORMA Bydgoszcz",
};

export default async function AdminCoachesPage() {
  // Wymuszenie dynamicznego żądania po stronie serwera
  await connection();

  const coachesRes = await getClubCoachesAction();
  const coaches = coachesRes.success ? coachesRes.coaches : [];

  return <CoachesManager initialCoaches={coaches} />;
}