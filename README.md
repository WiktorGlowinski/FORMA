# FORMA — Platforma Szkoleniowo-Analityczna

System wsparcia procesów szkoleniowych dedykowany sztabom trenerskim oraz akademiom piłkarskim. Platforma koncentruje się na długofalowym monitorowaniu rozwoju zawodników (*player-development centered*), błyskawicznej ocenie jednostek treningowych przy linii bocznej oraz analizie samopoczucia i obciążenia (RPE).

---

## 🚀 Główne Funkcjonalności

### 1. Panel Szkoleniowy i Tablica Jednostek (`TrainingBoard`)
* **Dynamiczne zarządzanie jednostkami**: Przegląd zaplanowanych i zakończonych jednostek z podziałem na statusy (*Bieżące / Do oceny / Historia*).
* **Obsługa Trenerów Multi**: Szybkie przełączanie kontekstu między rocznikami (np. U15, U17, Seniorzy).
* **Kontrola uprawnień i autorstwa**: Wyraźne rozróżnienie jednostek własnych od jednostek współpracowników ze sztabu; ochrona przed nieautoryzowaną modyfikacją protokołu kolegi (tryb podglądu).
* **Szybki szkic jednostki**: 3-krokowy kreator tworzenia jednostki zoptymalizowany pod obsługę kciukiem na urządzeniach mobilnych (presety czasowe, akcenty metodyczne, kalkulacja UTC).

### 2. Protokół Szybkiej Oceny Zawodników (`QuickEvaluation`)
* **Interfejs gestowy (TinderCard)**: Ocena funkcjonowania zawodnika względem własnej normy (`-` / `0` / `+`) za pomocą gestów swipe lub dedykowanego doku przycisków.
* **Rejestracja absencji i urazów**: Szczegółowe oznaczanie powodów nieobecności (zwolnienia lekarskie, kontuzje z typem urazu) bez negatywnego wpływu na wskaźniki sportowe.
* **Bezpieczeństwo na boisku (Moduł SOS)**: Szybkie wywołanie kontaktów awaryjnych z bezpośrednim wybieraniem numeru do rodzica/opiekuna (`parent_phone`) dla roczników młodzieżowych.

### 3. Ankiety Potreningowe RPE
* **Jednorazowe sesje zwrotne**: Aktywacja ankiet ważnych 24h dla zawodników obecnych na treningu.
* **Natywne udostępnianie (Web Share API)**: Bezpośrednia dystrybucja linku ankiety do aplikacji mobilnych (WhatsApp, Messenger, SMS) lub szybkie kopiowanie do schowka.
* **Weryfikacja tożsamości**: Autoryzacja odpowiedzi gracza rokiem urodzenia.

### 4. Zarządzanie Mediami i Storage
* **Integracja z Supabase Storage**: Obsługa dedykowanych bucketów na awatary zawodników (`avatars`) oraz herby klubowe (`club-logos`).
* **Taktyczny fallback graficzny**: Automatyczne generowanie kafelków z numerem koszulki i inicjałami w przypadku braku zdjęcia.

---

## 🛠️ Stos Technologiczny

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
* **Język**: [TypeScript](https://www.typescriptlang.org/)
* **Baza danych & Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Supabase Storage, Auth)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Komponenty UI**: Komponenty customowe stylizowane w estetyce boiska piłkarskiego (*chalk pitch blueprint*)
* **UI & Komponenty**: [shadcn/ui](https://ui.shadcn.com/) (architektura komponentów bazowych w `components/ui/`)
* **Ikony**: [Lucide React](https://lucide.dev/)
* **Narzędzia deweloperskie**: Turbopack, ESLint

---

## 📁 Struktura Projektu

```text
├── app/
│   ├── actions/                 # Server Actions (coach, surveys, auth, analytics)
│   ├── ankieta/[trainingId]/    # Publiczny moduł wypełniania ankiet RPE
│   ├── login/                   # Autoryzacja sztabu trenerskiego
│   ├── trener/                  # Panel trenera
│   │   ├── [trainingId]/        # Protokół oceny jednostki treningowej
│   │   ├── layout.tsx           # Globalna powłoka (CoachShell) z tłem boiska
│   │   └── page.tsx             # Główna tablica jednostek
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Style bazowe i motyw graficzny
├── components/
│   ├── coach/                   # Komponenty panelu (TrainingBoard, QuickEvaluation, SOS)
│   ├── ui/                      # Komponenty bazowe (Button, PlayerAvatar)
│   └── landing/                 # Grafiki i oznaczenia taktyczne (PitchArt, PitchMark)
├── lib/
│   ├── supabase.ts              # Klient Supabase dla przeglądarki
│   ├── supabase-server.ts       # Klient Supabase z obsługą sesji/ciasteczek
│   ├── supabase-admin.ts        # Klient z uprawnieniami Service Role
│   └── utils.ts                 # Funkcje pomocnicze
