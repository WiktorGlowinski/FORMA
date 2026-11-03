export const instant = false;

import { connection } from "next/server";
import { getAdminPlayersAction, getAdminTeamsAction } from "@/app/actions/admin";
import { PlayersManager } from "@/components/admin/players-manager";

export default async function AdminPlayersPage() {
  await connection();

  const [playersRes, teamsRes] = await Promise.all([
    getAdminPlayersAction(),
    getAdminTeamsAction(),
  ]);

  if (!playersRes.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {playersRes.error || "Nie udało się pobrać kartoteki zawodników."}
      </div>
    );
  }

  const teams = (teamsRes.teams || []).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const players = (playersRes.players || []).map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    jersey_number: p.jersey_number ?? null,
    birth_year: p.birth_year,
    avatar_url: p.avatar_url ?? null, // <-- przekazanie zdjęcia z bazy
    parent_name: p.parent_name ?? null,
    parent_phone: p.parent_phone ?? null,
    is_active: Boolean(p.is_active),
    current_team_id: p.current_team_id ?? null,
    teams: Array.isArray(p.teams)
      ? (p.teams[0] ? { id: p.teams[0].id, name: p.teams[0].name } : null)
      : (p.teams ? { id: p.teams.id, name: p.teams.name } : null),
  }));

  return (
    <PlayersManager
      initialPlayers={players}
      teams={teams}
    />
  );
}