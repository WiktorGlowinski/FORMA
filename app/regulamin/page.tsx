import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/landing/copy";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = {
  title: "Regulamin — Forma",
  description: "Regulamin świadczenia usług serwisu Forma.",
};

export default function TermsPage() {
  return (
    <PublicShell eyebrow="Dokument" title="Regulamin świadczenia usług">
      <p>Wersja z 23 listopada 2026 r.</p>
      <p className="rounded-md border-2 border-foreground/15 bg-card p-4 text-foreground">
        UZUPEŁNIJ przed publikacją nazwę, adres, NIP i KRS albo CEIDG. Regulamin porządkuje odpowiedzialność
        cywilną. Nie wyłącza odpowiedzialności karnej za czyn zabroniony.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 1. Postanowienia ogólne</h2>
      <p>
        Regulamin określa zasady korzystania z serwisu Forma, dostępnego pod adresem wskazanym przez
        Usługodawcę. Usługodawcą jest [UZUPEŁNIJ nazwę], [UZUPEŁNIJ adres], NIP [UZUPEŁNIJ], KRS albo CEIDG
        [UZUPEŁNIJ], e-mail {CONTACT_EMAIL}.
      </p>
      <p>
        Regulamin jest regulaminem świadczenia usług drogą elektroniczną w rozumieniu ustawy z 18 lipca 2002 r.
        o świadczeniu usług drogą elektroniczną. Do usług stosuje się prawo polskie. Praw konsumenta,
        których nie można wyłączyć, Regulamin nie uchyla.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 2. Definicje</h2>
      <p>
        Klub to organizacja sportowa, która korzysta z panelu. Użytkownik to osoba ze kontem sztabu: trener,
        koordynator, administrator klubu albo master admin. Zawodnik to osoba wpisana do składu, także dziecko.
        Rodzic oznacza rodzica albo opiekuna prawnego. Konto oznacza imienny dostęp do panelu. Ankieta oznacza
        dobrowolny link po treningu, bez zakladania konta.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 3. Na czym polega usługa</h2>
      <p>
        Usługa polega na udostępnieniu narzędzia do zapisu oceny po treningu w skali minus, zero i plus
        względem własnego poziomu zawodnika, do oznaczania nieobecności, do opcjonalnej ankiety oraz do
        podglądu historii w klubie. Serwis nie jest poradą treningową, medyczną ani prawną. Ocena jest
        decyzją trenera. Wynik na stronie nie jest orzeczeniem o stanie zdrowia ani o przydatności do gry.
      </p>
      <p>
        Podgląd na stronie głównej jest demonstracją. Nie tworzy konta i nie zapisuje wprowadzonego składu
        jako danych klubu.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 4. Konto i kto może go używać</h2>
      <p>
        Konto zakłada klub albo osoba przez niego upoważniona. Użytkownik konta ma ukończone 18 lat.
        Jeden login przypada jednej osobie. Hasła nie wolno przekazywać. Klub odpowiada za to, komu nadał rolę
        i które zespoły tej osobie przypisał.
      </p>
      <p>
        Usługodawca może wyłączyć konto, które służy do działania sprzecznego z prawem albo z Regulaminem,
        po informacji na adres e-mail konta, a bez uprzedzenia, gdy zwłoka grozi danym innych osób albo
        bezpieczeństwu serwisu.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 5. Dane zawodników, rodziców i dzieci</h2>
      <p>
        Klub jest administratorem danych zawodników i rodziców, które sam wprowadza. Przed wpisaniem danych
        klub upewnia się, że ma podstawę prawną. Dla dziecka poniżej 16. roku życia podstawą kontaktu
        i ankiety jest działanie rodzica albo inna podstawa, którą klub potrafi wykazać. Klub informuje
        rodzica, że historia treningowa jest prowadzona w Formie.
      </p>
      <p>
        Usługodawca nie pozyskuje dzieci do własnych celów, nie profiluje ich pod reklamę i nie sprzedaje
        danych. Dziecko nie musi mieć konta. Link ankiety nie jest kontem.
      </p>
      <p>
        Choroba, kontuzja i opis urazu są danymi o zdrowiu. Klub wpisuje je tylko przy podstawie z art. 9 RODO.
        Wpis takiego powodu oznacza, że klub tę podstawę ma. Forma nie diagnozuje i nie leczy. Notatka o urazie
        jest informacją organizacyjną dla sztabu, a nie dokumentacją medyczną.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 6. Obowiązki Klubu i Użytkownika</h2>
      <p>Klub i Użytkownik:</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>podają prawdziwe dane konta i nie podszywają się pod inną osobę,</li>
        <li>wpisują dane zawodników i rodziców tylko w zakresie potrzebnym do oceny i kontaktu,</li>
        <li>nie umieszczają w notatkach treści karalnych, zniesławiających ani danych osób z innych klubów bez podstawy,</li>
        <li>chronią dostęp do konta i zgłaszają Usługodawcy utratę hasła,</li>
        <li>mają umocowanie klubu do nadawania ocen i wysyłki ankiet.</li>
      </ol>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 7. Zakazane użycie</h2>
      <p>
        Zabrania się obchodzenia logowania, pobierania danych innego klubu, skanowania serwisu, wprowadzania
        złośliwego kodu, używania Formy do przestępstwa oraz wystawiania na podstawie skali decyzji,
        która miałaby charakter kary dyscyplinarnej albo orzeczenia medycznego. Naruszenie tego paragrafu
        uprawnia Usługodawcę do zablokowania dostępu.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 8. Powierzenie przetwarzania</h2>
      <p>
        Z chwilą wprowadzenia do Formy danych, których administratorem jest Klub, Klub powierza Usługodawcy
        ich przetwarzanie na art. 28 RODO, wyłącznie w celu utrzymania usługi. Usługodawca przetwarza je
        na udokumentowane polecenie Klubu, którym jest korzystanie z funkcji serwisu. Zapewnia, że osoby
        upoważnione zachowują poufność, stosuje środki z § 10 i po zakończeniu umowy usuwa albo zwraca dane,
        według wyboru Klubu, o ile prawo nie nakazuje ich dalej przechowywać.
      </p>
      <p>
        Dalszym podmiotem przetwarzającym jest dostawca bazy i logowania użyty do utrzymania Formy.
        Klub, korzystając z serwisu, przyjmuje ten dalszy podpowierzony zakres. Aktualną informację
        o odbiorcach podaje <Link className="text-foreground underline underline-offset-4" href="/polityka-prywatnosci">polityka prywatności</Link>.
      </p>
      <p>
        Usługodawca zawiadamia Klub bez zbędnej zwłoki o naruszeniu ochrony danych powierzonych, gdy naruszenie
        dotyczy tego Klubu, i przekazuje informacje potrzebne Klubowi do obowiązków z art. 33 i 34 RODO.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 9. Własność intelektualna</h2>
      <p>
        Oprogramowanie, układ strony, nazwa Forma i teksty serwisu należą do Usługodawcy albo jego licencjodawców.
        Klub otrzymuje niewyłączne prawo korzystania z nich przez czas trwania usługi. Dane i treści wpisane
        przez Klub pozostają przy Klubie. Klub udziela Usługodawcy licencji wyłącznie na ich przechowywanie
        i wyświetlanie w ramach usługi.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 10. Dostępność i bezpieczeństwo</h2>
      <p>
        Usługodawca utrzymuje serwis z należyta starannością. Usługa może być chwilowo niedostępna z powodu
        prac, awarii dostawcy albo siły wyższej. Usługodawca nie gwarantuje nieprzerwanego dostępu.
        Klub eksportuje dane, których utrata zakłóciłaby jego pracę, w tempie zgodnym z własną oceną ryzyka.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 11. Odpowiedzialność</h2>
      <p>
        Usługodawca odpowiada za szkodę wyrządzoną Klubowi umyślnym działaniem albo za szkodę na osobie
        w zakresie, w jakim prawa polskiego nie można ograniczyć. Za pozostałą szkodę związaną z usługą
        odpowiedzialność Usługodawcy wobec jednego Klubu jest ograniczona do opłat faktycznie zapłaconych
        przez ten Klub w ciągu 12 miesięcy przed zdarzeniem. Przy usłudze nieodpłatnej odpowiedzialność
        za zwykły brak staranności jest ograniczona do 500 zł, z wyjątkiem szkody na osobie i winy umyślnej.
      </p>
      <p>
        Usługodawca nie odpowiada za decyzje trenerskie, skutki oceny, treść wpisaną przez Klub, brak podstawy
        prawnej po stronie Klubu ani za to, że rodzic albo zawodnik nie otworzy ankiety. Klub zwolni
        Usługodawcę z roszczeń osób trzecich wynikłych z danych albo treści wprowadzonych przez Klub
        bez podstawy prawnej, w granicach prawomocnego rozstrzygnięcia albo ugody zaakceptowanej przez Klub.
      </p>
      <p>
        Żadne postanowienie nie wyłącza odpowiedzialności karnej, odpowiedzialności za szkodę wyrządzoną
        umyślnie ani praw, których ustawa nie pozwala wyłączyć. W szczególności nie wyłącza art. 107 ustawy
        z 10 maja 2018 r. o ochronie danych osobowych ani przepisów Kodeksu karnego o danych i systemie
        informatycznym.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 12. Reklamacje</h2>
      <p>
        Reklamację usługi składa się na {CONTACT_EMAIL}. Opis zawiera klub, konto i czego dotyczy żądanie.
        Usługodawca odpowiada w ciągu 14 dni. Konsument może dodatkowo skorzystać z pomocy miejskiego
        lub powiatowego rzecznika konsumentów albo z platformy ODR Komisji Europejskiej.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 13. Rozwiązanie</h2>
      <p>
        Klub może przestać korzystać z usługi w każdym czasie, pisząc na adres kontaktowy. Usługodawca może
        zakończyć usługę z 30-dniowym wypowiedzeniem, a ze skutkiem natychmiastowym przy istotnym naruszeniu
        § 6 albo § 7. Po zakończeniu Klub może w rozsądnym terminie odebrać swoje dane, zanim zostaną usunięte.
      </p>

      <h2 className="font-heading text-2xl tracking-tight text-foreground">§ 14. Zmiany i prawo</h2>
      <p>
        Usługodawca może zmienić Regulamin z ważnej przyczyny: zmiana prawa, funkcji serwisu albo dostawcy
        infrastruktury. O zmianie informuje na stronie i, gdy ma kontakt do Klubu, na adres e-mail, co najmniej
        14 dni wcześniej. Dalsze korzystanie po tej dacie oznacza przyjęcie nowej wersji. Klub, który nie
        przyjmuje zmiany, może zakończyć korzystanie przed datą wejścia w życie.
      </p>
      <p>
        Prawem właściwym jest prawo polskie. Spory z Klubem będącym przedsiębiorcą rozstrzyga sąd właściwy
        dla siedziby Usługodawcy. W sporze z konsumentem właściwość sądu wynika z przepisów, których nie można
        zmienić umową. Dokumenty powiązane:{" "}
        <Link className="text-foreground underline underline-offset-4" href="/polityka-prywatnosci">polityka prywatności</Link>{" "}
        i <Link className="text-foreground underline underline-offset-4" href="/rodo">RODO</Link>.
      </p>
    </PublicShell>
  );
}