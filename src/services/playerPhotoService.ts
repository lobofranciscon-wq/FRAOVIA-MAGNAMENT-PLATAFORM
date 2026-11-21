import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface UploadPhotoResult {
  filePath: string;
  signedUrl: string;
}

/**
 * Servicio de almacenamiento para fotos de jugadores (Supabase Storage).
 * 
 * Reglas de seguridad:
 * 1. Bucket privado/restringido: 'players'
 * 2. Estructura de ruta atómica: {club_id}/{uuid}.{ext}
 * 3. Lectura protegida: Se generan exclusivamente URLs firmadas mediante createSignedUrl().
 *    NO se utiliza getPublicUrl() en el bucket 'players'.
 */
export const playerPhotoService = {
  /**
   * Sube la foto del jugador al bucket 'players' bajo la ruta {club_id}/{uuid}.{ext}
   * y retorna inmediatamente una URL firmada con validez temporal.
   */
  async uploadPlayerPhoto(
    clubId: string,
    file: File
  ): Promise<UploadPhotoResult> {
    if (!isSupabaseConfigured()) {
      // Modo local/fallback para desarrollo sin credenciales
      const fakeUuid = crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`;
      const fakePath = `${clubId}/${fakeUuid}.jpg`;
      const localUrl = URL.createObjectURL(file);
      return { filePath: fakePath, signedUrl: localUrl };
    }

    // Extraer extensión del archivo o por defecto jpg
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileUuid = crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${clubId}/${fileUuid}.${extension}`;

    // Subida a Supabase Storage en el bucket 'players'
    const { error: uploadError } = await supabase.storage
      .from('players')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error('Error al subir foto de jugador a Supabase Storage:', uploadError);
      throw new Error(`Error al subir foto: ${uploadError.message}`);
    }

    // Generar URL firmada con vencimiento en segundos (1 hora = 3600s)
    const signedUrl = await this.getSignedUrl(filePath);

    return {
      filePath,
      signedUrl
    };
  },

  /**
   * Obtiene una URL firmada temporal (createSignedUrl) para visualizar la foto del jugador.
   * Validez por defecto: 1 hora (3600 segundos).
   */
  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!filePath) return '';
    
    // Si ya es un data-url o URL absoluta externa (ej. Unsplash de prueba), devolverla directamente
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:') || filePath.startsWith('data:')) {
      return filePath;
    }

    if (!isSupabaseConfigured()) {
      return filePath;
    }

    const { data, error } = await supabase.storage
      .from('players')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('No se pudo generar createSignedUrl para foto:', filePath, error);
      return '';
    }

    return data.signedUrl;
  }
};
