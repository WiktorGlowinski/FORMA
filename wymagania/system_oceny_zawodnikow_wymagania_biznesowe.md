# System oceny zawodników po treningu
## Wymagania biznesowe — wersja club-centered / player-development

**Wersja:** 0.1  
**Status:** Draft  
**Główny cel:** ułatwienie klubom systematycznej, szybkiej i porównywalnej w czasie oceny zawodników po treningach  
**Główne źródła danych:** ocena trenera, frekwencja, samoocena zawodnika / odpowiedź rodzica

---

## 1. Cel projektu

Celem projektu jest stworzenie aplikacji dla klubów sportowych, która pozwala regularnie zbierać proste informacje o funkcjonowaniu zawodników w procesie treningowym, bez obciążania trenerów rozbudowaną dokumentacją.

System powinien umożliwiać trenerowi po zakończeniu treningu szybkie przejście przez listę zawodników i ocenienie każdego z nich za pomocą prostej skali:

- `-` — zawodnik funkcjonował słabiej niż zwykle;
- `0` — zawodnik funkcjonował na swoim typowym poziomie;
- `+` — zawodnik funkcjonował powyżej swojego typowego poziomu.

Ocena nie ma być oceną absolutnego poziomu sportowego zawodnika. Ma opisywać jego funkcjonowanie **w odniesieniu do jego własnego, aktualnego poziomu**.

Jeżeli zawodnik nie uczestniczył w treningu, trener zamiast oceny wskazuje nieobecność oraz jej powód.

Dane są następnie agregowane w dashboardach analitycznych dla trenerów, koordynatorów i osób zarządzających klubem.

System powinien również opcjonalnie umożliwiać zebranie po treningu prostej samooceny zawodnika, dotyczącej co najmniej:

- poziomu zmęczenia;
- poziomu zadowolenia z treningu.

---

## 2. Główna zasada produktu

Platforma jest **player-development centered**.

Centralnym obiektem analizy jest zawodnik obserwowany w czasie.

Oznacza to, że:

- pojedyncza ocena nie powinna być interpretowana w oderwaniu od historii zawodnika;
- najważniejsza jest zmiana i powtarzalność zachowań w czasie;
- ocena `- / 0 / +` odnosi się do indywidualnego poziomu zawodnika, a nie do porównania z innymi zawodnikami;
- system powinien wspierać rozmowę o rozwoju zawodnika, a nie tworzyć automatyczny ranking „najlepszych” i „najsłabszych”;
- trener musi być w stanie wykonać ocenę całego zespołu bardzo szybko;
- dane muszą być możliwe do analizowania w kontekście treningu, okresu, zespołu, trenera i zawodnika.

---

## 3. Główne zastosowania biznesowe

Platforma ma wspierać przede wszystkim:

1. szybkie ocenianie zawodników po każdym treningu;
2. monitorowanie zmian poziomu funkcjonowania zawodnika w czasie;
3. identyfikowanie zawodników, u których przez dłuższy okres pojawia się więcej ocen `-`;
4. identyfikowanie zawodników regularnie funkcjonujących powyżej swojego typowego poziomu;
5. analizowanie regularności treningowej i absencji;
6. rozróżnianie powodów nieobecności;
7. obserwowanie zmęczenia zawodników;
8. obserwowanie poziomu zadowolenia zawodników z treningów;
9. porównywanie oceny trenera z samooceną zawodnika;
10. wspieranie rozmów trener–zawodnik;
11. wspieranie pracy koordynatora z trenerami;
12. tworzenie długoterminowej historii procesu treningowego zawodnika;
13. identyfikowanie sygnałów wymagających dodatkowej obserwacji lub rozmowy;
14. analizowanie jakości i regularności zbierania danych przez trenerów.

---

## 4. Główni użytkownicy

W systemie występują co najmniej cztery role wewnętrzne:

- **Trener**
- **Koordynator**
- **Administrator klubowy**
- **Master administrator**

Dodatkowo w procesie może występować:

- **Zawodnik**
- **Rodzic / opiekun**

Zawodnik i rodzic nie muszą w pierwszym MVP posiadać pełnego konta użytkownika systemu. Mogą być odbiorcami dedykowanej ankiety po treningu.

---

# 5. Główne obiekty biznesowe

Platforma powinna operować co najmniej na następujących obiektach:

- klub,
- zespół / drużyna,
- zawodnik,
- trener,
- użytkownik,
- trening,
- obecność zawodnika na treningu,
- ocena zawodnika przez trenera,
- powód nieobecności,
- ankieta potreningowa,
- samoocena zawodnika,
- odpowiedź rodzica / opiekuna,
- okres analityczny,
- sezon,
- historia przypisania zawodnika do zespołu,
- historia przypisania trenera do zespołu.

