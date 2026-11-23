"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessagesSquare, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/landing/site-footer";
import { BallMark, CornerFlag, PitchArt } from "@/components/landing/mark";
import { SiteHeader } from "@/components/landing/site-header";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    index: "01",
    title: "Zamknij jednostkę",
    text: "Data, godzina, zespół i trener prowadzący. Temat, cel i miejsce mogą poczekać — nie blokują oceny.",
  },
  {
    index: "02",
    title: "Przejdź skład",
    text: "Jedno nazwisko na ekranie. Minus, zero, plus albo nieobecność z powodem. Pomyłka? Wróć, zanim zamkniesz trening.",
  },
  {
    index: "03",
    title: "Zostaw historię",
    text: "Frekwencja, rozkład ocen i ankieta lądują przy zawodniku. Klub widzi zmianę w czasie, nie tabelę najlepszych.",
  },
];

const ROLES = [
  {
    title: "Trener",
    text: "Ocenia zespoły, do których jest przypisany. Dodaje trening, oznacza nieobecności i wysyła ankietę, jeśli chce.",
  },
  {
    title: "Koordynator",
    text: "Patrzy, czy zespoły w jego obszarze w ogóle zbierają oceny, i schodzi od klubu do pojedynczego treningu.",
  },
  {
    title: "Administrator klubu",
    text: "Prowadzi składy, trenerów i zespoły własnego klubu. Dane innego klubu nie są stąd widoczne.",
  },
  {
    title: "Zawodnik lub rodzic",
    text: "Opcjonalny link po treningu: zmęczenie i zadowolenie w skali 1–5. Bez konta. Brak odpowiedzi nie jest zerem.",
  },
];

const SAMPLE_BARS = [
  { label: "−", count: 3, tone: "bg-minus" },
  { label: "0", count: 3, tone: "bg-zero" },
  { label: "+", count: 1, tone: "bg-plus" },
];

const SAMPLE_TIMELINE = ["0", "+", "0", "−", "−", "0", "nb", "−"] as const;

