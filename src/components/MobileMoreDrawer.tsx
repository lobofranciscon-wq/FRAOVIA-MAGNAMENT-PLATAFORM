import React from 'react';
import { 
  X, 
  Palette, 
  Calendar, 
  History, 
  FileText, 
  Upload, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  Sliders,
  LogOut,
  Layers,
  Plane,
  EyeOff,
  CalendarCheck
} from 'lucide-react';
import { Club, User } from '../types/fraovia';
import { ActiveTab } from './MobileNavBar';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentClub: Club | null;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenModuleVisibility?: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentClub,
  onSelectTab,
  onOpenImport,
  onOpenExport,
  onOpenModuleVisibility
}) => {
  if (!isOpen) return null;

  const isSuperadmin = currentUser.role === 'SUPERADMIN';

  const handleNavigate = (tab: ActiveTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
      <div 
        className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Menú Principal & Módulos</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tools */}
        {currentUser.role !== 'PROFESOR' && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Herramientas de Datos
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="flex items-center gap-2 p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left border border-slate-700/60"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Importar Excel</div>
                  <div className="text-[10px] text-slate-400">Padrón & Duplicados</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenExport();
                }}
                className="flex items-center gap-2 p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left border border-slate-700/60"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Exportar</div>
                  <div className="text-[10px] text-slate-400">Excel, PDF, Word</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Club Modules (Only when inside a club) */}
        {currentClub && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Gestión Institucional ({currentClub.name})
            </span>
            <div className="space-y-1">
              {currentClub.activeModules?.viajesTorneos !== false && (
                <button
                  onClick={() => handleNavigate('viajes')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300">Viajes & Torneos</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono">Caja Exclusiva</span>
                </button>
              )}

              <button
                onClick={() => handleNavigate('comprobantes')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Comprobantes Oficiales</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Inmutables</span>
              </button>

              <button
                onClick={() => handleNavigate('asistencia')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-teal-400" />
                  <span>Asistencia en Cancha</span>
                </div>
                <span className="text-[10px] text-teal-400 font-mono">Planillas</span>
              </button>

              {onOpenModuleVisibility && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenModuleVisibility();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <EyeOff className="w-4 h-4 text-indigo-400" />
                    <span>Ventanas & Módulos</span>
                  </div>
                  <span className="text-[10px] text-indigo-300">Ocultar/Ver</span>
                </button>
              )}

              <button
                onClick={() => handleNavigate('configuracion')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Identidad Visual & Logo</span>
                </div>
                <span className="text-[10px] text-slate-400">White-label</span>
              </button>

              <button
                onClick={() => handleNavigate('temporadas')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Temporadas Deportivas</span>
                </div>
                <span className="text-[10px] text-slate-400">Histórico</span>
              </button>

              <button
                onClick={() => handleNavigate('auditoria')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Bitácora de Auditoría</span>
                </div>
                <span className="text-[10px] text-slate-400">Trazabilidad</span>
              </button>
            </div>
          </div>
        )}

        {/* Superadmin Exclusive Sections */}
        {isSuperadmin && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Funciones SuperAdmin
            </span>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate('superadmin_clubes')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-200 text-xs text-left"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Gestión Multi-Club & Alta</span>
              </button>
              <button
                onClick={() => handleNavigate('superadmin_planes')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-200 text-xs text-left"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Constructor de Planes SaaS</span>
              </button>
              <button
                onClick={() => handleNavigate('superadmin_betas')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-200 text-xs text-left"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Funciones Beta Experimentales</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">
            FRAOVIA Business Management Platform · v2.6
          </p>
        </div>
      </div>
    </div>
  );
};