Centralnym obiektem analitycznym pozostaje **zawodnik w kontekście kolejnych treningów**.

---

# 6. Klub i struktura organizacyjna

### BR-001 — Klub jako przestrzeń danych

Każdy klub posiada własną przestrzeń danych.

Dane jednego klubu nie mogą być widoczne dla użytkowników innego klubu, z wyjątkiem master administratora.

### BR-002 — Zespoły

Klub może posiadać wiele zespołów.

Przykładowo:

- U10,
- U12,
- U14,
- U17,
- senior.

### BR-003 — Zawodnik w zespole

Zawodnik musi być możliwy do przypisania do konkretnego zespołu.

### BR-004 — Historia przynależności

Zmiana zespołu nie może powodować utraty wcześniejszych ocen zawodnika.

System powinien zachowywać historię przynależności zawodnika do zespołów.

### BR-005 — Trenerzy zespołu

Do jednego zespołu może być przypisany jeden lub wielu trenerów.

### BR-006 — Dostęp wynikający z przypisania

Zakres danych dostępnych trenerowi powinien wynikać przede wszystkim z zespołów, do których jest przypisany.

---

# 7. Trening

### BR-007 — Dodawanie treningu

Trener powinien mieć możliwość dodania treningu w panelu.

Minimalne dane treningu:

- data;
- godzina rozpoczęcia;
- godzina zakończenia lub czas trwania;
- zespół;
- trener prowadzący.

### BR-008 — Opcjonalne dane treningu

Trening może dodatkowo posiadać:

- temat;
- główny cel;
- miejsce;
- typ treningu;
- notatkę organizacyjną.

Pola te nie powinny być obowiązkowe dla wykonania szybkiej oceny.

### BR-009 — Status treningu

Trening powinien posiadać status, np.:

- zaplanowany;
- zrealizowany;
- odwołany.

### BR-010 — Uruchomienie procesu oceny

Po zakończeniu treningu trener powinien otrzymać informację, że może wykonać ocenę zawodników.

Uruchomienie może nastąpić:

- automatycznie po planowanej godzinie zakończenia;
- po ręcznym oznaczeniu treningu jako zrealizowany.

### BR-011 — Brak oceny dla odwołanego treningu

Trening oznaczony jako odwołany nie powinien generować obowiązku oceny zawodników.

### BR-012 — Lista zawodników treningu

Domyślnie lista zawodników do oceny wynika z aktualnego składu zespołu.

System powinien pozwalać uwzględnić zawodnika czasowo trenującego z innym zespołem, jeżeli klub korzysta z takiego scenariusza.

---

# 8. Ocena zawodnika przez trenera

### BR-013 — Szybka ocena

Po treningu trener powinien móc uruchomić tryb szybkiej oceny zawodników.

### BR-014 — Jeden zawodnik na ekranie

Podstawowy interfejs oceny powinien prezentować jednego zawodnika na ekranie.

Widok powinien zawierać co najmniej:

- imię i nazwisko;
- zdjęcie, jeżeli jest dostępne;
- podstawową identyfikację zespołu;
- przyciski `-`, `0`, `+`;
- opcję oznaczenia nieobecności.

### BR-015 — Znaczenie skali

Skala ma następujące znaczenie:

- `-` — słabiej niż typowy poziom zawodnika;
- `0` — na typowym poziomie zawodnika;
- `+` — powyżej typowego poziomu zawodnika.

### BR-016 — Ocena względna

Ocena nie może być prezentowana jako bezpośrednia miara poziomu sportowego.

Przykład:

> `+` zawodnika U12 nie oznacza, że jest on sportowo lepszy od zawodnika U12 ocenionego na `0`.

Ocena opisuje relację występu treningowego zawodnika do jego własnego aktualnego poziomu.

### BR-017 — Jeden wybór główny

Dla jednego zawodnika i jednego treningu trener może wskazać tylko jeden główny status:

- `-`;
- `0`;
- `+`;
- nieobecny.

### BR-018 — Automatyczne przejście

Po wybraniu oceny system powinien automatycznie przejść do kolejnego zawodnika.

### BR-019 — Możliwość cofnięcia

Trener powinien móc wrócić do poprzedniego zawodnika i zmienić ocenę przed zakończeniem procesu.

### BR-020 — Postęp oceny

System powinien pokazywać postęp, np.:

> 8 / 18 zawodników ocenionych

### BR-021 — Zapis roboczy

Oceny powinny być zapisywane w trakcie procesu, tak aby przypadkowe zamknięcie aplikacji nie powodowało utraty wykonanej pracy.

### BR-022 — Zakończenie oceny

Trener powinien otrzymać czytelne potwierdzenie, że wszyscy zawodnicy zostali ocenieni lub oznaczeni jako nieobecni.

### BR-023 — Niepełna ocena

System powinien rozróżniać:

