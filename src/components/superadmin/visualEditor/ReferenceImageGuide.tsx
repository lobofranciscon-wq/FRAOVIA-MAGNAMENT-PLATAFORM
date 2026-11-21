import React, { useRef } from 'react';
import { Camera, X, Eye, EyeOff, Sliders, Image as ImageIcon, Move } from 'lucide-react';

interface ReferenceImageGuideProps {
  referenceImageUrl?: string;
  referenceImageOpacity: number;
  onUpdateImage: (url?: string) => void;
  onUpdateOpacity: (opacity: number) => void;
  isOverlayActive: boolean;
  onToggleOverlay: () => void;
}

export const ReferenceImageGuide: React.FC<ReferenceImageGuideProps> = ({
  referenceImageUrl,
  referenceImageOpacity,
  onUpdateImage,
  onUpdateOpacity,
  isOverlayActive,
  onToggleOverlay
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      onUpdateImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Imagen de Referencia</span>
          </div>
          {referenceImageUrl && (
            <button
              type="button"
              onClick={onToggleOverlay}
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition ${
                isOverlayActive 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Alternar visibilidad del calco"
            >
              {isOverlayActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isOverlayActive ? 'Visible' : 'Oculto'}</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Sube una captura o mockup de diseño para usarlo como guía visual mientras diseñas. 
          <strong className="text-slate-300 block mt-1">No modifica el sistema ni la base de datos.</strong>
        </p>

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {referenceImageUrl ? (
          <div className="space-y-3 pt-1">
            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center group">
              <img 
                src={referenceImageUrl} 
                alt="Referencia de diseño" 
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => onUpdateImage(undefined)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white transition shadow"
                title="Eliminar imagen de referencia"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slider de opacidad */}
            <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  Opacidad de Guía:
                </span>
                <span className="text-amber-400 font-mono font-bold">{referenceImageOpacity}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="90"
                step="5"
                value={referenceImageOpacity}
                onChange={(e) => onUpdateOpacity(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Translúcido (10%)</span>
                <span>Fuerte (90%)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Cambiar imagen de referencia</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 hover:text-white text-xs font-semibold flex flex-col items-center justify-center gap-2 transition cursor-pointer"
          >
            <Camera className="w-5 h-5 text-amber-400" />
            <span>📷 Subir Imagen de Referencia</span>
            <span className="text-[10px] text-slate-500 font-normal">Soporta PNG, JPG o WebP</span>
          </button>
        )}
      </div>
    </div>
  );
};
