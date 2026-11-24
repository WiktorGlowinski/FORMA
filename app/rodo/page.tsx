import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/landing/copy";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = {
  title: "RODO — Forma",
  description: "Obowiązek informacyjny i podział ról przy danych osobowych w Formie.",
};

export default function RodoPage() {
  return (
    <PublicShell eyebrow="RODO" title="Informacja o danych osobowych">
      <p>Wersja z 23 listopada 2026 r. Spełnia obowiązek z art. 13 i 14 RODO.</p>
      <p className="rounded-md border-2 border-foreground/15 bg-card p-4 text-foreground">
        UZUPEŁNIJ nazwę, adres, NIP i KRS albo CEIDG administratora kont sztabu. Przy danych składu
        administratorem pozostaje klub.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">1. Administrator</h2>
      <p>
        Administratorem danych konta sztabu, logów bezpieczeństwa oraz korespondencji na {CONTACT_EMAIL} jest
        Usługodawca: [UZUPEŁNIJ nazwę], [UZUPEŁNIJ adres], NIP [UZUPEŁNIJ], KRS albo CEIDG [UZUPEŁNIJ].
      </p>
      <p>
        Administratorem danych zawodnika, rodzica, oceny, nieobecności, notatki i ankiety jest klub, który
        te dane wprowadził. Usługodawca jest wtedy podmiotem przetwarzającym z art. 28 RODO. Żądanie dotyczące
        składu kieruje się do klubu. Usługodawca przekaże klubowi żądanie, które otrzyma, i wykona jego polecenie.
      </p>
      <p>
        Kontakt do obu ról po stronie serwisu:{" "}
        <a className="text-foreground underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        Inspektora ochrony danych nie wyznaczono.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">2. Cele i podstawy prawne</h2>
      <p>Usługodawca jako administrator:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>zakłada i utrzymuje konto sztabu, art. 6 ust. 1 lit. b RODO,</li>
        <li>zapewnia bezpieczeństwo i rozlicza roszczenia, art. 6 ust. 1 lit. f,</li>
        <li>wypełnia obowiązki prawne, w tym rachunkowe i odpowiedzi organom, art. 6 ust. 1 lit. c,</li>
        <li>odpowiada na wiadomość wysłaną na skrzynkę kontaktową, art. 6 ust. 1 lit. f albo lit. b, gdy dotyczy umowy.</li>
      </ul>
      <p>
        Klub jako administrator sam wskazuje swoją podstawę dla danych składu. Może nią być umowa albo działania
        przed umową z zawodnikiem pełnoletnim lub z rodzicem, prawnie uzasadniony interes klubu w prowadzeniu
        szkolenia, obowiązek prawny związku sportowego albo zgoda. Dla danych o zdrowiu klub potrzebuje
        przesłanki z art. 9 RODO. Sam wybór „kontuzja” w Formie nie tworzy takiej przesłanki.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">3. Dzieci</h2>
      <p>
        Dane dziecka pochodzą od klubu, nie od dziecka odwiedzającego stronę. Dziecko poniżej 16. roku życia
        nie wyraża samodzielnie zgody, o której mowa w art. 8 RODO. Zgody udziela rodzic albo opiekun prawny,
        jeżeli klub w ogóle opiera przetwarzanie na zgodzie.
      </p>
      <p>
        Rodzic może żądać dostępu, sprostowania i usunięcia danych dziecka oraz sprzeciwić się przetwarzaniu
        opartemu na prawnie uzasadnionym interesie. Wniosek składa do klubu. Usługodawca nie wykorzystuje
        danych dzieci do reklamy, nie sprzedaje ich i nie podejmuje wobec dziecka zautomatyzowanej decyzji
        wywołującej skutek prawny.
      </p>
      <p>
        Informacje o rodzicu, czyli imię, e-mail i telefon, służą kontaktowi w sprawie dziecka i wysyłce
        ankiety. Ankieta jest dobrowolna. Niewysłanie odpowiedzi nie wpływa na ocenę i nie jest traktowane
        jako zero.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">4. Kategorie danych</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>sztab: tożsamość, e-mail, telefon, rola, klub, status konta, identyfikatory sesji,</li>
        <li>zawodnik: imię, nazwisko, rocznik lub data urodzenia, numer, zespół, historia przynależności,</li>
        <li>trening: data, obecność, ocena minus / zero / plus, powód nieobecności, notatka trenera,</li>
        <li>zdrowie: wyłącznie gdy klub wpisze chorobę, kontuzję albo opis urazu,</li>
        <li>rodzic: imię, e-mail, telefon i fakt otrzymania linku,</li>
        <li>ankieta: zmęczenie, zadowolenie, ewentualna uwaga, czas wypełnienia,</li>
        <li>techniczne: adres IP i znacznik czasu w logach bezpieczeństwa, przez okres potrzebny do wykrycia nadużycia.</li>
      </ul>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">5. Odbiorcy i przekazanie</h2>
      <p>
        Odbiorcą jest dostawca infrastruktury bazy i uwierzytelnienia utrzymujący Formę oraz operator skrzynki
        {` ${CONTACT_EMAIL}`}. Dane klubu nie są przekazywane innym klubom. Dostęp wewnątrz klubu wynika z roli:
        trener widzi przypisane zespoły, koordynator i administrator zakres nadany w klubie.
      </p>
      <p>
        Jeżeli serwer dostawcy znajduje się poza Europejskim Obszarem Gospodarczym, przekazanie opiera się
        na standardowych klauzulach umownych z art. 46 RODO albo na innej zgodnej z prawem podstawie.
        Klub może zapytać o aktualną lokalizację na adres kontaktowy.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">6. Okres przechowywania</h2>
      <p>
        Konto istnieje do wyłączenia przez klub albo Usługodawcę, a potem przez okres przedawnienia roszczeń,
        zwykle do 6 lat, gdy dotyczą działalności gospodarczej. Dane powierzone przez klub są usuwane albo
        zwracane po zakończeniu współpracy, chyba że przepis każe je zachować. Logi bezpieczeństwa są
        przechowywane przez okres potrzebny do ustalenia incydentu, nie dłużej niż 12 miesięcy, o ile incydent
        nie wymaga dłuższego zachowania jako dowód. Wiadomość e-mail jest przechowywana przez czas odpowiedzi
        i przedawnienia roszczeń z tej korespondencji.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">7. Prawa</h2>
      <p>Osobie, której dane dotyczą, przysługuje:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>dostęp do danych i kopia,</li>
        <li>sprostowanie,</li>
        <li>usunięcie, gdy nie ma już podstawy albo zgodę cofnięto i nie ma innej podstawy,</li>
        <li>ograniczenie przetwarzania,</li>
        <li>przeniesienie danych przetwarzanych na umowie albo zgodzie, w sposób zautomatyzowany,</li>
        <li>sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie,</li>
        <li>cofnięcie zgody w dowolnym momencie, bez wpływu na zgodność przetwarzania sprzed cofnięcia,</li>
        <li>skarga do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.</li>
      </ul>
      <p>
        Aby żądanie trafiło do właściwego administratora, w wiadomości podaj klub, imię i nazwisko oraz czy
        sprawa dotyczy konta sztabu, czy danych zawodnika lub rodzica. Usługodawca odpowie w ciągu miesiąca.
        Ten termin może się przedłużyć o kolejne dwa miesiące przy sprawie skomplikowanej, o czym osoba
        zostanie poinformowana.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">8. Decyzje automatyczne</h2>
      <p>
        Forma nie wydaje decyzji opartej wyłącznie na zautomatyzowanym przetwarzaniu, która wywoływałaby
        skutek prawny wobec zawodnika albo rodzica. Minus, zero i plus zapisuje trener. Podsumowanie historii
        jest zestawieniem tych wyborów, a nie werdyktem systemu.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">9. Obowiązek albo dobrowolność</h2>
      <p>
        Podanie e-maila i hasła jest potrzebne do konta sztabu. Bez tego panel się nie otworzy. Dane zawodnika
        klub podaje w zakresie, w jakim chce prowadzić jego historię. Ankieta rodzica i zawodnika jest
        dobrowolna. Odmowa ankiety nie blokuje udziału w treningu i nie zmienia oceny.
      </p>

      <p>
        Szerszy opis środków i ciasteczek jest w{" "}
        <Link className="text-foreground underline underline-offset-4" href="/polityka-prywatnosci">polityce prywatności</Link>.
        Zasady umowy są w{" "}
        <Link className="text-foreground underline underline-offset-4" href="/regulamin">regulaminie</Link>.
      </p>
    </PublicShell>
  );
}