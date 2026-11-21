import { supabase } from '../lib/supabaseClient';
import { formatSupabaseError } from './supabaseDataService';

/**
 * Descuento por hermanos (grupo familiar) en Supabase.
 * Los cambios pasan siempre por funciones de la base de datos (solo Dueño y Administración),
 * que además dejan registro en la bitácora de auditoría.
 */

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  categoryId: string;
  familyDiscountPercent: number;
  scholarshipPercent: number;
  monthlyFeeDue: number;
}

export interface FamilyChange {
  id: string;
  playerId: string;
  action: 'set_percent' | 'detach';
  newPercent: number | null;
  effectiveFrom: string;
  reason?: string;
  status: 'pendiente' | 'aplicado' | 'cancelado';
}

export interface FamilyInfo {
  groupId: string | null;
  groupName: string;
  discountPercent: number;
  members: FamilyMember[];
  pending: FamilyChange[];
}

export interface PlayerSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  categoryId: string;
  familyGroupId: string | null;
}

const MEMBER_COLS = 'id, first_name, last_name, dni, category_id, family_discount_percent, scholarship_percent, monthly_fee_due';

export const supabaseFamilyService = {
  /** Estado actual y fresco del grupo familiar de un deportista. */
  async getFamily(playerId: string): Promise<FamilyInfo> {
    const { data: p, error: pe } = await supabase
      .from('players')
      .select('family_group_id')
      .eq('id', playerId)
      .single();
    if (pe) throw new Error(formatSupabaseError(pe));
    const groupId: string | null = p?.family_group_id || null;
    if (!groupId) return { groupId: null, groupName: '', discountPercent: 0, members: [], pending: [] };

    const [g, m, c] = await Promise.all([
      supabase.from('family_groups').select('id, name, discount_percent').eq('id', groupId).single(),
      supabase.from('players').select(MEMBER_COLS).eq('family_group_id', groupId).order('last_name'),
      supabase
        .from('family_discount_changes')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pendiente')
        .order('effective_from')
    ]);
    if (g.error) throw new Error(formatSupabaseError(g.error));
    if (m.error) throw new Error(formatSupabaseError(m.error));
    if (c.error) throw new Error(formatSupabaseError(c.error));

    return {
      groupId,
      groupName: g.data?.name || 'Grupo familiar',
      discountPercent: Number(g.data?.discount_percent) || 0,
      members: (m.data || []).map((r: any) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        dni: r.dni,
        categoryId: r.category_id,
        familyDiscountPercent: Number(r.family_discount_percent) || 0,
        scholarshipPercent: Number(r.scholarship_percent) || 0,
        monthlyFeeDue: Number(r.monthly_fee_due) || 0
      })),
      pending: (c.data || []).map((r: any) => ({
        id: r.id,
        playerId: r.player_id,
        action: r.action,
        newPercent: r.new_percent === null || r.new_percent === undefined ? null : Number(r.new_percent),
        effectiveFrom: r.effective_from,
        reason: r.reason || undefined,
        status: r.status
      }))
    };
  },

  async searchPlayers(term: string, excludeId: string): Promise<PlayerSearchResult[]> {
    const t = term.replace(/[,()%*\\]/g, ' ').trim();
    if (t.length < 2) return [];
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, dni, category_id, family_group_id')
      .or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,dni.ilike.%${t}%`)
      .neq('id', excludeId)
      .order('last_name')
      .limit(8);
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map((r: any) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      dni: r.dni,
      categoryId: r.category_id,
      familyGroupId: r.family_group_id || null
    }));
  },

  async linkPlayers(playerId: string, otherId: string, percent: number): Promise<string> {
    const { data, error } = await supabase.rpc('family_link_players', {
      p_player_id: playerId,
      p_other_id: otherId,
      p_percent: percent
    });
    if (error) throw new Error(formatSupabaseError(error));
    return data as string;
  },

  async setPercent(groupId: string, percent: number, effectiveFrom: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('family_set_percent', {
      p_group_id: groupId,
      p_percent: percent,
      p_effective_from: effectiveFrom,
      p_reason: reason || null
    });
    if (error) throw new Error(formatSupabaseError(error));
  },

  async memberLeave(playerId: string, remainingPercent: number, effectiveFrom: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('family_member_leave', {
      p_player_id: playerId,
      p_remaining_percent: remainingPercent,
      p_effective_from: effectiveFrom,
      p_reason: reason || null
    });
    if (error) throw new Error(formatSupabaseError(error));
  },

  async cancelChange(changeId: string): Promise<void> {
    const { error } = await supabase.rpc('family_cancel_change', { p_change_id: changeId });
    if (error) throw new Error(formatSupabaseError(error));
  },

  /** Aplica los cambios programados que ya llegaron a su fecha. Devuelve cuántos aplicó. */
  async applyDue(): Promise<number> {
    const { data, error } = await supabase.rpc('apply_due_family_changes');
    if (error) throw new Error(formatSupabaseError(error));
    return Number(data) || 0;
  }
};
