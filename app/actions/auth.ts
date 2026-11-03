'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export async function loginAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim();
  const password = ((formData.get('password') as string) || '').trim();

  if (!email || !password) {
    return { success: false, error: 'Wprowadź adres e-mail i hasło.' };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (error || !authData.user) {
    return { success: false, error: 'Błędny email lub hasło.' };
  }

  // 1. Sprawdzamy rolę bezpośrednio z JWT (0 ms opóźnienia z bazy)
  let role = authData.user.app_metadata?.role;

  // 2. Tylko w ostateczności (gdyby JWT jeszcze nie miało roli) pytamy bazę danych
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    role = profile?.role;
  }

// Przekierowanie zależne od roli
  let redirectTo = '/trener';
  if (role === 'club_admin' || role === 'admin' || role === 'master_admin') {
    redirectTo = '/admin';
  } else if (role === 'coordinator' || role === 'koordynator' || role === 'analyst') {
    redirectTo = '/koordynator';
  }

  return { success: true, redirectTo };
}

export const signInAction = loginAction;

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Zoptymalizowany kontekst sesji z pamięcią podręczną per-request (React cache)
 */
export const getSessionContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Jeśli profil ma już dane w app_metadata, nie musimy odpytywać bazy
  const metaRole = user.app_metadata?.role;
  const metaClubId = user.app_metadata?.club_id;

  if (metaRole && metaClubId) {
    return {
      userId: user.id,
      clubId: metaClubId,
      role: metaRole,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Użytkownik',
    };
  }

  // Fallback bazodanowy jeśli metadane nie były zsynchronizowane
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return {
      userId: user.id,
      clubId: profile.club_id,
      role: profile.role,
      name: profile.full_name || 'Użytkownik',
    };
  }

  return null;
});