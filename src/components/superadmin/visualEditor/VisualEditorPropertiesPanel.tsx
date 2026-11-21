import React, { useRef } from 'react';
import { 
  Sliders, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Type, 
  Image as ImageIcon, 
  Layers, 
  Palette, 
  Sparkles, 
  Move, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize2,
  Upload,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { VisualElement, BackgroundConfig } from './visualEditorTypes';

interface VisualEditorPropertiesPanelProps {
  selectedElement: VisualElement | null;
  onUpdateElement: (updated: VisualElement) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  backgroundConfig: BackgroundConfig;
  onUpdateBackgroundConfig: (updated: BackgroundConfig) => void;
}

export const VisualEditorPropertiesPanel: React.FC<VisualEditorPropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  backgroundConfig,
  onUpdateBackgroundConfig
}) => {
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const generalBgInputRef = useRef<HTMLInputElement>(null);

  // Helper for uploading element image
  const handleElementImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (selectedElement.type === 'banner' || selectedElement.type === 'image_block') {
        onUpdateElement({
          ...selectedElement,
          bgImageUrl: dataUrl,
          imageUrl: dataUrl,
          bgType: 'image'
        });
      } else {
        onUpdateElement({
          ...selectedElement,
          bgImageUrl: dataUrl,
          bgType: 'image'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper for uploading general background
  const handleGeneralBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      onUpdateBackgroundConfig({
        ...backgroundConfig,
        type: 'image',
        imageUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  // IF NO ELEMENT IS SELECTED: Show general canvas / background properties
  if (!selectedElement) {
    return (
      <div className="w-80 bg-[#0B132B] border-l border-slate-800 p-4 overflow-y-auto space-y-5 text-slate-100 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Palette className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-sm text-white">Fondo General del Sistema</h3>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Configuración del fondo maestro que envuelve la pantalla del club.
        </p>

        {/* Tipo de Fondo */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 block">Tipo de Fondo</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {(['color', 'gradient', 'image'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => onUpdateBackgroundConfig({ ...backgroundConfig, type })}
                className={`py-1.5 rounded-lg text-center font-bold text-[11px] capitalize transition cursor-pointer ${
                  backgroundConfig.type === type 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'color' ? 'Color' : type === 'gradient' ? 'Degradado' : 'Imagen'}
              </button>
            ))}
          </div>
        </div>

        {/* Fondo Color / Imagen */}
        {backgroundConfig.type === 'color' && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">Color de Fondo</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={backgroundConfig.color || '#070D1E'}
                onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input 
                type="text" 
                value={backgroundConfig.color || '#070D1E'}
                onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, color: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}

        {backgroundConfig.type === 'image' && (
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-300 block">Imagen de Fondo</label>
            <input 
              ref={generalBgInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleGeneralBgUpload} 
            />
            <button
              type="button"
              onClick={() => generalBgInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 text-slate-300 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Subir imagen desde mi PC</span>
            </button>

            {/* Presets de imágenes de fondo deportivas */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Fondos recomendados:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Estadio Nocturno', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80' },
                  { label: 'Cancha Césped', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80' },
                  { label: 'Arena Luces', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdateBackgroundConfig({ ...backgroundConfig, imageUrl: preset.url })}
                    className="p-1 rounded-lg border border-slate-800 hover:border-amber-400 group overflow-hidden transition"
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-10 object-cover rounded" />
                    <span className="text-[9px] text-slate-400 block truncate mt-1">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sliders: Opacidad, Desenfoque, Overlay */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Opacidad del Fondo:</span>
              <span className="text-amber-400 font-bold font-mono">{backgroundConfig.opacity}%</span>
            </div>
            <input 
              type="range"
              min="10"
              max="100"
              step="5"
              value={backgroundConfig.opacity}
              onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, opacity: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Desenfoque (Blur):</span>
              <span className="text-amber-400 font-bold font-mono">{backgroundConfig.blur}px</span>
            </div>
            <input 
              type="range"
              min="0"
              max="20"
              step="1"
              value={backgroundConfig.blur}
              onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, blur: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Overlay Oscuro:</span>
              <span className="text-amber-400 font-bold font-mono">{backgroundConfig.overlayDarkness}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="90"
              step="5"
              value={backgroundConfig.overlayDarkness}
              onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, overlayDarkness: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <span className="text-amber-400 font-bold block">💡 Consejo de Diseño</span>
          <p>
            Haz clic en cualquier tarjeta o elemento del centro para editar su posición, textos, bordes y nivel de transparencia.
          </p>
        </div>
      </div>
    );
  }

  // ELEMENT PROPERTIES PANEL
  return (
    <div className="w-80 bg-[#0B132B] border-l border-slate-800 p-4 overflow-y-auto space-y-5 text-slate-100 text-xs">
      {/* Top element info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
            {selectedElement.type.replace('_', ' ')}
          </span>
          <h3 className="font-extrabold text-sm text-white mt-1 truncate max-w-[170px]">
            {selectedElement.title || 'Elemento'}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Duplicar elemento"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateElement({ ...selectedElement, isVisible: !selectedElement.isVisible })}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedElement.isVisible 
                ? 'bg-slate-800 text-slate-300 hover:text-white' 
                : 'bg-amber-500/20 text-amber-300'
            }`}
            title={selectedElement.isVisible ? 'Ocultar elemento' : 'Mostrar elemento'}
          >
            {selectedElement.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition cursor-pointer"
            title="Eliminar elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* POSICIÓN Y TAMAÑO (COLUMNAS 1 A 12) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            Ancho (Columnas Grid):
          </label>
          <span className="text-amber-400 font-mono font-bold">{selectedElement.colSpan} / 12</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {[2, 3, 4, 6, 8, 12].map(cols => (
            <button
              key={cols}
              type="button"
              onClick={() => onUpdateElement({ ...selectedElement, colSpan: cols })}
              className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition ${
                selectedElement.colSpan === cols
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cols === 12 ? 'Full' : `${cols} col`}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO & TEXTOS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          Textos & Contenido
        </label>

        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">Título / Texto Principal</span>
            <input 
              type="text"
              value={selectedElement.title}
              onChange={(e) => onUpdateElement({ ...selectedElement, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {selectedElement.subtitle !== undefined && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Subtítulo / Bajada</span>
              <input 
                type="text"
                value={selectedElement.subtitle || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, subtitle: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {selectedElement.value !== undefined && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Valor / Número</span>
              <input 
                type="text"
                value={selectedElement.value || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, value: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {selectedElement.badgeText !== undefined && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Etiqueta / Badge</span>
              <input 
                type="text"
                value={selectedElement.badgeText || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, badgeText: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {selectedElement.buttonText !== undefined && (
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Texto de Botón</span>
              <input 
                type="text"
                value={selectedElement.buttonText || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, buttonText: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* SUBIR O CAMBIAR IMAGEN DEL ELEMENTO (SI TIENE) */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          Imagen del Elemento
        </label>
        <input 
          ref={imageUploadInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleElementImageUpload} 
        />
        <button
          type="button"
          onClick={() => imageUploadInputRef.current?.click()}
          className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:border-amber-400 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>{selectedElement.bgImageUrl || selectedElement.imageUrl ? 'Reemplazar imagen' : 'Subir imagen desde PC'}</span>
        </button>
      </div>

      {/* FONDO & TRANSPARENCIA (GLASSMORPHISM) */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Fondo & Transparencia
        </label>

        {/* Tipo de Fondo */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          {(['color', 'gradient', 'image', 'transparent'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdateElement({ ...selectedElement, bgType: type })}
              className={`py-1 rounded-md text-center font-bold text-[10px] capitalize transition ${
                selectedElement.bgType === type 
                  ? 'bg-amber-500 text-slate-950' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'color' ? 'Color' : type === 'gradient' ? 'Grad.' : type === 'image' ? 'Img' : 'Transp.'}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={selectedElement.bgColor || '#0B132B'}
            onChange={(e) => onUpdateElement({ ...selectedElement, bgColor: e.target.value })}
            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
          />
          <input 
            type="text" 
            value={selectedElement.bgColor || '#0B132B'}
            onChange={(e) => onUpdateElement({ ...selectedElement, bgColor: e.target.value })}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
          />
        </div>

        {/* Slider de Transparencia / Opacidad */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Opacidad / Transparencia:</span>
            <span className="text-amber-400 font-bold font-mono">{selectedElement.opacity}%</span>
          </div>
          <input 
            type="range"
            min="10"
            max="100"
            step="5"
            value={selectedElement.opacity}
            onChange={(e) => onUpdateElement({ ...selectedElement, opacity: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Slider de Desenfoque (Blur) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Desenfoque (Backdrop Blur):</span>
            <span className="text-amber-400 font-bold font-mono">{selectedElement.blur}px</span>
          </div>
          <input 
            type="range"
            min="0"
            max="20"
            step="1"
            value={selectedElement.blur}
            onChange={(e) => onUpdateElement({ ...selectedElement, blur: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* BORDES & SOMBRAS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 block">Bordes & Redondeo</label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Grosor de borde:</span>
            <select
              value={selectedElement.borderWidth}
              onChange={(e) => onUpdateElement({ ...selectedElement, borderWidth: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value={0}>Sin borde (0px)</option>
              <option value={1}>Fino (1px)</option>
              <option value={2}>Medio (2px)</option>
              <option value={3}>Grueso (3px)</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Redondeo:</span>
            <select
              value={selectedElement.borderRadius}
              onChange={(e) => onUpdateElement({ ...selectedElement, borderRadius: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="rounded-none">Recto</option>
              <option value="rounded-xl">Suave (xl)</option>
              <option value="rounded-2xl">Moderno (2xl)</option>
              <option value="rounded-3xl">Pill suave (3xl)</option>
            </select>
          </div>
        </div>

        {/* Color de acento / borde */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 block">Color de Acento:</span>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={selectedElement.accentColor || '#38BDF8'}
              onChange={(e) => onUpdateElement({ 
                ...selectedElement, 
                accentColor: e.target.value,
                borderColor: `${e.target.value}40`
              })}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <input 
              type="text" 
              value={selectedElement.accentColor || '#38BDF8'}
              onChange={(e) => onUpdateElement({ ...selectedElement, accentColor: e.target.value })}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* TIPOGRAFÍA */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 block">Tipografía</label>
        <select
          value={selectedElement.fontFamily}
          onChange={(e) => onUpdateElement({ ...selectedElement, fontFamily: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
        >
          <option value="Inter">Inter (Elegante / Moderno)</option>
          <option value="Montserrat">Montserrat (Impacto Deportivo)</option>
          <option value="Space Grotesk">Space Grotesk (Tech / Vanguardia)</option>
          <option value="Oswald">Oswald (Titulares Fuertes)</option>
          <option value="system-ui">Sistema / Clásico</option>
        </select>
      </div>
    </div>
  );
};
