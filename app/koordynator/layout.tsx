import Link from 'next/link'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase-server'

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
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile || !['coordinator', 'club_admin', 'master_admin'].includes(profile.role)) {
        redirect('/trener')
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b-2 border-foreground/15 bg-card">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                    <Link href="/koordynator" className="font-heading text-2xl font-bold uppercase">FORMA · Koordynator</Link>
                    <nav aria-label="Nawigacja koordynatora" className="flex items-center gap-4 text-sm">
                        <Link href="/koordynator" className="font-semibold hover:text-primary">Przegląd klubu</Link>
                        {profile.role !== 'coordinator' && (
                            <Link href="/admin" className="hover:text-primary">Panel administratora</Link>
                        )}
                        <form action={signOutAction}>
                            <button type="submit" className="font-semibold underline underline-offset-4">Wyloguj</button>
                        </form>
                    </nav>
                </div>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
    )
}