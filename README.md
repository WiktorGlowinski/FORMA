# FORMA — Platforma Zarządzania i Monitorowania Rozwoju Zawodników

**FORMA** to wielozadaniowa, chmurowa platforma klasy SaaS stworzona dla akademii i klubów sportowych. System stawia zawodnika i jego indywidualną ścieżkę rozwoju w centrum uwagi (*player-development centered*), eliminując zbędną biurokrację trenerską na rzecz szybkiej, systematycznej i porównywalnej w czasie oceny postępów po każdym treningu.

---

## ⚽ Filozofia i Metodyka Oceny

Platforma odchodzi od subiektywnych, bezwzględnych rankingów „najlepszy / najsłabszy” na rzecz monitorowania funkcjonowania zawodnika **w odniesieniu do jego własnego, aktualnego poziomu**:

* **Skala Oceny Względnej (`- / 0 / +`):**
  * `-` — funkcjonowanie poniżej typowego poziomu zawodnika w danym mikrocyklu;
  * `0` — funkcjonowanie na swoim typowym, stabilnym poziomie;
  * `+` — funkcjonowanie powyżej typowego poziomu (wyróżniające zaangażowanie/forma).
* **Precyzyjna Ewidencja Absencji:** Zawodnik nieobecny nie otrzymuje oceny sportowej; system kategoryzuje powód absencji: *kontuzja*, *choroba*, *usprawiedliwiona*, *nieusprawiedliwiona*.
* **Samoocena i Ankiety Potreningowe (RPE):** Opcjonalne zbieranie informacji zwrotnej od zawodników lub rodziców (subiektywne zmęczenie 1–10 oraz poziom zadowolenia) za pośrednictwem bezpiecznych, jednorazowych linków tokenowych (bez wymogu logowania konta).

---

## 🚀 Główne Moduły Systemu

### 1. Panel Administratora Klubu (`/admin`)
* **Centrum Dowodzenia:** Pasek metryk KPI w czasie rzeczywistym (aktywni zawodnicy, zarejestrowane roczniki, kadra szkoleniowa, aktywny sezon).
* **Sztab Trenerski (`/admin/sztab`):** Pełny cykl zarządzania szkoleniowcami (CRUD) — automatyczna synchronizacja z Supabase Auth, bezpieczne nadawanie haseł, modyfikacja danych kontaktowych (telefon, e-mail, awatar), blokada logowania oraz usuwanie kont.
* **Drużyny & Roczniki (`/admin/druzyny`):** Definiowanie kategorii wiekowych (od Skrzata do Seniora), podział struktur klubowych oraz delegowanie I Trenerów i Asystentów.
* **Kartoteka Zawodników (`/admin/zawodnicy`):**
  * Inteligentne formularze dostosowane do wieku: dla **juniorów** (<18 lat) wymagane dane opiekuna i opcjonalny kontakt do gracza; dla **seniorów** bezpośredni telefon i e-mail gracza.
  * Ewidencja dokładnej daty urodzenia (`birth_date`), rocznika i numerów na koszulkach.
  * Pełna historia przynależności do zespołów (`player_team_history`).
* **Masowy Importer CSV:** Wbudowany parser obsługujący kodowanie UTF-8, automatyczne wykrywanie separatorów (`,`, `;`), wbudowana instrukcja mapowania kolumn oraz funkcja generowania gotowego szablonu `.csv` do pobrania.
* **Organizacja i Cykle (`/admin/sezony`):** Konfiguracja sezonów rozgrywkowych, zarządzanie danymi i herbem klubu.

### 2. Panel Trenera (`/trener`)
* **Dostęp Kontekstowy:** Ścisłe ograniczenie uprawnień szkoleniowca wyłącznie do zespołów, do których został przypisany przez zarząd klubu.
* **Kreator Treningów:** Planowanie i uruchamianie jednostek treningowych (data, ramy czasowe, cel, kategoria).
* **Tryb Szybkiej Oceny:** Zoptymalizowany pod kątem urządzeń mobilnych widok zawodnik-po-zawodniku umożliwiający ocenienie całej kadry w mniej niż 60 sekund.
* **Dyspozytor Ankiet:** Generowanie i wysyłka bezpiecznych tokenów RPE do podopiecznych lub ich rodziców.
* **Asystent AI:** Wyszukiwanie treningów po polskiej dacie, drużynie, miejscu i treści treningu; wyszukiwanie konkretnego zawodnika po imieniu i nazwisku; przygotowanie CSV oraz tworzenie zawodników i treningów z podglądem i potwierdzeniem zapisu.

#### Konfiguracja asystenta AI

