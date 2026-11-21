import React, { useState } from 'react';
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  ShoppingBag, 
  Wallet, 
  BarChart3, 
  Settings,
  HeartPulse,
  Award,
  Database,
  CalendarCheck,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Cloud,
  Zap,
  TrendingUp,
  Eye,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Palette,
  Sparkles,
  Layers,
  GraduationCap,
  Plane
} from 'lucide-react';
import { Club, CommercialPlan, User } from '../types/fraovia';
import { ActiveTab } from './MobileNavBar';
import { BrandLogo, FraoviaAppIcon } from './BrandLogo';
import { ROLE_PERMISSIONS_MATRIX } from '../services/rbac';
import { useAppTheme } from '../context/ThemeContext';
import { SuperadminSidebarNav } from './superadmin/SuperadminSidebarNav';
import { SuperadminSection } from './superadmin/superadminNavigation';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: User;
  currentClub: Club | null;
  allClubs?: Club[];
  onSelectClubToSupervise?: (club: Club) => void;
  onExitSupervision?: () => void;
  onOpenClubMindMap?: (club: Club) => void;
  activePlan: CommercialPlan | null;
  playerCount: number;
  onOpenMedicalCenter: () => void;
  onOpenScholarships: () => void;
  onOpenSupabaseModal: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  superadminSection?: SuperadminSection;
  onSelectSuperadminSection?: (section: SuperadminSection) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  currentClub,
  allClubs = [],
  onSelectClubToSupervise,
  onExitSupervision,
  onOpenClubMindMap,
  activePlan,
  playerCount,
  onOpenMedicalCenter,
  onOpenScholarships,
  onOpenSupabaseModal,
  isCollapsed = false,
  onToggleCollapse,
  superadminSection = 'inicio',
  onSelectSuperadminSection
}) => {
  const isSuperadmin = currentUser.role === 'SUPERADMIN';
  const isProfesor = currentUser.role === 'PROFESOR';
  const isTienda = currentUser.role === 'TIENDA';
  const isDueno = currentUser.role === 'DUEÑO';
  const isAdmin = currentUser.role === 'ADMINISTRACIÓN';

  const quota = currentClub?.contractedPlayersQuota || 300;
  const percentage = Math.min(100, Math.round((playerCount / quota) * 100));

  const roleMeta = ROLE_PERMISSIONS_MATRIX[currentUser.role];
  const { theme } = useAppTheme();

  // Ghost Mode club selection state in Superadmin sidebar
  const [selectedGhostClubId, setSelectedGhostClubId] = useState<string>(
    allClubs[0]?.id || ''
  );

  const handleEnterGhostClub = () => {
    const target = allClubs.find(c => c.id === selectedGhostClubId) || allClubs[0];
    if (target && onSelectClubToSupervise) {
      onSelectClubToSupervise(target);
    }
  };

  // Helper to render clean buttons: ICON ONLY with floating tooltip when isCollapsed, FULL CARD when expanded
  const renderNavButton = (
    tab: ActiveTab,
    Icon: any,
    title: string,
    subtitle?: string,
    iconColor: string = 'text-white'
  ) => {
    const isActive = activeTab === tab;

    if (isCollapsed) {
      return (
        <div key={tab} className="relative group flex items-center justify-center">
          <button
            type="button"
            onClick={() => onSelectTab(tab)}
            aria-label={title}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition cursor-pointer relative ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/40 ring-1 ring-sky-400/40'
                : 'text-slate-400 hover:text-white hover:bg-[#0C162D]'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : iconColor}`} />
            {isActive && (
              <span className="absolute left-0.5 top-2.5 bottom-2.5 w-1 rounded-r-full bg-sky-300" />
            )}
          </button>

          {/* Floating Hover Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 backdrop-blur-md">
            <span className="font-bold text-white block">{title}</span>
            {subtitle && (
              <span className="text-[10px] text-slate-400 block mt-0.5">{subtitle}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <button
        key={tab}
        type="button"
        onClick={() => onSelectTab(tab)}
        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
            : 'text-slate-300 hover:text-white hover:bg-[#0C162D]'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : iconColor}`} />
        <div className="overflow-hidden">
          <span className="text-xs font-bold block leading-tight truncate">{title}</span>
          {subtitle && (
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight truncate">
              {subtitle}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col shrink-0 h-full max-h-[calc(100vh-4rem)] select-none border-r transition-all duration-300 relative ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#070D1E] border-[#1B2A4A] text-slate-100'
      }`}
    >
      {/* Top Sidebar Header with Fraovia and Toggle Collapse Button */}
      <div className={`p-3 border-b border-[#16233E] flex items-center ${isCollapsed ? 'flex-col gap-2.5 justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <BrandLogo size="sm" showTagline={false} />
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Plegar barra lateral (Solo íconos en los costados)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              title="FRAOVIA Management Platform" 
              className="cursor-pointer transition hover:scale-105"
              onClick={onToggleCollapse}
            >
              <FraoviaAppIcon size={32} />
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shadow"
                title="Desplegar nombres de secciones"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Perimeter Tag (only when NOT collapsed) */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {isSuperadmin && currentClub ? 'Modo Sigiloso Activo' : 'Sector Habilitado'}
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isSuperadmin && currentClub 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                : roleMeta.badgeColor
            }`}>
              {isSuperadmin && currentClub ? 'GHOST MODE' : currentUser.role}
            </span>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-4'}`}>
        
        {/* ========================================================
            CASE 1: SUPERADMIN AT PLATFORM ROOT (NO CLUB LOADED)
            NUEVA BARRA LATERAL MULTICLUB FRAOVIA
           ======================================================== */}
        {isSuperadmin && !currentClub && (
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="px-3 pb-1 border-b border-slate-800/80 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block font-mono">
                  FRAOVIA
                </span>
                <span className="text-[11px] font-extrabold text-slate-100 block">
                  SUPERADMIN
                </span>
              </div>
            )}

            <SuperadminSidebarNav
              currentSection={superadminSection}
              onSelectSection={(sec) => {
                onSelectTab('dashboard');
                onSelectSuperadminSection?.(sec);
              }}
              isCollapsed={isCollapsed}
              totalClubsCount={allClubs.length}
              openIssuesCount={2}
            />
          </div>
        )}

        {/* ========================================================
            CASE 2: SUPERADMIN INSIDE A CLUB IN GHOST MODE
           ======================================================== */}
        {isSuperadmin && currentClub && (
          <div className="space-y-2">
            {!isCollapsed ? (
              <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-white space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-300 uppercase font-black">
                    🕶️ Explorando Club
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Invisible
                  </span>
                </div>
                <h4 className="font-black text-sm text-white leading-tight">
                  {currentClub.name}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Tus acciones no figuran a los administradores ni dueños del club.
                </p>

                {onOpenClubMindMap && (
                  <button
                    type="button"
                    onClick={() => onOpenClubMindMap(currentClub)}
                    className="w-full py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>🧠 Ver Mapa Mental</span>
                  </button>
                )}

                {onExitSupervision && (
                  <button
                    onClick={onExitSupervision}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a Superadmin</span>
                  </button>
                )}
              </div>
            ) : (
              onExitSupervision && (
                <button
                  type="button"
                  onClick={onExitSupervision}
                  title="Salir de Ghost Mode y volver a Superadmin"
                  className="w-full h-11 flex items-center justify-center rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900 transition cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )
            )}

            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Administración del Club
              </span>
            )}

            {renderNavButton('jugadores', Users, 'Padrón de Jugadores', 'Fichas, matrículas y estados', 'text-blue-400')}
            {renderNavButton('categorias_profesores', GraduationCap, 'Categorías & Profesores', 'Planteles, docentes y grupos', 'text-teal-400')}
            {renderNavButton('comprobantes', FileText, 'Comprobantes Oficiales', 'Recibos emitidos con escudo', 'text-emerald-400')}
            {renderNavButton('caja', Wallet, 'Tesorería & Cajas', 'Arqueos y movimientos', 'text-amber-400')}
            {renderNavButton('viajes', Plane, 'Viajes & Torneos', 'Giras, torneos y caja exclusiva', 'text-amber-300')}
            {renderNavButton('tienda', ShoppingBag, 'Tienda Oficial', 'Punto de venta y stock', 'text-orange-400')}
            {renderNavButton('asistencia', CalendarCheck, 'Asistencia en Cancha', 'Planillas de entrenamientos', 'text-teal-400')}
          </div>
        )}

        {/* ========================================================
            CASE 3: REGULAR CLUB ROLES (DUEÑO, ADMINISTRACIÓN, PROFESOR, TIENDA)
           ======================================================== */}
        {!isSuperadmin && (
          <div className="space-y-1.5">
            {renderNavButton('dashboard', Home, 'Inicio')}

            {isProfesor && (
              renderNavButton('asistencia', CalendarCheck, 'Mis Planteles & Asistencia')
            )}

            {!isProfesor && !isTienda && (
              <>
                {renderNavButton('jugadores', Users, 'Padrón de Jugadores')}
                {renderNavButton('categorias_profesores', GraduationCap, 'Categorías & Profesores', undefined, 'text-teal-400')}
                {renderNavButton('asistencia', CalendarCheck, 'Asistencia & Cancha', 'Planillas y control de faltas', 'text-teal-400')}
              </>
            )}

            {!isProfesor && (
              renderNavButton('comprobantes', FileText, 'Comprobantes Oficiales')
            )}

            {(!isProfesor && !!currentClub?.activeModules.caja) && (
              renderNavButton('caja', Wallet, isTienda ? 'Caja de Tienda' : 'Tesorería & Cajas')
            )}

            {(!isProfesor && !isTienda && currentClub?.activeModules?.viajesTorneos !== false) && (
              renderNavButton('viajes', Plane, 'Viajes & Torneos', undefined, 'text-amber-300')
            )}

            {(isTienda || ((isAdmin || isDueno) && !!currentClub?.activeModules.tienda)) && (
              <>
                {renderNavButton('tienda', ShoppingBag, isTienda ? 'Punto de Venta & Stock' : 'Tienda Oficial')}
                {renderNavButton('tienda_analisis', TrendingUp, 'Análisis de Ventas')}
              </>
            )}

            {!isProfesor && !isTienda && (
              renderNavButton('auditoria', BarChart3, isDueno ? 'Auditoría & Balances' : 'Bitácora & Reportes')
            )}

            {isDueno && (
              renderNavButton('planes', Zap, 'Mi Plan Contratado', undefined, 'text-amber-400')
            )}
          </div>
        )}

      </div>

      {/* Plan Capacity Meter at Bottom (Exclusivo para el DUEÑO, sólo si no está colapsado) */}
      {!isCollapsed && currentClub && isDueno && (
        <div className={`p-3.5 m-3 rounded-2xl border transition-colors ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0C162D] border-sky-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-sky-300 font-bold">Plan {activePlan?.name || 'PRO'}</span>
            <span className="font-semibold text-white font-mono">{playerCount} / {quota}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentage > 90 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Cupo del club</span>
            <span className="text-sky-400 font-medium">{percentage}% utilizado</span>
          </p>
        </div>
      )}
    </aside>
  );
};
