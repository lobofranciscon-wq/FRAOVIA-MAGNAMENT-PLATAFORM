import React, { useState } from 'react';
import { 
  Palette, 
  Upload, 
  Sliders, 
  Image as ImageIcon, 
  Check, 
  Save, 
  Sparkles, 
  Eye, 
  Building2, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  FileText,
  Copy,
  Layout,
  Sun,
  Moon
} from 'lucide-react';
import { Club, ClubBranding, ClubFrontendTemplate, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface SuperadminClubStylingStudioProps {
  currentUser: User;
  allClubs: Club[];
  onRefreshData: () => void;
  onSelectClubToSupervise?: (club: Club) => void;
}

const PRESET_TEMPLATES: ClubFrontendTemplate[] = [
  {
    id: 'tpl-tucumano-decano',
    name: 'Albiceleste Decano Tucumano',
    description: 'Estilo clásico con franjas y gradientes celestes, escudo prominente y fondo de estadio traslúcido.',
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    bannerGradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)',
    watermarkOpacity: 0.18,
    bannerStyle: 'watermark',
    headerSize: 'normal',
    previewImageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tpl-san-martin-verde',
    name: 'San Martín Esmeralda',
    description: 'Verde profesional deportivo con acentos menta y marca de agua institucional.',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    bannerGradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
    watermarkOpacity: 0.20,
    bannerStyle: 'watermark',
    headerSize: 'normal',
    previewImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tpl-zafiro-pro',
    name: 'SaaS Fraovia Zafiro Pro',
    description: 'Diseño ultra-ejecutivo en azul royal con contraste de alto impacto para comisiones directivas.',
    primaryColor: '#0072FF',
    secondaryColor: '#00E5FF',
    bannerGradient: 'linear-gradient(135deg, #0072FF 0%, #0056E0 50%, #070E22 100%)',
    watermarkOpacity: 0.15,
    bannerStyle: 'watermark',
    headerSize: 'normal',
    previewImageUrl: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tpl-albirrojo-pasion',
    name: 'Albirrojo Tradición & Fuerza',
    description: 'Tonos carmesí y blanco para instituciones con identidad apasionada y enérgica.',
    primaryColor: '#EF4444',
    secondaryColor: '#F87171',
    bannerGradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)',
    watermarkOpacity: 0.18,
    bannerStyle: 'watermark',
    headerSize: 'normal'
  },
  {
    id: 'tpl-dorado-campeon',
    name: 'Torneo Dorado & Élite',
    description: 'Acentos en oro brillante y fondo oscuro para competencias de nivel superior.',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    bannerGradient: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #1E1B18 100%)',
    watermarkOpacity: 0.22,
    bannerStyle: 'watermark',
    headerSize: 'normal'
  }
];