export function PitchHome() {
  function scrollToTarget(e: React.MouseEvent<HTMLAnchorElement>, targetId: string) {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
      window.history.pushState(null, "", `#${targetId}`);
    }
  }

  return (
    <div id="gora" className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PitchArt className="absolute top-24 -right-[18%] hidden w-[680px] text-foreground/10 lg:block" />
        <BallMark className="absolute top-[38rem] left-[6%] hidden size-16 text-foreground/10 lg:block" />
      </div>

      <SiteHeader />

      <main className="flex-1">
        <section className="group/hero relative overflow-hidden">
          <PitchLines />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:py-24">
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
                Dla klubów piłkarskich i ich zawodników
              </p>
              <h1 className="mt-4 max-w-xl font-heading text-5xl leading-[1.05] font-semibold tracking-wide text-balance uppercase sm:text-6xl lg:text-7xl">
                Prowadź formę składu. Zostaw każdemu jego własną skalę.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Forma jest narzędziem dla klubu, który po treningu chce wiedzieć, jak funkcjonował każdy zawodnik,
                oraz dla zawodnika, który ma być oceniony względem siebie, a nie względem kolegi z drużyny.
                Trener zamyka jednostkę w kilka minut. Klub dostaje historię. Rodzic dostaje ankietę tylko wtedy,
                gdy trener ją wyśle.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/demo"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 px-5 text-base transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)]",
                  )}
                >
                  Wypróbuj szybką ocenę
                  <ArrowRight className="transition-transform group-hover/hero:translate-x-0.5" />
                </Link>
                <a
                  href="#skala"
                  onClick={(e) => scrollToTarget(e, "skala")}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 cursor-pointer border-2 border-foreground/20 px-5 text-base transition-transform hover:-translate-y-0.5 hover:border-foreground hover:bg-accent hover:shadow-[4px_4px_0_0_var(--foreground)]",
                  )}
                >
                  Jak czytać skalę
                </a>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <article className="print-card rounded-md border-2 border-foreground/15 bg-card px-4 py-4">
                  <h2 className="font-heading text-2xl tracking-tight">Dla klubu</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Akademia, szkółka i zespół seniorski prowadzą tu jeden zapis formy. Trener pracuje na boisku,
                    koordynator widzi, czy oceny powstają, a skład zostaje w Waszym klubie.
                  </p>
                </article>
                <article className="print-card rounded-md border-2 border-foreground/15 bg-card px-4 py-4">
                  <h2 className="font-heading text-2xl tracking-tight">Dla zawodnika</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Plus oznacza, że zagrałeś powyżej siebie. Nie oznacza, że jesteś najlepszy w drużynie.
                    Ankieta po treningu jest krótka, bez konta, a brak odpowiedzi nie staje się minusem.
                  </p>
                </article>
              </div>
            </div>

            <aside className="group/board relative">
              <div className="mow-stripes relative overflow-hidden rounded-md border-2 border-foreground/25 p-3 transition duration-200 group-hover/board:-translate-y-1 group-hover/board:shadow-[6px_6px_0_0_var(--foreground)] sm:p-4">
                <CornerFlag className="pointer-events-none absolute top-1 left-2 z-10 h-14 w-10 text-chalk" />
                <div className="relative bg-chalk/92">
                  <PitchArt className="w-full text-pitch transition-colors duration-200 group-hover/board:text-pitch-deep" />
                  <p className="absolute top-1/2 left-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 text-center font-heading text-sm leading-tight tracking-wide text-foreground uppercase sm:text-base">
                    Względem siebie
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Dwóch zawodników może dostać plus na tym samym treningu, choć ich poziom sportowy jest różny.
                Obaj zagrali powyżej siebie. Forma nie układa składu od najlepszego do najsłabszego.
              </p>
            </aside>
          </div>
        </section>

        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-6 sm:px-6 sm:py-10">
          <section id="skala" className="scroll-mt-24" aria-labelledby="skala-tytul">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Skala</p>
              <h2 id="skala-tytul" className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
                Cztery statusy. Jeden wybór.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Dla jednego zawodnika i jednego treningu trener wskazuje dokładnie jedną rzecz. Brak oceny
                nie zamienia się w zero. Odwołany trening nie prosi o skład.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ScaleCard
                symbol="−"
                tone="text-minus"
                title="Słabiej niż zwykle"
                text="Funkcjonował poniżej swojego aktualnego poziomu. To nie znaczy, że jest słabym zawodnikiem."
              />
              <ScaleCard
                symbol="0"
                tone="text-zero"
                title="Typowy poziom"
                text="Trening w jego normie. Zero na skali nie jest brakiem danych ani karą."
              />
              <ScaleCard
                symbol="+"
                tone="text-plus"
                title="Powyżej siebie"
                text="Lepiej niż własna norma. Plus U12 nie robi z nikogo lepszego zawodnika niż kolega z zerem."
              />
              <ScaleCard
                symbol="nb"
                tone="text-foreground"
                title="Nieobecny"
                text="Nieusprawiedliwiona, usprawiedliwiona, choroba albo kontuzja. Osobno od ocen i od siebie nawzajem."
              />
            </div>
          </section>

          <section id="przebieg" className="scroll-mt-24" aria-labelledby="przebieg-tytul">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Przebieg</p>
              <h2 id="przebieg-tytul" className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
                Od gwizdka do historii zawodnika.
              </h2>
            </div>
            <ol className="mt-8 grid gap-4 lg:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.index} className="print-card rounded-md border-2 border-foreground/15 bg-card p-6">
                  <span className="font-heading text-5xl text-primary">{step.index}</span>
                  <h3 className="mt-4 text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="rola-danych" className="scroll-mt-24 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Co zostaje w klubie</p>
              <h2 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
                Profil, nie klasyfikacja.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Przy zawodniku widać zespół, historię jednostek, rozkład minus / zero / plus, frekwencję
                i powody absencji. Jeśli wróci ankieta, obok siada zmęczenie i zadowolenie z treningu.
                Seria minusów albo wysokie zmęczenie to sygnał, żeby sprawdzić — nie diagnoza.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-3">
                  <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  Każdy procent ma obok liczbę treningów, z których wyszedł.
                </li>
                <li className="flex gap-3">
                  <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                  Zmiana zespołu nie kasuje wcześniejszych ocen. Zostają przy treningu, na którym powstały.
                </li>
                <li className="flex gap-3">
                  <MessagesSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  Ankieta jest decyzją trenera. Bez niej trening i tak można zamknąć.
                </li>
              </ul>
            </div>

            <article className="print-card rounded-md border-2 border-foreground/15 bg-card p-5 sm:p-6" aria-label="Przykładowy profil zawodnika">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Przykład · ostatnie 8 jednostek</p>
                  <h3 className="mt-1 font-heading text-3xl tracking-tight">Lena Wójcik</h3>
                  <p className="text-sm text-muted-foreground">U14 · skrzydłowa · wymyślony profil</p>
                </div>
                <p className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  dane wymyślone
                </p>
              </div>

              <div className="mt-6">
                <div className="flex h-3 overflow-hidden rounded-full">
                  {SAMPLE_BARS.map((bar) => (
                    <div key={bar.label} className={bar.tone} style={{ flex: bar.count }} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  3× minus · 3× zero · 1× plus, z 7 obecności. Jedna nieobecność (choroba) nie weszła do słupka.
                </p>
              </div>

              <p className="mt-5 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                Od najstarszej jednostki
              </p>
              <ol className="mt-2 flex gap-1.5" aria-label="Ostatnie osiem jednostek, od najstarszej">
                {SAMPLE_TIMELINE.map((mark, index) => (
                  <li
                    key={`${mark}-${index}`}
                    className={cn(
                      "grid h-10 flex-1 place-items-center rounded-sm text-xs font-semibold transition duration-150 hover:-translate-y-1 hover:shadow-[2px_2px_0_0_var(--foreground)]",
                      mark === "−" && "bg-minus/20 text-minus",
                      mark === "0" && "bg-zero/20 text-zero",
                      mark === "+" && "bg-plus/20 text-plus",
                      mark === "nb" && "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="sr-only">Jednostka {index + 1}: </span>
                    {mark === "nb" ? "nb" : mark}
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-2xl bg-muted/80 p-4">
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Sygnał do sprawdzenia</p>
                <p className="mt-1 text-sm leading-6">
                  Dwa minusy z rzędu i zmęczenie 4/5 po ostatniej jednostce. Warto porozmawiać po treningu.
                  System nie mówi, dlaczego tak jest.
                </p>
              </div>
            </article>
          </section>

          <section id="role" className="scroll-mt-24" aria-labelledby="role-tytul">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Dla kogo</p>
              <h2 id="role-tytul" className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
                Cztery role w klubie, jeden zawodnik w środku.
              </h2>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {ROLES.map((role) => (
                <article key={role.title} className="print-card rounded-md border-2 border-foreground/15 bg-card p-6">
                  <h3 className="font-heading text-3xl tracking-tight">{role.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function PitchLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-8 bottom-0 overflow-hidden">
      <div className="absolute top-6 right-[-8%] h-40 w-40 rounded-full border border-dashed border-foreground/15" />
      <div className="absolute top-16 right-[2%] h-px w-56 bg-foreground/15" />
    </div>
  );
}

function ScaleCard({
  symbol,
  tone,
  title,
  text,
}: {
  symbol: string;
  tone: string;
  title: string;
  text: string;
}) {
  return (
    <article className="print-card rounded-md border-2 border-foreground/15 bg-card p-5">
      <p className={cn("font-heading text-5xl leading-none", tone)}>{symbol}</p>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}