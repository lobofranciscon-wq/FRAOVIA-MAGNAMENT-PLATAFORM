import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ShoppingBag, 
  MoreHorizontal,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../types/fraovia';

export type ActiveTab = 
  | 'dashboard'
  | 'jugadores'
  | 'categorias_profesores'
  | 'asistencia'
  | 'caja'
  | 'viajes'
  | 'tienda'
  | 'tienda_analisis'
  | 'comprobantes'
  | 'planes'
  | 'configuracion'
  | 'auditoria'
  | 'temporadas'
  | 'superadmin_clubes'
  | 'superadmin_planes'
  | 'superadmin_betas'
  | 'superadmin_backups';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  onOpenMoreMenu: () => void;
  hasStoreModule: boolean;
  hasCashModule: boolean;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  onOpenMoreMenu,
  hasStoreModule,
  hasCashModule
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Inicio</span>
        </button>

        {/* Tab 2: Deportivo (Jugadores o Asistencia) */}
        {userRole === 'PROFESOR' ? (
          <button
            onClick={() => onSelectTab('asistencia')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'asistencia' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Asistencia</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('jugadores')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'jugadores' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Jugadores</span>
          </button>
        )}

        {/* Tab 3: Caja / Comprobantes (or Superadmin Clubs) */}
        {userRole === 'SUPERADMIN' ? (
          <button
            onClick={() => onSelectTab('superadmin_clubes')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'superadmin_clubes' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Clubes</span>
          </button>
        ) : hasCashModule ? (
          <button
            onClick={() => onSelectTab('caja')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'caja' || activeTab === 'comprobantes' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Caja</span>
          </button>
        ) : null}

        {/* Tab 4: Tienda (or Superadmin Plans) */}
        {userRole === 'SUPERADMIN' ? (
          <button
            onClick={() => onSelectTab('superadmin_planes')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'superadmin_planes' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Planes</span>
          </button>
        ) : hasStoreModule ? (
          <button
            onClick={() => onSelectTab('tienda')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
              activeTab === 'tienda' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Tienda</span>
          </button>
        ) : null}

        {/* Tab 5: Más (Drawer) */}
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Más</span>
        </button>
      </div>
    </nav>
  );
};
