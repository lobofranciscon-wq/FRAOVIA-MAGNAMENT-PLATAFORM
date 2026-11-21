import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { playerPhotoService } from '../../services/playerPhotoService';

interface PlayerImageProps {
  photoPathOrUrl?: string | null;
  alt: string;
  className?: string;
  fallbackInitials?: string;
}

/**
 * Componente oficial de visualización de fotos de jugadores.
 * 
 * Regla de oro:
 * En players.photo_url se almacena la RUTA (club_id/uuid.ext).
 * Este componente invoca automáticamente playerPhotoService.getSignedUrl()
 * (usando createSignedUrl de Supabase Storage) para resolver y mostrar la imagen.
 */
export const PlayerImage: React.FC<PlayerImageProps> = ({
  photoPathOrUrl,
  alt,
  className = 'w-full h-full object-cover',
  fallbackInitials
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cleanPath = photoPathOrUrl?.trim();
    if (!cleanPath) {
      setResolvedUrl('');
      setHasError(false);
      return;
    }

    // Si ya es una URL absoluta o blob/data-url, usarla directamente
    if (
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('blob:') ||
      cleanPath.startsWith('data:')
    ) {
      setResolvedUrl(cleanPath);
      setHasError(false);
      return;
    }

    // Es una ruta de storage (club_id/uuid.ext): generar URL firmada con createSignedUrl
    playerPhotoService.getSignedUrl(cleanPath)
      .then(url => {
        if (isMounted) {
          if (url && url.trim()) {
            setResolvedUrl(url.trim());
            setHasError(false);
          } else {
            setHasError(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [photoPathOrUrl]);

  if (!resolvedUrl || !resolvedUrl.trim() || hasError) {
    return (
      <div className={`bg-slate-800 text-slate-300 flex items-center justify-center font-bold ${className}`}>
        {fallbackInitials ? (
          <span>{fallbackInitials}</span>
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-slate-400" />
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
