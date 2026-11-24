"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NAV, PAGE_LINKS } from "@/components/landing/copy";
import { PitchMark } from "@/components/landing/mark";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  function close() {
    setOpen(false);
  }

  function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, targetId: string) {
    e.preventDefault();
    close();

    if (!onHome) {
      window.location.assign(`/#${targetId}`);
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: topOffset,
        behavior: "smooth",
      });
      window.history.pushState(null, "", `#${targetId}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground/15 bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 text-foreground" onClick={close}>
          <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex" aria-label="Sekcje strony">
          {NAV.map((item) => {
            const targetId = item.href.replace("#", "");
            return (
              <a
                key={item.href}
                href={onHome ? item.href : `/${item.href}`}
                onClick={(e) => scrollToSection(e, targetId)}
                className="pitch-link cursor-pointer"
              >
                {item.label}
              </a>
            );
          })}
          {PAGE_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("pitch-link", pathname === item.href && "text-foreground")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/demo"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 border-2 border-foreground/20 px-4 transition-transform hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--foreground)]"
            )}
          >
            Wypróbuj demo
          </Link>
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

      {open ? (
        <div id="menu-mobilne" className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Sekcje strony">
            {NAV.map((item) => {
              const targetId = item.href.replace("#", "");
              return (
                <a
                  key={item.href}
                  href={onHome ? item.href : `/${item.href}`}
                  onClick={(e) => scrollToSection(e, targetId)}
                  className="pitch-link rounded-lg px-3 py-3 text-base hover:bg-accent"
                >
                  {item.label}
                </a>
              );
            })}
            {PAGE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="pitch-link rounded-lg px-3 py-3 text-base hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/demo"
              onClick={close}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full border-2 border-foreground/20 text-center"
              )}
            >
              Wypróbuj demo
            </Link>
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