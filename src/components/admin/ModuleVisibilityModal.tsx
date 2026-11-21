import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Sliders, 
  Sparkles, 
  ShoppingBag, 
  Users, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  Compass, 
  ShieldCheck,
  Plane
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface ModuleVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  onUpdated: () => void;
}

export const ModuleVisibilityModal: React.FC<ModuleVisibilityModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  onUpdated
}) => {
  if (!isOpen) return null;

  const [modules, setModules] = useState({
    // Portal familias default is false (hidden) per user request: "por ejemplo ese portal familias, si bien esta en proceso aun no lo utilizamos"
    portalFamilias: currentClub.activeModules?.portalFamilias ?? false,
    viajesTorneos: currentClub.activeModules?.viajesTorneos ?? true,
    tienda: currentClub.activeModules?.tienda ?? true,
    asistencia: currentClub.activeModules?.asistencia ?? true,
    feeReminders: currentClub.activeModules?.feeReminders ?? true,
    caja: currentClub.activeModules?.caja ?? true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataActions.setModuleVisibility(
        currentClub,
        {
          portalFamilias: modules.portalFamilias,
          viajesTorneos: modules.viajesTorneos,
          tienda: modules.tienda,
          asistencia: modules.asistencia,
          feeReminders: modules.feeReminders,
          caja: modules.caja
        },
        currentUser
      );
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar visibilidad de módulos');
    } finally {
      setIsSaving(false);
    }
  };

  const moduleItems = [
    {
      id: 'portalFamilias' as const,
      name: 'Portal Familias & Autogestión',
      icon: Sparkles,
      iconColor: 'text-cyan-400',
      badge: 'En desarrollo',
      description: 'Acceso web para padres con carnet digital y consulta de cuotas. Puedes ocultarlo para no confundir a las familias mientras se prepara.',
      currentValue: modules.portalFamilias
    },
    {
      id: 'viajesTorneos' as const,
      name: 'Viajes, Giras & Torneos (Con Caja Exclusiva)',
      icon: Plane,
      iconColor: 'text-amber-400',
      badge: 'Nuevo',
      description: 'Gestión de delegaciones, seleccionados por categoría, cobros individuales y control de fondos en caja separada.',
      currentValue: modules.viajesTorneos
    },
    {
      id: 'tienda' as const,
      name: 'Tienda Oficial & Punto de Venta (POS)',
      icon: ShoppingBag,
      iconColor: 'text-orange-400',
      badge: 'Comercio',
      description: 'Venta de indumentaria deportiva del club, merchandising, control de stock y caja separada de tienda.',
      currentValue: modules.tienda
    },
    {
      id: 'asistencia' as const,
      name: 'Asistencia Deportiva en Cancha',
      icon: CalendarCheck,
      iconColor: 'text-teal-400',
      badge: 'Entrenadores',
      description: 'Módulo de toma de presentes por fecha y categorías para directores técnicos y preparadores físicos.',
      currentValue: modules.asistencia
    },
    {
      id: 'feeReminders' as const,
      name: 'Avisos Automatizados de Cuotas',
      icon: Clock,
      iconColor: 'text-emerald-400',
      badge: 'Cobranzas',
      description: 'Botón y asistente de despacho de mensajes automáticos de vencimiento por WhatsApp al inicio de cada mes.',
      currentValue: modules.feeReminders
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30">
                  Personalización de Interfaz
                </span>
                <span className="text-xs text-slate-400">{currentClub.name}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Visibilidad de Módulos & Ventanas
              </h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
            Puedes <strong>ocultar o mostrar cualquier icono o ventana</strong> del club para simplificar la pantalla y activar solo las funciones que el personal utiliza en este momento.
          </div>

          <div className="space-y-2.5">
            {moduleItems.filter(item => !(isSupabaseConfigured() && item.id === 'tienda')).map(item => {
              const Icon = item.icon;
              const isEnabled = item.currentValue;

              return (
                <div 
                  key={item.id}
                  onClick={() => toggleModule(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isEnabled 
                      ? 'bg-slate-950/70 border-slate-700/80 hover:border-indigo-500/50' 
                      : 'bg-slate-950/30 border-slate-800/60 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isEnabled ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500'
                    }`}>
                      <Icon className={`w-4 h-4 ${isEnabled ? item.iconColor : 'text-slate-500'}`} />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                          isEnabled ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Switch Pill */}
                  <div className="shrink-0 flex items-center gap-2 pt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isEnabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {isEnabled ? 'Visible' : 'Oculto'}
                    </span>
                    <button
                      type="button"
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border ${
                        isEnabled 
                          ? 'bg-emerald-500 border-emerald-400' 
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        isEnabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Los cambios impactan de inmediato en la barra lateral y cabecera</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              {successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Aplicar Visibilidad</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
