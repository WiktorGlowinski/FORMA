"use client";

import { useState } from "react";
import { 
  Plus, 
  Users, 
  UserPlus, 
  Trash2, 
  Crown, 
  X, 
  Shield 
} from "lucide-react";
import { 
  createTeamAction, 
  assignCoachToTeamAction, 
  removeCoachFromTeamAction 
} from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export interface AvailableCoach {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

export interface CoachAssignment {
  coach_id: string;
  is_primary: boolean;
  profiles: {
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface TeamItem {
  id: string;
  name: string;
  age_group: string;
  is_active: boolean;
  created_at: string;
  team_coaches: CoachAssignment[];
}

const AGE_GROUPS = [
  "Senior",
  "U19 (Junior Starszy)",
  "U17 (Junior Młodszy)",
  "U15 (Trampkarz)",
  "U13 (Młodzik)",
  "U11 (Orlik)",
  "U9 (Żak)",
  "Skrzat",
];

export function TeamsManager({
  initialTeams,
  availableCoaches,
}: {
  initialTeams: TeamItem[];
  availableCoaches: AvailableCoach[];
}) {
  const [teams, setTeams] = useState<TeamItem[]>(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(
    teams.length > 0 ? teams[0] : null
  );

  // Modal tworzenia drużyny
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamAgeGroup, setNewTeamAgeGroup] = useState(AGE_GROUPS[3]);
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Modal przypisywania trenera
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState(availableCoaches[0]?.id || "");
  const [isPrimaryCoach, setIsPrimaryCoach] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setSubmittingTeam(true);
    const res = await createTeamAction({
      name: newTeamName.trim(),
      ageGroup: newTeamAgeGroup,
    });

    if (res.success && res.teamId) {
      const created: TeamItem = {
        id: res.teamId,
        name: newTeamName.trim(),
        age_group: newTeamAgeGroup,
        is_active: true,
        created_at: new Date().toISOString(),
        team_coaches: [],
      };

      setTeams((prev) => [...prev, created]);
      setSelectedTeam(created);
      setNewTeamName("");
      setIsCreateTeamOpen(false);
    } else {
      alert(res.error || "Nie udało się utworzyć drużyny.");
    }
    setSubmittingTeam(false);
  }

  async function handleAssignCoach(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam || !selectedCoachId) return;

    setSubmittingAssign(true);
    const res = await assignCoachToTeamAction({
      teamId: selectedTeam.id,
      coachId: selectedCoachId,
      isPrimary: isPrimaryCoach,
    });

    if (res.success) {
      const coachProfile = availableCoaches.find((c) => c.id === selectedCoachId);
      const newAssignment: CoachAssignment = {
        coach_id: selectedCoachId,
        is_primary: isPrimaryCoach,
        profiles: coachProfile
          ? {
              full_name: coachProfile.full_name || coachProfile.fullName || "Trener",
              email: coachProfile.email,
              phone: coachProfile.phone ?? null,
              avatar_url: coachProfile.avatar_url || coachProfile.avatarUrl || null,
            }
          : null,
      };

      setTeams((prev) =>
        prev.map((tm) => (tm.id === selectedTeam.id ? { ...tm, team_coaches: [...tm.team_coaches, newAssignment] } : tm))
      );

      setSelectedTeam((prev) =>
        prev ? { ...prev, team_coaches: [...prev.team_coaches, newAssignment] } : null
      );

      setIsAssignModalOpen(false);
      setIsPrimaryCoach(false);
    } else {
      alert(res.error || "Wystąpił błąd podczas przypisywania trenera.");
    }
    setSubmittingAssign(false);
  }

  async function handleRemoveCoach(coachId: string) {
    if (!selectedTeam) return;
    if (!confirm("Czy na pewno chcesz odpiąć tego trenera od zespołu?")) return;

    const res = await removeCoachFromTeamAction(selectedTeam.id, coachId);
    if (res.success) {
      setTeams((prev) =>
        prev.map((tm) =>
          tm.id === selectedTeam.id ? { ...tm, team_coaches: tm.team_coaches.filter((c) => c.coach_id !== coachId) } : tm
        )
      );

      setSelectedTeam((prev) =>
        prev ? { ...prev, team_coaches: prev.team_coaches.filter((c) => c.coach_id !== coachId) } : null
      );
    } else {
      alert(res.error || "Nie udało się usunąć trenera z drużyny.");
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b-2 border-foreground/15 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Struktura Sportowa Klubu
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
            Drużyny & Roczniki
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Zarządzaj zespołami akademii i obsadzaj stanowiska I Trenerów oraz asystentów.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateTeamOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading uppercase tracking-wider font-black text-primary-foreground transition active:scale-95 shadow-[3px_3px_0_0_var(--foreground)] shrink-0"
        >
          <Plus className="size-4 stroke-3" />
          <span>Utwórz drużynę</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lewa kolumna: Drużyny */}
        <div className="lg:col-span-5 space-y-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground block px-1">
            Zespoły w klubie ({teams.length})
          </span>

          <div className="space-y-2.5">
            {teams.map((tm) => {
              const isSelected = selectedTeam?.id === tm.id;
              const leadCoach = tm.team_coaches.find((c) => c.is_primary);

              return (
                <button
                  key={tm.id}
                  type="button"
                  onClick={() => setSelectedTeam(tm)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.99]",
                    isSelected
                      ? "border-foreground bg-card shadow-[3px_3px_0_0_var(--foreground)]"
                      : "border-foreground/15 bg-card/60 hover:border-foreground/30 hover:bg-card"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xl uppercase tracking-tight">{tm.name}</span>
                    <span className="rounded-md border border-foreground/20 bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground">
                      {tm.age_group}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-border/80 pt-2 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      {tm.team_coaches.length} {tm.team_coaches.length === 1 ? "trener" : "trenerów"}
                    </span>
                    {leadCoach ? (
                      <span className="truncate text-foreground font-semibold">
                        I Trener: {leadCoach.profiles?.full_name || "Brak"}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Brak I Trenera</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prawa kolumna: Szczegóły drużyny */}
        <div className="lg:col-span-7">
          {selectedTeam ? (
            <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-foreground/15 pb-4">
                <div>
                  <span className="rounded bg-primary/10 border border-primary/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                    {selectedTeam.age_group}
                  </span>
                  <h2 className="mt-1 font-heading text-3xl uppercase tracking-tight">
                    {selectedTeam.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoachId(availableCoaches[0]?.id || "");
                    setIsAssignModalOpen(true);
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-foreground/20 bg-background px-3.5 text-xs font-heading uppercase tracking-wider font-bold hover:bg-muted transition-all active:scale-95 shadow-[2px_2px_0_0_var(--foreground)] shrink-0"
                >
                  <UserPlus className="size-3.5 text-primary" />
                  <span>Przypisz trenera</span>
                </button>
              </div>

              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Sztab szkoleniowy zespołu ({selectedTeam.team_coaches.length})
                </span>

                {selectedTeam.team_coaches.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-foreground/20 p-6 text-center text-xs text-muted-foreground font-mono">
                    Do tej drużyny nie przypisano jeszcze żadnego trenera z kadr klubu.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedTeam.team_coaches.map((assignment) => (
                      <div
                        key={assignment.coach_id}
                        className="flex items-center justify-between gap-3 rounded-xl border-2 border-foreground/15 bg-background p-3.5 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                            assignment.is_primary ? "border-primary bg-primary/10 text-primary" : "border-foreground/20 bg-muted text-muted-foreground"
                          )}>
                            {assignment.is_primary ? <Crown className="size-4" /> : <Shield className="size-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-base uppercase truncate">
                                {assignment.profiles?.full_name || "Trener"}
                              </span>
                              {assignment.is_primary && (
                                <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-primary-foreground">
                                  I Trener
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-muted-foreground block truncate">
                              {assignment.profiles?.email} {assignment.profiles?.phone && `• ${assignment.profiles.phone}`}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCoach(assignment.coach_id)}
                          className="rounded-lg border border-destructive/30 p-2 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Odepnij trenera"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-foreground/20 bg-card p-12 text-center text-muted-foreground font-mono text-xs">
              Wybierz drużynę z listy.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Przypisywanie trenera */}
      {isAssignModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-widest block">
                  {selectedTeam.name}
                </span>
                <h3 className="font-heading text-2xl uppercase tracking-tight">
                  Przypisz trenera
                </h3>
              </div>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="rounded-full border p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAssignCoach} className="space-y-4">
              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                  Wybierz trenera z kadr klubu
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                >
                  {availableCoaches.map((c) => {
                    const displayName = c.full_name || c.fullName || "Trener";
                    return (
                      <option key={c.id} value={c.id}>
                        {displayName} ({c.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <label className="flex items-center gap-2.5 rounded-xl border border-foreground/15 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimaryCoach}
                  onChange={(e) => setIsPrimaryCoach(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <span className="font-mono text-xs font-bold uppercase">
                  Ustaw jako I Trenera
                </span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {submittingAssign ? "Przypisywanie..." : "Przypisz do kadry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tworzenie drużyny */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-heading text-2xl uppercase tracking-tight">Nowa Drużyna</h3>
              <button type="button" onClick={() => setIsCreateTeamOpen(false)} className="rounded-full border p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                  Nazwa drużyny
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Trampkarz U14 A"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                  Kategoria wiekowa
                </label>
                <select
                  value={newTeamAgeGroup}
                  onChange={(e) => setNewTeamAgeGroup(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                >
                  {AGE_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {submittingTeam ? "Tworzenie..." : "Zapisz drużynę"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}