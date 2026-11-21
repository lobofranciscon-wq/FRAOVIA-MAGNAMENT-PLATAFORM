import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Layers, 
  ShieldCheck, 
  Zap, 
  ShoppingBag, 
  Wallet, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  HeartPulse, 
  Award, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import { Club, CommercialPlan, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface OneClickPlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  allPlans: CommercialPlan[];
  onPlanUpdated: () => void;
}

export const OneClickPlanSelectorModal: React.FC<OneClickPlanSelectorModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  allPlans,
  onPlanUpdated
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(currentClub.subscriptionPlanId);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Con Supabase el plan, los cupos y los módulos contratados los gestiona solo la plataforma
  const blockedBySupabase = (): boolean => {
    if (!isSupabaseConfigured()) return false;
    dataActions.changeClubPlan().catch((err: any) => alert(err.message));
    return true;
  };

  // 1-Click quick apply preset
  const handleSelectPlan = (plan: CommercialPlan) => {
    if (blockedBySupabase()) return;
    setSelectedPlanId(plan.id);
    currentClub.subscriptionPlanId = plan.id;
    currentClub.contractedPlayersQuota = typeof plan.maxPlayers === 'number' ? plan.maxPlayers : 5000;
    currentClub.activeModules.tienda = !!plan.modules.tienda;
    currentClub.activeModules.caja = !!plan.modules.caja;
    currentClub.activeModules.deportivo = !!plan.modules.deportivo;

    fraoviaDB.updateClub(currentClub, currentUser);
    fraoviaDB.logAudit(
      currentUser,
      'PLAN_ACTUALIZADO_1_CLIC',
      `El club '${currentClub.name}' cambió al plan '${plan.name}' con cupo de ${currentClub.contractedPlayersQuota} atletas.`,
      'planes',
      currentClub.id
    );

    setNotification(`¡Plan ${plan.name} activado a 1 clic con éxito!`);
    setTimeout(() => setNotification(null), 3000);
    onPlanUpdated();
  };

  // 1-Click quota toggle
  const handleSetQuota = (quota: number) => {
    if (blockedBySupabase()) return;
    currentClub.contractedPlayersQuota = quota;
    fraoviaDB.updateClub(currentClub, currentUser);
    fraoviaDB.logAudit(
      currentUser,
      'CUPO_JUGADORES_ACTUALIZADO_1_CLIC',
      `Cupo contratado ajustado a ${quota} atletas a 1 clic.`,
      'planes',
      currentClub.id
    );
    setNotification(`Cupo contratado ajustado a ${quota} atletas.`);
    setTimeout(() => setNotification(null), 3000);
    onPlanUpdated();
  };

  // 1-Click Module toggles
  const handleToggleModule = (moduleKey: 'tienda' | 'caja' | 'deportivo') => {
    if (blockedBySupabase()) return;
    const nextState = !currentClub.activeModules[moduleKey];
    currentClub.activeModules[moduleKey] = nextState;
    fraoviaDB.updateClub(currentClub, currentUser);
    fraoviaDB.logAudit(
      currentUser,
      'MODULO_TOGGLE_1_CLIC',
      `Módulo '${moduleKey.toUpperCase()}' cambiado a: ${nextState ? 'HABILITADO' : 'DESHABILITADO'}.`,
      'planes',
      currentClub.id
    );
    setNotification(`Módulo ${moduleKey.toUpperCase()} ${nextState ? 'activado' : 'desactivado'}.`);
    setTimeout(() => setNotification(null), 3000);
    onPlanUpdated();
  };

  const quotasPresets = [100, 300, 800, 1500, 3000];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Selector & Constructor de Planes a 1 Clic
                <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  Instantáneo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentClub.name} · Selecciona o personaliza los módulos y cupos con un solo toque.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Notification Pill */}
        {notification && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-2.5 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          
          {/* SECTION 1: Planes Oficiales Preconfigurados a 1 Clic */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              1. Seleccionar Plan Completo a 1 Clic
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allPlans.map((plan) => {
                const isSelected = plan.id === currentClub.subscriptionPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white tracking-wide">{plan.name}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black font-mono text-blue-400 mt-1">
                        ${plan.monthlyPrice.toLocaleString('es-AR')}<span className="text-[10px] text-slate-400">/mes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{plan.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cupo Atletas:</span>
                        <span className="font-bold text-slate-200">{plan.maxPlayers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tienda Oficial:</span>
                        <span className={plan.modules.tienda ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {plan.modules.tienda ? 'Incluida' : 'No'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Plan Seleccionado' : 'Elegir a 1 Clic'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Personalizar Cupo de Deportistas a 1 Clic */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs uppercase tracking-wider block">
                  2. Ajustar Cupo de Deportistas a 1 Clic
                </span>
                <p className="text-[11px] text-slate-400">
                  Define el límite contratado. Si se reduce, ningún socio se borra (pasan a Solo Lectura).
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                {currentClub.contractedPlayersQuota} Cupos
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {quotasPresets.map((q) => {
                const isActive = currentClub.contractedPlayersQuota === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSetQuota(q)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {q} Jugadores
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Módulos Opcionales a 1 Clic (On/Off) */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              3. Módulos y Funciones Específicas a 1 Clic
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Tienda */}
              <div 
                onClick={() => handleToggleModule('tienda')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  currentClub.activeModules.tienda
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className={`w-4 h-4 ${currentClub.activeModules.tienda ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs text-white">Tienda & POS</div>
                    <div className="text-[10px] text-slate-400">Ventas de indumentaria</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentClub.activeModules.tienda ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentClub.activeModules.tienda ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Caja y Tesorería */}
              <div 
                onClick={() => handleToggleModule('caja')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  currentClub.activeModules.caja
                    ? 'bg-emerald-600/10 border-emerald-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className={`w-4 h-4 ${currentClub.activeModules.caja ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs text-white">Caja & Recibos</div>
                    <div className="text-[10px] text-slate-400">Tesorería y cobros</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentClub.activeModules.caja ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentClub.activeModules.caja ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Deportes y Asistencias */}
              <div 
                onClick={() => handleToggleModule('deportivo')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  currentClub.activeModules.deportivo
                    ? 'bg-cyan-600/10 border-cyan-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className={`w-4 h-4 ${currentClub.activeModules.deportivo ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs text-white">Deporte & Cancha</div>
                    <div className="text-[10px] text-slate-400">Asistencia y profesores</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentClub.activeModules.deportivo ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentClub.activeModules.deportivo ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Toda modificación se aplica en tiempo real sin reiniciar el sistema ni perder información histórica.</span>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
