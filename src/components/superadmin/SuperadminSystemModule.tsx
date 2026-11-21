import React, { useState } from 'react';
import { 
  CreditCard, 
  Users, 
  Sliders, 
  Plus, 
  Search, 
  Check, 
  UserCheck, 
  ShieldAlert,
  Database,
  ArrowRight
} from 'lucide-react';
import { CommercialPlan, Club, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface SuperadminSystemModuleProps {
  subSection: 'sistema_planes' | 'sistema_usuarios' | 'sistema_config';
  allPlans: CommercialPlan[];
  allClubs: Club[];
  currentUser: User;
  onRefreshData: () => void;
  onOpenCreatePlanModal: () => void;
  onEditPlanModal: (plan: CommercialPlan) => void;
}

export const SuperadminSystemModule: React.FC<SuperadminSystemModuleProps> = ({
  subSection,
  allPlans,
  allClubs,
  currentUser,
  onRefreshData,
  onOpenCreatePlanModal,
  onEditPlanModal
}) => {
  // Estado para Configuración general
  const [notifySuperadminOnFail, setNotifySuperadminOnFail] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('ARS');
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState('120');

  // 1. SUBSECCIÓN: PLANES
  if (subSection === 'sistema_planes') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Administración de Planes Comerciales SaaS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura límites de jugadores, cupo de usuarios, módulos y tarifas mensuales/anuales.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreatePlanModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allPlans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-[#0C162D] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-white">{plan.name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{plan.status}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ${(plan.monthlyPrice / 1000).toFixed(0)}k/m
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jugadores:</span>
                    <strong className="text-white">{plan.maxPlayers}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Usuarios login:</span>
                    <strong className="text-white">{plan.maxLoginUsers}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Almacenamiento:</span>
                    <strong className="text-white">{plan.storageGb} GB</strong>
                  </div>
                </div>

                <div className="text-[11px] space-y-1">
                  <span className="text-slate-400 font-semibold block">Módulos incluidos:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(plan.modules).map(([mod, active]) => (
                      <span 
                        key={mod}
                        className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                          active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-600 line-through'
                        }`}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onEditPlanModal(plan)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Configurar Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. SUBSECCIÓN: USUARIOS GLOBALES
  if (subSection === 'sistema_usuarios') {
    const roleStats = [
      { role: 'Superadmin', count: 2, badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
      { role: 'Dueño / Junta', count: 14, badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
      { role: 'Administración', count: 28, badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
      { role: 'Profesores', count: 86, badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
      { role: 'Tienda & Otros', count: 56, badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
    ];

    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Usuarios Globales de la Plataforma
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas y distribución global. (Para gestionar credenciales de un club en particular, ingresa a CLUBES → SELECCIONAR CLUB → USUARIOS).
          </p>
        </div>

        {/* 3 KPIs de Usuarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Cantidad Total de Usuarios</span>
            <div className="text-3xl font-black text-white font-mono mt-1">186</div>
            <span className="text-[10px] text-slate-400">Registrados en la plataforma</span>
          </div>

          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Usuarios Activos (Últimos 7 días)</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">142</div>
            <span className="text-[10px] text-emerald-400">76% adopción de personal</span>
          </div>

          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Clubes con Usuarios Asignados</span>
            <div className="text-3xl font-black text-sky-400 font-mono mt-1">{allClubs.length}</div>
            <span className="text-[10px] text-slate-400">Promedio 7.7 usuarios x club</span>
          </div>
        </div>

        {/* Distribución por Rol */}
        <div className="p-5 bg-[#0C162D] border border-slate-800 rounded-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Distribución de Usuarios por Rol
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {roleStats.map(stat => (
              <div key={stat.role} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-white font-medium">{stat.role}</span>
                <span className={`px-2 py-0.5 rounded-full font-mono font-bold border text-[11px] ${stat.badge}`}>
                  {stat.count} usuarios
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. SUBSECCIÓN: CONFIGURACIÓN GENERAL
  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          Configuración General del Sistema
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Parámetros predeterminados, notificaciones automáticas y reglas generales.
        </p>
      </div>

      <div className="p-5 bg-[#0C162D] border border-slate-800 rounded-2xl space-y-4 max-w-2xl text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-bold text-white block">Alertar al Superadmin ante Errores de Pago</span>
            <span className="text-[11px] text-slate-400">Envía aviso inmediato cuando una cuota comercial SaaS vence.</span>
          </div>
          <button
            type="button"
            onClick={() => setNotifySuperadminOnFail(!notifySuperadminOnFail)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              notifySuperadminOnFail ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {notifySuperadminOnFail ? 'ACTIVADO' : 'DESACTIVADO'}
          </button>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Moneda Predeterminada del SaaS</label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
          >
            <option value="ARS">ARS ($ - Pesos Argentinos)</option>
            <option value="USD">USD ($ - Dólares Estadounidenses)</option>
            <option value="EUR">EUR (€ - Euros)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Tiempo Máximo de Inactividad de Sesión (Minutos)</label>
          <input
            type="number"
            value={sessionTimeoutMin}
            onChange={(e) => setSessionTimeoutMin(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
          />
        </div>
      </div>
    </div>
  );
};
