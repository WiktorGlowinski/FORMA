'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: 'Błędny email lub hasło.' };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Zwraca zweryfikowany kontekst zalogowanego użytkownika (ID, Klub, Rola)
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Pobierz klub i rolę tego usera
  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, role, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  return {
    userId: user.id,
    clubId: membership.club_id,
    role: membership.role,
    name: `${membership.first_name} ${membership.last_name}`,
  };
}