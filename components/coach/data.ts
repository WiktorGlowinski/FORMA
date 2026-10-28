export type EvaluationScore = "-" | "0" | "+";
export type AbsenceReason = "unexcused" | "excused" | "sick" | "injury";
export type TrainingStatus = "scheduled" | "completed" | "cancelled";

export type Mark =
  | { type: "score"; score: EvaluationScore }
  | { type: "absence"; reason: AbsenceReason };

export interface SquadPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  role: string;
}

export interface TrainingSession {
  id: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  topic?: string;
  status: TrainingStatus;
  players: SquadPlayer[];
}

export const ABSENCE_REASONS: { id: AbsenceReason; label: string }[] = [
  { id: "unexcused", label: "Nieusprawiedliwiona" },
  { id: "excused", label: "Usprawiedliwiona" },
  { id: "sick", label: "Choroba" },
  { id: "injury", label: "Kontuzja" },
];

export const SCORE_OPTIONS: { score: EvaluationScore; title: string }[] = [
  { score: "-", title: "Słabiej" },
  { score: "0", title: "Typowo" },
  { score: "+", title: "Powyżej" },
];

const U14: SquadPlayer[] = [
  { id: "lena", firstName: "Lena", lastName: "Wójcik", jerseyNumber: 7, role: "Skrzydłowa" },
  { id: "marek", firstName: "Marek", lastName: "Zieliński", jerseyNumber: 4, role: "Obrońca" },
  { id: "oliwia", firstName: "Oliwia", lastName: "Nowak", jerseyNumber: 11, role: "Napastniczka" },
  { id: "jan", firstName: "Jan", lastName: "Kaczmarek", jerseyNumber: 9, role: "Napastnik" },
  { id: "hanna", firstName: "Hanna", lastName: "Lis", jerseyNumber: 2, role: "Obrończyni" },
  { id: "igor", firstName: "Igor", lastName: "Adamczyk", jerseyNumber: 6, role: "Pomocnik" },
  { id: "zosia", firstName: "Zosia", lastName: "Król", jerseyNumber: 1, role: "Bramkarka" },
  { id: "tymon", firstName: "Tymon", lastName: "Wróbel", jerseyNumber: 8, role: "Pomocnik" },
];

export const TRAININGS: TrainingSession[] = [
  {
    id: "u14-2026-10-27",
    teamName: "U14",
    date: "2026-10-27",
    startTime: "17:30",
    endTime: "18:45",
    place: "Boisko główne",
    topic: "Gra do przodu po odbiorze",
    status: "completed",
    players: U14,
  },
  {
    id: "u14-2026-10-22",
    teamName: "U14",
    date: "2026-10-22",
    startTime: "17:30",
    endTime: "18:45",
    place: "Boisko główne",
    topic: "Pressing po stracie",
    status: "completed",
    players: U14,
  },
  {
    id: "u14-2026-10-29",
    teamName: "U14",
    date: "2026-10-29",
    startTime: "17:30",
    endTime: "18:45",
    place: "Hala",
    topic: "Gra w przewadze",
    status: "scheduled",
    players: U14,
  },
  {
    id: "u14-2026-10-24",
    teamName: "U14",
    date: "2026-10-24",
    startTime: "16:00",
    endTime: "17:15",
    place: "Boisko boczne",
    status: "cancelled",
    players: U14,
  },
];

export const STARTER_MARKS: Record<string, Record<string, Mark>> = {
  "u14-2026-10-22": {
    lena: { type: "score", score: "0" },
    marek: { type: "absence", reason: "sick" },
    oliwia: { type: "score", score: "+" },
  },
};

export function getTraining(id: string) {
  return TRAININGS.find((training) => training.id === id);
}

export function playerName(player: SquadPlayer) {
  return `${player.firstName} ${player.lastName}`;
}

export function formatTrainingDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

export function markLabel(mark: Mark) {
  if (mark.type === "score") {
    if (mark.score === "-") return "Słabiej niż zwykle";
    if (mark.score === "0") return "Typowy poziom";
    return "Powyżej siebie";
  }
  const reason = ABSENCE_REASONS.find((item) => item.id === mark.reason);
  return `Nieobecny · ${reason?.label ?? "bez powodu"}`;
}

export function ratedCount(players: SquadPlayer[], marks: Record<string, Mark>) {
  return players.filter((player) => marks[player.id]).length;
}