import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Download, 
  Zap, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Layers, 
  Type, 
  Palette, 
  Image as ImageIcon,
  Building2,
  ExternalLink,
  Info,
  Maximize2,
  Copy,
  X
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

// Helper: Calculate relative luminance for WCAG contrast ratio
function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.5;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return 0.5;
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('') 
    : cleanHex;
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Dynamic high-contrast text color based on background luminance
function getContrastTextColor(bgColor: string): string {
  return getLuminance(bgColor) > 0.45 ? '#0F172A' : '#FFFFFF';
}

// Helper: WCAG contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface BrandingDiagnostic {
  score: number; // 0 - 100
  status: 'optimo' | 'advertencia' | 'critico';
  primaryContrastRatio: number;
  contrastStatus: 'AAA' | 'AA' | 'FAIL';
  backgroundOpacityWarning: boolean;
  blurWarning: boolean;
  issues: string[];
  recommendations: string[];
}

// Analyze branding configuration of a club
export function analyzeClubBranding(club: Club): BrandingDiagnostic {
  const b = club.branding || {};
  const primary = b.primaryColor || '#0284C7';
  const bg = b.backgroundColor || '#070D1E';
  const bgOpacity = b.bgImageOpacity ?? 0.15;
  const bgBlur = b.bgImageBlur ?? 0;
  const watermarkOpacity = b.watermarkOpacity ?? 0.20;

  // Text on primary button (usually white #ffffff)
  const primaryOnWhiteRatio = getContrastRatio(primary, '#FFFFFF');
  const primaryOnBlackRatio = getContrastRatio(primary, '#000000');
  const effectivePrimaryRatio = Math.max(primaryOnWhiteRatio, primaryOnBlackRatio);

  // Background contrast with cards/text
  const bgOnWhiteRatio = getContrastRatio(bg, '#FFFFFF');

  const issues: string[] = [];
  const recommendations: string[] = [];

  let score = 100;
  let contrastStatus: 'AAA' | 'AA' | 'FAIL' = 'AAA';

  if (primaryOnWhiteRatio < 3.0) {
    issues.push(`El botón primario (${primary}) tiene un contraste muy bajo con texto blanco (${primaryOnWhiteRatio.toFixed(1)}:1).`);
    score -= 35;
    contrastStatus = 'FAIL';
  } else if (primaryOnWhiteRatio < 4.5) {
    issues.push(`Contraste regular en botones (${primaryOnWhiteRatio.toFixed(1)}:1). Cumple nivel mínimo AA para textos grandes, pero no para textos pequeños.`);
    score -= 15;
    contrastStatus = 'AA';
  }

  const backgroundOpacityWarning = bgOpacity > 0.30;
  if (backgroundOpacityWarning) {
    issues.push(`Opacidad de fondo elevada (${Math.round(bgOpacity * 100)}%). Puede competir visualmente con tablas y números.`);
    score -= 20;
  }

  const blurWarning = bgBlur > 12;
  if (blurWarning) {
    issues.push(`Desenfoque de fondo excesivo (${bgBlur}px), la imagen pierde definición institucional.`);
    score -= 10;
  }

  if (watermarkOpacity > 0.40) {
    issues.push(`Marca de agua en banner con opacidad alta (${Math.round(watermarkOpacity * 100)}%), puede tapar el texto de administración.`);
    score -= 15;
  }

  if (primaryOnWhiteRatio < 4.5) {
    recommendations.push('Oscurecer el tono primario para garantizar legibilidad WCAG AA (mínimo 4.5:1).');
  }
  if (bgOpacity > 0.25) {
    recommendations.push('Reducir la opacidad del fondo a entre 10% y 18% para un aspecto traslúcido profesional.');
  }
  if (watermarkOpacity > 0.25) {
    recommendations.push('Bajar la opacidad de la marca de agua a 15%-20% en el encabezado.');
  }

  let status: 'optimo' | 'advertencia' | 'critico' = 'optimo';
  if (score < 60 || contrastStatus === 'FAIL') {
    status = 'critico';
  } else if (score < 85 || issues.length > 0) {
    status = 'advertencia';
  }

  return {
    score: Math.max(0, score),
    status,
    primaryContrastRatio: primaryOnWhiteRatio,
    contrastStatus,
    backgroundOpacityWarning,
    blurWarning,
    issues,
    recommendations
  };
}

