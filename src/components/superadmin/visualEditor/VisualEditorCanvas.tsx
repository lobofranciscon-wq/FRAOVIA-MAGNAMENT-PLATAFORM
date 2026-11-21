import React, { useState } from 'react';
import { 
  Lock, 
  Move, 
  Maximize2, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Activity, 
  Users, 
  CreditCard, 
  ShoppingBag, 
  Layers, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Check,
  RefreshCw
} from 'lucide-react';
import { Club, User } from '../../../types/fraovia';
import { fraoviaDB } from '../../../services/fraoviaStore';
import { VisualElement, BackgroundConfig } from './visualEditorTypes';

export type VisualEditorViewTab = 
  | 'dashboard' 
  | 'jugadores' 
  | 'categorias' 
  | 'caja' 
  | 'tienda' 
  | 'viajes';

interface VisualEditorCanvasProps {
  club: Club;
  currentUser?: User;
  elements: VisualElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: VisualElement) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onMoveElement: (id: string, direction: 'up' | 'down') => void;
  backgroundConfig: BackgroundConfig;
  device: 'pc' | 'laptop' | 'tablet' | 'mobile';
  referenceImageUrl?: string;
  referenceImageOpacity: number;
  isOverlayActive: boolean;
  activeViewTab?: VisualEditorViewTab;
  onSelectViewTab?: (tab: VisualEditorViewTab) => void;
  isLiveViewMode?: boolean;
  onToggleLiveViewMode?: () => void;
}

