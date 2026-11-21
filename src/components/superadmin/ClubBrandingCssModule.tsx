import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Palette, 
  Code, 
  Upload, 
  Save, 
  Check, 
  Sparkles, 
  Eye, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  RotateCcw, 
  Sliders, 
  Building2, 
  Laptop, 
  Layers, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  Club, 
  User, 
  PREDEFINED_COLOR_PALETTES, 
  PredefinedColorPalette 
} from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface ClubBrandingCssModuleProps {
  initialClub?: Club | null;
  allClubs: Club[];
  currentUser: User;
  onUpdated: () => void;
  onClose?: () => void;
}

export const ClubBrandingCssModule: React.FC<ClubBrandingCssModuleProps> = ({
  initialClub,
  allClubs,
  currentUser,
  onUpdated,
  onClose
}) => {
  // Selected club to configure
  const [selectedClubId, setSelectedClubId] = useState<string>(
    initialClub?.id || allClubs[0]?.id || ''
  );

  const targetClub = useMemo(() => {
    return allClubs.find(c => c.id === selectedClubId) || initialClub || allClubs[0];
  }, [allClubs, selectedClubId, initialClub]);

  // Active sub-tab: 'palettes' | 'css_editor' | 'live_preview'
  const [activeTab, setActiveTab] = useState<'palettes' | 'css_editor' | 'live_preview'>('palettes');

  // Palette category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // State for branding settings
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(
    targetClub?.branding?.palettePresetId || ''
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    targetClub?.branding?.primaryColor || '#0284C7'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    targetClub?.branding?.secondaryColor || '#0369A1'
  );
  const [accentColor, setAccentColor] = useState<string>(
    targetClub?.branding?.accentColor || '#38BDF8'
  );
  const [bannerGradient, setBannerGradient] = useState<string>(
    targetClub?.branding?.bannerGradient || ''
  );

  // Custom CSS State
  const [customCss, setCustomCss] = useState<string>(
    targetClub?.branding?.customCss || ''
  );
  const [customCssUrl, setCustomCssUrl] = useState<string>(
    targetClub?.branding?.customCssUrl || ''
  );
  const [cssEnabled, setCssEnabled] = useState<boolean>(
    targetClub?.branding?.cssEnabled ?? true
  );

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when target club changes
  useEffect(() => {
    if (targetClub?.branding) {
      setSelectedPaletteId(targetClub.branding.palettePresetId || '');
      setPrimaryColor(targetClub.branding.primaryColor || '#0284C7');
      setSecondaryColor(targetClub.branding.secondaryColor || '#0369A1');
      setAccentColor(targetClub.branding.accentColor || '#38BDF8');
      setBannerGradient(targetClub.branding.bannerGradient || '');
      setCustomCss(targetClub.branding.customCss || '');
      setCustomCssUrl(targetClub.branding.customCssUrl || '');
      setCssEnabled(targetClub.branding.cssEnabled ?? true);
    }
  }, [targetClub]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered palettes
  const filteredPalettes = useMemo(() => {
    if (selectedCategory === 'Todas') return PREDEFINED_COLOR_PALETTES;
    return PREDEFINED_COLOR_PALETTES.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  // Handle Palette Selection
  const handleSelectPalette = (palette: PredefinedColorPalette) => {
    setSelectedPaletteId(palette.id);
    setPrimaryColor(palette.primaryColor);
    setSecondaryColor(palette.secondaryColor);
    setAccentColor(palette.accentColor);
    setBannerGradient(palette.bannerGradient);
    showFeedback(`Paleta "${palette.name}" seleccionada para ${targetClub.name}`);
  };

  // Handle CSS File Upload (.css)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.css') && file.type !== 'text/css') {
      showFeedback('Por favor selecciona un archivo con extensión .css válido', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Basic security check: disallow script tags in uploaded CSS
        if (content.toLowerCase().includes('<script') || content.toLowerCase().includes('javascript:')) {
          showFeedback('El archivo CSS contiene código potencialmente inseguro no permitido', 'error');
          return;
        }
        setCustomCss(content);
        setCssEnabled(true);
        showFeedback(`Hoja de estilos "${file.name}" cargada correctamente (${content.length} caracteres)`);
      }
    };
    reader.readAsText(file);
  };

  // Quick CSS Snippets
  const insertSnippet = (snippetType: 'glassmorphism' | 'neon_buttons' | 'tactical_typography' | 'card_hover') => {
    let snippetCode = '';
    switch (snippetType) {
      case 'glassmorphism':
        snippetCode = `\n/* --- Estilo Glassmorphism para Tarjetas del Club --- */\n.bg-slate-900, .bg-slate-950 {\n  background: rgba(12, 22, 45, 0.75) !important;\n  backdrop-filter: blur(12px) !important;\n  border: 1px solid rgba(255, 255, 255, 0.08) !important;\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;\n}\n`;
        break;
      case 'neon_buttons':
        snippetCode = `\n/* --- Botones Principales con Brillo y Gradiente --- */\nbutton[type="submit"], .bg-blue-600, .bg-sky-600 {\n  background: linear-gradient(135deg, var(--club-primary, #0284c7) 0%, var(--club-accent, #38bdf8) 100%) !important;\n  box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4) !important;\n  font-weight: 800 !important;\n  letter-spacing: 0.5px !important;\n}\n`;
        break;
      case 'tactical_typography':
        snippetCode = `\n/* --- Tipografía Táctica Deportiva en Mayúsculas --- */\nh1, h2, h3, h4 {\n  letter-spacing: -0.02em !important;\n  text-transform: uppercase !important;\n  font-family: system-ui, -apple-system, sans-serif !important;\n}\n.font-mono {\n  letter-spacing: 0.05em !important;\n}\n`;
        break;
      case 'card_hover':
        snippetCode = `\n/* --- Efecto Elevación 3D en Tarjetas de Socios --- */\n.hover\\:border-slate-700:hover {\n  transform: translateY(-3px) !important;\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;\n  border-color: var(--club-primary, #0284c7) !important;\n}\n`;
        break;
    }
    setCustomCss(prev => (prev ? prev + '\n' + snippetCode : snippetCode));
    showFeedback('Snippet insertado en el editor de CSS');
  };

  // Save All Branding to DB
  const handleSaveAll = () => {
    if (!targetClub) return;

    try {
      fraoviaDB.updateClubBranding(
        targetClub.id,
        {
          primaryColor,
          secondaryColor,
          accentColor,
          bannerGradient: bannerGradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          palettePresetId: selectedPaletteId || undefined,
          customCss,
          customCssUrl: customCssUrl.trim() || undefined,
          cssEnabled,
          customCssUpdatedAt: new Date().toISOString()
        },
        targetClub.logoUrl,
        currentUser
      );

      // Audit log
      fraoviaDB.logAudit(
        currentUser,
        'ACTUALIZACION_CSS_BRANDING',
        `Hoja de estilos CSS y paleta de colores actualizadas para "${targetClub.name}". Paleta: ${selectedPaletteId || 'Personalizada'}. CSS activo: ${cssEnabled}`,
        'superadmin',
        targetClub.id
      );

      showFeedback(`¡Configuración de estilos CSS y paleta guardada exitosamente en el branding de ${targetClub.name}!`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message || 'Error al guardar la configuración', 'error');
    }
  };

  return (
    <div className="bg-[#070D1E] border border-[#1A2B4C] rounded-3xl w-full shadow-2xl text-white overflow-hidden flex flex-col">
      
      {/* HEADER BAR */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0A1329] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Personalización CSS & Paletas por Club
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PROPIEDAD BRANDING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cargá hojas de estilos CSS personalizadas o asigná paletas de colores exclusivas para el front-end de cada club.
            </p>
          </div>
        </div>

        {/* Club Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 w-full sm:w-72">
            <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {allClubs.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} ({c.branding?.templateName || 'Paleta Activa'})
                </option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="px-4 sm:px-6 pt-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('palettes')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'palettes'
                ? 'border-purple-500 text-white bg-slate-900/80 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>1. Paletas de Colores Predefinidas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('css_editor')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'css_editor'
                ? 'border-sky-500 text-white bg-slate-900/80 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-sky-400" />
            <span>2. Hoja de Estilos CSS Específica</span>
            {customCss && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_preview')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'live_preview'
                ? 'border-emerald-500 text-white bg-slate-900/80 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Vista Previa en Vivo</span>
          </button>
        </div>

        {/* Global Save Button */}
        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-1.5 mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar en Branding del Club</span>
        </button>
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
        
        {/* ========================================================
            TAB 1: PALETAS DE COLORES PREDEFINIDAS
           ======================================================== */}
        {activeTab === 'palettes' && (
          <div className="space-y-6">
            
            {/* Category Pills & Info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['Todas', 'Clásicos Tradicionales', 'Modernos & Tácticos', 'Institucionales'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {filteredPalettes.length} paletas profesionales listas para aplicar en 1 clic
              </span>
            </div>

            {/* Palettes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPalettes.map(palette => {
                const isSelected = selectedPaletteId === palette.id;
                return (
                  <div
                    key={palette.id}
                    onClick={() => handleSelectPalette(palette)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-950/20 shadow-xl shadow-purple-600/20'
                        : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Header gradient banner strip */}
                    <div 
                      className="h-10 w-full rounded-xl flex items-center justify-between px-3 shadow-inner"
                      style={{ background: palette.bannerGradient }}
                    >
                      <span className="text-[10px] font-black uppercase text-white drop-shadow">
                        {palette.category}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-white text-purple-700 flex items-center justify-center font-bold text-xs shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-white">{palette.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {palette.description}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: palette.primaryColor }}
                          title={`Primario: ${palette.primaryColor}`}
                        />
                        <div 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: palette.secondaryColor }}
                          title={`Secundario: ${palette.secondaryColor}`}
                        />
                        <div 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: palette.accentColor }}
                          title={`Acento: ${palette.accentColor}`}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-purple-300 font-bold">
                        {isSelected ? 'APLICADA' : 'Click para Asignar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color Fine-Tuning Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Ajuste Fino de Colores Hexadecimales</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Podés personalizar manualmente cada valor tras elegir una paleta
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Primary Color Picker */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs text-slate-300 block font-bold">Color Primario (Botones & Títulos)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setSelectedPaletteId(''); // Custom
                      }}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
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

                {/* Secondary Color Picker */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs text-slate-300 block font-bold">Color Secundario (Fondo & Marcos)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setSelectedPaletteId('');
                      }}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
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

                {/* Accent Color Picker */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs text-slate-300 block font-bold">Color de Acento (Badges & Alertas)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        setSelectedPaletteId('');
                      }}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
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
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: EDITOR & HOJA DE ESTILOS CSS ESPECÍFICA
           ======================================================== */}
        {activeTab === 'css_editor' && (
          <div className="space-y-4">
            
            {/* Top Toolbar: File upload, URL, and Status Switch */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* File Upload Button (.css) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".css,text/css"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cargar Archivo .CSS</span>
                </button>

                {/* Master Switch: Enable / Disable CSS */}
                <label className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cssEnabled}
                    onChange={(e) => setCssEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    CSS Activo para este Club
                  </span>
                </label>
              </div>

              {/* Quick Snippets Dropdown/Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Snippets:</span>
                <button
                  type="button"
                  onClick={() => insertSnippet('glassmorphism')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  title="Insertar efecto Glassmorphism"
                >
                  + Glassmorphism
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('neon_buttons')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  title="Insertar botones con gradiente"
                >
                  + Botones Pro
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('tactical_typography')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  title="Insertar tipografía táctica"
                >
                  + Tipografía
                </button>
              </div>
            </div>

            {/* External Stylesheet Link (Optional) */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="URL de hoja de estilos externa o Google Fonts (opcional, ej: https://fonts.googleapis.com/...)"
                value={customCssUrl}
                onChange={(e) => setCustomCssUrl(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            {/* Code Editor Area */}
            <div className="rounded-2xl border border-slate-800 bg-[#040814] overflow-hidden shadow-2xl">
              <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono text-[11px] text-white">
                    custom-styles-{targetClub.id}.css
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({customCss.split('\n').length} líneas, {customCss.length} bytes)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customCss);
                      showFeedback('CSS copiado al portapapeles');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomCss('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder={`/* Escribí o pegá tus reglas CSS personalizadas para ${targetClub.name} */\n/* Variables disponibles automáticamente:\n   var(--club-primary)\n   var(--club-secondary)\n   var(--club-accent)\n*/\n\n.card-socio {\n  border-left: 4px solid var(--club-primary);\n}`}
                className="w-full h-80 p-4 bg-transparent text-xs text-sky-300 font-mono leading-relaxed focus:outline-none resize-y selection:bg-sky-500/30"
                spellCheck={false}
              />
            </div>

            {/* Helper tips */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Las variables <code>var(--club-primary)</code>, <code>var(--club-secondary)</code> y <code>var(--club-accent)</code> se inyectan dinámicamente en el DOM de la aplicación del club.
              </span>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: VISTA PREVIA EN VIVO (SANDBOX)
           ======================================================== */}
        {activeTab === 'live_preview' && (
          <div className="space-y-4">
            
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>Simulador en vivo del front-end para los usuarios de <strong>{targetClub.name}</strong></span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                EN VIVO
              </span>
            </div>

            {/* Sandbox Container with injected style */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-[#070D1E] shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Inject CSS live in preview container */}
              {cssEnabled && customCss && (
                <style dangerouslySetInnerHTML={{ __html: customCss }} />
              )}

              {/* Simulated Club Header */}
              <div 
                className="p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-white"
                style={{ 
                  background: bannerGradient || `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow flex items-center justify-center">
                    {targetClub.logoUrl && targetClub.logoUrl.trim() ? (
                      <img src={targetClub.logoUrl} alt={targetClub.name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white drop-shadow">
                      {targetClub.name}
                    </h3>
                    <span className="text-xs text-white/80 font-mono">
                      Portal Oficial de Socios & Directivos
                    </span>
                  </div>
                </div>

                <span 
                  className="px-3 py-1 rounded-full text-xs font-black shadow"
                  style={{ backgroundColor: accentColor, color: '#0F172A' }}
                >
                  TEMPORADA 2025
                </span>
              </div>

              {/* Simulated Content Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Card 1: Sample Player */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 card-socio">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Socio #1042</span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: `${primaryColor}30`, color: accentColor }}
                    >
                      AL DÍA
                    </span>
                  </div>
                  <strong className="text-sm text-white block">Mateo Rossi</strong>
                  <span className="text-xs text-slate-400 block">Fútbol Juvenil · Sub 16</span>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cuota:</span>
                    <strong style={{ color: accentColor }}>$12.500</strong>
                  </div>
                </div>

                {/* Card 2: Sample Receipt */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Recibo #REC-0089</span>
                    <span className="text-[10px] text-emerald-400 font-bold">COBRADO</span>
                  </div>
                  <strong className="text-sm text-white block">Cuota Social Octubre</strong>
                  <span className="text-xs text-slate-400 block">Efectivo · Caja Central</span>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total:</span>
                    <strong className="text-emerald-400">$12.500</strong>
                  </div>
                </div>

                {/* Card 3: Action Buttons */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2">
                  <div>
                    <strong className="text-xs text-white block">Acciones Rápidas</strong>
                    <span className="text-[11px] text-slate-400 block">Estilo de botones con CSS</span>
                  </div>
                  <button
                    type="button"
                    style={{ backgroundColor: primaryColor }}
                    className="w-full py-2 text-white font-bold rounded-xl text-xs shadow transition cursor-pointer"
                  >
                    Botón Primario
                  </button>
                  <button
                    type="button"
                    style={{ borderColor: accentColor, color: accentColor }}
                    className="w-full py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Botón Secundario
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* FOOTER BAR */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span>Configurando: <strong className="text-white">{targetClub.name}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Paleta: <strong className="text-purple-300">{selectedPaletteId || 'Personalizada'}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Estilos en Club.branding</span>
          </button>
        </div>
      </div>

    </div>
  );
};
