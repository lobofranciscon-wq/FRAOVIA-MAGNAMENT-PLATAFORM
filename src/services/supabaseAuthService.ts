import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, UserRole } from '../types/fraovia';

export interface SupabaseAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export const supabaseAuthService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async signIn(email: string, password: string): Promise<SupabaseAuthResult> {
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        error: 'Supabase no está configurado. Carga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.' 
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Obtener perfil con RLS desde public.profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        return { 
          success: false, 
          error: 'Perfil de usuario no encontrado o sin acceso en la base de datos de FRAOVIA.' 
        };
      }

      // Regla de seguridad A: Solo accede quien tiene perfil con status 'activo'
      if (profile.status !== 'activo') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Tu cuenta se encuentra deshabilitada o suspendida. Comunícate con la administración de tu club o con FRAOVIA.'
        };
      }

      // Fallback a app_metadata si profile viniera sin rol/club definido
      const appMeta = data.user.app_metadata || {};
      const resolvedRole: UserRole = (profile.role || appMeta.fraovia_role || 'GENERAL') as UserRole;
      const resolvedClubId: string = profile.club_id ?? appMeta.fraovia_club_id ?? '';
      const resolvedScope = profile.scope || appMeta.fraovia_scope || { categoryIds: [], disciplineIds: [] };

      const fraoviaUser: User = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: resolvedRole,
        clubId: resolvedClubId,
        status: profile.status,
        phone: profile.phone || '',
        avatarUrl: profile.avatar_url?.trim() || undefined,
        scope: resolvedScope,
        createdAt: profile.created_at,
        lastLogin: new Date().toISOString()
      };

      return { success: true, user: fraoviaUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error inesperado de autenticación' };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  async getCurrentProfile(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'activo') {
      if (profile && profile.status !== 'activo') {
        await supabase.auth.signOut();
      }
      return null;
    }

    const appMeta = user.app_metadata || {};
    const resolvedRole: UserRole = (profile.role || appMeta.fraovia_role || 'GENERAL') as UserRole;
    const resolvedClubId: string = profile.club_id ?? appMeta.fraovia_club_id ?? '';
    const resolvedScope = profile.scope || appMeta.fraovia_scope || { categoryIds: [], disciplineIds: [] };

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: resolvedRole,
      clubId: resolvedClubId,
      status: profile.status,
      phone: profile.phone || '',
      avatarUrl: profile.avatar_url?.trim() || undefined,
      scope: resolvedScope,
      createdAt: profile.created_at,
      lastLogin: profile.last_login
    };
  }
};
