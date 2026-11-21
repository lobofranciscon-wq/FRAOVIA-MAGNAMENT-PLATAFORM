import { supabase } from '../lib/supabaseClient';
import { formatSupabaseError, mapReceiptFromDb } from './supabaseDataService';
import { AttendanceRecord, PaymentMethod, Receipt, TripParticipant, TripTournament } from '../types/fraovia';

/**
 * Viajes/torneos y asistencia en Supabase.
 * Las operaciones que tocan dinero o varias tablas pasan por funciones de la base (RPC)
 * para que se guarden completas o no se guarden.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRealId = (id: string | undefined | null): boolean => !!id && UUID_RE.test(id);

function participantStatus(paid: number, total: number): TripParticipant['status'] {
  if (total > 0 && paid >= total) return 'al_dia';
  if (paid > 0) return 'en_pagos';
  return 'pendiente';
}

function mapTripFromDb(row: any): TripTournament {
  const participants: TripParticipant[] = (row.tournament_players || [])
    .filter((tp: any) => tp.status !== 'baja')
    .map((tp: any) => {
      const pl = tp.players || {};
      const total = Number(tp.total_cost ?? row.total_cost_per_player ?? 0);
      const paid = Number(tp.amount_paid || 0);
      return {
        playerId: tp.player_id,
        playerFullName: `${pl.last_name || ''}, ${pl.first_name || ''}`.trim(),
        playerDni: pl.dni || '',
        originalCategoryId: pl.category_id || undefined,
        originalCategoryName: pl.categories?.name || 'General',
        tutorName: tp.tutor_name || pl.emergency_contact?.name || undefined,
        tutorPhone: tp.tutor_phone || pl.emergency_contact?.phone || undefined,
        totalCost: total,
        amountPaid: paid,
        notes: tp.notes || undefined,
        status: participantStatus(paid, total)
      } as TripParticipant;
    })
    .sort((a: TripParticipant, b: TripParticipant) => a.playerFullName.localeCompare(b.playerFullName));

  const statusMap: Record<string, TripTournament['status']> = {
    planificacion: 'planificacion',
    inscripciones: 'en_recaudacion',
    en_recaudacion: 'en_recaudacion',
    confirmado: 'confirmado',
    en_curso: 'viajando',
    viajando: 'viajando',
    finalizado: 'finalizado'
  };

  return {
    id: row.id,
    clubId: row.club_id,
    tournamentName: row.name,
    destination: row.location,
    datesDescription: row.dates_description || '',
    categoryDescription: row.category_description || '',
    coachesInCharge: row.coaches_in_charge || '',
    costPerPlayer: Number(row.total_cost_per_player || 0),
    bannerImageUrl: row.banner_image_url || undefined,
    cashBoxId: row.cash_box_id || '',
    status: statusMap[row.status] || 'en_recaudacion',
    participants,
    createdAt: row.created_at
  };
}

function tripDataToDb(t: Partial<TripTournament>) {
  const d: Record<string, any> = {};
  if (t.tournamentName !== undefined) d.name = t.tournamentName;
  if (t.destination !== undefined) d.location = t.destination;
  if (t.costPerPlayer !== undefined) d.costPerPlayer = t.costPerPlayer;
  if (t.status !== undefined) d.status = t.status;
  if (t.datesDescription !== undefined) d.datesDescription = t.datesDescription;
  if (t.categoryDescription !== undefined) d.categoryDescription = t.categoryDescription;
  if (t.coachesInCharge !== undefined) d.coachesInCharge = t.coachesInCharge;
  if (t.bannerImageUrl !== undefined) d.bannerImageUrl = t.bannerImageUrl;
  return d;
}

function participantsToDb(list: TripParticipant[]) {
  // Los convocados "externos" (sin ficha en el padrón) no se pueden guardar en la base
  return list
    .filter(p => isRealId(p.playerId))
    .map(p => ({
      playerId: p.playerId,
      totalCost: p.totalCost,
      tutorName: p.tutorName || null,
      tutorPhone: p.tutorPhone || null,
      notes: p.notes || null
    }));
}

export const supabaseTripService = {
  async fetchTrips(clubId: string): Promise<TripTournament[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, tournament_players(*, players(first_name, last_name, dni, category_id, emergency_contact, categories(name)))')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapTripFromDb);
  },

  async createTrip(
    data: Omit<TripTournament, 'id' | 'createdAt' | 'cashBoxId'>
  ): Promise<string> {
    const { data: id, error } = await supabase.rpc('create_trip', {
      p_data: tripDataToDb(data),
      p_participants: participantsToDb(data.participants || [])
    });
    if (error) throw new Error(formatSupabaseError(error));
    return id as string;
  },

  async getTrip(tripId: string): Promise<TripTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, tournament_players(*, players(first_name, last_name, dni, category_id, emergency_contact, categories(name)))')
      .eq('id', tripId)
      .single();
    if (error || !data) throw new Error(formatSupabaseError(error));
    return mapTripFromDb(data);
  },

  async updateTrip(trip: TripTournament): Promise<void> {
    const { error } = await supabase.rpc('update_trip', {
      p_trip_id: trip.id,
      p_data: tripDataToDb(trip),
      p_participants: participantsToDb(trip.participants || [])
    });
    if (error) throw new Error(formatSupabaseError(error));
  },

  async recordTripPayment(
    tripId: string, playerId: string, amount: number, method: PaymentMethod, notes: string
  ): Promise<Receipt> {
    const { data, error } = await supabase.rpc('record_trip_payment', {
      p_trip_id: tripId, p_player_id: playerId, p_amount: amount, p_payment_method: method, p_notes: notes || ''
    });
    if (error) throw new Error(formatSupabaseError(error));
    const receiptId = (data as any)?.receipt_id;
    const { data: rec, error: recErr } = await supabase.from('receipts').select('*').eq('id', receiptId).single();
    if (recErr || !rec) throw new Error('El cobro se registró, pero no se pudo leer el comprobante: ' + formatSupabaseError(recErr));
    return mapReceiptFromDb(rec);
  },

  // ----------------------------------------------------------------------------
  // ASISTENCIA
  // ----------------------------------------------------------------------------
  async fetchAttendance(clubId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*, attendance_entries(*)')
      .eq('club_id', clubId)
      .order('date', { ascending: false })
      .limit(500);
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map((s: any) => ({
      id: s.id,
      clubId: s.club_id,
      categoryId: s.category_id,
      date: s.date,
      sessionTitle: s.session_title,
      recordedByUserId: s.recorded_by_user_id,
      isSuspended: !!s.is_suspended,
      suspensionReason: s.suspension_reason || undefined,
      suspensionNotes: s.suspension_notes || undefined,
      entries: (s.attendance_entries || []).map((e: any) => ({
        playerId: e.player_id,
        status: e.status,
        notes: e.notes || undefined
      }))
    }));
  },

  async recordAttendance(rec: Omit<AttendanceRecord, 'id'>): Promise<void> {
    const { error } = await supabase.rpc('record_attendance', {
      p_category_id: rec.categoryId,
      p_date: rec.date,
      p_title: rec.sessionTitle,
      p_entries: rec.entries.map(e => ({ playerId: e.playerId, status: e.status, notes: e.notes || null })),
      p_suspended: !!rec.isSuspended,
      p_reason: rec.isSuspended ? (rec.suspensionReason || null) : null,
      p_notes: rec.isSuspended ? (rec.suspensionNotes || null) : null
    });
    if (error) throw new Error(formatSupabaseError(error));
  }
};
