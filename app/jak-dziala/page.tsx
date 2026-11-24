import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = {
  title: "Jak działa Forma",
  description: "Jak klub, trener, zawodnik i rodzic korzystają z oceny po treningu.",
};

export default function HowItWorksPage() {
  return (
    <PublicShell eyebrow="Dla odwiedzających" title="Jak działa Forma">
      <p className="text-base leading-7">
        Forma jest narzędziem klubowym. Po treningu trener zapisuje, czy zawodnik funkcjonował słabiej niż zwykle,
        typowo, czy powyżej siebie. Wynik zostaje przy tej osobie. Serwis nie układa rankingu drużyny i nie wystawia
        noty na tle rocznika.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">Co robi klub</h2>
      <p>
        Administrator klubu zakłada zespoły, wprowadza skład i zaprasza trenerów. Każdy klub widzi własne dane.
        Konto sztabu jest imienne. Trener ocenia zespoły, do których został przypisany. Koordynator sprawdza,
        czy oceny w jego obszarze w ogóle powstają.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">Co robi trener po jednostce</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Zamyka trening: data, godzina, zespół i trener prowadzący.</li>
        <li>Przechodzi skład po jednym nazwisku. Wybiera minus, zero, plus albo nieobecność.</li>
        <li>Nieobecność oznacza osobno: nieusprawiedliwiona, usprawiedliwiona, choroba albo kontuzja.</li>
        <li>Może wysłać ankietę. Bez ankiety trening też da się zamknąć.</li>
      </ol>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">Co dostaje zawodnik i rodzic</h2>
      <p>
        Zawodnik nie zakłada konta, żeby być ocenionym. Jeśli trener włączy ankietę, zawodnik albo rodzic dostaje
        link do dwóch pytań: zmęczenie i zadowolenie, w skali od 1 do 5. Brak odpowiedzi nie zamienia się w zero
        i nie obniża oceny. Link jest jednorazowym adresem do tej jednostki, a nie profilem w serwisie.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">Czego Forma nie robi</h2>
      <p>
        Nie stawia diagnozy medycznej, nie dobiera leczenia i nie zastępuje rozmowy trenera z zawodnikiem.
        Seria minusów albo wysokie zmęczenie jest sygnałem do sprawdzenia. Powód tego sygnału ustala klub.
        Podgląd oceny na stronie głównej jest demonstracją. Nie zapisuje wymyślonego składu na serwerze.
      </p>
      <p>
        Działającą skalę można przejść na stronie głównej. Zasady konta i danych opisują{" "}
        <Link href="/regulamin" className="text-foreground underline underline-offset-4">regulamin</Link>,{" "}
        <Link href="/polityka-prywatnosci" className="text-foreground underline underline-offset-4">polityka prywatności</Link>{" "}
        i{" "}
        <Link href="/rodo" className="text-foreground underline underline-offset-4">klauzula RODO</Link>.
      </p>
    </PublicShell>
  );
}