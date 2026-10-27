'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface CsvPlayerRecord {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  birthYear?: number;
  primaryPosition?: string;
}

/**
 * 1. Masowy import zawodników z pliku CSV bezpośrednio do danej drużyny
 */
export async function importPlayersBatch(
  clubId: string,
  teamId: string,
  records: CsvPlayerRecord[]
) {
  try {
    if (!records || records.length === 0) {
      return { success: false, error: 'Przekazano pustą listę zawodników.' };
    }

    // Mapowanie na kolumny bazy danych
    const rowsToInsert = records.map((p) => {
      if (!p.firstName?.trim() || !p.lastName?.trim()) {
        throw new Error('Każdy zawodnik musi posiadać imię i nazwisko.');
      }

      return {
        club_id: clubId,
        current_team_id: teamId,
        first_name: p.firstName.trim(),
        last_name: p.lastName.trim(),
        jersey_number: p.jerseyNumber ? Number(p.jerseyNumber) : null,
        birth_year: p.birthYear ? Number(p.birthYear) : null,
        primary_position: p.primaryPosition?.trim() || null,
        status: 'active',
      };
    });

    const { data, error } = await supabaseAdmin
      .from('players')
      .insert(rowsToInsert)
      .select('id, first_name, last_name, jersey_number');

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      importedCount: data.length, 
      players: data 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Pobranie listy zawodników danej drużyny wraz z ich aktualnym statusem
 */
export async function getTeamPlayersList(teamId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, jersey_number, birth_year, status')
      .eq('current_team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false })
      .order('last_name', { ascending: true });

    if (error) {
      return { success: false, error: error.message, players: [] };
    }

    return { success: true, players: data };
  } catch (err: any) {
    return { success: false, error: err.message, players: [] };
  }
}