"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NAV } from "@/components/landing/copy";
import { PitchMark } from "@/components/landing/mark";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#gora" className="group flex items-center gap-2.5 text-foreground" onClick={close}>
          <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Sekcje strony">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="pitch-link">
              {item.label}
            </a>
          ))}
          <Link href="/trener" className="pitch-link">
            Panel trenera
          </Link>
        </nav>

        {/* Przyciski nawigacji na desktopie */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#ocena"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 border-2 border-foreground/20 px-4 transition-transform hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--foreground)]"
            )}
          >
            Wypróbuj demo
          </a>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 px-4 transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
            )}
          >
            Panel sztabu
          </Link>
        </div>

        {/* Przycisk menu mobilnego */}
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobilne"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Zamknij menu" : "Otwórz menu"}</span>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Rozwijane menu na telefonie */}
      {open ? (
        <div id="menu-mobilne" className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Sekcje strony">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="pitch-link rounded-lg px-3 py-3 text-base hover:bg-accent"
              >
                {item.label}
              </a>
            ))}
            <Link href="/trener" onClick={close} className="rounded-lg px-3 py-3 text-base hover:bg-accent">
              Panel trenera
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="#ocena"
              onClick={close}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full border-2 border-foreground/20 text-center"
              )}
            >
              Wypróbuj demo
            </a>
            <Link
              href="/login"
              onClick={close}
              className={cn(buttonVariants({ size: "lg" }), "h-11 w-full text-center")}
            >
              Panel sztabu
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}