- trening w pełni oceniony;
- trening częściowo oceniony;
- trening bez oceny.

### BR-024 — Korekta po zapisaniu

Trener powinien móc skorygować własną ocenę po zakończeniu formularza, zgodnie z polityką klubu.

System powinien zachowywać informację o istotnej zmianie, jeżeli wymagany jest audyt.

---

# 9. Frekwencja i nieobecności

### BR-025 — Oznaczenie nieobecności

Jeżeli zawodnik nie uczestniczył w treningu, trener oznacza go jako nieobecnego.

### BR-026 — Powód nieobecności

Dla nieobecnego zawodnika należy wskazać jeden z powodów:

- nieusprawiedliwiona;
- usprawiedliwiona;
- choroba;
- kontuzja.

### BR-027 — Brak oceny sportowej przy nieobecności

Zawodnik oznaczony jako nieobecny nie otrzymuje dla tego treningu oceny `- / 0 / +`.

### BR-028 — Nieobecność nie jest oceną ujemną

Nieobecność nie może być automatycznie interpretowana jako ocena `-`.

### BR-029 — Historia absencji

System powinien umożliwiać analizowanie absencji zawodnika w czasie.

### BR-030 — Analiza powodów absencji

Dashboardy powinny pozwalać rozróżniać liczbę nieobecności według powodów.

### BR-031 — Kontuzja jako osobna kategoria analityczna

Nieobecności spowodowane kontuzją powinny być możliwe do analizowania osobno od innych nieobecności.

### BR-032 — Frekwencja

System powinien umożliwiać wyliczenie frekwencji zawodnika dla wskazanego okresu.

---

# 10. Ankieta potreningowa zawodnika / rodzica

### BR-033 — Decyzja trenera

Dla każdego treningu trener powinien móc zdecydować, czy chce wysłać ankietę potreningową.

### BR-034 — Odbiorca ankiety

Ankieta może zostać skierowana do:

- zawodnika;
- rodzica / opiekuna.

Sposób wyboru odbiorcy powinien zależeć od konfiguracji zawodnika i zasad klubu.

### BR-035 — Brak obowiązku ankiety

Ankieta potreningowa jest opcjonalna.

Brak wysłania ankiety nie powinien blokować zamknięcia treningu ani oceny trenerskiej.

### BR-036 — Minimalny zakres ankiety

Ankieta powinna zawierać co najmniej:

1. poziom zmęczenia;
2. poziom zadowolenia z treningu.

### BR-037 — Skala ankiety

Skala zmęczenia i zadowolenia powinna być prosta i możliwa do szybkiego wypełnienia na telefonie.

Dokładny zakres skali pozostaje do ustalenia.

Przykładowy wariant MVP:

- skala 1–5.

### BR-038 — Jedna odpowiedź

Dla jednego zawodnika i jednego treningu system powinien przechowywać jedną aktualną odpowiedź ankietową.

### BR-039 — Brak odpowiedzi

System musi rozróżniać:

- ankieta niewysłana;
- ankieta wysłana;
- ankieta wypełniona;
- ankieta niewypełniona.

### BR-040 — Bez wymuszania konta w MVP

W MVP ankieta może być dostępna przez bezpieczny, indywidualny link, bez konieczności tworzenia pełnego konta zawodnika lub rodzica.

### BR-041 — Powiązanie odpowiedzi

Każda odpowiedź musi być jednoznacznie powiązana z:

- zawodnikiem;
- treningiem;
- zespołem;
- datą odpowiedzi.

### BR-042 — Brak odpowiedzi a wartość zerowa

Brak odpowiedzi nie może być interpretowany jako `0` ani jako najniższy poziom na skali.

---

# 11. Zmęczenie

### BR-043 — Rejestrowanie zmęczenia

System powinien przechowywać deklarowany poziom zmęczenia zawodnika po treningu.

### BR-044 — Analiza w czasie

Poziom zmęczenia powinien być możliwy do analizowania w czasie.

### BR-045 — Serie podwyższonego zmęczenia

Dashboard powinien pozwalać zauważyć sytuacje, w których zawodnik przez kilka kolejnych treningów deklaruje wysoki poziom zmęczenia.

System nie powinien automatycznie diagnozować przyczyny takiej sytuacji.

---

# 12. Zadowolenie z treningu

### BR-046 — Rejestrowanie zadowolenia

System powinien przechowywać deklarowany poziom zadowolenia zawodnika z treningu.

### BR-047 — Analiza w czasie

Poziom zadowolenia powinien być możliwy do analizowania w czasie.

### BR-048 — Zmiana trendu

Dashboard powinien ułatwiać zauważenie wyraźnego spadku lub wzrostu deklarowanego zadowolenia zawodnika.

### BR-049 — Brak automatycznej interpretacji psychologicznej

