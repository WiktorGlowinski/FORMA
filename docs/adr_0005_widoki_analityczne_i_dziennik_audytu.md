# ADR 0005: Wydajność i Bezpieczeństwo — Widok `v_player_analytics` oraz Tabela `audit_logs`

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Baza Danych / Optymalizacja Zapytań / Audyt

---

## 1. Kontekst i Problem

W miarę trwania sezonu liczba pojedynczych rekordów ocen (`evaluations`) i ankiet (`post_training_surveys`) rośnie w tysiące wpisów na drużynę. 
Pobieranie surowych wierszy do pamięci Node.js i przeliczanie procentów frekwencji, rozkładu `- / 0 / +` oraz średnich arytmetycznych zmęczenia po stronie serwera aplikacyjnego powodowałoby spadek wydajności i wysokie narzuty pamięciowe.

Jednocześnie wymagania **BR-024**, **BR-072** oraz **BR-084** nakładają obowiązek śledzenia historii korekt (kto, kiedy i dlaczego zmienił zatwierdzoną ocenę lub usunął szkoleniowca).

---

## 2. Podjęta Decyzja

1. **Agregacja po stronie silnika PostgreSQL (`v_player_analytics`)**:
   Zaimplementowano dedykowany widok relacyjny SQL (`VIEW`), który agreguje:
   - Procent frekwencji (`attendance_percentage`) z użyciem konstrukcji `FILTER (WHERE e.is_present = TRUE)`.
   - Rozkład ocen `count_plus`, `count_zero`, `count_minus`.
   - Podział powodów absencji (`absences_injury`, `absences_illness` itd.).
   - Średnie wskaźniki zmęczenia i zadowolenia z ankiet RPE.
   Dzięki temu moduł analityczny pobiera gotowy profil zawodnika jednym selektywnym zapytaniem:
   ```sql
   SELECT * FROM public.v_player_analytics WHERE player_id = $1;
   ```
   Analiza trenera korzysta dodatkowo z planowanego RPE zapisanego przy treningu. Sygnalizator
   porównuje średnie RPE z ostatnich trzech ukończonych jednostek ze średnią bazową zawodnika,
   a widok „Plan vs Realia” zestawia plan trenera z odpowiedziami ankiet.

2. **Dziennik Audytu (`audit_logs`) jako mechanizm wewnętrzny**:
   - Utworzono tabelę zdarzeniową ze strukturami `old_data JSONB` i `new_data JSONB`.
   - Zgodnie z decyzją projektową **nie eksponuje się audytu jako osobnej zakładki w menu**, lecz traktuje jako „czarną skrzynkę” systemu dostępną dla Master Admina oraz jako podkład pod przyszłe adnotacje o korektach ocen.

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Optymalizacja zapytań**: Silnik bazy wykonuje agregację w czasie kilku milisekund z wykorzystaniem natywnych funkcji wektorowych PostgreSQL.
- **Bezpieczeństwo dowodowe**: Każda istotna modyfikacja danych zostawia nienaruszalny ślad z poprzednim stanem obiektu w formacie JSONB.
- **Czysty interfejs**: Panel klubu pozostaje wolny od technicznego szumu administratorskiego.

### Ograniczenia i Środki Zaradcze
- Przy bardzo dużych zbiorach danych (dziesiątki tysięcy treningów) widok tradycyjny może wymagać konwersji do `MATERIALIZED VIEW` odświeżanego po zakończeniu jednostki treningowej. Na etapie MVP zwykły `VIEW` zapewnia idealną równowagę świeżości danych do narzutu.