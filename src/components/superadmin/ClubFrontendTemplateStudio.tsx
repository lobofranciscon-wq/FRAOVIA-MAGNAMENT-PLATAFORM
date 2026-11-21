import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Upload, 
  Sparkles, 
  Eye, 
  Check, 
  RotateCcw, 
  Save, 
  Building2, 
  Sliders, 
  FileImage, 
  ShieldCheck, 
  Copy, 
  X, 
  Layers, 
  Layout, 
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { Club, ClubBranding, ClubFrontendTemplate, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface ClubFrontendTemplateStudioProps {
  allClubs: Club[];
  currentUser: User;
  onRefreshData: () => void;
  onSelectClubToSupervise?: (club: Club) => void;
}

const PRESET_TEMPLATES: ClubFrontendTemplate[] = [
  {
    id: 'tpl-san-martin',
    name: 'Zafiro & Escudo Traslúcido',
    description: 'Gradiente azul zafiro con marca de agua traslúcida del escudo oficial a la derecha.',
    primaryColor: '#0284C7',
    secondaryColor: '#0369A1',
    bannerGradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #082F49 100%)',
    watermarkOpacity: 0.20,
    bannerStyle: 'watermark',
    headerSize: 'normal'
  },
  {
    id: 'tpl-belgrano',
    name: 'Esmeralda & Estadio Nocturno',
    description: 'Verde esmeralda institucional con foto de cancha difuminada de fondo.',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    bannerGradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #064E3B 100%)',
    watermarkOpacity: 0.25,
    bannerStyle: 'cover_blur',
    headerSize: 'normal'
  },
  {
    id: 'tpl-los-andes',
    name: 'Violeta Real & Neón',
    description: 'Estilo nocturno de alta gama para clubes deportivos y polideportivos.',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    bannerGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #4C1D95 100%)',
    watermarkOpacity: 0.18,
    bannerStyle: 'watermark',
    headerSize: 'normal'
  },
  {
    id: 'tpl-norte',
    name: 'Oro & Carmesí Tucumano',
    description: 'Combinación enérgica con alto contraste para clubes tradicionales.',
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    bannerGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 60%, #7F1D1D 100%)',
    watermarkOpacity: 0.22,
    bannerStyle: 'watermark',
    headerSize: 'large'
  }
];

export const ClubFrontendTemplateStudio: React.FC<ClubFrontendTemplateStudioProps> = ({
  allClubs,
  currentUser,
  onRefreshData,
  onSelectClubToSupervise
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(allClubs[0]?.id || '');
  const activeClub = allClubs.find(c => c.id === selectedClubId) || allClubs[0];

  // Template design state
  const [primaryColor, setPrimaryColor] = useState<string>(activeClub?.branding?.primaryColor || '#0284C7');
  const [secondaryColor, setSecondaryColor] = useState<string>(activeClub?.branding?.secondaryColor || '#0369A1');
  const [logoUrl, setLogoUrl] = useState<string>(activeClub?.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState<string>(activeClub?.branding?.coverUrl || '');
  const [watermarkUrl, setWatermarkUrl] = useState<string>(activeClub?.branding?.watermarkUrl || activeClub?.logoUrl || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(activeClub?.branding?.watermarkOpacity ?? 0.20);
  const [bannerStyle, setBannerStyle] = useState<'watermark' | 'cover_blur' | 'clean_gradient'>(
    activeClub?.branding?.bannerStyle || 'watermark'
  );
  const [headerSize, setHeaderSize] = useState<'compact' | 'normal' | 'large'>(
    activeClub?.branding?.headerSize || 'normal'
  );

  // Template management
  const [templates, setTemplates] = useState<ClubFrontendTemplate[]>(PRESET_TEMPLATES);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // When selected club changes, sync local editing state
  const handleSelectClub = (clubId: string) => {
    setSelectedClubId(clubId);
    const club = allClubs.find(c => c.id === clubId);
    if (club) {
      setPrimaryColor(club.branding.primaryColor || '#0284C7');
      setSecondaryColor(club.branding.secondaryColor || '#0369A1');
      setLogoUrl(club.logoUrl || '');
      setCoverUrl(club.branding.coverUrl || '');
      setWatermarkUrl(club.branding.watermarkUrl || club.logoUrl || '');
      setWatermarkOpacity(club.branding.watermarkOpacity ?? 0.20);
      setBannerStyle(club.branding.bannerStyle || 'watermark');
      setHeaderSize(club.branding.headerSize || 'normal');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP o SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === 'logo') {
        setLogoUrl(dataUrl);
        if (!watermarkUrl) setWatermarkUrl(dataUrl);
      } else if (target === 'cover') {
        setCoverUrl(dataUrl);
      } else {
        setWatermarkUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply template to active club
  const handleApplyTemplate = (tpl: ClubFrontendTemplate) => {
    setPrimaryColor(tpl.primaryColor);
    setSecondaryColor(tpl.secondaryColor);
    setWatermarkOpacity(tpl.watermarkOpacity);
    setBannerStyle(tpl.bannerStyle);
    setHeaderSize(tpl.headerSize);

    // Save directly to the club
    if (activeClub) {
      fraoviaDB.updateClubBranding(activeClub.id, {
        primaryColor: tpl.primaryColor,
        secondaryColor: tpl.secondaryColor,
        darkSidebar: true,
        coverUrl,
        watermarkUrl: watermarkUrl || logoUrl,
        watermarkOpacity: tpl.watermarkOpacity,
        bannerStyle: tpl.bannerStyle,
        headerSize: tpl.headerSize,
        templateName: tpl.name,
        bannerGradient: tpl.bannerGradient
      }, logoUrl, currentUser);

      onRefreshData();
      setSavedFeedback(`Plantilla "${tpl.name}" aplicada con éxito a ${activeClub.name}.`);
      setTimeout(() => setSavedFeedback(null), 3000);
    }
  };

  // Save current design to active club
  const handleSaveToClub = () => {
    if (!activeClub) return;

    fraoviaDB.updateClubBranding(activeClub.id, {
      primaryColor,
      secondaryColor,
      darkSidebar: true,
      coverUrl,
      watermarkUrl: watermarkUrl || logoUrl,
      watermarkOpacity,
      bannerStyle,
      headerSize,
      bannerGradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, #071739 100%)`
    }, logoUrl, currentUser);

    onRefreshData();
    setSavedFeedback(`¡Front personalizado guardado para ${activeClub.name}!`);
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  // Save current design as a new reusable template
  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTpl: ClubFrontendTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      description: `Plantilla generada desde el diseño de ${activeClub?.name}`,
      primaryColor,
      secondaryColor,
      bannerGradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, #071739 100%)`,
      watermarkOpacity,
      bannerStyle,
      headerSize
    };

    setTemplates(prev => [newTpl, ...prev]);
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
    setSavedFeedback(`¡Plantilla "${newTpl.name}" registrada con éxito! Ya puedes aplicarla a otros clubes.`);
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const bannerPadding = headerSize === 'compact' ? 'p-4' : headerSize === 'large' ? 'p-7 sm:p-8' : 'p-5 sm:p-6';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Header Banner */}
      <div 
        className="p-5 sm:p-6 rounded-2xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0072FF 0%, #0056E0 50%, #070D1E 100%)',
          borderColor: '#0072FF'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Exclusivo Superadmin
                </span>
                <span className="text-xs text-blue-200">
                  White-Label & Plantillas
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Editor Visual de Front por Club & Generador de Plantillas
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Selecciona cualquier club para editar de manera manual sus imágenes, colores, marca de agua traslúcida y tamaños, y guarda el resultado como plantilla reutilizable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-400/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Generar como Plantilla</span>
            </button>
            <button
              onClick={handleSaveToClub}
              className="px-4 py-2 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4 text-blue-600" />
              <span>Aplicar al Club</span>
            </button>
          </div>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Club Selector Bar */}
      <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Institución a Personalizar:
            </label>
            <span className="text-xs text-slate-300">
              Elige el club cuyo front y cabecera deseas diseñar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClubId}
            onChange={(e) => handleSelectClub(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 shadow-sm"
          >
            {allClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name} ({club.slug})
              </option>
            ))}
          </select>

          {onSelectClubToSupervise && activeClub && (
            <button
              type="button"
              onClick={() => onSelectClubToSupervise(activeClub)}
              className="px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Ver Club en Vivo
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Controls (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (6 cols): Manual Front Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Section 1: Escudo & Fotos (Carga real de archivos) */}
          <div className="p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Upload className="w-4 h-4 text-sky-400" />
              Subida de Archivos Reales (JPG, PNG, WebP)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Escudo Oficial */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  Escudo del Club
                </span>
                {logoUrl && logoUrl.trim() && (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-900 rounded-lg">
                    <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain p-1 bg-slate-950 rounded" />
                    <span className="text-[11px] text-slate-300 truncate">Escudo cargado</span>
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
                  className="w-full py-1.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Escudo</span>
                </button>
              </div>

              {/* Foto de Portada / Estadio */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                  Foto de Sede / Cancha
                </span>
                {coverUrl && coverUrl.trim() && (
                  <div className="h-10 rounded-lg overflow-hidden border border-slate-800">
                    <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
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
                  className="w-full py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto Cancha</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Colores y Fondo Traslúcido para no quedar vacío */}
          <div className="p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Palette className="w-4 h-4 text-purple-400" />
              Colores & Marca de Agua Traslúcida
            </h4>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Color Secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Slider de Opacidad de Marca de Agua Traslúcida */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Opacidad del Fondo Traslúcido en Cabeceras:
                </span>
                <span className="font-mono text-purple-300 font-bold">
                  {Math.round(watermarkOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.45"
                step="0.01"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>5% (Muy sutil)</span>
                <span>20% (Recomendado)</span>
                <span>45% (Intenso)</span>
              </div>
            </div>

            {/* Estilo y Tamaños */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Estilo de Fondo</label>
                <select
                  value={bannerStyle}
                  onChange={(e) => setBannerStyle(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="watermark">Marca de Agua con Escudo</option>
                  <option value="cover_blur">Estadio / Cancha de Fondo</option>
                  <option value="clean_gradient">Gradiente Limpio</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tamaño de Cabecera</label>
                <select
                  value={headerSize}
                  onChange={(e) => setHeaderSize(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="compact">Compacto</option>
                  <option value="normal">Normal (Estándar)</option>
                  <option value="large">Grande / Panorámico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Catálogo de Plantillas Guardadas */}
          <div className="p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-purple-400" />
                Plantillas Disponibles ({templates.length})
              </h4>
              <span className="text-[10px] text-slate-400">1 clic para aplicar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-sky-500/50 transition cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-white text-xs group-hover:text-sky-400 transition">{tpl.name}</h5>
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: tpl.primaryColor }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-sky-600 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Aplicar a {activeClub?.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6 cols): Real-Time Live Preview of the Banner */}
        <div className="lg:col-span-6 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                Previsualización en Tiempo Real del Banner
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {activeClub?.name}
              </span>
            </div>

            {/* LIVE PREVIEW OF THE EXACT BANNER FROM IMAGE 3 */}
            <div 
              className={`${bannerPadding} rounded-2xl border text-white shadow-xl relative overflow-hidden transition-all duration-300`}
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, #071739 100%)`,
                borderColor: primaryColor
              }}
            >
              {/* Translucent Background Watermark (No queda vacío!) */}
              {bannerStyle === 'watermark' && (watermarkUrl?.trim() || logoUrl?.trim()) ? (
                <div 
                  className="absolute -right-6 -bottom-6 w-56 h-56 pointer-events-none select-none z-0 mix-blend-overlay transition-opacity duration-300"
                  style={{ opacity: watermarkOpacity }}
                >
                  <img 
                    src={watermarkUrl?.trim() || logoUrl?.trim()} 
                    alt="Watermark" 
                    className="w-full h-full object-contain filter drop-shadow-2xl" 
                  />
                </div>
              ) : null}

              {/* Cover Blur Background */}
              {bannerStyle === 'cover_blur' && coverUrl && coverUrl.trim() ? (
                <div 
                  className="absolute inset-0 pointer-events-none select-none z-0 mix-blend-overlay transition-opacity duration-300"
                  style={{ opacity: watermarkOpacity }}
                >
                  <img 
                    src={coverUrl} 
                    alt="Cancha" 
                    className="w-full h-full object-cover filter blur-[2px]" 
                  />
                </div>
              ) : null}

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0 overflow-hidden">
                    {logoUrl && logoUrl.trim() ? (
                      <img src={logoUrl} alt="Escudo" className="w-9 h-9 object-contain" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Secretaría & Finanzas
                      </span>
                      <span className="text-xs text-sky-200">
                        {activeClub?.name}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      ADMINISTRACIÓN – Gestión Administrativa y Financiera
                    </h3>
                    <p className="text-xs text-sky-100 max-w-md">
                      Padrón de deportistas, control de cuotas sociales, bloques por color y gráfico comparativo interanual.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button className="px-3.5 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs shadow">
                    Nuevo Comprobante
                  </button>
                  <button className="px-3.5 py-2 bg-sky-500 text-white font-bold rounded-xl text-xs shadow">
                    Inscribir Socio
                  </button>
                </div>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="p-4 bg-[#0C162D] border border-[#1B2B4C] rounded-2xl text-xs text-slate-300 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Cómo funciona la marca de agua traslúcida:
              </span>
              <p className="text-slate-400 leading-relaxed">
                Al subir el escudo o la foto de la cancha del club y definir la opacidad ({Math.round(watermarkOpacity * 100)}%), este elemento se funde automáticamente en el fondo de las cabeceras de <strong>Administración</strong>, <strong>Gerencia</strong> y en los carnets oficiales. De esta forma la interfaz adquiere un look institucional propio y exclusivo sin quedar vacía.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Guardar como Plantilla Reutilizable */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-purple-400" />
                Guardar Diseño como Plantilla Reutilizable
              </h4>
              <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre de la Plantilla</label>
                <input
                  type="text"
                  placeholder="Ej: Plantilla Clásica Rayada, Plantilla Polideportivo Neón..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-semibold">Parámetros que se guardarán:</span>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Colores:</span>
                  <span className="font-mono text-white">{primaryColor} / {secondaryColor}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Opacidad Traslúcida:</span>
                  <span className="font-mono text-white">{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Estilo de Banner:</span>
                  <span className="font-mono text-white">{bannerStyle}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Guardar en el Catálogo de Plantillas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
