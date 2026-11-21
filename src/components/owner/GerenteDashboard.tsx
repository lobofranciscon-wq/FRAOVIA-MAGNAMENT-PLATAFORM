import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  ShoppingBag, 
  Wallet, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Activity, 
  Clock, 
  Building2,
  ChevronRight,
  Sliders,
  DollarSign,
  Search,
  ArrowDownLeft,
  Receipt as ReceiptIcon,
  Target
} from 'lucide-react';
import { Club, CommercialPlan, User, Player, CashMovement, StoreSale, Receipt } from '../../types/fraovia';
import { ActiveTab } from '../MobileNavBar';

interface GerenteDashboardProps {
  currentClub: Club;
  currentUser: User;
  activePlan: CommercialPlan | null;
  players: Player[];
  movements: CashMovement[];
  sales: StoreSale[];
  receipts: Receipt[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenPlanSelector: () => void;
  onOpenMedicalCenter: () => void;
}

export const GerenteDashboard: React.FC<GerenteDashboardProps> = ({
  currentClub,
  currentUser,
  activePlan,
  players,
  movements,
  sales,
  receipts,
  onNavigate,
  onOpenPlanSelector,
  onOpenMedicalCenter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const totalPlayers = players.length;
  const quota = currentClub.contractedPlayersQuota || 800;
  const quotaPercent = Math.min(100, Math.round((totalPlayers / quota) * 100));

  const totalStoreSales = sales.reduce((acc, s) => acc + s.total, 0) || 2340500;
  const totalCobrado = receipts.reduce((acc, r) => acc + r.amount, 0) || 2340000;
  const debtors = players.filter(p => p.balance > 0);
  const totalDebt = debtors.reduce((acc, p) => acc + p.balance, 0) || 620000;
  const currentCash = movements.reduce((acc, m) => m.type === 'ingreso' ? acc + m.amount : acc - m.amount, 189450);

  // Cobros de hoy & Cumplimiento sobre la meta mensual para el club activo
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReceipts = receipts.filter(r => r.date?.startsWith(todayStr) && r.status !== 'anulado');
  const totalCobradoHoy = todayReceipts.reduce((acc, r) => acc + r.amount, 0) || 184500;
  const countCobradoHoy = todayReceipts.length || 8;
  const monthlyGoal = currentClub.monthlyGoal || 3000000;
  const compliancePercent = Math.min(100, Math.round((totalCobrado / monthlyGoal) * 100));

  const searchedPlayers = players.filter(p => 
    searchTerm.trim().length > 0 && (
      p.dni.includes(searchTerm) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Role Banner with translucent watermark */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border text-white shadow-lg relative overflow-hidden"
        style={{
          background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)',
          borderColor: currentClub.branding?.primaryColor || '#0284C7'
        }}
      >
        {/* Translucent Background Watermark */}
        {(currentClub.branding?.watermarkUrl?.trim() || currentClub.logoUrl?.trim()) ? (
          <div 
            className="absolute -right-6 -bottom-6 w-60 h-60 pointer-events-none select-none z-0 mix-blend-overlay transition-opacity duration-300"
            style={{ opacity: currentClub.branding?.watermarkOpacity ?? 0.20 }}
          >
            <img 
              src={currentClub.branding?.watermarkUrl?.trim() || currentClub.logoUrl?.trim()} 
              alt="Marca de agua" 
              className="w-full h-full object-contain filter drop-shadow-2xl" 
            />
          </div>
        ) : null}

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden shrink-0">
              {currentClub.logoUrl && currentClub.logoUrl.trim() ? (
                <img src={currentClub.logoUrl} alt="Escudo" className="w-9 h-9 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Sector Gerencial
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                GENERAL / GERENTE - Visión Global del Club
              </h2>
              <p className="text-xs text-sky-100">
                Supervisión ejecutiva integral de secretaría, plantel deportivo, tesorería y tienda.
              </p>
            </div>
          </div>

          {/* Quick Plan Info badge visible ONLY for Dueño / Gerente */}
          <div className="flex items-center gap-2 bg-slate-950/40 backdrop-blur-md p-2 rounded-xl border border-white/15">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-sky-300 block font-semibold">
                Suscripción Activa
              </span>
              <span className="text-xs font-bold text-white">
                Plan {activePlan?.name || 'PRO'} ({quotaPercent}%)
              </span>
            </div>
            <button
              onClick={onOpenPlanSelector}
              className="p-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition cursor-pointer shadow font-bold text-xs"
              title="Gestionar mi plan comercial"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Gerente Search Bar */}
      <div className="p-3.5 rounded-2xl border border-sky-500/20 bg-[#0C162D] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscador Gerencial: Buscar deportistas por DNI, apellido o nombre en la institución..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {searchTerm.trim().length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">
              Socios encontrados: ({searchedPlayers.length})
            </span>
            {searchedPlayers.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">No se encontraron socios con ese término.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchedPlayers.slice(0, 5).map(p => (
                  <div key={p.id} className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{p.firstName} {p.lastName}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">DNI: {p.dni}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${p.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.balance > 0 ? `Saldo: $${p.balance.toLocaleString()}` : 'Al Día'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header section: "Resumen general - Todos los sectores en un solo lugar" */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-white">
          Resumen general
        </h3>
        <p className="text-xs text-slate-400">
          Todos los sectores del club unificados en un solo lugar.
        </p>
      </div>

      {/* Quick Metrics Grid: Total active athletes, monthly cash inflows, pending receipts & dues, cash balance, and today collections & monthly goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-sky-500/30 bg-[#0C162D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Deportistas Activos</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalPlayers || 642}</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12% vs. mes anterior · {quotaPercent}% cupo</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-[#0C162D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos del Mes (Cobranzas)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">${(totalCobrado).toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>78% cuotas cobradas a tiempo</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-[#0C162D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comprobantes & Cuotas Pendientes</span>
            <ReceiptIcon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">${(totalDebt).toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{debtors.length || 62} socios en mora (8.5%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/30 bg-[#0C162D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo de Caja Disponible</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">${(currentCash).toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Caja abierta · Arqueo al día</span>
          </div>
        </div>

        {/* Metric 5: Cobros Realizados Hoy & Porcentaje de Cumplimiento de Meta Mensual */}
        <div className="p-4 rounded-2xl border border-amber-500/35 bg-[#0C162D] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Cobros de Hoy</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Hoy
              </span>
            </span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">${(totalCobradoHoy).toLocaleString('es-AR')}</div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>{countCobradoHoy} cobros hoy</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Meta mensual:</span>
              <span className="font-bold text-white font-mono">{compliancePercent}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${compliancePercent}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">
                {compliancePercent >= 75 ? '● En objetivo' : '● En gestión'}
              </span>
              <span>Meta: ${(monthlyGoal / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusivo del DUEÑO: Tarjeta de Gestión de Plan Comercial */}
      <div className="p-4 sm:p-5 rounded-2xl border border-sky-500/40 bg-sky-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
              Solo Visible para el Dueño
            </span>
            <h4 className="font-bold text-white text-sm">
              Mi Plan Contratado: {activePlan?.name || 'PLAN PRO'}
            </h4>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Tu institución cuenta con un cupo de <strong>{quota} jugadores federados</strong>. Actualmente estás utilizando {totalPlayers} fichas activas ({quotaPercent}% del límite del plan).
          </p>
          <div className="w-full max-w-md bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={onOpenPlanSelector}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-600/30 shrink-0"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Gestionar / Ampliar Plan a 1 Clic</span>
        </button>
      </div>

      {/* Accesos Rápidos matching screenshot */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Accesos Rápidos
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => onNavigate('jugadores')}
            className="p-3 rounded-xl border border-slate-800 bg-[#0C162D] hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-200 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Administración</span>
          </button>

          <button
            onClick={() => onNavigate('asistencia')}
            className="p-3 rounded-xl border border-slate-800 bg-[#0C162D] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-200 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Deportivo</span>
          </button>

          <button
            onClick={() => onNavigate('caja')}
            className="p-3 rounded-xl border border-slate-800 bg-[#0C162D] hover:border-purple-500/50 hover:bg-purple-500/10 text-slate-200 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Caja</span>
          </button>

          <button
            onClick={() => onNavigate('tienda')}
            className="p-3 rounded-xl border border-slate-800 bg-[#0C162D] hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-200 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Tienda</span>
          </button>

          <button
            onClick={() => onNavigate('auditoria')}
            className="p-3 rounded-xl border border-slate-800 bg-[#0C162D] hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-200 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Reportes</span>
          </button>
        </div>
      </div>

      {/* Two columns: Actividad reciente (Left) & Próximos eventos (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Actividad reciente */}
        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Actividad reciente
            </h4>
            <span className="text-[10px] text-slate-400">En tiempo real</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white font-medium">Pago registrado - Juan Pérez</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Hace 1h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-white font-medium">Venta en tienda - Remera oficial</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Hace 2h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="text-white font-medium">Comprobante emitido - #000432</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Hace 3h</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span className="text-white font-medium">Nuevo jugador - Lucas García</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Hace 4h</span>
            </div>
          </div>
        </div>

        {/* Right Column: Próximos eventos */}
        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Próximos eventos
            </h4>
            <span className="text-[10px] text-slate-400">Calendario oficial</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  15/04
                </span>
                <span className="text-white font-medium">Entrenamiento - Sub 17</span>
              </div>
              <span className="text-[10px] text-slate-400">17:00 hs</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  16/04
                </span>
                <span className="text-white font-medium">Partido amistoso federado</span>
              </div>
              <span className="text-[10px] text-slate-400">Sede Central</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  18/04
                </span>
                <span className="text-white font-medium">Reunión de comisión directiva</span>
              </div>
              <span className="text-[10px] text-slate-400">19:30 hs</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  20/04
                </span>
                <span className="text-white font-medium">Cierre de caja y balances</span>
              </div>
              <span className="text-[10px] text-slate-400">Tesorería</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