Asystent używa Gemini API po stronie serwera. Ustaw `GEMINI_API_KEY` w środowisku serwera (klucz można uzyskać w Google AI Studio); opcjonalnie ustaw `GEMINI_MODEL`, aby wybrać obsługiwany model. Domyślnie używany jest szybki `gemini-3.5-flash-lite`, a przy niedostępności modelu aplikacja próbuje `gemini-3.5-flash` i `gemini-3.1-flash-lite`. Nie umieszczaj klucza w zmiennych `NEXT_PUBLIC_*`.

Treść poleceń i historia rozmowy są wysyłane do Google Gemini w celu ich interpretacji. Treści przesyłane w bezpłatnym planie mogą być używane przez Google do ulepszania usług. Nie przekazuj danych, których klub nie może udostępnić dostawcy, ani haseł. Historia asystenta jest zachowywana w `sessionStorage` danej karty przeglądarki do jej zamknięcia i oddzielona dla każdego użytkownika. Limity i dostępność bezpłatnego planu zależą od aktualnych warunków dostawcy. Operacje tworzące dane w aplikacji wymagają osobnego potwierdzenia, a uprawnienia są ponownie weryfikowane podczas zapisu.

### 3. Moduł Analityczny & Audyt
* **Widok Zagregowany (`v_player_analytics`):** Natywny widok SQL obliczający w locie frekwencję procentową, rozkład formy (`- / 0 / +`), strukturę kontuzji i absencji oraz średnie wskaźniki samopoczucia.
* **Dziennik Zdarzeń (`audit_logs`):** Niezmienna tabela audytowa rejestrująca modyfikacje ocen, usunięcia profili oraz zmiany administracyjne w strukturach klubu.

### 4. Panel Master Admina (`/master-admin`)
* Tworzenie nowego klubu razem z pierwszym kontem administratora klubu.
* Globalny podgląd aktywnych klubów.
* Dostęp do globalnego `audit_logs` z filtrowaniem kontekstowym i rozwijanym dekoderem danych JSON `old_data`/`new_data`. Logi są prezentowane jako dane audytowe; panel nie odszyfrowuje haseł ani sekretów.

---

## 🛠️ Stack Technologiczny

| Warstwa | Technologia | Zastosowanie |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Renderowanie hybrydowe (RSC), obsługa Turbopack, routing dynamiczny |
| **Backend & Logika** | **Server Actions** | Bezpieczne operacje bazodanowe i uwierzytelnianie bez ekspozycji API |
| **Baza Danych & Auth** | **Supabase (PostgreSQL)** | Relacyjna baza danych, silnik Supabase Auth, Row Level Security (RLS) |
| **Język Programowania** | **TypeScript** | Ścisłe typowanie end-to-end, stabilność kompilacji produkcyjnej |
| **Styling & UI** | **Tailwind CSS** | Semantyczny design inspirowany estetyką boiska (*Pitch Art & Mark*), pełna responsywność |
| **Komponenty & Ikony** | **Lucide React** | Spójny, zoptymalizowany zestaw ikon wektorowych |
| **Dokumentacja** | **ADR (MADR 3.0.0)** | Sformalizowany rejestr decyzji architektonicznych w katalogu `docs/adr/` |

---

## 📂 Struktura Projektu

```text
├── app/
│   ├── (auth)/             # Logowanie, reset haseł i obsługa sesji
│   ├── actions/            # Server Actions (admin.ts, auth.ts, coach.ts)
│   ├── admin/              # Panel administratora (druzyny, sztab, zawodnicy, sezony)
│   ├── ankieta/            # Publiczny moduł ankiet potreningowych (dostęp tokenowy)
│   ├── trener/             # Panel operacyjny szkoleniowca i oceny jednostek
│   └── layout.tsx          # Główny layout aplikacji
├── components/
│   ├── admin/              # Komponenty panelu zarządczego (navbar, menedżery, CSV)
│   ├── coach/              # Moduł oceny potreningowej i frekwencji
│   ├── landing/            # Motywy graficzne PitchArt / PitchMark
│   └── ui/                 # Uniwersalne prymitywy interfejsu użytkownika
├── docs/
│   └── adr/                # Rekordy decyzji architektonicznych (ADR 0001 - 0007)
├── lib/
│   ├── supabase-admin.ts   # Klient administracyjny (service_role) do zadań Auth
│   ├── supabase-client.ts  # Klient przeglądarkowy z kontekstem sesji
│   ├── supabase-server.ts  # Klient serwerowy weryfikujący ciasteczka sesyjne
│   └── utils.ts            # Narzędzia pomocnicze (formatowanie, Tailwind merge)
└── public/                 # Zasoby statyczne, herby, ikony PWA


📄 Licencja
Projekt objęty licencją komercyjną zastrzeżoną na rzecz autorów platformy FORMA. Wszelkie prawa zastrzeżone.