Wartość z ankiety nie może być automatycznie prezentowana jako diagnoza psychologiczna lub ocena dobrostanu zawodnika.

---

# 13. Dashboard zawodnika

### BR-050 — Profil zawodnika

Każdy zawodnik powinien posiadać profil analityczny.

### BR-051 — Podstawowy zakres profilu

Profil powinien zawierać co najmniej:

- dane podstawowe zawodnika;
- aktualny zespół;
- historię treningów;
- historię ocen `- / 0 / +`;
- frekwencję;
- historię nieobecności;
- powody nieobecności;
- poziom zmęczenia;
- poziom zadowolenia.

### BR-052 — Oś czasu

Dane zawodnika powinny być możliwe do prezentowania na osi czasu.

### BR-053 — Rozkład ocen

System powinien prezentować rozkład ocen w wybranym okresie, np.:

- 20% `-`;
- 55% `0`;
- 25% `+`.

### BR-054 — Liczebność próby

Każdy procent lub agregat powinien być możliwy do odczytania razem z liczbą treningów, z których wynika.

### BR-055 — Okres analizy

Użytkownik powinien móc analizować dane zawodnika dla wybranego okresu, np.:

- ostatnie 7 dni;
- ostatnie 30 dni;
- ostatnie 90 dni;
- bieżący mikrocykl;
- miesiąc;
- sezon;
- własny zakres dat.

### BR-056 — Trend oceny

Dashboard powinien ułatwiać zauważanie zmian w rozkładzie ocen zawodnika w czasie.

### BR-057 — Ocena trenera i samoocena

Jeżeli dla treningu istnieją oba typy danych, profil powinien umożliwiać zestawienie:

- oceny trenera;
- zmęczenia deklarowanego przez zawodnika;
- zadowolenia deklarowanego przez zawodnika.

### BR-058 — Brak fałszywej precyzji

System nie powinien automatycznie przeliczać `- / 0 / +` na „ocenę 1–10” lub inny wskaźnik sugerujący większą precyzję, jeśli nie ma do tego zdefiniowanej metodologii.

---

# 14. Dashboard zespołu

### BR-059 — Widok zespołu

Trener powinien móc zobaczyć zbiorczy dashboard własnego zespołu.

### BR-060 — Zakres dashboardu zespołu

Dashboard powinien prezentować co najmniej:

- liczbę przeprowadzonych treningów;
- kompletność ocen;
- frekwencję;
- liczbę i strukturę absencji;
- rozkład `- / 0 / +`;
- zawodników z powtarzającymi się ocenami `-`;
- zawodników z powtarzającymi się ocenami `+`;
- poziom zmęczenia;
- poziom zadowolenia;
- poziom odpowiedzi na ankiety.

### BR-061 — Lista wymagająca uwagi

System może prezentować listę zawodników wymagających dodatkowej obserwacji na podstawie prostych reguł biznesowych.

Przykładowo:

- kilka kolejnych ocen `-`;
- nagły wzrost absencji;
- seria wysokiego zmęczenia;
- seria niskiego zadowolenia.

Taka lista powinna być prezentowana jako **sygnał do sprawdzenia**, a nie automatyczny wniosek o zawodniku.

### BR-062 — Brak automatycznego rankingu

Dashboard zespołu nie powinien domyślnie tworzyć rankingu zawodników od najlepszego do najgorszego na podstawie ocen `- / 0 / +`.

---

# 15. Dashboard koordynatora

### BR-063 — Dostęp do wielu zespołów

Koordynator powinien mieć możliwość analizowania wszystkich zespołów znajdujących się w jego zakresie odpowiedzialności.

### BR-064 — Porównanie procesów

Koordynator powinien móc analizować m.in.:

- kompletność ocen w zespołach;
- częstotliwość wykonywania ocen przez trenerów;
- frekwencję zawodników;
- strukturę absencji;
- trendy ocen;
- poziom odpowiedzi na ankiety.

### BR-065 — Zejście do szczegółu

Z poziomu dashboardu zbiorczego koordynator powinien móc przejść:

> klub / obszar → zespół → zawodnik → trening → pojedyncza ocena

### BR-066 — Monitoring procesu, nie tylko wyniku

Dashboard koordynatora powinien pokazywać również jakość realizacji samego procesu zbierania danych.

Przykład:

> Zespół U14 posiada oceny dla 94% zrealizowanych treningów w ostatnich 30 dniach.

---

# 16. Role i uprawnienia

## 16.1. Trener

### BR-067 — Zakres trenera

Trener powinien mieć dostęp przede wszystkim do zespołów, do których jest przypisany.

Powinien móc:

- dodawać treningi;
- edytować własne treningi;
- oznaczać trening jako zrealizowany;
- oceniać zawodników;
- rejestrować nieobecności;
- wskazywać powody nieobecności;
- wysyłać ankietę potreningową;
- przeglądać dashboard swojego zespołu;
- przeglądać profile swoich zawodników.

