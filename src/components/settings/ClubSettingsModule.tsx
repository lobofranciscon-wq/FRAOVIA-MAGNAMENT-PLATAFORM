import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Save, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw,
  Upload,
  X,
  FileImage,
  Sliders,
  Eye
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { fileToCompressedDataUrl } from '../../utils/imageOptimizer';

interface ClubSettingsModuleProps {
  currentClub: Club;
  currentUser: User;
  onBrandingUpdated: () => void;
}

export const ClubSettingsModule: React.FC<ClubSettingsModuleProps> = ({
  currentClub,
  currentUser,
  onBrandingUpdated
}) => {
  const [primaryColor, setPrimaryColor] = useState(currentClub.branding.primaryColor || '#0284C7');
  const [secondaryColor, setSecondaryColor] = useState(currentClub.branding.secondaryColor || '#0369A1');
  const [logoUrl, setLogoUrl] = useState(currentClub.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState(currentClub.branding.coverUrl || '');
  const [watermarkUrl, setWatermarkUrl] = useState(currentClub.branding.watermarkUrl || currentClub.logoUrl || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(currentClub.branding.watermarkOpacity ?? 0.18);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const predefinedThemes = [
    { name: 'San Martín (Azul Clásico)', primary: '#0284C7', secondary: '#0369A1' },
    { name: 'Belgrano (Esmeralda)', primary: '#10B981', secondary: '#059669' },
    { name: 'Los Andes (Violeta Real)', primary: '#8B5CF6', secondary: '#7C3AED' },
    { name: 'Norte (Oro / Carmesí)', primary: '#F59E0B', secondary: '#EF4444' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP o SVG).');
      return;
    }

    fileToCompressedDataUrl(file, target === 'cover' ? 1400 : 600)
      .then(dataUrl => {
        if (target === 'logo') setLogoUrl(dataUrl);
        else if (target === 'cover') setCoverUrl(dataUrl);
        else setWatermarkUrl(dataUrl);
      })
      .catch(err => alert(err.message));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    await dataActions.saveBranding(currentClub, {
      primaryColor,
      secondaryColor,
      darkSidebar: true,
      coverUrl,
      watermarkUrl: watermarkUrl || logoUrl,
      watermarkOpacity,
      bannerGradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
    }, logoUrl, currentUser);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onBrandingUpdated();
    } catch (err: any) {
      alert(err.message || 'No se pudo guardar la identidad visual.');
    }
  };

  const handleRestoreDefault = () => {
    setPrimaryColor('#0284C7');
    setSecondaryColor('#0369A1');
    setWatermarkOpacity(0.18);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with translucent watermark preview */}
      <div 
        className="p-5 sm:p-6 rounded-2xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, #071739 100%)`,
          borderColor: primaryColor
        }}
      >
        {/* Translucent Background Watermark preview */}
        {watermarkUrl && (
          <div 
            className="absolute -right-8 -bottom-8 w-64 h-64 pointer-events-none select-none z-0 mix-blend-overlay transition-opacity duration-300"
            style={{ opacity: watermarkOpacity }}
          >
            <img 
              src={watermarkUrl} 
              alt="Marca de agua" 
              className="w-full h-full object-contain filter drop-shadow-2xl"
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Escudo" className="w-9 h-9 object-contain" />
              ) : (
                <Palette className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Identidad Visual & Front
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Personalización Visual del Club
              </h1>
              <p className="text-xs text-sky-100">
                Sube el escudo oficial (JPG/PNG), foto de portada y define la marca de agua traslúcida de cabeceras.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-[#0C162D] border border-[#1B2B4C] rounded-2xl p-5 space-y-6 text-xs text-slate-300 shadow-sm">
          {/* Paleta de Colores */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Paleta de Colores Institucionales</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-400 font-semibold text-[11px]">Color Primario (Cabeceras & Acentos)</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-slate-900 border border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white uppercase text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-400 font-semibold text-[11px]">Color Secundario (Gradientes & Botones)</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-slate-900 border border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white uppercase text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Quick Themes */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Temas Institucionales Sugeridos:</span>
              <div className="flex flex-wrap gap-2">
                {predefinedThemes.map((th) => (
                  <button
                    key={th.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(th.primary);
                      setSecondaryColor(th.secondary);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 text-xs transition cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.primary }} />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subida de Archivos Reales (JPG, PNG) - Reemplaza los inputs de URL */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Carga de Imágenes y Archivos Oficiales</h3>
                <p className="text-[11px] text-slate-400">Sube tus archivos locales sin tener que escribir URLs manuales.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                JPG · PNG · WebP · SVG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Uploader: Escudo Oficial del Club */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      Escudo / Logo Oficial
                    </span>
                    {logoUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Cargado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Se visualiza en la cabecera, carnet de socios y comprobantes de pago.
                  </p>
                </div>

                {logoUrl && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                    <img src={logoUrl} alt="Escudo" className="w-12 h-12 object-contain bg-slate-950 p-1 rounded-lg" />
                    <div className="flex-1 truncate">
                      <span className="text-white font-medium block truncate text-xs">Escudo Institucional</span>
                      <span className="text-[10px] text-slate-400 font-mono">Archivo local en memoria</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleFileUpload(e, 'logo')} 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoUrl ? 'Cambiar Archivo de Escudo' : 'Subir Escudo (JPG / PNG)'}</span>
                </button>
              </div>

              {/* Uploader: Foto de Portada / Sede Social */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <FileImage className="w-4 h-4 text-emerald-400" />
                      Foto de Portada / Cancha
                    </span>
                    {coverUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Cargada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sede social, cancha o estadio para banners y fondo decorativo del club.
                  </p>
                </div>

                {coverUrl && (
                  <div className="relative h-14 rounded-xl overflow-hidden border border-slate-800">
                    <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="absolute top-1 right-1 p-1 bg-slate-950/80 text-white rounded-lg hover:bg-rose-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={coverInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, 'cover')} 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{coverUrl ? 'Cambiar Foto de Portada' : 'Subir Portada (JPG / PNG)'}</span>
                </button>
              </div>
            </div>

            {/* Marca de Agua Traslúcida para Banners */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Imagen Traslúcida de Fondo para Banners
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marca de agua suave que decora las cabeceras de Administración y Padrón para que no queden vacías.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300 font-mono font-bold">
                    {Math.round(watermarkOpacity * 100)}% Opacidad
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.01"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer"
                />
                <input 
                  type="file" 
                  ref={watermarkInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleFileUpload(e, 'watermark')} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => watermarkInputRef.current?.click()}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagen Específica</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleRestoreDefault}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Valores</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Identidad del Club</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>¡Identidad visual y archivos actualizados con éxito en la plataforma!</span>
            </div>
          )}
        </form>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="p-5 bg-[#0C162D] border border-[#1B2B4C] rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-400" />
                Previsualización en Vivo
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">En tiempo real</span>
            </div>

            {/* Mini preview of the Header Banner */}
            <div 
              className="p-4 rounded-xl border text-white relative overflow-hidden shadow-md"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                borderColor: primaryColor
              }}
            >
              {/* Translucent Watermark in Preview */}
              {(watermarkUrl || logoUrl) && (
                <div 
                  className="absolute -right-4 -bottom-4 w-32 h-32 pointer-events-none select-none mix-blend-overlay"
                  style={{ opacity: watermarkOpacity }}
                >
                  <img src={watermarkUrl || logoUrl} alt="Watermark" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="relative z-10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" /> : <ShieldCheck className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider block text-white/80 font-bold">Secretaría & Finanzas</span>
                  <h5 className="font-black text-xs text-white">ADMINISTRACIÓN</h5>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="text-slate-400 font-medium block">Resumen del diseño:</span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Color Primario:</span>
                <span className="font-mono text-white font-bold">{primaryColor}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Color Secundario:</span>
                <span className="font-mono text-white font-bold">{secondaryColor}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Escudo:</span>
                <span className="text-emerald-400 font-medium">{logoUrl ? 'Personalizado' : 'Predeterminado'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Marca de Agua:</span>
                <span className="text-purple-300 font-medium">{Math.round(watermarkOpacity * 100)}% traslúcida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
