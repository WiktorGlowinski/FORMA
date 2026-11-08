'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { headers } from 'next/headers';

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
  if (role === 'master_admin') {
    redirectTo = '/master-admin';
  } else if (role === 'club_admin' || role === 'admin') {
    redirectTo = '/admin';
  } else if (role === 'coordinator' || role === 'koordynator' || role === 'analyst') {
    redirectTo = '/koordynator';
  }

  const mustChangePassword = authData.user.user_metadata?.must_change_password === true;

  return {
    success: true,
    redirectTo: mustChangePassword ? '/ustaw-haslo' : redirectTo,
  };
}

export const signInAction = loginAction;

export async function changePasswordAction(formData: FormData) {
  const password = ((formData.get('password') as string) || '').trim();
  const confirmation = ((formData.get('confirmation') as string) || '').trim();

  if (password.length < 6) {
    return { success: false, error: 'Hasło musi mieć co najmniej 6 znaków.' };
  }
  if (password !== confirmation) {
    return { success: false, error: 'Hasła muszą być identyczne.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: 'Sesja wygasła. Zaloguj się ponownie.' };

  const { error } = await supabase.auth.updateUser({
    password,
    data: { ...user.user_metadata, must_change_password: false },
  });
  if (error) return { success: false, error: error.message };

  return { success: true };
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  if (!email) return { success: false, error: 'Wprowadź adres e-mail.' };

  const requestHeaders = await headers();
  const referer = requestHeaders.get('referer');
  const origin = requestHeaders.get('origin') || (referer ? new URL(referer).origin : null);
  if (!origin) return { success: false, error: 'Nie udało się ustalić adresu aplikacji.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-hasla`,
  });
  if (error) return { success: false, error: 'Nie udało się wysłać wiadomości resetującej.' };

  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const password = ((formData.get('password') as string) || '').trim();
  const confirmation = ((formData.get('confirmation') as string) || '').trim();
  if (password.length < 6) return { success: false, error: 'Hasło musi mieć co najmniej 6 znaków.' };
  if (password !== confirmation) return { success: false, error: 'Hasła muszą być identyczne.' };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: 'Link resetujący wygasł. Poproś o nowy.' };

  const { error } = await supabase.auth.updateUser({
    password,
    data: { ...user.user_metadata, must_change_password: false },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

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