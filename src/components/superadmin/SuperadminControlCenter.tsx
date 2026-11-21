import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Clock, 
  Check, 
  Sliders, 
  ShieldCheck, 
  TrendingUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Club, CommercialPlan, BetaFeature, AuditLog, User } from '../../types/fraovia';
import { SuperadminSection } from './superadminNavigation';

interface SuperadminControlCenterProps {
  allClubs: Club[];
  allPlans: CommercialPlan[];
  allBetas: BetaFeature[];
  auditLogs: AuditLog[];
  onNavigateSection: (section: SuperadminSection) => void;
  onEnterClubView: (club: Club) => void;
  onResolveAttentionItem: (type: string, clubId?: string) => void;
}

export const SuperadminControlCenter: React.FC<SuperadminControlCenterProps> = ({
  allClubs,
  allPlans,
  allBetas,
  auditLogs,
  onNavigateSection,
  onEnterClubView,
  onResolveAttentionItem
}) => {
  const [clubSearchTerm, setClubSearchTerm] = useState('');

  // 1. Métricas agrupadas (4 indicadores principales)
  const totalClubs = allClubs.length;
  const activeClubs = allClubs.filter(c => c.status === 'activo').length;
  const totalUsersCount = 186; // Suma escalable de usuarios en la plataforma
  const activeUsersCount = 42; // Activos hoy
  
  // MRR Total
  const totalMrr = allClubs.reduce((acc, c) => {
    const plan = allPlans.find(p => p.id === c.subscriptionPlanId);
    return acc + (plan?.monthlyPrice || 0);
  }, 0);

  // Alertas / Ítems que requieren atención
  const attentionItems = [
    {
      id: 'alert-1',
      severity: 'danger' as const, // 🔴
      clubName: 'Club Atlético Norte',
      clubId: 'club-norte',
      issue: 'Error de conexión en base secundaria',
      actionLabel: 'Revisar',
      targetSection: 'monitoreo_errores' as SuperadminSection
    },
    {
      id: 'alert-2',
      severity: 'warning' as const, // 🟡
      clubName: 'Club Atlético San Martín',
      clubId: 'club-san-martin',
      issue: 'Solicitud de cambio de plan (a BUSINESS)',
      actionLabel: 'Revisar',
      targetSection: 'sistema_planes' as SuperadminSection
    },
    {
      id: 'alert-3',
      severity: 'warning' as const, // 🟡
      clubName: 'Club Social y Deportivo Belgrano',
      clubId: 'club-belgrano',
      issue: 'Solicitud de activación función Beta (WhatsApp Masivo)',
      actionLabel: 'Revisar',
      targetSection: 'plataforma_funciones' as SuperadminSection
    }
  ];

  // Filtro de clubes resumidos para el dashboard
  const filteredQuickClubs = allClubs.filter(c => {
    if (!clubSearchTerm.trim()) return true;
    const term = clubSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term);
  }).slice(0, 4);

  // Distribución de planes comercial
  const planDistribution = allPlans.map(plan => {
    const count = allClubs.filter(c => c.subscriptionPlanId === plan.id).length;
    return { plan, count };
  });

  return (
    <div className="space-y-6">
      {/* ========================================================
          ENCABEZADO LIMPIO: CENTRO DE CONTROL FRAOVIA
         ======================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              CENTRO DE CONTROL
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              PLATAFORMA ACTIVA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Resumen general de la plataforma
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateSection('clubes')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Gestionar Clubes</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          INDICADORES PRINCIPALES (4 TARJETAS COMPACTAS)
         ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. CLUBES */}
        <div 
          onClick={() => onNavigateSection('clubes')}
          className="p-4 rounded-2xl border border-slate-800 bg-[#0C162D] hover:border-slate-700 transition cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Clubes
            </span>
            <Building2 className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalClubs}</div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{activeClubs} clubes activos</span>
          </div>
        </div>

        {/* 2. USUARIOS */}
        <div 
          onClick={() => onNavigateSection('sistema_usuarios')}
          className="p-4 rounded-2xl border border-slate-800 bg-[#0C162D] hover:border-slate-700 transition cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Usuarios
            </span>
            <Users className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalUsersCount}</div>
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 pt-0.5">
            <span className="text-emerald-400 font-bold">{activeUsersCount} activos</span> hoy
          </div>
        </div>

        {/* 3. MRR */}
        <div 
          onClick={() => onNavigateSection('sistema_planes')}
          className="p-4 rounded-2xl border border-slate-800 bg-[#0C162D] hover:border-slate-700 transition cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              MRR
            </span>
            <DollarSign className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ${(totalMrr / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>+12% vs. período anterior</span>
          </div>
        </div>

        {/* 4. ALERTAS */}
        <div 
          onClick={() => onNavigateSection('monitoreo_errores')}
          className={`p-4 rounded-2xl border transition cursor-pointer space-y-1 group ${
            attentionItems.length > 0 
              ? 'border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50' 
              : 'border-slate-800 bg-[#0C162D]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Alertas
            </span>
            <AlertTriangle className={`w-4 h-4 ${attentionItems.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-3xl font-black font-mono ${attentionItems.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {attentionItems.length}
          </div>
          <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 pt-0.5">
            {attentionItems.length > 0 ? 'Requieren acción' : 'Sin problemas'}
          </div>
        </div>
      </div>

      {/* ========================================================
          SECCIÓN "REQUIERE ATENCIÓN" (CLAVE DEL CONTROL CENTER)
         ======================================================== */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              ⚠️ REQUIERE ATENCIÓN
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              {attentionItems.length} pendientes
            </span>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateSection('monitoreo_errores')}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            Ver todos los registros
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {attentionItems.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">Todo funcionando correctamente</div>
              <div className="text-[11px] text-slate-400">No hay acciones pendientes en la plataforma.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.severity === 'danger' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {item.clubName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.issue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const targetClub = allClubs.find(c => c.id === item.clubId);
                      if (targetClub) {
                        onEnterClubView(targetClub);
                      } else {
                        onNavigateSection(item.targetSection);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      item.severity === 'danger'
                        ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-slate-950 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30'
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          SECCIÓN CLUBES (RESUMEN EN DASHBOARD)
         ======================================================== */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              🏢 CLUBES
            </span>
            <span className="text-xs text-slate-400">
              ({allClubs.length} registrados)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar club..."
                value={clubSearchTerm}
                onChange={(e) => setClubSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            <button 
              type="button"
              onClick={() => onNavigateSection('clubes')}
              className="text-xs text-amber-400 font-bold hover:underline transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              Ver todos →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredQuickClubs.map((club) => {
            const plan = allPlans.find(p => p.id === club.subscriptionPlanId);
            return (
              <div 
                key={club.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {club.logoUrl && club.logoUrl.trim() ? (
                    <img 
                      src={club.logoUrl} 
                      alt={club.name} 
                      className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-slate-800 shrink-0" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                      {club.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {club.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      <strong className="text-amber-400">{plan?.name || 'PRO'}</strong> · {club.contractedPlayersQuota} jugadores · {club.contractedUsersQuota} usuarios
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Activo
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">Hace 4 minutos</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEnterClubView(club)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-sm"
                >
                  Entrar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          FILA INFERIOR: RESUMEN COMERCIAL (IZQ) & ACTIVIDAD RECIENTE (DER)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RESUMEN COMERCIAL: DISTRIBUCIÓN DE PLANES */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              📈 Distribución de Planes
            </span>
            <button 
              type="button"
              onClick={() => onNavigateSection('sistema_planes')}
              className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Ver planes →
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {planDistribution.map(({ plan, count }) => (
              <div 
                key={plan.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{plan.name}</span>
                  <span className="text-[10px] text-slate-400">({plan.maxPlayers} jug)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">{count}</span>
                  <span className="text-[10px] text-slate-500">clubes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              🕐 Actividad Reciente
            </span>
            <button 
              type="button"
              onClick={() => onNavigateSection('monitoreo_actividad')}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              Ver toda la actividad →
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-slate-200">
                  Nuevo club registrado · <strong className="text-white">Club Atlético Norte</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Hace 2 h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-200">
                  Cambio de plan · <strong className="text-white">Club San Martín</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Hace 4 h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="text-slate-200">
                  Solicitud de función Beta · <strong className="text-white">Club La Esperanza</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Hace 5 h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-200">
                  Usuario creado · <strong className="text-white">Club Belgrano</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Hace 6 h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