---

## 16.2. Koordynator

### BR-068 — Zakres koordynatora

Koordynator powinien móc:

- przeglądać zespoły w swoim obszarze;
- przeglądać treningi;
- przeglądać oceny zawodników;
- przeglądać dashboardy;
- analizować kompletność pracy trenerów;
- przechodzić do profilu zawodnika;
- analizować trendy w zespołach.

W zależności od polityki klubu koordynator może posiadać również możliwość korekty wybranych danych.

---

## 16.3. Administrator klubowy

### BR-069 — Administracja klubem

Administrator klubowy odpowiada za konfigurację organizacyjną klubu.

Powinien móc:

- tworzyć i edytować zespoły;
- dodawać i dezaktywować użytkowników;
- przypisywać trenerów do zespołów;
- nadawać role klubowe;
- dodawać i edytować zawodników;
- przenosić zawodników pomiędzy zespołami;
- konfigurować podstawowe ustawienia klubu;
- przeglądać dane wszystkich zespołów klubu;
- przeglądać dashboardy klubowe.

### BR-070 — Brak dostępu do innych klubów

Administrator klubowy nie może przeglądać danych innych klubów.

---

## 16.4. Master administrator

### BR-071 — Pełny dostęp systemowy

Master administrator posiada dostęp do całej platformy.

Powinien móc:

- tworzyć kluby;
- zarządzać klubami;
- przeglądać użytkowników;
- przypisywać administratorów klubowych;
- przeglądać dane w celu wsparcia i kontroli;
- korygować błędne dane;
- zarządzać konfiguracją globalną;
- analizować działanie całej platformy.

### BR-072 — Audyt działań administracyjnych

Istotne działania master administratora i administratora klubowego powinny być możliwe do audytu.

---

# 17. Wieloklubowość i izolacja danych

### BR-073 — Multi-tenancy

System powinien być przygotowany do obsługi wielu niezależnych klubów.

### BR-074 — Izolacja danych

Użytkownik jednego klubu nie może uzyskać dostępu do danych innego klubu poprzez:

- interfejs;
- bezpośredni link;
- API;
- zmianę identyfikatora w adresie;
- eksport.

### BR-075 — Kontekst klubowy

Każdy istotny rekord biznesowy powinien być możliwy do jednoznacznego przypisania do klubu.

---

# 18. Reguły biznesowe ocen

### RB-001

Dla jednego zawodnika i jednego treningu może istnieć jedna aktualna ocena trenerska.

### RB-002

Ocena `- / 0 / +` opisuje poziom zawodnika względem jego własnego typowego funkcjonowania.

### RB-003

Ocena `-` nie oznacza automatycznie słabego zawodnika.

### RB-004

Ocena `+` nie oznacza automatycznie zawodnika o wyższym poziomie niż inni zawodnicy.

### RB-005

Nieobecność nie jest oceną sportową.

### RB-006

Jeżeli zawodnik jest nieobecny, nie może jednocześnie posiadać oceny `- / 0 / +` dla tego samego treningu.

### RB-007

Brak oceny nie jest równoważny z oceną `0`.

### RB-008

Brak odpowiedzi na ankietę nie jest równoważny z najniższym poziomem zmęczenia lub zadowolenia.

### RB-009

Zmiana zespołu nie tworzy nowego zawodnika.

### RB-010

Historyczne oceny pozostają przypisane do zespołu i treningu, w którym powstały.

### RB-011

Agregaty muszą wynikać z danych szczegółowych i umożliwiać zejście do rekordów źródłowych zgodnie z uprawnieniami użytkownika.

### RB-012

System powinien przechowywać informację, kto wykonał ocenę.

### RB-013

Jeżeli zawodnik jest oceniany przez różnych trenerów, system powinien zachować autora każdej oceny.

---

# 19. Dashboardy i agregacje

### BR-076 — Agregacja w czasie

Oceny muszą być możliwe do agregowania dla dowolnego sensownego okresu.

### BR-077 — Agregacja dla zawodnika

Dla zawodnika powinno być możliwe policzenie:

- liczby treningów;
- liczby obecności;
- liczby nieobecności;
- procentu frekwencji;
- liczby ocen `-`;
- liczby ocen `0`;
- liczby ocen `+`;
- udziału procentowego poszczególnych ocen;
- średniego lub medianowego zmęczenia, jeżeli skala na to pozwala;
- średniego lub medianowego zadowolenia, jeżeli skala na to pozwala.

### BR-078 — Agregacja dla zespołu

Analogiczne dane powinny być możliwe do analizowania zbiorczo dla zespołu.

### BR-079 — Agregacja dla klubu

Administrator klubowy powinien móc analizować dane zbiorczo dla całego klubu, z możliwością zejścia do zespołu i zawodnika.

