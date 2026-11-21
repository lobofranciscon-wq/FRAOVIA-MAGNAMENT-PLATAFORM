import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Save, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  User as UserIcon, 
  Check, 
  Sparkles, 
  Eye, 
  Sliders, 
  Building2, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  Download,
  FileDown,
  FileUp,
  FileJson,
  Copy
} from 'lucide-react';
import { Club, User, PREDEFINED_COLOR_PALETTES, PredefinedColorPalette } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface ClubProfileAndEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  currentUser: User;
  onUpdated: () => void;
}

export const ClubProfileAndEditorModal: React.FC<ClubProfileAndEditorModalProps> = ({
  isOpen,
  onClose,
  club,
  currentUser,
  onUpdated
}) => {
  if (!isOpen) return null;

  // Tabs: 'perfil' | 'colores' | 'fondo' | 'tipografia' | 'plantilla_json' | 'hoja_software'
  const [activeTab, setActiveTab] = useState<'perfil' | 'colores' | 'fondo' | 'tipografia' | 'plantilla_json' | 'hoja_software'>('perfil');

  // 1. Perfil del Club
  const [name, setName] = useState(club.name);
  const [cuit, setCuit] = useState(club.cuit);
  const [logoUrl, setLogoUrl] = useState(club.logoUrl || '');
  const [slogan, setSlogan] = useState(club.branding?.slogan || 'Pasión, disciplina y comunidad');
  const [phone, setPhone] = useState(club.phone || '');
  const [email, setEmail] = useState(club.email || '');

  // 2. Colores & Tonos
  const [selectedPaletteId, setSelectedPaletteId] = useState(club.branding?.palettePresetId || '');
  const [primaryColor, setPrimaryColor] = useState(club.branding?.primaryColor || '#0284C7');
  const [secondaryColor, setSecondaryColor] = useState(club.branding?.secondaryColor || '#0369A1');
  const [accentColor, setAccentColor] = useState(club.branding?.accentColor || '#38BDF8');
  const [backgroundColor, setBackgroundColor] = useState(club.branding?.backgroundColor || '#070D1E');
  const [bannerGradient, setBannerGradient] = useState(club.branding?.bannerGradient || '');

  // 3. Fondo & Marca Traslúcida
  const [bgImageUrl, setBgImageUrl] = useState(club.branding?.bgImageUrl || club.branding?.coverUrl || '');
  const [bgImageOpacity, setBgImageOpacity] = useState(club.branding?.bgImageOpacity ?? 0.15);
  const [bgImageBlur, setBgImageBlur] = useState(club.branding?.bgImageBlur ?? 0);
  const [watermarkUrl, setWatermarkUrl] = useState(club.branding?.watermarkUrl || club.logoUrl || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState(club.branding?.watermarkOpacity ?? 0.20);
  const [bannerStyle, setBannerStyle] = useState<'watermark' | 'cover_blur' | 'clean_gradient'>(
    club.branding?.bannerStyle || 'watermark'
  );

  // 4. Tipografía & Letras
  const [fontFamily, setFontFamily] = useState<'system' | 'inter' | 'montserrat' | 'teko' | 'roboto' | 'oswald'>(
    club.branding?.fontFamily || 'inter'
  );
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>(
    club.branding?.fontSize || 'normal'
  );
  const [headerWeight, setHeaderWeight] = useState<'normal' | 'bold' | 'black'>(
    club.branding?.headerWeight || 'black'
  );

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Upload Logo from File
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
        if (!watermarkUrl || watermarkUrl === club.logoUrl) {
          setWatermarkUrl(dataUrl);
        }
        showFeedback('Foto de perfil / Escudo actualizado correctamente');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Background Image from File
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBgImageUrl(dataUrl);
        showFeedback('Imagen de fondo cargada con éxito');
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply Predefined Color Palette
  const handleApplyPalette = (palette: PredefinedColorPalette) => {
    setSelectedPaletteId(palette.id);
    setPrimaryColor(palette.primaryColor);
    setSecondaryColor(palette.secondaryColor);
    setAccentColor(palette.accentColor);
    setBannerGradient(palette.bannerGradient);
    showFeedback(`Paleta "${palette.name}" aplicada`);
  };

  // Get current visual configuration payload object
  const getCurrentVisualThemePayload = () => {
    return {
      fraoviaThemeVersion: '1.0',
      exportedAt: new Date().toISOString(),
      clubSource: name,
      themeName: `Tema Visual - ${name}`,
      visualConfig: {
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        bannerGradient: bannerGradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        palettePresetId: selectedPaletteId || undefined,
        bgImageUrl,
        bgImageOpacity,
        bgImageBlur,
        watermarkUrl,
        watermarkOpacity,
        bannerStyle,
        fontFamily,
        fontSize,
        headerWeight,
        slogan
      }
    };
  };

  // Export current visual config to JSON file
  const handleExportThemeJSON = () => {
    try {
      const payload = getCurrentVisualThemePayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanSlug = (name || 'club').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `tema-visual-${cleanSlug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showFeedback(`Configuración visual exportada como "tema-visual-${cleanSlug}.json"`);
    } catch (err: any) {
      showFeedback('Error al exportar tema JSON: ' + (err.message || ''), 'error');
    }
  };

  // Import visual config from JSON file
  const handleImportThemeJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const cfg = parsed.visualConfig || parsed;

        if (!cfg.primaryColor && !cfg.secondaryColor && !cfg.backgroundColor) {
          throw new Error('El archivo no contiene un tema visual válido de FRAOVIA');
        }

        if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
        if (cfg.secondaryColor) setSecondaryColor(cfg.secondaryColor);
        if (cfg.accentColor) setAccentColor(cfg.accentColor);
        if (cfg.backgroundColor) setBackgroundColor(cfg.backgroundColor);
        if (cfg.bannerGradient) setBannerGradient(cfg.bannerGradient);
        if (cfg.palettePresetId) setSelectedPaletteId(cfg.palettePresetId);

        if (cfg.bgImageUrl !== undefined) setBgImageUrl(cfg.bgImageUrl);
        if (cfg.bgImageOpacity !== undefined) setBgImageOpacity(Number(cfg.bgImageOpacity));
        if (cfg.bgImageBlur !== undefined) setBgImageBlur(Number(cfg.bgImageBlur));
        if (cfg.watermarkUrl !== undefined) setWatermarkUrl(cfg.watermarkUrl);
        if (cfg.watermarkOpacity !== undefined) setWatermarkOpacity(Number(cfg.watermarkOpacity));
        if (cfg.bannerStyle) setBannerStyle(cfg.bannerStyle);

        if (cfg.fontFamily) setFontFamily(cfg.fontFamily);
        if (cfg.fontSize) setFontSize(cfg.fontSize);
        if (cfg.headerWeight) setHeaderWeight(cfg.headerWeight);
        if (cfg.slogan) setSlogan(cfg.slogan);

        showFeedback(`¡Configuración visual importada con éxito desde "${parsed.clubSource || file.name}"!`);
      } catch (err: any) {
        showFeedback(err.message || 'Error al procesar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy JSON to clipboard
  const handleCopyJSONToClipboard = () => {
    try {
      const payload = getCurrentVisualThemePayload();
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setIsCopied(true);
      showFeedback('Configuración JSON copiada al portapapeles');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showFeedback('No se pudo copiar automáticamente', 'error');
    }
  };

  // Font family styles helper
  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'inter': return '"Inter", sans-serif';
      case 'montserrat': return '"Montserrat", sans-serif';
      case 'teko': return '"Teko", sans-serif';
      case 'roboto': return '"Roboto", sans-serif';
      case 'oswald': return '"Oswald", sans-serif';
      default: return 'system-ui, -apple-system, sans-serif';
    }
  };

  // Font scale multiplier helper
  const getFontScaleClass = () => {
    switch (fontSize) {
      case 'compact': return 'text-[90%]';
      case 'large': return 'text-[112%]';
      default: return 'text-[100%]';
    }
  };

  // Save All Changes
  const handleSave = () => {
    try {
      // 1. Update basic club details
      club.name = name.trim();
      club.cuit = cuit.trim();
      club.phone = phone.trim();
      club.email = email.trim();
      club.logoUrl = logoUrl;

      // 2. Update branding object
      const updatedBranding = {
        ...club.branding,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        bgImageUrl,
        bgImageOpacity,
        bgImageBlur,
        watermarkUrl,
        watermarkOpacity,
        bannerStyle,
        bannerGradient: bannerGradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        palettePresetId: selectedPaletteId || undefined,
        fontFamily,
        fontSize,
        headerWeight,
        slogan: slogan.trim()
      };

      fraoviaDB.updateClubBranding(club.id, updatedBranding, logoUrl, currentUser);
      club.branding = updatedBranding;

      showFeedback(`¡Configuración y perfil de "${club.name}" guardados exitosamente!`);
      onUpdated();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      showFeedback(err.message || 'Error al guardar la configuración', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#070D1E] border border-[#1A2B4C] rounded-3xl w-full max-w-6xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0A1329] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
              <Sliders className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Editar Club · {club.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  EDITOR PROFESIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ajustá el perfil, paleta de colores, marcas traslúcidas, tipografía y previsualizá la hoja del software en tiempo real.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' 
              : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('perfil')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'perfil'
                  ? 'border-sky-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>1. Perfil & Escudo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('colores')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'colores'
                  ? 'border-purple-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Colores & Tonos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fondo')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'fondo'
                  ? 'border-emerald-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Fondo & Marca Traslúcida</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tipografia')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'tipografia'
                  ? 'border-amber-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Tipografía & Letras</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plantilla_json')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'plantilla_json'
                  ? 'border-cyan-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>5. Tema JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hoja_software')}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'hoja_software'
                  ? 'border-indigo-500 text-white bg-slate-900 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>6. Vista Hoja Software</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mb-1.5 shrink-0">
            <input
              type="file"
              ref={jsonFileInputRef}
              accept=".json,application/json"
              onChange={handleImportThemeJSON}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleExportThemeJSON}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Descargar archivo .json con la configuración visual para clonarlo en otros clubes"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Cargar archivo .json exportado de otro club"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Importar JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-600/30 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================================
              TAB 1: PERFIL DEL CLUB (FOTO DE PERFIL, ESCUDO Y DATOS)
             ======================================================== */}
          {activeTab === 'perfil' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Picture Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Foto de Perfil & Escudo Oficial
                  </span>

                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-slate-950 p-2 border-2 border-sky-400 flex items-center justify-center overflow-hidden shadow-2xl">
                      {logoUrl && logoUrl.trim() ? (
                        <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-14 h-14 text-slate-600" />
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-xs font-bold text-white cursor-pointer"
                    >
                      <Upload className="w-6 h-6 mb-1 text-sky-400" />
                      <span>Cambiar Escudo</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Foto de Perfil desde PC</span>
                    </button>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">O pegar URL de imagen:</label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Details Form */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Datos Institucionales del Club
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1 font-bold">Nombre Oficial de la Institución</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">CUIT Institucional</label>
                      <input
                        type="text"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Teléfono Oficial</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Email de Contacto / Administración</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Slogan o Lema del Club (Aparece en carnets y portal)</label>
                      <input
                        type="text"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        placeholder="Ej: Pasión, disciplina y comunidad desde 1920"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: COLORES & TONOS & PLANTILLAS PREDEFINIDAS
             ======================================================== */}
          {activeTab === 'colores' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                  Paletas de Colores & Tonos Predefinidos (Click para aplicar)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PREDEFINED_COLOR_PALETTES.map(p => {
                    const isSelected = selectedPaletteId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleApplyPalette(p)}
                        className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-purple-400 bg-purple-950/20 shadow-lg'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div 
                          className="h-8 rounded-lg flex items-center justify-between px-2 text-[10px] font-black text-white"
                          style={{ background: p.bannerGradient }}
                        >
                          <span className="truncate">{p.name}</span>
                          {isSelected && <span>✓</span>}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.primaryColor }} />
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.secondaryColor }} />
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.accentColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Color Customization */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Edición Manual de Colores y Tonos del Software
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Primary Color */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs text-slate-300 block font-bold">Color Primario (Botones)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs text-slate-300 block font-bold">Color Secundario (Marcos)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs text-slate-300 block font-bold">Color de Acento (Badges)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedPaletteId('');
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs text-slate-300 block font-bold">Fondo General Software</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: FONDO & MARCA TRASLÚCIDA REGULABLE
             ======================================================== */}
          {activeTab === 'fondo' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Background Image Configuration */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    1. Imagen en el Fondo del Software
                  </h4>

                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={bgFileInputRef}
                      accept="image/*"
                      onChange={handleBgUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Cargar Foto de Fondo (Cancha / Tribuna / Estadio)</span>
                    </button>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">O URL de la imagen de fondo:</label>
                      <input
                        type="text"
                        value={bgImageUrl}
                        onChange={(e) => setBgImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {/* Translucency Slider */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Regulador de Traslucidez / Transparencia:</span>
                        <strong className="text-emerald-400 font-mono text-sm">{Math.round(bgImageOpacity * 100)}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={bgImageOpacity}
                        onChange={(e) => setBgImageOpacity(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0% (Invisible)</span>
                        <span>15% (Sutil recomendado)</span>
                        <span>50% (Visible)</span>
                        <span>100% (Opaco)</span>
                      </div>
                    </div>

                    {/* Blur Slider */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Desenfoque / Blur de Fondo:</span>
                        <strong className="text-emerald-400 font-mono">{bgImageBlur}px</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={bgImageBlur}
                        onChange={(e) => setBgImageBlur(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Translucent Watermark Configuration */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    2. Marca de Agua Traslúcida en Encabezados
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">URL de la Marca de Agua (Escudo)</label>
                      <input
                        type="text"
                        value={watermarkUrl}
                        onChange={(e) => setWatermarkUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {/* Watermark Opacity Slider */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Opacidad de la Marca en Banner:</span>
                        <strong className="text-sky-400 font-mono text-sm">{Math.round(watermarkOpacity * 100)}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0% (Sin marca)</span>
                        <span>20% (Elegante)</span>
                        <span>40% (Marcada)</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Banner Style Selector */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold">Estilo del Banner Principal</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'watermark', label: 'Marca Traslúcida' },
                          { id: 'cover_blur', label: 'Fondo Difuminado' },
                          { id: 'clean_gradient', label: 'Gradiente Limpio' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setBannerStyle(st.id as any)}
                            className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                              bannerStyle === st.id
                                ? 'bg-sky-600 text-white border-sky-400 shadow'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: TIPOGRAFÍA & TAMAÑO DE LETRAS
             ======================================================== */}
          {activeTab === 'tipografia' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Font Family Selector */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Tipo de Letra (Familia Tipográfica)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'inter', name: 'Inter Pro', desc: 'Moderna, equilibrada y neutra' },
                      { id: 'montserrat', name: 'Montserrat', desc: 'Geométrica, sobria e institucional' },
                      { id: 'teko', name: 'Teko Sport', desc: 'Impacto táctico y mayúsculas deportivas' },
                      { id: 'oswald', name: 'Oswald Condensada', desc: 'Poderosa para títulos de cartelera' },
                      { id: 'roboto', name: 'Roboto', desc: 'Clásica, alta legibilidad en pantallas' },
                      { id: 'system', name: 'Sistema Operativo', desc: 'Nativa sin consumo de red' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id as any)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          fontFamily === f.id
                            ? 'border-amber-400 bg-amber-950/20 text-white shadow'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <strong className="text-xs block text-white">{f.name}</strong>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size & Weight Scale */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Escala de Tamaño y Peso de Títulos
                  </h4>

                  {/* Size Scale */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-bold block">Tamaño General de las Letras</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'compact', label: 'Compacto (85%)', desc: 'Mayor densidad de datos' },
                        { id: 'normal', label: 'Estándar (100%)', desc: 'Equilibrio recomendado' },
                        { id: 'large', label: 'Cómodo (115%)', desc: 'Lectura amplia y descanso visual' }
                      ].map(sz => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setFontSize(sz.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            fontSize === sz.id
                              ? 'border-amber-400 bg-amber-950/20 text-white shadow'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <strong className="text-xs block">{sz.label}</strong>
                          <span className="text-[9px] text-slate-500">{sz.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title Weight */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-xs text-slate-300 font-bold block">Grosor de los Encabezados</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'normal', label: 'Normal (Medium)' },
                        { id: 'bold', label: 'Negrita (Bold)' },
                        { id: 'black', label: 'Ultra Black (900)' }
                      ].map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setHeaderWeight(w.id as any)}
                          className={`p-2 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                            headerWeight === w.id
                              ? 'border-amber-400 bg-amber-950/20 text-white shadow'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: EXPORTAR / IMPORTAR CONFIGURACIÓN VISUAL (JSON)
             ======================================================== */}
          {activeTab === 'plantilla_json' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      Exportación e Importación de Plantilla Visual (JSON)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Guarda todos los colores, tipografía, imágenes y niveles de transparencia de fondo en un archivo estándar <code className="text-cyan-300 font-mono">.json</code> para duplicar la identidad visual en otros clubes nuevos o restaurarla en 1 clic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. EXPORT CARD */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        1. Exportar Configuración Actual
                      </span>
                      <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        DESCARGA .JSON
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Genera un archivo JSON con toda la arquitectura visual de <strong>{name}</strong>: colores primarios, fondo general, transparencia de imagen, desenfoque, escala tipográfica y estilos de encabezado.
                    </p>

                    {/* Summary Badges */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Paleta de Colores:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: primaryColor }} />
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: secondaryColor }} />
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: accentColor }} />
                          <span className="text-[11px] text-white">{primaryColor}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Fondo & Traslucidez:</span>
                        <span className="text-emerald-400 font-bold">{bgImageUrl ? `Foto (${Math.round(bgImageOpacity * 100)}% opacidad)` : 'Color sólido'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Marca en Banner:</span>
                        <span className="text-sky-400 font-bold">{Math.round(watermarkOpacity * 100)}% opacidad</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tipografía & Escala:</span>
                        <span className="text-amber-400 font-bold uppercase">{fontFamily} ({fontSize})</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleExportThemeJSON}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Archivo JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyJSONToClipboard}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                      title="Copiar contenido JSON al portapapeles"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                      <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. IMPORT CARD */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        2. Importar en Este Club
                      </span>
                      <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        CARGA DESDE PC
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sube un archivo <code className="text-purple-300 font-mono">.json</code> descargado de cualquier otro club (o de una copia de respaldo) para aplicar instantáneamente sus colores, fondos y tipografías.
                    </p>

                    <div 
                      onClick={() => jsonFileInputRef.current?.click()}
                      className="p-5 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl bg-purple-950/10 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-purple-950/20 group"
                    >
                      <Upload className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white block">Haz clic para seleccionar el archivo JSON</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Compatible con temas FRAOVIA v1.0 (.json)</span>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      * Al importar, los cambios se cargarán de inmediato en el editor para que puedas previsualizarlos en vivo en la pestaña <strong>"6. Vista Hoja Software"</strong> antes de confirmar el guardado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo JSON de Otro Club</span>
                  </button>
                </div>
              </div>

              {/* JSON Live Preview Box */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Estructura Técnica del Archivo JSON
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      tema-visual-{(name || 'club').toLowerCase().replace(/[^a-z0-9]/g, '-')}.json
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyJSONToClipboard}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copiado al portapapeles' : 'Copiar JSON'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-48 leading-relaxed selection:bg-cyan-500 selection:text-black">
                  {JSON.stringify(getCurrentVisualThemePayload(), null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: VISTA PREVIA DE LA HOJA DEL SOFTWARE (EN TIEMPO REAL)
             ======================================================== */}
          {activeTab === 'hoja_software' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span>Esta es la vista exacta de cómo se ve la hoja del software con las opciones aplicadas.</span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">En Vivo · 100% Sincronizado</span>
              </div>

              {/* Software Sheet Preview Container */}
              <div 
                className={`p-6 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl space-y-6 ${getFontScaleClass()}`}
                style={{ 
                  backgroundColor: backgroundColor || '#070D1E',
                  fontFamily: getFontFamilyStyle()
                }}
              >
                {/* Background image preview if present */}
                {bgImageUrl && (
                  <div 
                    className="absolute inset-0 pointer-events-none select-none z-0 transition-opacity duration-300"
                    style={{ 
                      opacity: bgImageOpacity,
                      backgroundImage: `url(${bgImageUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      filter: `blur(${bgImageBlur}px)`
                    }}
                  />
                )}

                {/* 1. Software Header Banner (Exact matches user's screenshot 1) */}
                <div 
                  className="p-6 rounded-3xl shadow-2xl relative overflow-hidden text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10"
                  style={{ 
                    background: bannerGradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                  }}
                >
                  {/* Translucent Watermark inside header */}
                  {watermarkUrl && (
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none select-none z-0"
                      style={{ 
                        opacity: watermarkOpacity,
                        backgroundImage: `url(${watermarkUrl})`,
                        backgroundPosition: 'center right',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain'
                      }}
                    />
                  )}

                  <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0">
                      {logoUrl && logoUrl.trim() ? (
                        <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white uppercase tracking-wider">
                          SECRETARÍA & FINANZAS
                        </span>
                        <span className="text-xs text-white/90 font-medium">
                          {name}
                        </span>
                      </div>
                      <h2 className={`text-xl sm:text-2xl mt-1 text-white ${
                        headerWeight === 'black' ? 'font-black' : headerWeight === 'bold' ? 'font-bold' : 'font-medium'
                      }`}>
                        ADMINISTRACIÓN – Gestión Administrativa y Financiera
                      </h2>
                      <p className="text-xs text-white/80 mt-1 max-w-xl">
                        Padrón de deportistas, control de cuotas sociales, bloques por color y gráfico comparativo interanual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 z-10 shrink-0">
                    <button
                      type="button"
                      className="px-4 py-2.5 bg-white text-slate-900 font-bold rounded-2xl text-xs shadow hover:bg-slate-100 transition cursor-pointer"
                    >
                      Nuevo Comprobante
                    </button>
                    <button
                      type="button"
                      style={{ backgroundColor: accentColor, color: '#0A1128' }}
                      className="px-4 py-2.5 font-black rounded-2xl text-xs shadow hover:opacity-90 transition cursor-pointer"
                    >
                      Inscribir Socio
                    </button>
                  </div>
                </div>

                {/* 2. Content Row (Sample Software cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 z-10 relative">
                  
                  <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-mono block">SOCIO ACTIVO</span>
                    <strong className="text-sm text-white block">Valentino Gómez</strong>
                    <span className="text-xs text-slate-400 block">Fútbol Infantil · Cat. 2012</span>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Cuota:</span>
                      <span className="font-bold font-mono" style={{ color: accentColor }}>$14.000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-mono block">CAJA PRINCIPAL</span>
                    <strong className="text-sm text-white block">Tesorería Central</strong>
                    <span className="text-xs text-slate-400 block">Saldo consolidado en vivo</span>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Arqueo:</span>
                      <span className="font-bold font-mono text-emerald-400">$485.000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-mono block">IDENTIDAD OFICIAL</span>
                    <strong className="text-sm text-white block">{slogan}</strong>
                    <span className="text-xs text-slate-400 block">CUIT: {cuit}</span>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Estado:</span>
                      <span className="font-bold text-sky-400">Software Habilitado</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span>Club: <strong className="text-white">{name}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Fondo: <strong>{bgImageUrl ? `Foto (${Math.round(bgImageOpacity * 100)}%)` : 'Liso'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportThemeJSON}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Descargar archivo JSON con colores, fuentes y fondos de este club"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Cargar archivo JSON de otro club"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración del Club</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