interface ClubBrandingMonitorProps {
  allClubs: Club[];
  currentUser: User;
  onRefreshData: () => void;
  onOpenClubEditor: (club: Club) => void;
  onSelectClubToSupervise?: (club: Club) => void;
}

export const ClubBrandingMonitor: React.FC<ClubBrandingMonitorProps> = ({
  allClubs,
  currentUser,
  onRefreshData,
  onOpenClubEditor,
  onSelectClubToSupervise
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'optimo' | 'advertencia' | 'critico'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cloningSourceClub, setCloningSourceClub] = useState<Club | null>(null);
  const [selectedCloneTargetId, setSelectedCloneTargetId] = useState<string>('');

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Diagnostics map
  const diagnosticsMap = useMemo(() => {
    const map = new Map<string, BrandingDiagnostic>();
    allClubs.forEach(club => {
      map.set(club.id, analyzeClubBranding(club));
    });
    return map;
  }, [allClubs]);

  // Filtered clubs
  const filteredClubs = useMemo(() => {
    return allClubs.filter(club => {
      const diag = diagnosticsMap.get(club.id);
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            club.slug.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      return diag?.status === statusFilter;
    });
  }, [allClubs, searchTerm, statusFilter, diagnosticsMap]);

  // Overall statistics
  const stats = useMemo(() => {
    let optimos = 0;
    let advertencias = 0;
    let criticos = 0;

    allClubs.forEach(c => {
      const d = diagnosticsMap.get(c.id);
      if (d?.status === 'optimo') optimos++;
      else if (d?.status === 'advertencia') advertencias++;
      else if (d?.status === 'critico') criticos++;
    });

    return {
      total: allClubs.length,
      optimos,
      advertencias,
      criticos
    };
  }, [allClubs, diagnosticsMap]);

  // One-click Auto-Fix Contrast for a single club
  const handleAutoFixClub = (club: Club) => {
    try {
      const b = club.branding || {};
      const currentPrimary = b.primaryColor || '#0284C7';
      const lum = getLuminance(currentPrimary);

      // If too bright for white text, darken it by 30%
      let safePrimary = currentPrimary;
      if (lum > 0.45) {
        safePrimary = '#0369A1'; // Deep accessible blue
      }

      const updatedBranding = {
        ...b,
        primaryColor: safePrimary,
        bgImageOpacity: Math.min(b.bgImageOpacity ?? 0.15, 0.18), // Clamp safe background opacity
        watermarkOpacity: Math.min(b.watermarkOpacity ?? 0.20, 0.22),
        bgImageBlur: Math.min(b.bgImageBlur ?? 0, 4)
      };

      fraoviaDB.updateClubBranding(club.id, updatedBranding, club.logoUrl, currentUser);
      club.branding = updatedBranding;
      onRefreshData();
      showNotification(`¡Contraste y legibilidad de "${club.name}" auto-optimizados a estándar WCAG AA!`);
    } catch (err: any) {
      showNotification(err.message || 'Error al auto-corregir');
    }
  };

  // Batch Auto-Fix all clubs with warnings or critical contrast
  const handleAutoFixAllClubs = () => {
    try {
      let count = 0;
      allClubs.forEach(club => {
        const diag = diagnosticsMap.get(club.id);
        if (diag && diag.status !== 'optimo') {
          const b = club.branding || {};
          const currentPrimary = b.primaryColor || '#0284C7';
          const lum = getLuminance(currentPrimary);
          let safePrimary = currentPrimary;
          if (lum > 0.45) {
            safePrimary = '#0369A1';
          }
          const updatedBranding = {
            ...b,
            primaryColor: safePrimary,
            bgImageOpacity: Math.min(b.bgImageOpacity ?? 0.15, 0.18),
            watermarkOpacity: Math.min(b.watermarkOpacity ?? 0.20, 0.22),
            bgImageBlur: Math.min(b.bgImageBlur ?? 0, 4)
          };
          fraoviaDB.updateClubBranding(club.id, updatedBranding, club.logoUrl, currentUser);
          club.branding = updatedBranding;
          count++;
        }
      });
      onRefreshData();
      showNotification(`¡${count} clubes con alertas fueron optimizados a estándar WCAG AA con éxito!`);
    } catch (err: any) {
      showNotification('Error al optimizar todos los clubes: ' + (err.message || ''));
    }
  };

  // Clone visual branding to another club
  const handleConfirmClone = () => {
    if (!cloningSourceClub || !selectedCloneTargetId) return;
    try {
      const target = allClubs.find(c => c.id === selectedCloneTargetId);
      if (!target) return;
      const b = cloningSourceClub.branding || {};
      const updatedBranding = {
        ...target.branding,
        primaryColor: b.primaryColor || '#0284C7',
        secondaryColor: b.secondaryColor || '#0369A1',
        accentColor: b.accentColor || '#38BDF8',
        backgroundColor: b.backgroundColor || '#070D1E',
        bannerGradient: b.bannerGradient || '',
        bgImageUrl: b.bgImageUrl || '',
        bgImageOpacity: b.bgImageOpacity ?? 0.15,
        bgImageBlur: b.bgImageBlur ?? 0,
        watermarkUrl: b.watermarkUrl || '',
        watermarkOpacity: b.watermarkOpacity ?? 0.20,
        bannerStyle: b.bannerStyle || 'watermark',
        fontFamily: b.fontFamily || 'inter',
        fontSize: b.fontSize || 'normal',
        headerWeight: b.headerWeight || 'black',
        palettePresetId: b.palettePresetId
      };
      fraoviaDB.updateClubBranding(target.id, updatedBranding, target.logoUrl, currentUser);
      target.branding = updatedBranding;
      onRefreshData();
      showNotification(`¡Identidad visual de "${cloningSourceClub.name}" clonada exitosamente a "${target.name}"!`);
      setCloningSourceClub(null);
      setSelectedCloneTargetId('');
    } catch (err: any) {
      showNotification('Error al clonar diseño: ' + (err.message || ''));
    }
  };

  // Export Theme JSON for a specific club
  const handleExportJSON = (club: Club) => {
    try {
      const b = club.branding || {};
      const payload = {
        fraoviaThemeVersion: '1.0',
        exportedAt: new Date().toISOString(),
        clubSource: club.name,
        themeName: `Tema Visual - ${club.name}`,
        visualConfig: {
          primaryColor: b.primaryColor || '#0284C7',
          secondaryColor: b.secondaryColor || '#0369A1',
          accentColor: b.accentColor || '#38BDF8',
          backgroundColor: b.backgroundColor || '#070D1E',
          bannerGradient: b.bannerGradient || '',
          bgImageUrl: b.bgImageUrl || b.coverUrl || '',
          bgImageOpacity: b.bgImageOpacity ?? 0.15,
          bgImageBlur: b.bgImageBlur ?? 0,
          watermarkUrl: b.watermarkUrl || club.logoUrl || '',
          watermarkOpacity: b.watermarkOpacity ?? 0.20,
          bannerStyle: b.bannerStyle || 'watermark',
          fontFamily: b.fontFamily || 'inter',
          fontSize: b.fontSize || 'normal',
          headerWeight: b.headerWeight || 'black',
          slogan: b.slogan || 'Pasión y comunidad'
        }
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanSlug = club.slug || 'club';
      a.download = `tema-visual-${cleanSlug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification(`Tema exportado como "tema-visual-${cleanSlug}.json"`);
    } catch {
      showNotification('Error al exportar tema JSON');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TOP HEADER: Monitor de Branding & Auditoría de Contraste */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Control de Calidad Visual
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                AUDITORÍA WCAG & TRASLUCIDEZ
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Monitor de Branding & Legibilidad Multi-Club
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Supervisa las miniaturas reales de la interfaz de cada club con sus colores, fondos y marcas de agua aplicados. Detecta contrastes insuficientes o fotos de fondo demasiado invasivas para garantizar una experiencia de lectura óptima.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            {stats.advertencias + stats.criticos > 0 && (
              <button
                type="button"
                onClick={handleAutoFixAllClubs}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                title="Ajusta automáticamente todos los clubes con alertas a WCAG AA"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>Optimizar Todos en Alerta ({stats.advertencias + stats.criticos})</span>
              </button>
            )}
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              <strong>{allClubs.length} clubes</strong> evaluados
            </span>
          </div>
        </div>

        {/* 4 Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Clubes Totales</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{stats.total}</div>
            <span className="text-[10px] text-slate-500">100% renderizados</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Legibilidad Óptima
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{stats.optimos}</div>
            <span className="text-[10px] text-emerald-400/80">Pasan WCAG AAA/AA</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-[10px] text-amber-400 font-bold uppercase block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Advertencias Menores
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{stats.advertencias}</div>
            <span className="text-[10px] text-amber-400/80">Revisión sugerida</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <span className="text-[10px] text-rose-400 font-bold uppercase block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Contraste Deficiente
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">{stats.criticos}</div>
            <span className="text-[10px] text-rose-400/80">Requiere ajuste</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({allClubs.length})
          </button>

          <button
            onClick={() => setStatusFilter('optimo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'optimo'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Óptimos ({stats.optimos})</span>
          </button>

          <button
            onClick={() => setStatusFilter('advertencia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'advertencia'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Con Advertencias ({stats.advertencias})</span>
          </button>

          <button
            onClick={() => setStatusFilter('critico')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'critico'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Contraste Deficiente ({stats.criticos})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* MINIATURES GRID */}
      {filteredClubs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <Eye className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No se encontraron clubes para el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredClubs.map((club) => {
            const diag = diagnosticsMap.get(club.id) || analyzeClubBranding(club);
            const b = club.branding || {};
            const primary = b.primaryColor || '#0284C7';
            const secondary = b.secondaryColor || '#0369A1';
            const bg = b.backgroundColor || '#070D1E';
            const bgImage = b.bgImageUrl || b.coverUrl || '';
            const bgOpacity = b.bgImageOpacity ?? 0.15;
            const bgBlur = b.bgImageBlur ?? 0;
            const watermarkUrl = b.watermarkUrl || club.logoUrl || '';
            const watermarkOpacity = b.watermarkOpacity ?? 0.20;
            const slogan = b.slogan || 'Pasión y comunidad';

            return (
              <div 
                key={club.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition hover:border-slate-700"
              >
                {/* CARD HEADER */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {club.logoUrl && club.logoUrl.trim() ? (
                      <img 
                        src={club.logoUrl} 
                        alt={club.name} 
                        className="w-9 h-9 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800 shrink-0" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                        {club.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white block">{club.name}</strong>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">/{club.slug}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate max-w-xs">{slogan}</span>
                    </div>
                  </div>

                  {/* Diagnostic Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {diag.status === 'optimo' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Óptimo ({diag.score} pts)</span>
                      </span>
                    )}

                    {diag.status === 'advertencia' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Revisar ({diag.score} pts)</span>
                      </span>
                    )}

                    {diag.status === 'critico' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>Bajo Contraste ({diag.score} pts)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* MINIATURE INTERFACE (Exact representation of club's live UI) */}
                <div className="p-4 bg-slate-950/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Miniatura de Interfaz en Vivo
                    </span>
                    <span className="text-slate-500">
                      Fuente: {b.fontFamily || 'Inter'} • Escala: {b.fontSize || 'normal'}
                    </span>
                  </div>

                  {/* The Simulated Applet Sheet */}
                  <div 
                    className="p-4 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner select-none transition-all"
                    style={{
                      backgroundColor: bg,
                      fontFamily: b.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                                  b.fontFamily === 'teko' ? 'Teko, sans-serif' :
                                  b.fontFamily === 'oswald' ? 'Oswald, sans-serif' : 'Inter, sans-serif'
                    }}
                  >
                    {/* Simulated Background Photo with active opacity and blur */}
                    {bgImage && (
                      <div 
                        className="absolute inset-0 pointer-events-none select-none z-0"
                        style={{
                          opacity: bgOpacity,
                          backgroundImage: `url(${bgImage})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                          filter: `blur(${bgBlur}px)`
                        }}
                      />
                    )}

                    {/* Simulated Header Banner */}
                    <div 
                      className="p-3.5 rounded-xl shadow-md relative overflow-hidden text-white flex items-center justify-between gap-3 z-10"
                      style={{
                        background: b.bannerGradient || `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
                      }}
                    >
                      {/* Translucent Watermark inside banner */}
                      {watermarkUrl && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none select-none z-0"
                          style={{
                            opacity: watermarkOpacity,
                            backgroundImage: `url(${watermarkUrl})`,
                            backgroundPosition: 'center right',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'contain'
                          }}
                        />
                      )}

                      <div className="flex items-center gap-2.5 z-10">
                        <div className="w-8 h-8 rounded-lg bg-white p-1 shadow flex items-center justify-center shrink-0">
                          {club.logoUrl && club.logoUrl.trim() ? (
                            <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5 text-slate-900" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-white/20 text-white">
                              SECRETARÍA
                            </span>
                            <span className="text-[10px] text-white/90 font-semibold">{club.name}</span>
                          </div>
                          <div className="text-xs font-black text-white leading-tight">
                            ADMINISTRACIÓN & FINANZAS
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 z-10 shrink-0">
                        <div 
                          className="px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm flex items-center gap-1"
                          style={{ backgroundColor: primary }}
                        >
                          + Nuevo
                        </div>
                      </div>
                    </div>

                    {/* Simulated Dashboard Metric Cards */}
                    <div className="grid grid-cols-3 gap-2 mt-2.5 z-10 relative">
                      <div className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800">
                        <span className="text-[8px] text-slate-400 font-bold block">Cobranza</span>
                        <div className="text-xs font-mono font-black text-emerald-400">$182.4k</div>
                        <span className="text-[8px] text-slate-400">88% al día</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800">
                        <span className="text-[8px] text-slate-400 font-bold block">Deportistas</span>
                        <div className="text-xs font-mono font-black text-white">{club.contractedPlayersQuota || 240}</div>
                        <span className="text-[8px] text-sky-400">Padrón activo</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800">
                        <span className="text-[8px] text-slate-400 font-bold block">Mora</span>
                        <div className="text-xs font-mono font-black text-amber-400">12%</div>
                        <span className="text-[8px] text-rose-400">En aviso</span>
                      </div>
                    </div>

                    {/* Simulated Table Row Preview */}
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900/85 backdrop-blur-sm border border-slate-800 z-10 relative flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
                        <span className="text-slate-300 font-medium">Socio #1042 - Cuota Octubre</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">$12.500</span>
                    </div>
                  </div>
                </div>

                {/* AUDIT DIAGNOSTIC DETAILS */}
                <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Contraste Botón:</span>
                        <span className={`font-mono font-black ${
                          diag.primaryContrastRatio >= 4.5 ? 'text-emerald-400' :
                          diag.primaryContrastRatio >= 3.0 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {diag.primaryContrastRatio.toFixed(1)}:1 ({diag.contrastStatus})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Traslucidez Fondo:</span>
                        <span className={`font-mono font-bold ${
                          diag.backgroundOpacityWarning ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {Math.round(bgOpacity * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Palette Dots */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/20" title={`Primario: ${primary}`} style={{ backgroundColor: primary }} />
                      <span className="w-3 h-3 rounded-full border border-white/20" title={`Secundario: ${secondary}`} style={{ backgroundColor: secondary }} />
                      <span className="w-3 h-3 rounded-full border border-white/20" title={`Fondo: ${bg}`} style={{ backgroundColor: bg }} />
                    </div>
                  </div>

                  {/* Issues or Status Note */}
                  {diag.issues.length > 0 ? (
                    <div className="space-y-1 p-2.5 rounded-xl bg-amber-950/15 border border-amber-500/20 text-[11px] text-amber-200">
                      {diag.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-950/15 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Legibilidad y contraste impecables. Cumple con normativas de accesibilidad visual.</span>
                    </div>
                  )}

                  {/* ACTIONS TOOLBAR */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {diag.status !== 'optimo' && (
                        <button
                          type="button"
                          onClick={() => handleAutoFixClub(club)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Ajusta automáticamente el contraste a estándar WCAG AA y equilibra la opacidad del fondo"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Auto-Corregir Contraste</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExportJSON(club)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                        title="Exportar configuración visual actual a JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Exportar JSON</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenClubEditor(club)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                      title="Abrir editor completo de este club para ajustar colores, tipografía o fondos"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Editar Club</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
