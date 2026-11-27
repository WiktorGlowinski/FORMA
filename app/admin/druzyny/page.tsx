export const instant = false;

import { connection } from "next/server";
import { getAdminTeamsAction, getClubCoachesAction } from "@/app/actions/admin";
import { TeamsManager } from "@/components/admin/teams-manager";

export const metadata = {
  title: "Drużyny & Roczniki | FORMA",
};

export default async function AdminTeamsPage() {
  await connection();

  const [teamsRes, coachesRes] = await Promise.all([
    getAdminTeamsAction(),
    getClubCoachesAction(),
  ]);

  if (!teamsRes.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {teamsRes.error || "Nie udało się załadować drużyn."}
      </div>
    );
  }

  if (!coachesRes.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {coachesRes.error || "Nie udało się załadować trenerów."}
      </div>
    );
  }

  const teams = teamsRes.teams
    ? teamsRes.teams.map((team) => ({
        ...team,
        team_coaches: team.team_coaches.map((assignment) => ({
          ...assignment,
          profiles: Array.isArray(assignment.profiles)
            ? assignment.profiles[0] ?? null
            : assignment.profiles,
        })),
      }))
    : [];
  const coaches = coachesRes.coaches.filter((coach) => coach.role === "coach");

  return (
    <TeamsManager 
      initialTeams={teams}
      availableCoaches={coaches}
    />
  );
}