### BR-080 — Filtry

Dashboardy powinny umożliwiać filtrowanie co najmniej według:

- okresu;
- zespołu;
- zawodnika;
- trenera;
- statusu obecności;
- powodu nieobecności;
- typu oceny.

---

# 20. Scenariusze użycia

### UC-001 — Ocena zespołu po treningu

> Trener kończy trening U14. Otwiera aplikację i otrzymuje informację, że trening można ocenić. Na ekranie pojawiają się kolejno zawodnicy. Trener wybiera dla każdego `-`, `0`, `+` albo nieobecność. Po ostatnim zawodniku widzi podsumowanie i zapisuje ocenę.

### UC-002 — Zawodnik nieobecny

> Przy zawodniku trener wybiera „nieobecny”, a następnie wskazuje „choroba”. Zawodnik nie otrzymuje oceny sportowej dla tego treningu.

### UC-003 — Ankieta zawodnika

> Po treningu trener włącza opcję wysłania ankiety. Zawodnik otrzymuje prosty link i wskazuje poziom zmęczenia oraz zadowolenia z treningu.

### UC-004 — Analiza zawodnika

> Trener otwiera profil zawodnika i widzi, że w ostatnich 10 treningach zawodnik otrzymał 5 ocen `0`, 4 oceny `-` i 1 ocenę `+`. W tym samym okresie zawodnik kilkukrotnie deklarował wysokie zmęczenie.

### UC-005 — Analiza koordynatora

> Koordynator widzi, że trzy zespoły regularnie uzupełniają dane, natomiast w jednym zespole oceny wykonano tylko dla 40% treningów.

### UC-006 — Analiza absencji

> Trener sprawdza frekwencję zawodnika i widzi osobno nieobecności usprawiedliwione, choroby, kontuzje i nieobecności nieusprawiedliwione.

### UC-007 — Sygnał do rozmowy

> Dashboard wskazuje zawodnika, który w kilku kolejnych treningach otrzymał ocenę `-` i jednocześnie deklarował niższe zadowolenie. System nie stawia diagnozy, lecz sugeruje dodatkową obserwację.

---

# 21. Jakość danych

### BR-081 — Kompletność treningu

System powinien umożliwiać określenie, ilu zawodników zostało ocenionych dla danego treningu.

### BR-082 — Autor danych

Każda ocena trenerska powinna posiadać informację o autorze.

### BR-083 — Czas utworzenia

Każdy istotny rekord powinien posiadać czas utworzenia i ostatniej modyfikacji.

### BR-084 — Historia korekt

Dla istotnych zmian powinno być możliwe ustalenie:

- kto dokonał zmiany;
- kiedy;
- jaka była wartość wcześniejsza;
- jaka jest wartość aktualna.

### BR-085 — Brak danych

System musi odróżniać:

- wartość `0`;
- brak odpowiedzi;
- brak oceny;
- nieobecność;
- trening odwołany.

---

# 22. Powiadomienia

### BR-086 — Informacja po treningu

Po zakończeniu treningu trener powinien otrzymać czytelną informację o możliwości wykonania oceny.

### BR-087 — Przypomnienie o brakującej ocenie

Jeżeli trening został zrealizowany, ale nie został oceniony, system powinien móc przypomnieć trenerowi o brakującej ocenie.

### BR-088 — Ankieta dla zawodnika

Jeżeli trener zdecyduje się wysłać ankietę, system powinien wygenerować i dostarczyć odpowiednie zaproszenie do odbiorcy.

Kanał dostarczenia pozostaje do ustalenia.

---

# 23. Prywatność i bezpieczeństwo

### BR-089 — Minimalizacja danych

System powinien gromadzić wyłącznie dane niezbędne do realizacji celu biznesowego.

### BR-090 — Uprawnienia

Dostęp do danych zawodnika powinien wynikać z roli i zakresu odpowiedzialności użytkownika.

### BR-091 — Dane osób niepełnoletnich

W przypadku zawodników niepełnoletnich system musi umożliwiać klubowi działanie zgodnie z przyjętą podstawą przetwarzania danych i zasadami kontaktu z rodzicem / opiekunem.

### BR-092 — Bezpieczny link ankiety

Jeżeli ankieta jest dostępna bez logowania, link musi być trudny do odgadnięcia i przypisany do konkretnej ankiety.

### BR-093 — Wygaśnięcie linku

Link do ankiety powinien mieć możliwość wygaśnięcia po określonym czasie lub po udzieleniu odpowiedzi.

---

# 24. Zakres MVP

W pierwszej wersji produktu priorytetem jest możliwość:

