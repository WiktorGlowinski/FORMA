Next.js (App Router) i Server Actions zamiast osobnego backendu

Problem: Zastanawialiśmy się, czy budować tradycyjny podział: osobny backend (np. Express/NestJS/FastAPI) wystawiający REST API oraz osobny frontend w czystym React/Vite.

Decyzja: Wybraliśmy jeden monolit w Next.js (App Router) z wykorzystaniem Server Actions ('use server').

Dlaczego?:
Oszczędzamy mnóstwo czasu: nie musimy pisać kontrolerów, tras API (/api/evaluations), parsować req.body ani pisać setek zapytań fetch().

TypeScript pilnuje spójności typów od bazy danych w Supabase aż po przycisk na telefonie trenera.

Mniej serwerów do utrzymania – cała aplikacja wdraża się jednym commitem na Vercel.

#####################################################

Baza danych PostgreSQL (Supabase) i relacyjny model danych

Problem: Czy trzymać dane sportowe w elastycznej bazie dokumentowej (NoSQL, np. MongoDB), czy w klasycznej relacyjnej bazie SQL?

Decyzja: Postawiliśmy na PostgreSQL zarządzany przez Supabase.

Dlaczego?:
Struktura klubu piłkarskiego to czysta relacja: Klub -> Drużyna -> Trening -> Zawodnik -> Ocena. Tutaj nie ma miejsca na bałagan.Klucze obce gwarantują, że nie powstaną „osierocone” oceny zawodnika, który został usunięty z bazy.Bezpieczeństwo i unikalność: dzięki ograniczeniu UNIQUE(training_id, player_id) trener może wielokrotnie klikać i poprawiać ocenę danego dnia, a baza robi bezpieczny upsert (aktualizuje istniejący rekord zamiast tworzyć duplikaty).

#########################################################

Interfejs i system stylów – Tailwind CSS + shadcn/ui w estetyce „FORMA”

Problem: Aplikacja ma działać głównie w terenie (na boisku), często w ostrym słońcu na ekranie smartfona. Standardowe szablony UI są albo przeładowane białym tłem, albo zbyt ciężkie.

Decyzja: Zbudowaliśmy lekki interfejs w oparciu o Tailwind CSS i komponenty shadcn/ui, stosując dedykowaną paletę klubową (ciepły pergaminowy beż  i głęboka zieleń murawy).

Dlaczego?:

Ciepłe, matowe tło nie oślepia na zewnątrz i redukuje odblaski na ekranie telefonu.

Duże kafelki pod kciuk eliminują przypadkowe kliknięcia podczas szybkiego marszu czy rozmowy z zespołem.

Brak ciężkich zewnętrznych bibliotek ze stylami – interfejs ładuje się błyskawicznie nawet przy słabym zasięgu LTE na boisku.

#######################################################

Ankiety zawodników – Dostęp przez tokeny linkowe zamiast kont użytkowników

Problem: Zmuszanie kilkunastoletnich zawodników do zakładania kont, logowania i pamiętania haseł tylko po to, by odpowiedzieli na 2 pytania o zmęczenie po treningu, skutkowałoby 10-procentową frekwencją w ankietach.

Decyzja: Dostęp do ankiety potreningowej opiera się na unikalnych tokenach UUID z limitem czasowym (TTL 24h) przesyłanych w linku.

Dlaczego?:

Zero barier wejścia: trener generuje linki i wrzuca je na wspólną grupę (np. WhatsApp). Zawodnik klika swój link, przesuwa dwa suwaki (RPE i zmęczenie), klika „Wyślij” i zamyka stronę.

Token po wypełnieniu lub po upływie doby wygasa, co chroni dane przed manipulacją wstecz.

######################################################

Zarządzanie stanem – Zustand po stronie klienta z masowym zapisem

Problem: Gdyby każde kliknięcie oceny (-, 0, +) od razu wysyłało zapytanie sieciowe do bazy, przy słabym zasięgu na boisku aplikacja zacinałaby się, a trener czekałby na załadowanie każdego kolejnego piłkarza.

Decyzja: Stan oceniania całego zespołu trzymamy lokalnie w pamięci telefonu przy użyciu biblioteki Zustand (useEvaluationStore), a do bazy danych uderzamy jednym zapytaniem zbiorczym dopiero po kliknięciu „Zapisz oceny”.

Dlaczego?:

Przełączanie między zawodnikami działa natychmiastowo z prędkością 60 fps – zero opóźnień sieciowych.

Trener może w dowolnym momencie cofnąć się do poprzedniego zawodnika, zmienić mu ocenę na inną lub zmienić obecność na kontuzję bez generowania zbędnego ruchu w bazie.

Baza wykonuje jedną szybką transakcję zamiast 25 osobnych zapytań HTTP.