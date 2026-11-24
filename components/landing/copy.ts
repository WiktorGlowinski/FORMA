export type EvaluationScore = "-" | "0" | "+";
export type AbsenceReason = "unexcused" | "excused" | "sick" | "injury";

export type Mark =
  | { type: "score"; score: EvaluationScore }
  | { type: "absence"; reason: AbsenceReason };

export interface DemoPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  role: string;
}

export const NAV = [
  { href: "#skala", label: "Skala" },
  { href: "#przebieg", label: "Przebieg" },
  { href: "#role", label: "Dla kogo" },
] as const;

export const PAGE_LINKS = [
  { href: "/jak-dziala", label: "Jak działa?" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

export const FOOTER_LINKS = [
  { href: "/jak-dziala", label: "Jak działa?" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
  { href: "/regulamin", label: "Regulamin" },
  { href: "/rodo", label: "RODO" },
] as const;

export const CONTACT_EMAIL = "forma-kontakt@outlook.com";

export const ABSENCE_REASONS: { id: AbsenceReason; label: string }[] = [
  { id: "unexcused", label: "Nieusprawiedliwiona" },
  { id: "excused", label: "Usprawiedliwiona" },
  { id: "sick", label: "Choroba" },
  { id: "injury", label: "Kontuzja" },
];

export const SCORE_OPTIONS: {
  score: EvaluationScore;
  title: string;
  hint: string;
}[] = [
  { score: "-", title: "Słabiej", hint: "poniżej swojego poziomu" },
  { score: "0", title: "Typowo", hint: "na swoim poziomie" },
  { score: "+", title: "Powyżej", hint: "lepiej niż zwykle" },
];

/** Wymyślony skład. Żadnych prawdziwych zawodników. */
export const DEMO_PLAYERS: DemoPlayer[] = [
  { id: "lena", firstName: "Lena", lastName: "Wójcik", jerseyNumber: 7, role: "Skrzydłowa" },
  { id: "marek", firstName: "Marek", lastName: "Zieliński", jerseyNumber: 4, role: "Obrońca" },
  { id: "oliwia", firstName: "Oliwia", lastName: "Nowak", jerseyNumber: 11, role: "Napastniczka" },
  { id: "jan", firstName: "Jan", lastName: "Kaczmarek", jerseyNumber: 9, role: "Napastnik" },
  { id: "hanna", firstName: "Hanna", lastName: "Lis", jerseyNumber: 2, role: "Obrończyni" },
];

export function playerName(player: DemoPlayer) {
  return `${player.firstName} ${player.lastName}`;
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