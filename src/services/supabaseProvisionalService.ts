import { supabase } from '../lib/supabaseClient';
import { formatSupabaseError } from './supabaseDataService';
import { CoachApprovalRequest, ProvisionalPlayer } from '../types/fraovia';

/**
 * Listado provisorio (profesor) y solicitudes de alta a administración, en Supabase.
 * Agregar/borrar borradores va directo a la tabla (con permisos por rol);
 * enviar, aprobar y rechazar pasan por funciones de la base para que se guarden completas.
 */

function mapPlayer(row: any): ProvisionalPlayer {
  return {
    id: row.id,
    clubId: row.club_id,
    disciplineId: row.discipline_id,
    categoryId: row.category_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dni: row.dni,
    birthDate: row.birth_date,
    phone: row.phone || '',
    email: row.email || undefined,
    emergencyContact: row.emergency_contact || undefined,
    notes: row.notes || undefined,
    photoUrl: row.photo_url || undefined,
    coachId: row.coach_id,
    coachName: row.profiles?.full_name || '',
    createdAt: row.created_at,
    status: row.status
  };
}

export const supabaseProvisionalService = {
  async fetchAll(clubId: string): Promise<{ players: ProvisionalPlayer[]; requests: CoachApprovalRequest[] }> {
    const [pl, rq] = await Promise.all([
      supabase
        .from('provisional_players')
        .select('*, profiles!coach_id(full_name)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('coach_approval_requests')
        .select('*, profiles!coach_id(full_name), categories(name)')
        .eq('club_id', clubId)
        .order('request_date', { ascending: false })
        .limit(300)
    ]);
    if (pl.error) throw new Error(formatSupabaseError(pl.error));
    if (rq.error) throw new Error(formatSupabaseError(rq.error));

    const players = (pl.data || []).map(mapPlayer);
    const requests: CoachApprovalRequest[] = (rq.data || []).map((r: any) => ({
      id: r.id,
      clubId: r.club_id,
      coachId: r.coach_id,
      coachName: r.profiles?.full_name || '',
      categoryId: r.category_id,
      categoryName: r.categories?.name || '',
      disciplineId: r.discipline_id,
      requestDate: r.request_date,
      status: r.status,
      players: players.filter(p => (pl.data || []).find((x: any) => x.id === p.id)?.request_id === r.id),
      coachNotes: r.coach_notes || undefined,
      adminNotes: r.admin_notes || undefined,
      resolvedAt: r.resolved_at || undefined,
      resolvedByUserId: r.resolved_by_user_id || undefined
    }));
    return { players, requests };
  },

  async addProvisionalPlayer(p: Omit<ProvisionalPlayer, 'id' | 'createdAt' | 'status'>): Promise<void> {
    const { error } = await supabase.from('provisional_players').insert({
      club_id: p.clubId,
      discipline_id: p.disciplineId,
      category_id: p.categoryId,
      coach_id: p.coachId,
      first_name: p.firstName,
      last_name: p.lastName,
      dni: p.dni,
      birth_date: p.birthDate,
      phone: p.phone || null,
      email: p.email || null,
      emergency_contact: p.emergencyContact || null,
      notes: p.notes || null,
      status: 'borrador'
    });
    if (error) throw new Error(formatSupabaseError(error));
  },

  async deleteProvisionalPlayer(id: string): Promise<void> {
    const { error } = await supabase.from('provisional_players').delete().eq('id', id).eq('status', 'borrador');
    if (error) throw new Error(formatSupabaseError(error));
  },

  async submitRequest(categoryId: string, notes: string): Promise<string> {
    const { data, error } = await supabase.rpc('submit_coach_approval_request', { p_category_id: categoryId, p_notes: notes });
    if (error) throw new Error(formatSupabaseError(error));
    return data as string;
  },

  async approveOne(requestId: string, provId: string, data: Record<string, any>): Promise<void> {
    const { error } = await supabase.rpc('approve_provisional_player', {
      p_request_id: requestId,
      p_prov_id: provId,
      p_data: {
        dni: data.dni, firstName: data.firstName, lastName: data.lastName,
        birthDate: data.birthDate, phone: data.phone, email: data.email
      }
    });
    if (error) throw new Error(formatSupabaseError(error));
  },

  async approveAll(requestId: string): Promise<{ approved: number; failed: { name: string; reason: string }[] }> {
    const { data, error } = await supabase.rpc('approve_all_provisional_players', { p_request_id: requestId });
    if (error) throw new Error(formatSupabaseError(error));
    return { approved: Number(data?.approved || 0), failed: data?.failed || [] };
  },

  async reject(requestId: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('reject_coach_request', { p_request_id: requestId, p_reason: reason });
    if (error) throw new Error(formatSupabaseError(error));
  }
};
