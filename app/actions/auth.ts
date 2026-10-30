'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  
  // 1. Logowanie - zwraca od razu sesję i usera (BEZ potrzeby kolejnego getUser())
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { success: false, error: 'Błędny email lub hasło.' };
  }

  // 2. Natychmiastowe sprawdzenie roli po id usera
  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  // 3. Natychmiastowe przekierowanie serwerowe (brak laga po stronie klienta)
  const targetRoute = membership?.role === 'admin' ? '/admin' : '/trener';
  redirect(targetRoute);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Zoptymalizowany kontekst sesji
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Odpytujemy właściwą tabelę profiles ze schematu
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    clubId: profile.club_id,
    role: profile.role,
    name: profile.full_name || 'Użytkownik',
  };
}