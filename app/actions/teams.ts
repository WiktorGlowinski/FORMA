'use server';

import { createClient } from '@/lib/supabase-server';

export interface TeamItem {
  id: string;
  name: string;
  ageCategory?: string;
  playersCount?: number;
}

export async function getClubTeams(clubId: string): Promise<{
  success: boolean;
  teams: TeamItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        age_category,
        players (count)
      `)
      .eq('club_id', clubId)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message, teams: [] };
    }

    const teams = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      ageCategory: t.age_category,
      playersCount: t.players?.[0]?.count || 0,
    }));

    return { success: true, teams };
  } catch (err: any) {
    return { success: false, error: err.message, teams: [] };
  }
}