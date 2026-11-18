import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { BugReportWidget } from '@/components/bug-reports/bug-report-widget'
import { AssistantWidget } from '@/components/assistant/assistant-widget'
import { CoordinatorNav } from '@/components/coordinator/coordinator-nav'

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
        <div className="min-h-screen bg-background text-foreground">
            <CoordinatorNav canManageClub={profile.role !== 'coordinator'} />
            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
            <AssistantWidget key={user.id} userId={user.id} />
            <BugReportWidget />
        </div>
    )
}