1. utworzenia klubu;
2. utworzenia zespołów;
3. dodania trenerów i zawodników;
4. przypisania trenerów i zawodników do zespołów;
5. dodania treningu;
6. oznaczenia treningu jako zrealizowany;
7. uruchomienia szybkiej oceny po treningu;
8. ocenienia zawodnika `- / 0 / +`;
9. oznaczenia zawodnika jako nieobecnego;
10. wybrania powodu nieobecności;
11. zapisania danych dla całego zespołu;
12. wyświetlenia podstawowego dashboardu zawodnika;
13. wyświetlenia podstawowego dashboardu zespołu;
14. wysłania opcjonalnej ankiety potreningowej;
15. zebrania poziomu zmęczenia;
16. zebrania poziomu zadowolenia;
17. rozróżnienia ról trener / koordynator / administrator klubowy / master administrator;
18. zapewnienia izolacji danych pomiędzy klubami.

---

# 25. Poza zakresem pierwszego MVP

Na pierwszym etapie poza zakresem mogą pozostać:

- rozbudowane oceny techniczne i taktyczne;
- osobne oceny wielu kompetencji zawodnika;
- skala 1–10;
- pełny dziennik treningowy;
- planowanie mikrocyklu;
- biblioteka ćwiczeń;
- GPS i dane trackingowe;
- integracje z urządzeniami wearables;
- automatyczne diagnozowanie przemęczenia;
- automatyczna ocena ryzyka kontuzji;
- modele sztucznej inteligencji przewidujące rozwój zawodnika;
- ranking zawodników;
- porównania między klubami;
- benchmarking zawodników pomiędzy klubami;
- komunikator trener–rodzic;
- płatności;
- pełne konto zawodnika / rodzica;
- rozbudowane ankiety psychologiczne;
- medyczna dokumentacja kontuzji.

---

# 26. Kryteria akceptacji MVP

### AC-001

Trener może utworzyć trening dla przypisanego zespołu.

### AC-002

Po zakończeniu treningu trener może rozpocząć ocenę zawodników.

### AC-003

System prezentuje trenerowi kolejnych zawodników zespołu.

### AC-004

Dla każdego obecnego zawodnika można wybrać dokładnie jedną ocenę:

- `-`;
- `0`;
- `+`.

### AC-005

Zamiast oceny można oznaczyć zawodnika jako nieobecnego.

### AC-006

Dla nieobecnego zawodnika można wskazać:

- nieobecność nieusprawiedliwioną;
- nieobecność usprawiedliwioną;
- chorobę;
- kontuzję.

### AC-007

Po wyborze oceny aplikacja przechodzi do kolejnego zawodnika.

### AC-008

Trener może cofnąć się i poprawić ocenę.

### AC-009

Aplikacja pokazuje postęp oceny zespołu.

### AC-010

Po zakończeniu procesu wszystkie oceny są zapisane i dostępne w dashboardzie.

### AC-011

Nieobecny zawodnik nie otrzymuje oceny `- / 0 / +`.

### AC-012

Dashboard zawodnika pokazuje historię jego ocen.

### AC-013

Dashboard zawodnika pokazuje frekwencję i powody nieobecności.

### AC-014

Trener może zdecydować o wysłaniu ankiety po treningu.

### AC-015

Ankieta pozwala podać poziom zmęczenia.

### AC-016

Ankieta pozwala podać poziom zadowolenia z treningu.

### AC-017

Brak odpowiedzi na ankietę jest odróżniany od wartości na skali.

### AC-018

Koordynator może przeglądać dane wszystkich zespołów znajdujących się w jego zakresie.

### AC-019

Administrator klubowy może zarządzać użytkownikami, zespołami i zawodnikami własnego klubu.

### AC-020

Master administrator może zarządzać wieloma klubami.

### AC-021

Użytkownik jednego klubu nie może uzyskać dostępu do danych innego klubu.

### AC-022

System pozwala określić autora oceny i trening, którego ocena dotyczy.

### AC-023

Zmiana zespołu zawodnika nie usuwa jego historycznych ocen.

---

# 27. Kluczowe pytania otwarte

Do dalszego doprecyzowania:

1. Jak dokładnie definiujemy „typowy poziom zawodnika”, do którego trener odnosi ocenę `- / 0 / +`?
   - intuicyjna ocena trenera;
   - ostatnie kilka tygodni;
   - cały sezon;
   - bez formalnej definicji w MVP?

2. Czy trener ocenia zawodnika wyłącznie globalnie, czy w przyszłości `- / 0 / +` ma być możliwe również dla kilku obszarów, np.:
   - zaangażowanie;
   - działania z piłką;
   - działania bez piłki;
   - zachowania społeczne?

3. Czy na jednym treningu zawodnika może ocenić więcej niż jeden trener?

4. Jeżeli kilku trenerów oceni tego samego zawodnika:
   - przechowujemy wszystkie oceny osobno;
   - wybieramy ocenę głównego trenera;
   - budujemy agregat?

