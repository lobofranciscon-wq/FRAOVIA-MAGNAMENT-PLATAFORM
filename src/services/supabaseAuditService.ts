import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface AuditLogPayload {
  clubId?: string;
  userId?: string;
  userName?: string;
  role?: string;
  action: string;
  detail: string;
  category?: 'seguridad' | 'caja' | 'planes' | 'jugadores' | 'becas' | 'sistema' | 'superadmin' | 'tienda' | 'asistencia' | 'viajes' | 'torneos' | 'configuracion' | 'usuarios' | 'deportivo' | 'administracion';
  [key: string]: any;
}

/**
 * Servicio de auditoría institucional inmutable.
 * 
 * Regla de oro de seguridad:
 * Todo registro de auditoría se inserta ÚNICAMENTE invocando el procedimiento almacenado
 * de base de datos `log_audit(p_action, p_detail, p_category)` con `supabase.rpc('log_audit', ...)`.
 * El club_id y los datos del operador los resuelve automáticamente la base de datos desde auth.uid().
 * No existen inserts directos a la tabla `audit_logs` desde el cliente frontend.
 */
export const supabaseAuditService = {
  /**
   * Registra un evento en la bitácora inmutable invocando la función RPC 'log_audit' con exactamente 3 parámetros.
   */
  async logAudit(payload: AuditLogPayload): Promise<string | null> {
    const { action, detail, category = 'sistema' } = payload;

    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_audit', {
        p_action: action,
        p_detail: detail,
        p_category: category
      });

      if (error) {
        console.error('Error al registrar auditoría vía supabase.rpc("log_audit"):', error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('Excepción al registrar auditoría en Supabase:', err);
      return null;
    }
  },

  /**
   * Consulta el historial de auditoría respetando RLS
   */
  async getAuditLogs(clubId?: string | null, limit: number = 100) {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error al consultar audit_logs:', error);
      return [];
    }

    return data || [];
  }
};