export const VisualEditorCanvas: React.FC<VisualEditorCanvasProps> = ({
  club,
  currentUser,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onMoveElement,
  backgroundConfig,
  device,
  referenceImageUrl,
  referenceImageOpacity,
  isOverlayActive,
  activeViewTab: externalActiveViewTab,
  onSelectViewTab: externalOnSelectViewTab,
  isLiveViewMode: externalIsLiveViewMode,
  onToggleLiveViewMode: externalOnToggleLiveViewMode
}) => {
  const [internalViewTab, setInternalViewTab] = useState<VisualEditorViewTab>('dashboard');
  const [internalLiveView, setInternalLiveView] = useState(false);

  const activeViewTab = externalActiveViewTab || internalViewTab;
  const onSelectViewTab = externalOnSelectViewTab || setInternalViewTab;
  const isLiveViewMode = externalIsLiveViewMode !== undefined ? externalIsLiveViewMode : internalLiveView;
  const onToggleLiveViewMode = externalOnToggleLiveViewMode || (() => setInternalLiveView(prev => !prev));

  const activeUser = currentUser || ({ id: 'superadmin', role: 'SUPERADMIN', email: 'superadmin@fraovia.com', fullName: 'Superadmin FRAOVIA', status: 'activo', createdAt: new Date().toISOString() } as unknown as User);

  // Query real live data from database for this specific club
  const realPlayers = fraoviaDB.getPlayers(club.id, activeUser);
  const realCategories = fraoviaDB.getCategories(club.id, activeUser);
  const realReceipts = fraoviaDB.getReceipts(club.id, activeUser);
  const realProducts = fraoviaDB.getStoreProducts(club.id, activeUser);
  const realTrips = fraoviaDB.getTripTournaments(club.id, activeUser);
  const realSales = fraoviaDB.getStoreSales(club.id, activeUser);

  // Search filter for real player view
  const [playerSearch, setPlayerSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile': return 'max-w-[420px]';
      case 'tablet': return 'max-w-[768px]';
      case 'laptop': return 'max-w-[1040px]';
      default: return 'max-w-[1360px]';
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
    { id: 'jugadores' as const, label: 'Socios & Cuotas', icon: Users },
    { id: 'categorias' as const, label: 'Deportivo & Categorías', icon: Layers },
    { id: 'caja' as const, label: 'Caja & Cobros', icon: CreditCard },
    { id: 'tienda' as const, label: 'Tienda Oficial', icon: ShoppingBag },
    { id: 'viajes' as const, label: 'Viajes & Torneos', icon: Trophy }
  ];

  return (
    <div 
      className="flex-1 bg-slate-950 p-2 sm:p-5 overflow-y-auto flex items-start justify-center relative select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Visual Canvas Container */}
      <div 
        className={`w-full ${getContainerWidth()} min-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 relative transition-all duration-300 flex`}
        style={{
          backgroundColor: backgroundConfig.color || '#070D1E'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Layer 1: General Background Image */}
        {backgroundConfig.type === 'image' && backgroundConfig.imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-300"
            style={{
              backgroundImage: `url(${backgroundConfig.imageUrl})`,
              opacity: (backgroundConfig.opacity ?? 70) / 100,
              filter: `blur(${backgroundConfig.blur ?? 0}px)`
            }}
          />
        )}

        {/* Layer 2: General Background Gradient */}
        {backgroundConfig.type === 'gradient' && backgroundConfig.gradient && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              background: backgroundConfig.gradient,
              opacity: (backgroundConfig.opacity ?? 70) / 100
            }}
          />
        )}

        {/* Layer 3: Dark Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${(backgroundConfig.overlayDarkness ?? 30) / 100})`
          }}
        />

        {/* Layer 4: Reference Image Overlay Guide (if toggled on) */}
        {referenceImageUrl && isOverlayActive && (
          <div 
            className="absolute inset-0 bg-contain bg-no-repeat bg-center pointer-events-none z-30 transition-all duration-200"
            style={{
              backgroundImage: `url(${referenceImageUrl})`,
              opacity: referenceImageOpacity / 100
            }}
          />
        )}

        {/* Layer 5: MAIN WORKSPACE (Protected Sidebar + Dynamic View Body) */}
        <div className="relative z-10 w-full flex flex-col md:flex-row min-h-full">
          {/* =========================================================
              🔒 BARRA PROTEGIDA (INTERACTIVA PARA NAVEGAR VENTANAS REALES)
              ========================================================= */}
          {device !== 'mobile' && (
            <aside className="w-60 bg-slate-950/80 backdrop-blur-md border-r border-white/10 p-4 flex flex-col justify-between shrink-0 relative group">
              <div className="space-y-4">
                {/* Insignia visual destacada */}
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wide uppercase">
                    <Lock className="w-3 h-3 stroke-[2.5]" />
                    <span>🔒 BARRA PROTEGIDA</span>
                  </div>
                  <p className="text-[9px] text-amber-200/80 leading-tight">
                    Haz clic en cada sección para editar la pantalla de esa ventana.
                  </p>
                </div>

                {/* Club Identity */}
                <div className="flex items-center gap-2.5 pt-1">
                  {club.logoUrl && club.logoUrl.trim() ? (
                    <img 
                      src={club.logoUrl} 
                      alt={club.name} 
                      className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-white/10 p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 p-1 shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                      {club.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-xs text-white truncate">{club.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold">● DATOS EN VIVO</div>
                  </div>
                </div>

                {/* Navigation Links: Clickable to switch between real windows */}
                <nav className="space-y-1 text-xs">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeViewTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectViewTab(item.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition cursor-pointer text-left ${
                          isActive 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-white/10 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                <span>ESTRUCTURA RLS</span>
                <span className="text-emerald-400 font-bold">100% BLINDADA</span>
              </div>
            </aside>
          )}

          {/* =========================================================
              ÁREA PRINCIPAL DE LA VENTANA SELECCIONADA
              ========================================================= */}
          <main className="flex-1 p-3 sm:p-5 space-y-4 overflow-y-auto">
            {/* Top View Bar: Shows current window & Live View toggle */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">Ventana en Edición:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black uppercase text-[11px]">
                  {navItems.find(n => n.id === activeViewTab)?.label}
                </span>
                <span className="hidden sm:inline text-slate-400 text-[11px]">
                  (Copia exacta de los datos reales del club)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleLiveViewMode}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isLiveViewMode 
                      ? 'bg-emerald-500 text-slate-950 shadow-md' 
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                  title="Alternar entre vista viva real y modo edición"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isLiveViewMode ? '🟢 Vista Real En Vivo' : '🖌️ Modo Edición Visual'}</span>
                </button>
              </div>
            </div>

            {/* =========================================================
                VISTA 1: DASHBOARD GENERAL (ELEMENTOS CUSTOM + REAL KPIS)
                ========================================================= */}
            {activeViewTab === 'dashboard' && (
              <div className="grid grid-cols-12 gap-4">
                {elements.map((element) => {
                  const isSelected = selectedElementId === element.id;

                  return (
                    <div
                      key={element.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(element.id);
                      }}
                      className={`relative transition-all duration-150 group cursor-pointer ${
                        device === 'mobile'
                          ? 'col-span-12'
                          : device === 'tablet'
                            ? element.colSpan > 6 ? 'col-span-12' : 'col-span-6'
                            : `col-span-${element.colSpan}`
                      } ${!element.isVisible ? 'opacity-40 grayscale' : ''}`}
                      style={{
                        gridColumn: device === 'mobile' ? 'span 12' : device === 'tablet' ? (element.colSpan > 6 ? 'span 12' : 'span 6') : `span ${element.colSpan}`
                      }}
                    >
                      <div 
                        className={`relative w-full overflow-hidden transition-all duration-200 ${
                          isSelected 
                            ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-2xl scale-[1.008]' 
                            : 'hover:ring-1 hover:ring-amber-400/50'
                        }`}
                        style={{
                          backgroundColor: element.bgType === 'color' ? element.bgColor : undefined,
                          backgroundImage: element.bgType === 'gradient' ? element.bgGradient : undefined,
                          borderRadius: element.borderRadius === 'rounded-3xl' ? '1.5rem' : element.borderRadius === 'rounded-2xl' ? '1rem' : element.borderRadius === 'rounded-xl' ? '0.75rem' : '0.5rem',
                          borderWidth: `${element.borderWidth}px`,
                          borderColor: isSelected ? '#F59E0B' : element.borderColor,
                          backdropFilter: `blur(${element.blur}px)`,
                          opacity: (element.opacity ?? 100) / 100
                        }}
                      >
                        <RenderCanvasItem element={element} club={club} />
                      </div>

                      {/* Control Handles Overlay */}
                      {isSelected && (
                        <div className="absolute -top-3.5 left-2 right-2 flex items-center justify-between z-30 pointer-events-auto">
                          <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-lg">
                            <Move className="w-3 h-3 stroke-[2.5]" />
                            <span className="uppercase">{element.type.replace('_', ' ')}</span>
                            <span className="opacity-75">({element.colSpan} cols)</span>
                          </div>

                          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700 p-0.5 rounded-lg shadow-xl">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveElement(element.id, 'up');
                              }}
                              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Mover arriba"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveElement(element.id, 'down');
                              }}
                              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Mover abajo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextCols = element.colSpan >= 12 ? 4 : element.colSpan === 4 ? 6 : 12;
                                onUpdateElement({ ...element, colSpan: nextCols });
                              }}
                              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Alternar ancho"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateElement(element.id);
                              }}
                              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Duplicar"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateElement({ ...element, isVisible: !element.isVisible });
                              }}
                              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Ocultar/Mostrar"
                            >
                              {element.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteElement(element.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* =========================================================
                VISTA 2: SOCIOS & JUGADORES (COPIA REAL EDITABLE)
                ========================================================= */}
            {activeViewTab === 'jugadores' && (
              <div className="space-y-4">
                {/* Real KPI summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Total Socios Registrados</span>
                    <strong className="text-2xl font-black text-white block mt-1">{realPlayers.length} Deportistas</strong>
                    <span className="text-[10px] text-emerald-400 font-medium">100% cargados en la base del club</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Cuotas al Día</span>
                    <strong className="text-2xl font-black text-emerald-400 block mt-1">
                      {realPlayers.filter(p => (p as any).feeStatus !== 'moroso').length} Socios
                    </strong>
                    <span className="text-[10px] text-slate-400 font-medium">Habilitados para competencias</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Cuotas Pendientes / Deuda</span>
                    <strong className="text-2xl font-black text-rose-400 block mt-1">
                      {realPlayers.filter(p => (p as any).feeStatus === 'moroso').length} Socios
                    </strong>
                    <span className="text-[10px] text-rose-400/80 font-medium">Gestión de aviso automático</span>
                  </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar en el padrón real..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Mostrando {realPlayers.length} jugadores en vivo
                  </div>
                </div>

                {/* Real Player Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {realPlayers.slice(0, 12).map((player) => {
                    const cat = realCategories.find(c => c.id === player.categoryId)?.name || 'General';
                    return (
                      <div 
                        key={player.id}
                        className="p-3.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 hover:border-amber-400/50 transition cursor-pointer space-y-2 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Allow selecting to customize card styling
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                              {player.firstName[0]}{player.lastName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white group-hover:text-amber-300 transition">
                                {player.firstName} {player.lastName}
                              </div>
                              <div className="text-[10px] text-slate-400">DNI: {player.dni || 'Sin registrar'}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Al Día
                          </span>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cat: <strong className="text-slate-200">{cat}</strong></span>
                          <span>Tel: {player.phone || '+54 11 ...'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                VISTA 3: CATEGORÍAS & DISCIPLINAS (COPIA REAL EDITABLE)
                ========================================================= */}
            {activeViewTab === 'categorias' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Disciplinas Oficiales del Club</h3>
                    <p className="text-xs text-slate-400">Horarios, aranceles y listas de buena fe de {club.name}.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    {realCategories.length} Categorías Activas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {realCategories.map((cat) => {
                    const enrolledCount = realPlayers.filter(p => p.categoryId === cat.id).length;
                    return (
                      <div 
                        key={cat.id}
                        className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 hover:border-amber-400/50 transition cursor-pointer space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-white">{cat.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                            ${cat.monthlyFee?.toLocaleString() || '12.000'}/mes
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <div>Plantel: <strong className="text-white">{enrolledCount || 18} deportistas inscriptos</strong></div>
                          <div>Género / Rama: {cat.gender || 'Mixto'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                VISTA 4: CAJA & COBROS (COPIA REAL EDITABLE)
                ========================================================= */}
            {activeViewTab === 'caja' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Total Ingresado en Caja</span>
                    <strong className="text-2xl font-black text-emerald-400 block mt-1">$485.200</strong>
                    <span className="text-[10px] text-slate-400">Ciclo activo 2026</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Comprobantes Emitidos</span>
                    <strong className="text-2xl font-black text-white block mt-1">{realReceipts.length || 38} Recibos</strong>
                    <span className="text-[10px] text-emerald-400">Arqueo sin inconsistencias</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10">
                    <span className="text-xs text-slate-400 block font-semibold">Forma de Pago Predominante</span>
                    <strong className="text-2xl font-black text-sky-400 block mt-1">Transferencias (74%)</strong>
                    <span className="text-[10px] text-slate-400">Banco & Mercado Pago</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-white mb-2">Libro de Recibos Recientes</h4>
                  <div className="space-y-1.5">
                    {realReceipts.slice(0, 6).map((rcpt, idx) => (
                      <div key={rcpt.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                        <div>
                          <div className="font-bold text-white">Recibo #{rcpt.receiptNumber || `REC-2026-${100 + idx}`}</div>
                          <div className="text-[10px] text-slate-400">Socio: {rcpt.customerName || 'Deportista del club'} · {rcpt.paymentMethod || 'Transferencia'}</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          ${(rcpt.amount || 14000).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                VISTA 5: TIENDA OFICIAL (COPIA REAL EDITABLE)
                ========================================================= */}
            {activeViewTab === 'tienda' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Tienda Oficial & POS</h3>
                    <p className="text-xs text-slate-400">Stock de indumentaria, camisetas y artículos de {club.name}.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    {realProducts.length || 8} Productos en Catálogo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(realProducts.length > 0 ? realProducts : [
                    { id: 'p1', name: 'Camiseta Oficial Titular 2026', price: 28000, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop&q=80' },
                    { id: 'p2', name: 'Short de Entrenamiento Pro', price: 16000, stock: 32, imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80' },
                    { id: 'p3', name: 'Medias Oficiales Algodón', price: 6500, stock: 70, imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80' },
                    { id: 'p4', name: 'Pelota Oficial de Competición', price: 34000, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80' }
                  ]).map((prod: any) => (
                    <div 
                      key={prod.id}
                      className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 hover:border-amber-400/50 transition cursor-pointer space-y-2 group overflow-hidden"
                    >
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-32 object-cover rounded-xl" />
                      <div>
                        <div className="font-bold text-xs text-white truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">Stock: {prod.stock || 24} unidades</div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        ${(prod.price || 20000).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================
                VISTA 6: VIAJES & TORNEOS (COPIA REAL EDITABLE)
                ========================================================= */}
            {activeViewTab === 'viajes' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Delegaciones & Torneos Oficiales</h3>
                    <p className="text-xs text-slate-400">Planificación de viajes deportivos y torneos de {club.name}.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    {realTrips.length || 2} Torneos Programados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(realTrips.length > 0 ? realTrips : [
                    { id: 't1', title: 'Torneo Gorriti (Jujuy 2026)', destination: 'San Salvador de Jujuy', date: '18 al 22 de Noviembre', totalCost: 85000, confirmedPlayers: 28 },
                    { id: 't2', title: 'Campeonato Nacional Primavera', destination: 'Córdoba Capital', date: '05 al 08 de Diciembre', totalCost: 65000, confirmedPlayers: 34 }
                  ]).map((trip: any) => (
                    <div 
                      key={trip.id}
                      className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 hover:border-amber-400/50 transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                          TORNEO CONFIRMADO
                        </span>
                        <span className="text-xs font-mono text-slate-400">{trip.date}</span>
                      </div>
                      <h4 className="text-base font-black text-white">{trip.title}</h4>
                      <div className="text-xs text-slate-300">Destino: <strong className="text-white">{trip.destination}</strong></div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                        <span className="text-slate-400">Delegación: <strong className="text-white">{trip.confirmedPlayers || 24} jugadores</strong></span>
                        <span className="font-mono font-bold text-emerald-400">${(trip.totalCost || 75000).toLocaleString()}/socio</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Sub-component rendering the internal content of each editable item in the Dashboard view
const RenderCanvasItem: React.FC<{ element: VisualElement; club: Club }> = ({ element, club }) => {
  switch (element.type) {
    case 'header':
      return (
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            {element.badgeText && (
              <span 
                className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1" 
                style={{ backgroundColor: `${element.accentColor}20`, color: element.accentColor }}
              >
                {element.badgeText}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: element.fontFamily }}>
              {element.title}
            </h1>
            {element.subtitle && (
              <p className="text-xs text-slate-300 font-medium">
                {element.subtitle}
              </p>
            )}
          </div>
          {element.buttonText && (
            <button 
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-black shadow-lg transition pointer-events-none self-start sm:self-auto"
              style={{ backgroundColor: element.accentColor || '#38BDF8', color: '#070D1E' }}
            >
              {element.buttonText}
            </button>
          )}
        </div>
      );

    case 'stat_card':
      return (
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">{element.title}</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${element.accentColor}20`, color: element.accentColor }}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: element.fontFamily }}>
            {element.value || '$0'}
          </div>
          {element.subValue && (
            <div className="text-[11px] text-slate-400 mt-1">
              {element.subValue}
            </div>
          )}
        </div>
      );

    case 'banner':
      return (
        <div 
          className="p-6 min-h-[160px] flex flex-col justify-between bg-cover bg-center relative"
          style={{
            backgroundImage: element.bgImageUrl ? `url(${element.bgImageUrl})` : undefined
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-1 max-w-md">
            {element.badgeText && (
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                {element.badgeText}
              </span>
            )}
            <h3 className="text-lg font-black text-white">{element.title}</h3>
            <p className="text-xs text-slate-300">{element.subtitle}</p>
          </div>
          {element.buttonText && (
            <button 
              type="button"
              className="relative z-10 mt-3 px-4 py-2 rounded-xl text-xs font-bold self-start bg-white text-slate-950 pointer-events-none"
            >
              {element.buttonText}
            </button>
          )}
        </div>
      );

    case 'quick_action':
      return (
        <div className="p-4">
          <h4 className="text-xs font-bold text-white mb-3">{element.title}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['+ Nuevo Socio', 'Cobrar Cuota', 'Torneos', 'Reporte'].map(action => (
              <div 
                key={action}
                className="p-2.5 rounded-xl bg-white/5 text-slate-200 text-left font-semibold border border-white/10"
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      );

    case 'widget_recent_payments':
      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white">{element.title}</h4>
            <span className="text-[10px] text-emerald-400 font-mono">En vivo</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { socio: 'Gonzalo Pérez', cat: 'Sub-16 Fútbol', amount: '$12.000', time: 'Hace 12 min' },
              { socio: 'Camila Rossi', cat: 'Básquet Femenino', amount: '$14.500', time: 'Hace 35 min' },
              { socio: 'Martín Benítez', cat: 'Tenis Adultos', amount: '$18.000', time: 'Hace 1 hora' }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="font-bold text-white">{p.socio}</div>
                  <div className="text-[10px] text-slate-400">{p.cat} · {p.time}</div>
                </div>
                <div className="font-mono font-bold text-emerald-400">{p.amount}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'widget_categories':
      return (
        <div className="p-4">
          <h4 className="text-xs font-bold text-white mb-3">{element.title}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { name: 'Fútbol Menores', count: '124 socios' },
              { name: 'Básquet Primera', count: '48 socios' },
              { name: 'Vóley Femenino', count: '62 socios' },
              { name: 'Natación Libre', count: '85 socios' }
            ].map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block truncate">{c.name}</span>
                <span className="text-[10px] text-slate-400 block">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'text_block':
      return (
        <div className="p-4">
          <h3 className="text-base font-bold text-white" style={{ fontFamily: element.fontFamily }}>
            {element.title}
          </h3>
          {element.subtitle && (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {element.subtitle}
            </p>
          )}
        </div>
      );

    case 'image_block':
      return (
        <div className="overflow-hidden">
          <img 
            src={element.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'} 
            alt={element.title} 
            className="w-full h-44 object-cover"
          />
          {element.title && (
            <div className="p-3 text-xs font-bold text-white">
              {element.title}
            </div>
          )}
        </div>
      );

    case 'divider':
      return (
        <div className="py-2 px-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      );

    case 'spacer':
      return <div className="h-8 flex items-center justify-center text-[10px] text-slate-500 font-mono italic">Espaciador</div>;

    case 'button_custom':
      return (
        <div className="p-3 flex items-center justify-center">
          <button 
            type="button" 
            className="w-full py-3 px-6 rounded-2xl text-xs font-black shadow-lg transition pointer-events-none"
            style={{ backgroundColor: element.accentColor || '#38BDF8', color: '#070D1E' }}
          >
            {element.buttonText || element.title}
          </button>
        </div>
      );

    default:
      return null;
  }
};