5. Jaka ma być skala zmęczenia:
   - 1–5;
   - 1–7;
   - RPE – Rating of Perceived Exertion;
   - inna?

6. Jaka ma być skala zadowolenia z treningu?

7. Czy ankieta ma trafiać do zawodnika, rodzica czy automatycznie do odpowiedniego odbiorcy na podstawie wieku?

8. Jakim kanałem wysyłamy ankietę:
   - link w aplikacji;
   - e-mail;
   - SMS;
   - WhatsApp;
   - powiadomienie PWA?

9. Czy zawodnik / rodzic może zmienić odpowiedź po jej wysłaniu?

10. Jak długo po treningu ankieta pozostaje aktywna?

11. Czy trener widzi odpowiedź zawodnika natychmiast, czy dopiero po zamknięciu ankiety?

12. Czy trener może dodać krótki komentarz do oceny `-` lub `+`?

13. Czy komentarz powinien być:
   - opcjonalny;
   - obowiązkowy przy `-`;
   - obowiązkowy przy `-` i `+`?

14. Czy trener może wprowadzić frekwencję przed treningiem, a po treningu tylko uzupełnić ocenę?

15. Czy lista zawodników treningu zawsze wynika z kadry zespołu, czy trener może tworzyć indywidualny skład na konkretną jednostkę?

16. Czy zawodnik może trenować jednego dnia z inną grupą i być oceniony w kontekście tamtego zespołu?

17. Jak długo trener może edytować ocenę po treningu?

18. Czy koordynator może edytować ocenę trenera, czy wyłącznie ją przeglądać?

19. Czy administrator klubowy powinien mieć dostęp do treści wszystkich ocen, czy tylko do danych organizacyjnych i dashboardów?

20. Czy klub może tworzyć własne powody nieobecności poza czterema domyślnymi?

21. Czy kontuzja ma pozostać wyłącznie powodem absencji, czy w przyszłości ma prowadzić do osobnego modułu medycznego?

22. Czy potrzebujemy osobnej kategorii „zwolniony z treningu / ograniczony udział”?

23. Czy zawodnik częściowo uczestniczący w treningu może otrzymać normalną ocenę?

24. Czy chcemy mierzyć czas potrzebny trenerowi na wykonanie całej oceny?

25. Czy system ma przypominać trenerowi o nieuzupełnionej ocenie:
   - po kilku godzinach;
   - następnego dnia;
   - według ustawień klubu?

26. Jakie dokładnie dane powinien widzieć dashboard koordynatora w pierwszym MVP?

27. Czy dashboard powinien prezentować automatyczne „alerty”, czy na początku wyłącznie dane i trendy?

28. Czy przewidujemy w przyszłości porównania z danymi meczowymi i ocenami po meczu?

29. Czy ten sam mechanizm `- / 0 / +` ma docelowo działać również dla meczów?

30. Czy system ma być produktem SaaS dla wielu klubów z osobnymi planami subskrypcyjnymi?

---

# 28. Rekomendowany model interpretacji danych

Najważniejszą zasadą analityczną powinno być oddzielenie:

1. **poziomu zawodnika**;
2. **aktualnego funkcjonowania zawodnika względem jego poziomu**.

Skala `- / 0 / +` opisuje wyłącznie punkt 2.

Dzięki temu system może być stosowany zarówno do zawodnika wyróżniającego się sportowo, jak i do zawodnika będącego na wcześniejszym etapie rozwoju.

Przykład:

> Dwóch zawodników może otrzymać `+` na tym samym treningu, mimo że ich aktualny poziom sportowy jest zupełnie różny. Obaj zagrali lub trenowali powyżej własnego typowego poziomu.

To rozróżnienie powinno być konsekwentnie zachowane zarówno w interfejsie, jak i w dashboardach.

---

# 29. Definicja sukcesu projektu

Projekt osiąga podstawowy cel, jeżeli trener jest w stanie po treningu w krótkim czasie ocenić cały zespół, a klub może następnie wykorzystać te dane do obserwowania zawodników w dłuższej perspektywie.

Podstawowy scenariusz sukcesu:

> trener kończy trening → w aplikacji otwiera szybką ocenę → przechodzi zawodnik po zawodniku → wybiera `-`, `0`, `+` lub nieobecność → opcjonalnie wysyła ankietę → dane automatycznie pojawiają się w dashboardzie zawodnika i zespołu.

System powinien ograniczać liczbę kliknięć i czas potrzebny trenerowi na wprowadzenie danych, ponieważ regularność zbierania informacji jest ważniejsza niż rozbudowanie pojedynczego formularza.

Docelową wartością platformy jest zbudowanie spójnej, długoterminowej historii procesu treningowego zawodnika, która może wspierać decyzje trenerów, koordynatorów i osób odpowiedzialnych za rozwój sportowy klubu.
