import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserRole } from '../types/fraovia';

export interface CreateClubUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  clubId?: string;
  phone?: string;
  scope?: {
    categoryIds?: string[];
    disciplineIds?: string[];
  };
}

/**
 * Servicio de administración de usuarios y miembros del personal.
 * 
 * Regla de seguridad:
 * - El registro público (signUp) está deshabilitado.
 * - Toda alta de usuario operativo se delega a la Supabase Edge Function `create-club-user`
 *   usando tokens verificados del llamador y service_role aislado en el servidor.
 */
export const supabaseUserService = {
  /**
   * Invoca la Edge Function create-club-user para crear un usuario de forma segura
   */
  async createClubUser(payload: CreateClubUserPayload) {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        user: {
          id: `local-usr-${Date.now()}`,
          email: payload.email,
          full_name: payload.fullName,
          role: payload.role,
          club_id: payload.clubId,
          status: 'activo'
        }
      };
    }

    // Invocación a la Edge Function de Supabase
    const { data, error } = await supabase.functions.invoke('create-club-user', {
      body: payload
    });

    if (error) {
      console.error('Error al invocar Edge Function create-club-user:', error);
      // Cuando la función responde con error, el mensaje útil viene en el cuerpo de la respuesta
      let detail = '';
      try {
        const body = await (error as any).context?.json?.();
        detail = body?.error || '';
      } catch { /* sin cuerpo legible */ }
      const msg = String(error.message || '');
      if (!detail && /not found|404|Failed to send a request|fetch/i.test(msg)) {
        detail = 'La función create-club-user no está publicada en Supabase o no responde. Publicala desde Supabase → Edge Functions.';
      }
      throw new Error(detail || msg || 'Error del servidor al crear usuario');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  },

  /**
   * Consulta perfiles de usuarios de la institución respetando RLS
   */
  async getClubProfiles(clubId?: string) {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('profiles').select('*');
    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error al consultar perfiles en Supabase:', error);
      return [];
    }

    return data || [];
  }
};
