import Link from 'next/link'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase-server'
import { PitchArt, PitchMark } from '@/components/landing/mark'
import { BugReportWidget } from '@/components/bug-reports/bug-report-widget'

export const instant = false

export default async function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    await connection()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile || profile.is_active === false) {
        redirect('/login')
    }

    if (!['coordinator', 'club_admin', 'master_admin'].includes(profile.role)) {
        redirect('/trener')
    }

    return (
        <div className="relative flex min-h-screen flex-1 flex-col overflow-x-clip bg-background text-foreground">
            <PitchArt className="pointer-events-none fixed top-16 -right-[15%] block w-[680px] select-none text-foreground/10 opacity-60" />
            <PitchArt className="pointer-events-none fixed bottom-0 -left-[20%] hidden w-[600px] rotate-180 select-none text-foreground/10 opacity-40 md:block" />

            <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md">
                <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/koordynator" className="group flex items-center gap-2.5 text-foreground">
                            <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
                            <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
                        </Link>
                        <span className="hidden items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary sm:inline-flex">
                            Koordynator
                        </span>
                    </div>
                    <nav aria-label="Nawigacja koordynatora" className="flex flex-wrap items-center gap-1 text-xs font-heading uppercase tracking-wider sm:gap-2">
                        <Link href="/koordynator" className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">Przegląd klubu</Link>
                        {profile.role !== 'coordinator' && (
                            <Link href="/admin" className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">Panel administratora</Link>
                        )}
                        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                        <form action={signOutAction}>
                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground/20 px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-wider transition hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95">
                                <LogOut className="size-3.5" />
                                <span>Wyloguj</span>
                            </button>
                        </form>
                    </nav>
                </div>
            </header>
            <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
            <BugReportWidget />
        </div>
    )
}