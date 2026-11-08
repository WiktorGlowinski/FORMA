"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { PitchMark } from "@/components/landing/mark";
import { cn } from "@/lib/utils";

export function MasterAdminNavbar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/master-admin" className="flex items-center gap-2.5">
          <PitchMark className="size-7 text-primary" />
          <span className="font-heading text-2xl uppercase">Forma</span>
          <span className="hidden rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary sm:inline">
            Master Admin
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/master-admin"
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase", pathname === "/master-admin" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutDashboard className="size-4" /> Panel
          </Link>
          <span className="hidden font-mono text-xs text-muted-foreground md:inline">{name}</span>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border-2 border-foreground/15 px-3 py-2 text-xs font-bold uppercase hover:border-destructive hover:text-destructive">
              <LogOut className="size-3.5" /> <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
