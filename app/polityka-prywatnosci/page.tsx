import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/landing/copy";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = {
  title: "Polityka prywatności — Forma",
  description: "Zasady przetwarzania danych w serwisie Forma.",
};

export default function PrivacyPage() {
  return (
    <PublicShell eyebrow="Dokument" title="Polityka prywatności">
      <p>Wersja z 23 listopada 2026 r.</p>
      <p className="rounded-md border-2 border-foreground/15 bg-card p-4 text-foreground">
        UZUPEŁNIJ przed publikacją: pełna nazwa podmiotu, adres siedziby, NIP oraz numer KRS albo wpisu w CEIDG.
        Do tego czasu w dokumencie występuje „Usługodawca”.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">1. Kto prowadzi serwis</h2>
      <p>
        Serwis Forma prowadzi Usługodawca: [UZUPEŁNIJ nazwę], [UZUPEŁNIJ adres], NIP [UZUPEŁNIJ],
        KRS albo CEIDG [UZUPEŁNIJ]. Kontakt:{" "}
        <a className="text-foreground underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        Inspektora ochrony danych nie powołano. Sprawy danych przyjmuje ten sam adres.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">2. Dwie role przy danych</h2>
      <p>
        Przy koncie sztabu, logach bezpieczeństwa i wiadomościach na skrzynkę kontaktową Usługodawca jest
        administratorem. Przy danych, które klub sam wpisuje do systemu, administratorem jest klub.
        Usługodawca przetwarza je wtedy jako podmiot przetwarzający, na udokumentowane polecenie klubu.
        Zasady tego podziału opisuje <Link className="text-foreground underline underline-offset-4" href="/rodo">klauzula RODO</Link>.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">3. Jakie dane powstają</h2>
      <p>Strona publiczna, demo oceny i zakładki informacyjne nie wymagają konta i nie zapisują składu z podglądu.</p>
      <p>
        Konto sztabu może obejmować imię i nazwisko, adres e-mail, telefon, rolę, identyfikator klubu, hasło
        przechowywane przez dostawcę logowania w postaci zabezpieczonej oraz informację, czy konto jest aktywne.
      </p>
      <p>
        Klub może wpisać dane zawodnika: imię, nazwisko, rocznik albo datę urodzenia, numer, zespół, kontakt,
        a także dane rodzica albo opiekuna, czyli imię, e-mail i telefon. Może też powstać ocena po treningu,
        powód nieobecności, notatka, wynik ankiety o zmęczeniu i zadowoleniu oraz token linku do ankiety.
      </p>
      <p>
        Powód „choroba” albo „kontuzja” oraz opis urazu są informacją o zdrowiu. To dane szczególnej kategorii.
        Klub wprowadza je tylko wtedy, gdy ma podstawę z art. 9 RODO, w szczególności wyraźną zgodę pełnoletniego
        zawodnika albo rodzica lub opiekuna osoby poniżej 16. roku życia. Forma nie jest podmiotem leczniczym
        i nie prowadzi diagnozy.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">4. Dzieci i rodzice</h2>
      <p>
        Serwis jest przeznaczony do prowadzenia szkółek i akademii, więc w składzie mogą być dzieci. Konto
        w panelu zakłada osoba upoważniona przez klub, co najmniej pełnoletnia. Dziecko nie musi zakładać konta,
        żeby klub prowadził jego historię treningową.
      </p>
      <p>
        W Polsce zgoda dziecka na usługi społeczeństwa informacyjnego, o której mowa w art. 8 RODO, dotyczy
        osoby, która ukończyła 16 lat. Poniżej tego wieku zgody udziela rodzic albo opiekun prawny. Prawa
        dziecka wobec danych wpisanych przez klub wykonuje wobec klubu rodzic albo opiekun. Usługodawca pomaga
        klubowi w realizacji takiego żądania, gdy dotyczy danych powierzonych w Formie.
      </p>
      <p>
        Dane rodzica służą kontaktowi w sprawie zawodnika i ewentualnej ankiecie. Klub podaje je tylko wtedy,
        gdy rodzic wie o tym kontakcie albo inna podstawa prawna klubu na to pozwala. Link ankiety nie tworzy
        profilu rodzica i nie służy do marketingu.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">5. Cele i podstawy</h2>
      <p>
        Konto i świadczenie usługi opierają się na art. 6 ust. 1 lit. b RODO. Bezpieczeństwo, logi i ustalenie
        roszczeń opierają się na art. 6 ust. 1 lit. f. Obowiązki rachunkowe i odpowiadanie na żądania organów
        opierają się na art. 6 ust. 1 lit. c. Dane klubu o zawodnikach klub przetwarza na własnej podstawie,
        a Usługodawca wyłącznie w zakresie powierzenia.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">6. Odbiorcy</h2>
      <p>
        Dane systemu utrzymuje dostawca bazy i logowania, obecnie Supabase, jako podmiot przetwarzający.
        Lokalizacja serwera wynika z konfiguracji projektu. Jeśli serwer jest poza Europejskim Obszarem
        Gospodarczym, przekazanie odbywa się na podstawie standardowych klauzul umownych albo innej przesłanki
        z rozdziału V RODO. Poczta na {CONTACT_EMAIL} trafia do skrzynki Microsoft Outlook.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">7. Czas przechowywania</h2>
      <p>
        Konto sztabu działa przez czas współpracy z klubem, a potem przez okres przedawnienia roszczeń.
        Dane wpisane przez klub Usługodawca usuwa albo zwraca na polecenie klubu, nie później niż po zakończeniu
        umowy, z wyjątkiem kopii wymaganych prawem. Wiadomość e-mail jest przechowywana przez czas potrzebny
        do odpowiedzi i ewentualnych roszczeń. Token ankiety wygasa w terminie ustawionym przy treningu.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">8. Ciasteczka</h2>
      <p>
        Panel sztabu używa ciasteczek sesji niezbędnych do logowania. Strona publiczna nie włącza ciasteczek
        reklamowych ani narzędzi śledzących. Ciasteczko sesji jest konieczne do utrzymania zalogowania
        i nie służy do profilowania marketingowego.
      </p>
      <h2 className="font-heading text-2xl tracking-tight text-foreground">9. Prawa osób</h2>
      <p>
        Przysługuje prawo dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia, sprzeciwu oraz skargi
        do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa. Przy danych zawodnika
        i rodzica pierwszy adresat żądania to klub, który te dane wprowadził. Szczegóły podaje{" "}
        <Link className="text-foreground underline underline-offset-4" href="/rodo">klauzula RODO</Link>.
      </p>
    </PublicShell>
  );
}