export const SuperadminClubStylingStudio: React.FC<SuperadminClubStylingStudioProps> = ({
  currentUser,
  allClubs,
  onRefreshData,
  onSelectClubToSupervise
}) => {
  // Security check: Only SUPERADMIN can use this
  if (currentUser.role !== 'SUPERADMIN') {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
        Acceso restringido. Solo el Superadministrador de FRAOVIA tiene permisos para editar el frontend y crear plantillas.
      </div>
    );
  }

  const [selectedClubId, setSelectedClubId] = useState<string>(allClubs[0]?.id || '');
  const activeClub = allClubs.find(c => c.id === selectedClubId) || allClubs[0];

  // Form State for Active Club Customization
  const [logoUrl, setLogoUrl] = useState<string>(activeClub?.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState<string>(activeClub?.branding?.coverUrl || '');
  const [watermarkUrl, setWatermarkUrl] = useState<string>(activeClub?.branding?.watermarkUrl || activeClub?.logoUrl || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(activeClub?.branding?.watermarkOpacity ?? 0.18);
  const [primaryColor, setPrimaryColor] = useState<string>(activeClub?.branding?.primaryColor || '#0284C7');
  const [secondaryColor, setSecondaryColor] = useState<string>(activeClub?.branding?.secondaryColor || '#38BDF8');
  const [bannerGradient, setBannerGradient] = useState<string>(activeClub?.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)');
  const [headerSize, setHeaderSize] = useState<'compact' | 'normal' | 'large'>(activeClub?.branding?.headerSize || 'normal');
  const [bannerStyle, setBannerStyle] = useState<'watermark' | 'cover_blur' | 'clean_gradient'>(activeClub?.branding?.bannerStyle || 'watermark');
  
  // Plantillas
  const [templates, setTemplates] = useState<ClubFrontendTemplate[]>(PRESET_TEMPLATES);
  const [templateName, setTemplateName] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync state when switching club
  const handleSelectClub = (clubId: string) => {
    setSelectedClubId(clubId);
    const club = allClubs.find(c => c.id === clubId);
    if (club) {
      setLogoUrl(club.logoUrl || '');
      setCoverUrl(club.branding?.coverUrl || '');
      setWatermarkUrl(club.branding?.watermarkUrl || club.logoUrl || '');
      setWatermarkOpacity(club.branding?.watermarkOpacity ?? 0.18);
      setPrimaryColor(club.branding?.primaryColor || '#0284C7');
      setSecondaryColor(club.branding?.secondaryColor || '#38BDF8');
      setBannerGradient(club.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)');
      setHeaderSize(club.branding?.headerSize || 'normal');
      setBannerStyle(club.branding?.bannerStyle || 'watermark');
    }
  };

  // File Upload Handlers (FileReader converts to base64 DataURL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 4MB
    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen seleccionada supera el tamaño sugerido (máx 4MB). Elija una versión más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        if (target === 'logo') {
          setLogoUrl(result);
          // Auto-suggest as watermark if empty
          if (!watermarkUrl) setWatermarkUrl(result);
        } else if (target === 'cover') {
          setCoverUrl(result);
        } else if (target === 'watermark') {
          setWatermarkUrl(result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply Changes to Club
  const handleSaveToClub = () => {
    if (!activeClub) return;

    const newBranding: ClubBranding = {
      ...activeClub.branding,
      primaryColor,
      secondaryColor,
      coverUrl,
      watermarkUrl,
      watermarkOpacity,
      bannerGradient,
      headerSize,
      bannerStyle
    };

    fraoviaDB.updateClubBranding(activeClub.id, newBranding, logoUrl, currentUser);
    onRefreshData();

    setSaveSuccessMessage(`¡Diseño y front aplicados con éxito a "${activeClub.name}"!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Save current style as a reusable Template
  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTemplate: ClubFrontendTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateName.trim(),
      description: `Plantilla personalizada basada en ${activeClub.name}`,
      primaryColor,
      secondaryColor,
      bannerGradient,
      watermarkOpacity,
      bannerStyle,
      headerSize,
      previewImageUrl: coverUrl || watermarkUrl
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setTemplateName('');
    setSaveSuccessMessage(`¡Plantilla "${newTemplate.name}" guardada y lista para reutilizar!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Apply an existing template to the active club
  const handleApplyTemplate = (tpl: ClubFrontendTemplate) => {
    setPrimaryColor(tpl.primaryColor);
    setSecondaryColor(tpl.secondaryColor);
    setBannerGradient(tpl.bannerGradient);
    setWatermarkOpacity(tpl.watermarkOpacity);
    setBannerStyle(tpl.bannerStyle);
    setHeaderSize(tpl.headerSize);
    if (tpl.previewImageUrl && !coverUrl) {
      setCoverUrl(tpl.previewImageUrl);
    }
    setSaveSuccessMessage(`Plantilla "${tpl.name}" cargada en el editor. Haga clic en "Guardar y Aplicar" para confirmar.`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Exclusivo Superadmin */}
      <div className="p-4 sm:p-5 rounded-2xl border border-sky-500/30 bg-[#0C162D] space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  Panel Exclusivo Superadmin
                </span>
                <span className="text-xs text-slate-400">
                  Gestión Visual Multi-Institución
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Personalizador de Front & Generador de Plantillas de Clubes
              </h2>
              <p className="text-xs text-slate-300">
                Seleccione el club, suba el escudo y portada (PNG/JPG), configure la imagen de fondo traslúcida para que no quede vacío, y guarde plantillas reutilizables.
              </p>
            </div>
          </div>

          {/* Club Selector Dropdown */}
          <div className="w-full sm:w-auto min-w-[260px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Institución a Personalizar:
            </label>
            <select
              value={selectedClubId}
              onChange={(e) => handleSelectClub(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            >
              {allClubs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Controls on Left, Live Real-Time Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Escudo & Portada del Club (File Uploads) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1B2A4A] bg-[#0C162D] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Escudo & Portada Oficial del Club
              </h3>
            </div>

            {/* Escudo uploader */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Escudo del Club (PNG sin fondo, JPG o SVG)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {logoUrl && logoUrl.trim() ? (
                    <img src={logoUrl} alt="Escudo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cargar Archivo de Escudo</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'logo')} 
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="O pegue URL directa del escudo..."
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Portada / Banner uploader */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 block">
                Portada / Imagen de Cabecera (Banner)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {coverUrl && coverUrl.trim() ? (
                    <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Sin Portada</span>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Cargar Foto de Portada</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'cover')} 
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="O pegue URL directa de la foto de portada..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fondo Translúcido / Marca de Agua Propia del Club */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1B2A4A] bg-[#0C162D] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Foto de Fondo Translúcida del Club (Anti-Vacío)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Solo Superadmin
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Cargue una foto del estadio, instalaciones o escudo en alta definición para renderizar como marca de agua traslúcida en el fondo de Administración y Vistas Principales:
            </p>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                {watermarkUrl && watermarkUrl.trim() ? (
                  <img 
                    src={watermarkUrl} 
                    alt="Marca de agua" 
                    className="w-full h-full object-cover" 
                    style={{ opacity: watermarkOpacity * 3 }}
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cargar Foto de Fondo Translúcida</span>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/webp" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, 'watermark')} 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setWatermarkUrl(logoUrl)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs"
                    title="Usar el escudo como marca de agua"
                  >
                    Usar Escudo
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="URL de foto o textura de fondo..."
                  value={watermarkUrl}
                  onChange={(e) => setWatermarkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Intensidad / Traslucidez de Fondo:</span>
                <span className="font-mono text-sky-400 font-bold">{Math.round(watermarkOpacity * 100)}% opaco</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.40"
                step="0.02"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Muy sutil (4%)</span>
                <span>Equilibrado (18%)</span>
                <span>Marcado (40%)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Paleta de Colores & Gradientes */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1B2A4A] bg-[#0C162D] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Palette className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Paleta de Colores & Gradiente de Cabecera
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Color Secundario / Acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Presets de Gradiente */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-300 block">Gradientes Institucionales Rápidos:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)');
                    setPrimaryColor('#0284C7');
                    setSecondaryColor('#38BDF8');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)' }}
                >
                  Albiceleste Decano
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)');
                    setPrimaryColor('#10B981');
                    setSecondaryColor('#34D399');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)' }}
                >
                  Verde San Martín
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #0072FF 0%, #0056E0 50%, #070E22 100%)');
                    setPrimaryColor('#0072FF');
                    setSecondaryColor('#00E5FF');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0072FF 0%, #0056E0 50%, #070E22 100%)' }}
                >
                  Zafiro Fraovia Pro
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)');
                    setPrimaryColor('#EF4444');
                    setSecondaryColor('#F87171');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #450A0A 100%)' }}
                >
                  Albirrojo Clásico
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #D97706 0%, #B45309 50%, #1E1B18 100%)');
                    setPrimaryColor('#F59E0B');
                    setSecondaryColor('#FBBF24');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #1E1B18 100%)' }}
                >
                  Oro & Élite
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerGradient('linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #2E1065 100%)');
                    setPrimaryColor('#8B5CF6');
                    setSecondaryColor('#C084FC');
                  }}
                  className="p-2 rounded-xl border border-slate-700 text-left text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #2E1065 100%)' }}
                >
                  Violeta Neón
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Acciones de Guardado & Generador de Plantilla */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1B2A4A] bg-[#0C162D] space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveToClub}
                className="w-full sm:w-auto px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Aplicar a "{activeClub?.name}"</span>
              </button>

              {onSelectClubToSupervise && (
                <button
                  type="button"
                  onClick={() => onSelectClubToSupervise(activeClub)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Ver en Vivo como este Club</span>
                </button>
              )}
            </div>

            {/* Crear Plantilla Reutilizable */}
            <form onSubmit={handleSaveAsTemplate} className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Generar Plantilla Reutilizable para Otros Clubes:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva plantilla (ej: 'Plantilla Tucumana 2026')..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Plantilla</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Live Interactive Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Live Preview Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1B2A4A] bg-[#0C162D] space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Vista Previa en Tiempo Real
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Sincronizado
              </span>
            </div>

            {/* Mini Dashboard Header Mockup */}
            <div 
              className="p-4 rounded-2xl border text-white shadow-xl relative overflow-hidden transition-all duration-300"
              style={{
                background: bannerGradient,
                borderColor: primaryColor
              }}
            >
              {/* Live Translucent Watermark Photo */}
              {watermarkUrl && watermarkUrl.trim() ? (
                <div 
                  className="absolute -right-4 -bottom-4 w-36 h-36 pointer-events-none select-none z-0 mix-blend-overlay transition-opacity duration-300"
                  style={{ opacity: watermarkOpacity }}
                >
                  <img 
                    src={watermarkUrl} 
                    alt="Watermark preview" 
                    className="w-full h-full object-contain filter drop-shadow-2xl" 
                  />
                </div>
              ) : null}

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden shrink-0">
                    {logoUrl && logoUrl.trim() ? (
                      <img src={logoUrl} alt="Escudo preview" className="w-9 h-9 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                      ADMINISTRACIÓN · {activeClub?.name || 'Club'}
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      Gestión Administrativa y Financiera
                    </h4>
                  </div>
                </div>

                <p className="text-[11px] text-white/80 line-clamp-2">
                  Padrón de deportistas, control de cuotas sociales, bloques por color y gráfico comparativo interanual.
                </p>
              </div>
            </div>

            {/* Mock KPI cards showing how non-empty the background looks */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Jugadores activos</span>
                <span className="text-lg font-black text-white font-mono">642</span>
                <span className="text-[10px] text-emerald-400 font-bold block">+12%</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cuotas del mes</span>
                <span className="text-lg font-black text-sky-400 font-mono">78%</span>
                <span className="text-[10px] text-slate-400 block">501 / 642</span>
              </div>
            </div>

            {/* Library of Saved Templates */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Catálogo de Plantillas Guardadas:
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {templates.map(tpl => (
                  <div 
                    key={tpl.id} 
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div 
                        className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: tpl.primaryColor }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">{tpl.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{tpl.description}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-[11px] font-semibold transition shrink-0 cursor-pointer"
                    >
                      Cargar
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
