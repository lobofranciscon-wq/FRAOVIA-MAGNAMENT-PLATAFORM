import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Wallet, 
  FileCheck, 
  AlertTriangle, 
  UserPlus, 
  Receipt as ReceiptIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search, 
  Filter, 
  CheckCircle, 
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Clock,
  Printer,
  ChevronRight,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  FileText,
  Upload,
  BarChart3,
  Palette,
  FolderTree,
  Sparkles,
  Check,
  Coins,
  Target,
  UserCheck,
  ClipboardCheck,
  FileSpreadsheet,
  Activity,
  Camera,
  Edit2,
  GraduationCap,
  Ban,
  Layers,
  ArrowRightLeft,
  Share2,
  MessageCircle,
  Plane,
  Trophy,
  EyeOff
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { Category, Club, Discipline, Player, Receipt, User, CashBox, TripTournament, CoachApprovalRequest, AttendanceRecord, SuspensionReason, SUSPENSION_REASON_LABELS } from '../../types/fraovia';
import { SuspendPlayerModal } from './SuspendPlayerModal';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { AdminComparativeLineChart } from './AdminComparativeLineChart';
import { AdminSalesAnalyticsCharts } from './AdminSalesAnalyticsCharts';
import { ColorBlocksAndDivisionsModule } from './ColorBlocksAndDivisionsModule';
import { OpenCashBoxModal } from '../cash/OpenCashBoxModal';
import { CoachApprovalsModal } from './CoachApprovalsModal';
import { AttendanceControlModal } from '../coach/AttendanceControlModal';
import { ExcelImportModal } from './ExcelImportModal';
import { FeeReminderAutomationModal } from './FeeReminderAutomationModal';
import { UpcomingDuesWidget } from './UpcomingDuesWidget';
import { EditPlayerModal } from './EditPlayerModal';
import { ModuleVisibilityModal } from './ModuleVisibilityModal';
import { ViajesTorneosModule } from '../trips/ViajesTorneosModule';
import { PlayerImage } from '../common/PlayerImage';

interface AdminDashboardProps {
  currentClub: Club;
  currentUser: User;
  players: Player[];
  receipts: Receipt[];
  disciplines: Discipline[];
  categories: Category[];
  cashBoxes?: CashBox[];
  /** Viajes/torneos leídos de Supabase (App.tsx). Sin Supabase se usan los locales. */
  trips?: TripTournament[];
  /** Usuarios del club (profesores). Con Supabase vienen de la base; si no se pasan, se usan los locales. */
  clubUsers?: User[];
  coachRequests?: CoachApprovalRequest[];
  attendanceRecords?: AttendanceRecord[];
  onOpenNewPlayerModal: () => void;
  onOpenNewReceiptModal: (player?: Player) => void;
  onSelectReceipt: (receipt: Receipt) => void;
  onNavigate?: (tab: any) => void;
  onRefreshData?: () => void;
  initialViewTab?: 'resumen' | 'padron' | 'viajes' | 'graficos' | 'grafico_lineas' | 'bloques_color';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentClub,
  currentUser,
  players,
  receipts,
  disciplines,
  categories,
  cashBoxes: passedCashBoxes,
  trips: tripsProp,
  clubUsers: clubUsersProp,
  coachRequests: coachRequestsProp,
  attendanceRecords: attendanceRecordsProp,
  onOpenNewPlayerModal,
  onOpenNewReceiptModal,
  onSelectReceipt,
  onNavigate,
  onRefreshData,
  initialViewTab = 'resumen'
}) => {
  const [adminViewTab, setAdminViewTab] = useState<'resumen' | 'padron' | 'viajes' | 'graficos' | 'grafico_lineas' | 'bloques_color'>(initialViewTab);
  const [adminRefreshTick, setAdminRefreshTick] = useState<number>(0);

  const handleLocalRefresh = () => {
    setAdminRefreshTick(prev => prev + 1);
    if (onRefreshData) onRefreshData();
  };

  React.useEffect(() => {
    if (initialViewTab) {
      setAdminViewTab(initialViewTab);
    }
  }, [initialViewTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('all');
  const [selectedPlayerStatus, setSelectedPlayerStatus] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [showOpenCashBoxModal, setShowOpenCashBoxModal] = useState<boolean>(false);
  const [showCoachApprovalsModal, setShowCoachApprovalsModal] = useState<boolean>(false);
  const [showAttendanceControl, setShowAttendanceControl] = useState<boolean>(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState<boolean>(false);
  const [showFeeReminderModal, setShowFeeReminderModal] = useState<boolean>(false);
  const [showModuleVisibilityModal, setShowModuleVisibilityModal] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToSuspend, setPlayerToSuspend] = useState<Player | null>(null);

  // Available coaches for assignment
  const clubCoaches = useMemo(() => {
    const users = isSupabaseConfigured() || clubUsersProp
      ? (clubUsersProp || [])
      : fraoviaDB.getUsers(currentClub.id, currentUser);
    return users.filter(u => u.role === 'PROFESOR');
  }, [currentClub.id, currentUser, clubUsersProp]);

  const coachRequests = isSupabaseConfigured()
    ? (coachRequestsProp || [])
    : fraoviaDB.getCoachApprovalRequests(currentClub.id, currentUser);
  const pendingCoachRequests = coachRequests.filter(r => r.status === 'pendiente' || r.status === 'aprobado_parcial');

  // Multi-Sport Isolation Computed Data
  const isMultiSportEnabled = currentClub.activeModules.multiSportIsolation !== false;
  const activeDisciplineObj = selectedDiscipline !== 'all' 
    ? disciplines.find(d => d.id === selectedDiscipline) 
    : null;

  // Filter players by selected discipline if in isolated mode
  const effectivePlayers = useMemo(() => {
    if (!isMultiSportEnabled || selectedDiscipline === 'all') return players;
    return players.filter(p => p.disciplineId === selectedDiscipline);
  }, [players, isMultiSportEnabled, selectedDiscipline]);

  // Filter categories by selected discipline
  const effectiveCategories = useMemo(() => {
    if (!isMultiSportEnabled || selectedDiscipline === 'all') return categories;
    return categories.filter(c => c.disciplineId === selectedDiscipline);
  }, [categories, isMultiSportEnabled, selectedDiscipline]);

  // Padron filtered players (advanced filters)
  const padronFilteredPlayers = useMemo(() => {
    return effectivePlayers.filter(p => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        if (!fullName.includes(term) && !p.dni.includes(term)) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedBlock !== 'all') {
        const pBlock = p.colorBlockName || 'Azul';
        if (pBlock !== selectedBlock) return false;
      }
      if (selectedCoachId !== 'all') {
        if (p.coachId !== selectedCoachId) return false;
      }
      if (selectedPlayerStatus !== 'all') {
        if (selectedPlayerStatus === 'activo' && (p.status !== 'activo' || p.balance > 0 || p.pendingFirstPayment)) return false;
        if (selectedPlayerStatus === 'sin_pagos' && !p.pendingFirstPayment) return false;
        if (selectedPlayerStatus === 'moroso' && (p.status !== 'moroso' && p.balance <= 0)) return false;
        if (selectedPlayerStatus === 'medico_vencido' && p.medicalCertificateValid) return false;
        if (selectedPlayerStatus === 'suspendido' && p.status !== 'suspendido') return false;
      }
      return true;
    });
  }, [effectivePlayers, searchTerm, selectedCategory, selectedBlock, selectedCoachId, selectedPlayerStatus]);

  // Color blocks breakdown
  const colorBlocksCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Azul: 0,
      Rojo: 0,
      Blanco: 0,
      Oro: 0,
      Verde: 0,
      Negro: 0
    };
    effectivePlayers.forEach(p => {
      const block = p.colorBlockName || 'Azul';
      counts[block] = (counts[block] || 0) + 1;
    });
    return counts;
  }, [effectivePlayers]);

  // Recent inscripted players
  const recentPlayers = useMemo(() => {
    return [...effectivePlayers]
      .sort((a, b) => (b.joinedDate || '').localeCompare(a.joinedDate || ''))
      .slice(0, 6);
  }, [effectivePlayers]);

  // Quick Action Handlers for Players
  const handleChangePlayerCat = async (playerId: string, newCatId: string) => {
    try {
      const target = effectivePlayers.find(p => p.id === playerId);
      if (!target) throw new Error('Deportista no encontrado');
      await dataActions.changePlayerCategory(target, newCatId, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar categoría');
    }
  };

  const handleChangePlayerBlock = async (playerId: string, newBlock: string) => {
    try {
      const target = effectivePlayers.find(p => p.id === playerId);
      if (!target) throw new Error('Deportista no encontrado');
      await dataActions.changePlayerColorBlock(target, newBlock, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar bloque');
    }
  };

  const handleChangePlayerCoach = async (playerId: string, coachId: string) => {
    try {
      const coach = clubCoaches.find(c => c.id === coachId) || null;
      const target = effectivePlayers.find(p => p.id === playerId);
      if (!target) throw new Error('Deportista no encontrado');
      await dataActions.changePlayerCoach(target, coach, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al asignar profesor');
    }
  };

  const handleToggleSuspend = async (player: Player) => {
    if (player.status !== 'suspendido') {
      setPlayerToSuspend(player); // pide el motivo antes de suspender
      return;
    }
    await runSuspension(player, undefined);
  };

  const runSuspension = async (player: Player, info: { reason: SuspensionReason; note?: string } | undefined) => {
    try {
      await dataActions.togglePlayerSuspension(player, info, currentUser);
      setPlayerToSuspend(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar suspensión');
    }
  };

  const cashBoxes = passedCashBoxes ?? fraoviaDB.getCashBoxes(currentClub.id, currentUser);
  const effectiveCashBoxes = useMemo(() => {
    if (!isMultiSportEnabled || selectedDiscipline === 'all') return cashBoxes;
    const discBox = cashBoxes.filter(b => b.disciplineId === selectedDiscipline);
    return discBox.length > 0 ? discBox : cashBoxes;
  }, [cashBoxes, isMultiSportEnabled, selectedDiscipline]);

  const primaryCashBox = effectiveCashBoxes[0] || cashBoxes[0];
  const currentBoxBalance = primaryCashBox?.currentBalance ?? 0;
  const initialCash = primaryCashBox?.initialCashAmount;

  // Trips / Torneos for current club
  const clubTrips = useMemo(() => {
    if (isSupabaseConfigured()) return tripsProp || [];
    return fraoviaDB.getTripTournaments(currentClub.id, currentUser);
  }, [currentClub.id, currentUser, adminRefreshTick, tripsProp]);
  const mainTrip = clubTrips[0];
  const dedicatedTripCashBox = cashBoxes.find(b => b.id === mainTrip?.cashBoxId);

  // Filter receipts by selected discipline
  const effectiveReceipts = useMemo(() => {
    if (!isMultiSportEnabled || selectedDiscipline === 'all') return receipts;
    const playerDnisInDiscipline = new Set(effectivePlayers.map(p => p.dni));
    const catNamesInDiscipline = new Set(effectiveCategories.map(c => c.name.toLowerCase()));

    return receipts.filter(r => {
      if (r.customerDni && playerDnisInDiscipline.has(r.customerDni)) return true;
      const lowerConcept = (r.concept || '').toLowerCase();
      for (const catName of catNamesInDiscipline) {
        if (lowerConcept.includes(catName)) return true;
      }
      return false;
    });
  }, [receipts, isMultiSportEnabled, selectedDiscipline, effectivePlayers, effectiveCategories]);

  const totalPlayersCount = effectivePlayers.length || (selectedDiscipline === 'all' ? 642 : 0);
  const debtors = effectivePlayers.filter(p => p.balance > 0);
  const totalDebt = debtors.reduce((acc, p) => acc + p.balance, 0) || (selectedDiscipline === 'all' ? 620000 : 0);
  const totalCobrado = effectiveReceipts.reduce((acc, r) => acc + r.amount, 0) || (selectedDiscipline === 'all' ? 2340000 : 0);

  // Cobros de hoy & Cumplimiento sobre la meta mensual
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReceipts = effectiveReceipts.filter(r => r.date?.startsWith(todayStr) && r.status !== 'anulado');
  const totalCobradoHoy = todayReceipts.reduce((acc, r) => acc + r.amount, 0);
  const countCobradoHoy = todayReceipts.length;
  
  const baseMonthlyGoal = currentClub.monthlyGoal || 3000000;
  const monthlyGoal = selectedDiscipline !== 'all' 
    ? Math.round(baseMonthlyGoal * (Math.max(1, effectivePlayers.length) / Math.max(1, players.length)))
    : baseMonthlyGoal;
  const compliancePercent = Math.min(100, Math.round((totalCobrado / Math.max(1, monthlyGoal)) * 100));

  const averageFee = effectiveCategories.length > 0
    ? Math.round(effectiveCategories.reduce((acc, c) => acc + c.monthlyFee, 0) / effectiveCategories.length)
    : 22000;

  // Filtered players based on top search bar
  const searchedPlayers = effectivePlayers.filter(p => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    const cat = effectiveCategories.find(c => c.id === p.categoryId) || categories.find(c => c.id === p.categoryId);
    return (
      p.dni.includes(term) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      (cat?.name.toLowerCase().includes(term)) ||
      (cat?.colorBlockName?.toLowerCase().includes(term))
    );
  });

  // Mock list of recent payments matching screenshot
  const recentPayments = [
    { id: '1', date: '12/04/2026', player: 'García Lucas', category: 'Sub 17 Blanco', amount: 45000, status: 'Cobrado' },
    { id: '2', date: '12/04/2026', player: 'Fernández Tomás', category: '2013 Blanco', amount: 38000, status: 'Cobrado' },
    { id: '3', date: '11/04/2026', player: 'Rodríguez Mateo', category: 'Primera División', amount: 60000, status: 'Pendiente' },
    { id: '4', date: '11/04/2026', player: 'López Santiago', category: 'Sub 17 Azul', amount: 45000, status: 'Cobrado' },
    { id: '5', date: '10/04/2026', player: 'Pérez Joaquín', category: '2013 Azul', amount: 35000, status: 'Cobrado' }
  ];

  // Morosidad por categoría matching screenshot
  const categoryDebts = [
    { name: 'Primera División', percent: 12, color: 'bg-blue-500' },
    { name: 'Sub 17 Blanco', percent: 8, color: 'bg-blue-500' },
    { name: '2013 Blanco / Sub 13', percent: 6, color: 'bg-blue-500' },
    { name: '2013 Azul', percent: 4, color: 'bg-blue-500' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner matching reference image: ADMINISTRACIÓN - Club with Translucent Watermark */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border text-white shadow-lg relative overflow-hidden"
        style={{
          background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #0c204c 100%)',
          borderColor: currentClub.branding?.primaryColor || '#0284C7'
        }}
      >
        {/* Translucent Background Watermark of Club Crest / Photo (No queda vacío) */}
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
                  Secretaría & Finanzas
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                ADMINISTRACIÓN - Gestión Administrativa y Financiera
              </h2>
              <p className="text-xs text-sky-100">
                Padrón de deportistas, control de cuotas sociales, bloques por color y gráfico comparativo interanual.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && currentClub.activeModules?.viajesTorneos !== false && (
              <button
                onClick={() => onNavigate('viajes')}
                className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                title="Administración de seleccionados, giras, torneos y caja exclusiva"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Viajes & Torneos</span>
              </button>
            )}
            <button
              onClick={() => setShowModuleVisibilityModal(true)}
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Ocultar o mostrar cualquier ventana o icono del club (ej. Portal Familias)"
            >
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span>Ventanas & Módulos</span>
            </button>
            <button
              onClick={() => setShowFeeReminderModal(true)}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Avisos automatizados al inicio de mes para saldos próximos a vencer"
            >
              <Clock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>Avisos de Cuotas</span>
            </button>
            <button
              onClick={() => setShowExcelImportModal(true)}
              className="px-3.5 py-2.5 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Importar padrón completo de alumnos desde planilla Excel con meses de pagos"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Importar Excel</span>
            </button>
            <button
              onClick={() => setShowAttendanceControl(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Faltas y porcentaje de asistencia por alumno"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Control de Asistencia</span>
            </button>
            <button
              onClick={() => setShowCoachApprovalsModal(true)}
              className={`px-3.5 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow ${
                pendingCoachRequests.length > 0
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black ring-2 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Solicitudes de alta de deportistas enviadas por los profesores"
            >
              <UserCheck className="w-4 h-4" />
              <span>Solicitudes Profesores ({pendingCoachRequests.length})</span>
            </button>
            <button
              onClick={() => setShowOpenCashBoxModal(true)}
              className="px-3.5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Apertura de turno y asignación de saldo inicial en efectivo"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Apertura de Caja</span>
            </button>
            <button
              onClick={() => onOpenNewReceiptModal()}
              className="px-3.5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <ReceiptIcon className="w-4 h-4 text-sky-600" />
              <span>Cobrar y Emitir Recibo</span>
            </button>
            <button
              onClick={onOpenNewPlayerModal}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300/60"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ CREAR FICHA DE JUGADOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* WIDGET: ACCESOS RÁPIDOS (PARTE SUPERIOR DEL DASHBOARD) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0C162D] via-[#0E1B38] to-[#0A1224] border-2 border-amber-500/35 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  Panel de Operaciones Frecuentes
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                  Tesorería & Facturación Rápida
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                Accesos Rápidos
              </h3>
            </div>
          </div>

          {/* Quick Cash Status Pill */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${primaryCashBox?.status === 'abierta' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-400 text-[11px]">{primaryCashBox?.name || 'Caja Central'}:</span>
              <span className="font-mono font-bold text-white">${currentBoxBalance.toLocaleString('es-AR')}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-[11px] text-slate-400">
              Hoy: <strong className="text-emerald-400 font-mono">${totalCobradoHoy.toLocaleString('es-AR')}</strong> ({countCobradoHoy})
            </div>
          </div>
        </div>

        {/* 3 Prominent Action Cards (Unificados y Claros) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. COBRAR Y EMITIR RECIBO (UNIFICADO) */}
          <div 
            onClick={() => onOpenNewReceiptModal()}
            className="group p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition">
                  <ReceiptIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  COBRO & RECIBO OFICIAL
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition flex items-center gap-1.5">
                  Cobrar y Emitir Recibo
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Registra el cobro de cuota, matrícula o arancel, cancela la deuda del alumno e impacta en caja emitiendo el comprobante oficial a 1 clic.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400 group-hover:underline flex items-center gap-1">
                Cobrar y Generar Comprobante &rarr;
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1 Clic</span>
            </div>
          </div>

          {/* 2. VER CAJA Y ARQUEO */}
          <div 
            onClick={() => {
              if (onNavigate) {
                onNavigate('caja');
              } else {
                setShowOpenCashBoxModal(true);
              }
            }}
            className="group p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/25 transition">
                  <Wallet className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  TESORERÍA EN VIVO
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  Ver Caja & Arqueo
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Arqueo en vivo, apertura/cierre de turnos, libro de ingresos/egresos y saldos consolidados por medio de pago.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-400 group-hover:underline flex items-center gap-1">
                Consultar Arqueo &rarr;
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">${currentBoxBalance.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* 3. COMPROBANTES Y COMPARTIR RECIBOS */}
          <div 
            onClick={() => {
              if (onNavigate) {
                onNavigate('comprobantes');
              }
            }}
            className="group p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-sky-500/10 hover:-translate-y-0.5"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500/25 transition">
                  <Share2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  COMPARTIR POR WHATSAPP
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition flex items-center gap-1.5">
                  Comprobantes & Compartir
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Historial de recibos emitidos para ver el detalle después de ocurrido el cobro, imprimir o compartir por WhatsApp con el socio.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-400 group-hover:underline flex items-center gap-1">
                Ver y Compartir Recibos &rarr;
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">{effectiveReceipts.length} Emitidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-SPORT ISOLATION & SUB-ENTITIES CONTROL (Habilitado/Deshabilitado por Superadmin) */}
      {isMultiSportEnabled && disciplines.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0C162D] via-[#091124] to-[#111A33] border border-sky-500/30 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    Aislamiento Multideporte
                  </span>
                  <span className="text-xs text-slate-400">
                    Carga y gestión de valores independiente por deporte
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {selectedDiscipline === 'all'
                    ? '📊 Modo General: Carga y valores consolidados de todo el club'
                    : `🏆 Entidad Aislada: ${activeDisciplineObj?.name || 'Deporte'} (Valores, Alumnos y Cajas Propias)`}
                </h3>
              </div>
            </div>

            {/* Sport Select Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDiscipline('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedDiscipline === 'all'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-2 ring-sky-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>🌐 General (Todos: {players.length})</span>
              </button>

              {disciplines.map(d => {
                const count = players.filter(p => p.disciplineId === d.id).length;
                const isSelected = selectedDiscipline === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDiscipline(d.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-300'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/40 text-sky-200">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick banner if isolated sport is selected */}
          {selectedDiscipline !== 'all' && activeDisciplineObj && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                <span>Alumnos en {activeDisciplineObj.name}: <strong className="text-white font-mono">{effectivePlayers.length}</strong></span>
                <span>Recaudación de {activeDisciplineObj.name}: <strong className="text-emerald-400 font-mono">${totalCobrado.toLocaleString('es-AR')}</strong></span>
                <span>Cuota promedio: <strong className="text-sky-300 font-mono">${averageFee.toLocaleString('es-AR')}</strong></span>
                <span>Caja asignada: <strong className="text-amber-300 font-mono">{primaryCashBox?.name || 'Caja Central'}</strong></span>
              </div>
              <span className="text-[10px] text-sky-300/80 italic">
                * Los comprobantes, fichas y búsquedas se encuentran filtrados para {activeDisciplineObj.name}.
              </span>
            </div>
          )}
        </div>
      )}

      {/* BANNER DE AVISO: Solicitudes de Alta de Profesores Pendientes */}
      {pendingCoachRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border-2 border-sky-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <UserCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  Bandeja de Aprobaciones
                </span>
                <span className="text-xs font-bold text-white">
                  {pendingCoachRequests.length} {pendingCoachRequests.length === 1 ? 'solicitud de profesor esperando alta oficial' : 'solicitudes de profesores esperando alta oficial'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong>{pendingCoachRequests[0].coachName}</strong> solicita dar de alta a {pendingCoachRequests[0].players.length} alumnos en "{pendingCoachRequests[0].categoryName}".
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCoachApprovalsModal(true)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-500/25 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Revisar y Dar de Alta</span>
          </button>
        </div>
      )}

      {/* SECCIÓN DESTACADA: CREACIÓN & ACCESO RÁPIDO A FICHA DE JUGADOR */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-sky-950/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
              <UserPlus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Alta Inmediata de Socios
                </span>
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                  Ficha Deportiva & Federativa
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Creación de Ficha de Jugador
              </h3>
              <p className="text-xs text-slate-300">
                Inscriba al deportista con DNI, certificado médico, categoría por año, bloque por color y cuota mensual en 1 clic.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setShowExcelImportModal(true)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Planilla Excel</span>
            </button>
            <button
              onClick={onOpenNewPlayerModal}
              className="flex-1 md:flex-initial px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-300/80 hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ CREAR NUEVA FICHA DE JUGADOR</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('jugadores')}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Ver Padrón de Fichas ({totalPlayersCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Search Bar for Administration */}
      <div className="p-3.5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscador Administrativo: Ingrese DNI, Nombre de socio, Categoría (ej: '2013 Blanco') o Bloque de color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
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

        {/* Live Search Results Popover */}
        {searchTerm.trim().length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Resultados de búsqueda rápida:</span>
              <span className="font-mono text-sky-400 font-bold">{searchedPlayers.length} coincidencias</span>
            </div>
            {searchedPlayers.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No se encontraron deportistas ni categorías con ese término.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {searchedPlayers.slice(0, 6).map(p => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <div key={p.id} className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.firstName} {p.lastName}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">DNI: {p.dni}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold">
                          {cat?.name || 'Categoría'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${p.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {p.balance > 0 ? `Debe $${p.balance.toLocaleString()}` : 'Al Día'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtab Navigation for Administration */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setAdminViewTab('resumen')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
            adminViewTab === 'resumen' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Resumen Administrativo</span>
        </button>

        <button
          onClick={() => setAdminViewTab('padron')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
            adminViewTab === 'padron' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Padrón de Jugadores & Fotos ({effectivePlayers.length})</span>
        </button>

        {currentClub.activeModules?.viajesTorneos !== false && (
          <button
            onClick={() => setAdminViewTab('viajes')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
              adminViewTab === 'viajes' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plane className="w-4 h-4 text-amber-400" />
            <span>Viajes & Torneos (Caja Exclusiva)</span>
          </button>
        )}

        <button
          onClick={() => setAdminViewTab('graficos')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
            adminViewTab === 'graficos' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Gráficos & Ventas Diarias</span>
        </button>

        <button
          onClick={() => setAdminViewTab('grafico_lineas')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
            adminViewTab === 'grafico_lineas' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Comparativa Interanual (Líneas)</span>
        </button>

        <button
          onClick={() => setAdminViewTab('bloques_color')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
            adminViewTab === 'bloques_color' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Bloques por Color & Jerarquías</span>
        </button>
      </div>

      {/* TAB 1: RESUMEN ADMINISTRATIVO */}
      {adminViewTab === 'resumen' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Resumen Administrativo · Métricas Rápidas</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  Vista Ejecutiva
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Información de alto nivel para un vistazo rápido: deportistas activos, ingresos mensuales y comprobantes pendientes.
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Actualizado en tiempo real</span>
            </div>
          </div>

          {/* WIDGET RECORDATORIO DE VENCIMIENTOS PRÓXIMOS (7 DÍAS) */}
          <UpcomingDuesWidget
            currentClub={currentClub}
            currentUser={currentUser}
            players={effectivePlayers}
            onOpenReminderModal={() => setShowFeeReminderModal(true)}
          />

          {/* BANNER DESTACADO DE VIAJES & TORNEOS (REQUERIMIENTO: SECCIÓN Y CAJA EXCLUSIVA DE VIAJES) */}
          {currentClub.activeModules?.viajesTorneos !== false && mainTrip && (
            <div className="w-full rounded-2xl overflow-hidden border border-amber-500/40 relative bg-slate-950 shadow-xl group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${mainTrip.bannerImageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80'})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-[#08132B]/85 backdrop-blur-[1px]" />

              <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 text-white">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      Gira / Torneo Oficial
                    </span>
                    {dedicatedTripCashBox && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-indigo-400" />
                        Caja Exclusiva de Viaje: <strong className="text-white">${dedicatedTripCashBox.currentBalance.toLocaleString('es-AR')}</strong>
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      {mainTrip.destination} · {mainTrip.datesDescription}
                    </span>
                  </div>

                  {/* Resaltando Torneo y Categoría */}
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                      {mainTrip.tournamentName}
                    </h4>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 mt-1">
                      <span className="text-xs sm:text-sm font-black text-amber-300 uppercase">
                        🏆 {mainTrip.categoryDescription}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="text-slate-400">A cargo:</span> <strong className="text-white">{mainTrip.coachesInCharge}</strong> · {mainTrip.participants.length} jugadores convocados
                  </p>
                </div>

                {/* Metrics & Action Button */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Recaudación de Delegación</div>
                    <div className="text-lg font-mono font-black text-emerald-300">
                      ${mainTrip.participants.reduce((acc, p) => acc + p.amountPaid, 0).toLocaleString('es-AR')}
                      <span className="text-xs text-slate-400 font-normal"> / ${mainTrip.participants.reduce((acc, p) => acc + p.totalCost, 0).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="w-40 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/20 mt-1">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((mainTrip.participants.reduce((acc, p) => acc + p.amountPaid, 0) / (mainTrip.participants.reduce((acc, p) => acc + p.totalCost, 0) || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdminViewTab('viajes')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Plane className="w-4 h-4 stroke-[2.5]" />
                    <span>Ver Delegación & Pagos</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK METRICS GRID (Total Active Athletes, Monthly Inflows, Pending Receipts, Cash Liquidity, Today's Collections & Monthly Goal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            
            {/* Metric 1: Total Active Athletes */}
            <div className="p-4 sm:p-5 rounded-2xl border border-sky-500/30 bg-[#0C162D] space-y-3 relative overflow-hidden group hover:border-sky-500/60 transition shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Deportistas Activos
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {totalPlayersCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12% vs. mes anterior</span>
                  <span className="text-slate-500 text-[10px]">· 100% cupo cubierto</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Fichas con Apto Médico:</span>
                <span className="font-bold text-sky-300 font-mono">98% vigentes</span>
              </div>
            </div>

            {/* Metric 2: Monthly Cash Inflows */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-[#0C162D] space-y-3 relative overflow-hidden group hover:border-emerald-500/60 transition shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ingresos Mensuales (Cobranzas)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  ${totalCobrado.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>78% de cuotas cobradas</span>
                  <span className="text-slate-500 text-[10px]">· 580 cuotas</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Promedio por socio:</span>
                <span className="font-bold text-emerald-300 font-mono">${Math.round(totalCobrado / (totalPlayersCount || 1)).toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Metric 3: Pending Receipts & Unpaid Dues */}
            <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-[#0C162D] space-y-3 relative overflow-hidden group hover:border-rose-500/60 transition shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Comprobantes & Cuotas Pendientes
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <ReceiptIcon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
                  ${totalDebt.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{debtors.length || 62} socios pendientes</span>
                  <span className="text-slate-500 text-[10px]">· 8.5% mora</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Estado de cartera:</span>
                <span className="font-bold text-amber-300">En gestión de cobranza</span>
              </div>
            </div>

            {/* Metric 4: Available Cash In Box */}
            <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/30 bg-[#0C162D] space-y-3 relative overflow-hidden group hover:border-purple-500/60 transition shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Saldo en Caja Principal
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-purple-400 font-mono tracking-tight">
                  ${currentBoxBalance.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{primaryCashBox?.status === 'abierta' ? 'Caja abierta' : 'Caja cerrada'}</span>
                  {initialCash !== undefined && (
                    <span className="text-slate-400 text-[10px]">· Inicial: ${initialCash.toLocaleString('es-AR')}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowOpenCashBoxModal(true)}
                  className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Apertura de turno</span>
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('caja')}
                    className="text-slate-400 hover:text-white cursor-pointer font-medium"
                  >
                    Ver arqueo →
                  </button>
                )}
              </div>
            </div>

            {/* Metric 5: Cobros Realizados Hoy & Porcentaje de Cumplimiento de Meta Mensual */}
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/35 bg-[#0C162D] space-y-3 relative overflow-hidden group hover:border-amber-500/65 transition shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>Cobros de Hoy</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Hoy
                  </span>
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                  ${totalCobradoHoy.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{countCobradoHoy} cobros hoy</span>
                  <span className="text-slate-500 text-[10px]">· En caja activa</span>
                </div>
              </div>

              {/* Porcentaje de Cumplimiento sobre la Meta Mensual */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Meta mensual:</span>
                  <span className="font-bold text-white font-mono">
                    {compliancePercent}% <span className="text-slate-400 text-[10px]">(${monthlyGoal >= 1000000 ? `${(monthlyGoal / 1000000).toFixed(1)}M` : `${(monthlyGoal / 1000).toFixed(0)}k`})</span>
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${compliancePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span className="text-emerald-400 font-semibold">
                    {compliancePercent >= 75 ? '● Ritmo proyectado OK' : '● En gestión'}
                  </span>
                  <span>${totalCobrado.toLocaleString('es-AR')} cobrados</span>
                </div>
              </div>
            </div>

          </div>

          {/* Direct Line Chart Embed on Main Overview */}
          <AdminComparativeLineChart />

          {/* Filter Strip matching reference screenshot */}
          <div className="p-3.5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Disciplina</label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Todas las disciplinas</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Temporada</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="2026">Temporada 2026</option>
                  <option value="2025">Temporada 2025</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow self-end"
            >
              Aplicar Filtros
            </button>
          </div>

          {/* Two Columns: Últimos pagos (Left) & Morosidad por categoría (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Tabla Últimos Pagos (8 cols) */}
            <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-sky-400" />
                  Últimos pagos registrados
                </h4>
                <span className="text-[10px] text-slate-400">Comprobantes oficiales</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2">Jugador</th>
                      <th className="pb-2">Categoría</th>
                      <th className="pb-2">Monto</th>
                      <th className="pb-2 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-950/40 transition">
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">{p.date}</td>
                        <td className="py-2.5 font-semibold text-white">{p.player}</td>
                        <td className="py-2.5 text-slate-400">{p.category}</td>
                        <td className="py-2.5 font-mono font-bold text-white">${p.amount.toLocaleString('es-AR')}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'Cobrado' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Morosidad por Categoría (4 cols) */}
            <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Morosidad por categoría
                </h4>
                <span className="text-[10px] text-slate-400">Ratio %</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {categoryDebts.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium">{cat.name}</span>
                      <span className="font-mono text-amber-400 font-bold">{cat.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${cat.percent * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                Los socios con mora pueden ser agrupados por bloque de color para notificaciones colectivas.
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo Interanual con Cuadrícula y Comparativa de Años */}
          <div className="pt-2">
            <AdminComparativeLineChart />
          </div>
        </div>
      )}

      {/* TAB: PADRÓN DE JUGADORES, ESTADÍSTICAS Y GESTIÓN COMPLETA */}
      {adminViewTab === 'padron' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0C162D] to-sky-950/40 border border-sky-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  Padrón Oficial & Estadísticas Deportivas
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  {effectivePlayers.length} inscriptos
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Fichas de Jugadores, Bloques y Profesores Asignados
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Consulta estadísticas en tiempo real, traslada chicos entre bloques o profesores, suspende por impago y actualiza perfiles con foto.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenNewReceiptModal()}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
              >
                <CreditCard className="w-4 h-4" />
                <span>💵 Cobrar Cuota</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('categorias_profesores')}
                  className="px-3.5 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <GraduationCap className="w-4 h-4 text-teal-400" />
                  <span>Categorías & Profesores</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenNewPlayerModal}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscribir Jugador</span>
              </button>
            </div>
          </div>

          {/* BANNER GUÍA DE COBRANZAS Y PAGOS (FÁCIL DE ENCONTRAR) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0C1E2C] to-slate-900 border border-emerald-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">¿Cómo realizar un pago o registrar un cobro de cuota?</h3>
              </div>
              <p className="text-xs text-slate-300">
                1️⃣ Elige al alumno y pulsa <strong className="text-emerald-400 font-bold">"💵 Cobrar Cuota"</strong> en su tarjeta (o en el botón verde superior).<br className="hidden sm:inline" />
                2️⃣ Selecciona el medio (Efectivo en Caja, Transferencia bancaria o Tarjeta).<br className="hidden sm:inline" />
                3️⃣ El sistema emitirá el Comprobante Oficial con escudo del club y cancelará la deuda automáticamente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenNewReceiptModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>💵 Cobrar Cuota Ahora</span>
            </button>
          </div>

          {/* Estadísticas de Jugadores & Bloques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Jugadores */}
            <div className="p-3.5 bg-[#0C162D] rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Deportistas
              </span>
              <div className="text-2xl font-black font-mono text-white">
                {effectivePlayers.length}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{effectivePlayers.filter(p => p.balance <= 0 && p.status !== 'suspendido').length} al día</span>
              </div>
            </div>

            {/* Bloques de Color */}
            <div className="p-3.5 bg-[#0C162D] rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Bloques de Color
              </span>
              <div className="text-2xl font-black font-mono text-sky-400">
                {Object.keys(colorBlocksCounts).filter(k => (colorBlocksCounts[k] || 0) > 0).length} Activos
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1.5 flex-wrap">
                <span className="text-sky-300">Azul: {colorBlocksCounts.Azul || 0}</span>
                <span>•</span>
                <span className="text-rose-300">Rojo: {colorBlocksCounts.Rojo || 0}</span>
                <span>•</span>
                <span className="text-amber-300">Oro: {colorBlocksCounts.Oro || 0}</span>
              </div>
            </div>

            {/* Morosos & Finanzas */}
            <div className="p-3.5 bg-[#0C162D] rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Cuotas Pendientes (Mora)
              </span>
              <div className="text-2xl font-black font-mono text-amber-400">
                {effectivePlayers.filter(p => p.balance > 0 && p.status !== 'suspendido').length}
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium">
                Deuda: ${effectivePlayers.reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0).toLocaleString('es-AR')}
              </div>
            </div>

            {/* Suspendidos por Impago */}
            <div className="p-3.5 bg-[#0C162D] rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Suspendidos por Impago
              </span>
              <div className="text-2xl font-black font-mono text-rose-400">
                {effectivePlayers.filter(p => p.status === 'suspendido').length}
              </div>
              <div className="text-[11px] text-rose-400/90 font-medium flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                <span>Restringidos en cancha</span>
              </div>
            </div>
          </div>

          {/* ⚡ ÚLTIMOS JUGADORES AGREGADOS (HIGHLIGHTED SECTION) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  ⚡ Últimos Jugadores Inscriptos
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Incorporaciones recientes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {recentPlayers.map(player => {
                const cat = categories.find(c => c.id === player.categoryId);
                const assignedCoach = clubCoaches.find(c => c.id === player.coachId) || { fullName: player.coachName || 'Lucas Benítez' };

                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        <PlayerImage
                          photoPathOrUrl={player.photoUrl}
                          alt={player.firstName}
                          className="w-full h-full object-cover"
                          fallbackInitials={`${player.firstName?.charAt(0) || ''}${player.lastName?.charAt(0) || ''}`}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <strong className="text-xs font-bold text-white block truncate">
                          {player.firstName} {player.lastName}
                        </strong>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="truncate">{cat?.name || 'Categoría'}</span>
                          <span>•</span>
                          <span className="text-teal-400 truncate">{assignedCoach.fullName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPlayerToEdit(player)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                    >
                      Ficha
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros Avanzados y Buscador */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0C162D] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Buscador */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Nombre, Apellido o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Categoría */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Bloque */}
              <div>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">Todos los bloques</option>
                  <option value="Azul">Bloque Azul</option>
                  <option value="Rojo">Bloque Rojo</option>
                  <option value="Blanco">Bloque Blanco</option>
                  <option value="Oro">Bloque Oro</option>
                </select>
              </div>

              {/* Filtro Profesor */}
              <div>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">Todos los profesores</option>
                  {clubCoaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div>
                <select
                  value={selectedPlayerStatus}
                  onChange={(e) => setSelectedPlayerStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Al Día (Sin deuda)</option>
                  <option value="moroso">Con Deuda (Morosos)</option>
                  <option value="medico_vencido">Apto Médico Vencido</option>
                  <option value="suspendido">Suspendidos por Impago</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Pills for Instant Access */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {effectivePlayers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('moroso')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'moroso'
                  ? 'bg-red-500/25 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-red-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Con Deuda</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 font-bold">
                {effectivePlayers.filter(p => p.balance > 0).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('activo')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'activo'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-emerald-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Al Día</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-bold">
                {effectivePlayers.filter(p => p.balance <= 0 && p.status !== 'suspendido' && !p.pendingFirstPayment).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('sin_pagos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'sin_pagos'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-sky-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Sin pagos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 font-bold">
                {effectivePlayers.filter(p => p.pendingFirstPayment).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('medico_vencido')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'medico_vencido'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-amber-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Apto Vencido</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-bold">
                {effectivePlayers.filter(p => !p.medicalCertificateValid).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlayerStatus('suspendido')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedPlayerStatus === 'suspendido'
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-rose-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Suspendidos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-bold">
                {effectivePlayers.filter(p => p.status === 'suspendido').length}
              </span>
            </button>
          </div>

          {/* Listado y Fichas de Jugadores */}
          {padronFilteredPlayers.length === 0 ? (
            <div className="p-8 text-center bg-[#0C162D] border border-slate-800 rounded-2xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">No se encontraron deportistas con los filtros seleccionados</p>
              <p className="text-xs text-slate-400 mt-1">Prueba restableciendo los filtros o la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {padronFilteredPlayers.map((player) => {
                const cat = categories.find(c => c.id === player.categoryId);
                const disc = disciplines.find(d => d.id === player.disciplineId);
                const isSuspended = player.status === 'suspendido';
                const isMoroso = player.status === 'moroso' || player.balance > 0;
                const assignedCoach = clubCoaches.find(c => c.id === player.coachId) || { fullName: player.coachName || 'Lucas Benítez' };

                return (
                  <div 
                    key={player.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-lg ${
                      isSuspended
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : isMoroso
                        ? 'bg-[#0C162D] border-amber-500/30'
                        : 'bg-[#0C162D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Avatar + Datos + Estado */}
                    <div className="flex items-start gap-3">
                      {/* Avatar with group hover */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-inner flex items-center justify-center shrink-0 relative group">
                        <PlayerImage
                          photoPathOrUrl={player.photoUrl}
                          alt={player.firstName}
                          className="w-full h-full object-cover"
                          fallbackInitials={`${player.firstName?.charAt(0) || ''}${player.lastName?.charAt(0) || ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setPlayerToEdit(player)}
                          title="Cambiar foto del jugador"
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-sky-400" />
                        </button>
                      </div>

                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-sm font-bold text-white truncate block">
                            {player.firstName} {player.lastName}
                          </strong>
                          {isSuspended ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                              SUSPENDIDO
                            </span>
                          ) : isMoroso ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              DEBE ${player.balance.toLocaleString('es-AR')}
                            </span>
                          ) : player.pendingFirstPayment ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                              SIN PAGOS
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                              AL DÍA
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono block">
                          DNI {player.dni} {player.position ? `· ${player.position}` : ''}
                        </span>
                        {isSuspended && player.suspensionReason && (
                          <span
                            className="text-[10px] text-rose-300 block truncate"
                            title={player.suspensionNote || undefined}
                          >
                            Motivo: {SUSPENSION_REASON_LABELS[player.suspensionReason]}
                            {player.suspensionNote ? ` · ${player.suspensionNote}` : ''}
                          </span>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                          <span className={`flex items-center gap-1 font-semibold ${
                            player.medicalCertificateValid ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${player.medicalCertificateValid ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {player.medicalCertificateValid ? 'Apto Vigente' : 'Apto Vencido'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Selectors: Categoría, Bloque, Profesor */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      {/* Categoría Selector */}
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Categoría</span>
                        <select
                          value={player.categoryId}
                          onChange={(e) => handleChangePlayerCat(player.id, e.target.value)}
                          className="w-full bg-transparent text-white font-bold text-[11px] focus:outline-none cursor-pointer truncate"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bloque de Color Selector */}
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Bloque Color</span>
                        <select
                          value={player.colorBlockName || 'Azul'}
                          onChange={(e) => handleChangePlayerBlock(player.id, e.target.value)}
                          className="w-full bg-transparent text-sky-300 font-bold text-[11px] focus:outline-none cursor-pointer truncate"
                        >
                          <option value="Azul" className="bg-slate-900 text-white">Bloque Azul</option>
                          <option value="Rojo" className="bg-slate-900 text-white">Bloque Rojo</option>
                          <option value="Blanco" className="bg-slate-900 text-white">Bloque Blanco</option>
                          <option value="Oro" className="bg-slate-900 text-white">Bloque Oro</option>
                        </select>
                      </div>

                      {/* Profesor Asignado Selector */}
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Profesor</span>
                        <select
                          value={player.coachId || clubCoaches[0]?.id || ''}
                          onChange={(e) => handleChangePlayerCoach(player.id, e.target.value)}
                          className="w-full bg-transparent text-teal-300 font-bold text-[11px] focus:outline-none cursor-pointer truncate"
                        >
                          {clubCoaches.map(coach => (
                            <option key={coach.id} value={coach.id} className="bg-slate-900 text-white">
                              {coach.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bottom Actions Row: Suspender por impago & Editar Ficha */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(player)}
                        title={isSuspended ? "Reincorporar al deportista" : "Suspender de entrenamientos por deuda"}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                          isSuspended
                            ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-rose-600/15 text-rose-300 border-rose-500/30 hover:bg-rose-600/25'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Reactivar Alumno</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Suspender por Impago</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenNewReceiptModal(player)}
                          title="Cobrar cuota y emitir comprobante para este deportista"
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3 text-emerald-400" />
                          <span>Cobrar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlayerToEdit(player)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 border border-sky-500/20 shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5 text-sky-400" />
                          <span>Ficha</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: GRÁFICOS & VENTAS DIARIAS (COMPARATIVAS POR DÍAS, SEMANAS, MESES Y AÑOS) */}
      {adminViewTab === 'graficos' && (
        <div className="space-y-4 animate-in fade-in">
          <AdminSalesAnalyticsCharts
            currentClub={currentClub}
            currentUser={currentUser}
            receipts={receipts}
            onOpenReceiptDetail={onSelectReceipt}
          />
        </div>
      )}

      {/* TAB 2: GRÁFICO COMPARATIVO DE LÍNEAS */}
      {adminViewTab === 'grafico_lineas' && (
        <div className="space-y-4">
          <AdminComparativeLineChart />
        </div>
      )}

      {/* TAB 3: BLOQUES POR COLOR & JERARQUÍAS */}
      {adminViewTab === 'bloques_color' && (
        <ColorBlocksAndDivisionsModule
          currentClub={currentClub}
          currentUser={currentUser}
          disciplines={disciplines}
          categories={categories}
          players={players}
          onRefreshData={() => {}}
        />
      )}

      {/* TAB: VIAJES, GIRAS & TORNEOS (CON CAJA EXCLUSIVA Y DELEGACIONES) */}
      {adminViewTab === 'viajes' && (
        <div className="space-y-4 animate-in fade-in">
          <ViajesTorneosModule
            currentClub={currentClub}
            currentUser={currentUser}
            categories={categories}
            players={players}
            cashBoxes={cashBoxes}
            trips={clubTrips}
            onRefreshData={handleLocalRefresh}
          />
        </div>
      )}

      {/* MODAL APERTURA DE CAJA */}
      {showOpenCashBoxModal && (
        <OpenCashBoxModal
          isOpen={showOpenCashBoxModal}
          onClose={() => setShowOpenCashBoxModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          cashBoxes={cashBoxes}
          selectedBoxId={primaryCashBox?.id}
          onBoxOpened={(updatedBox) => {
            // Updated in DB
          }}
        />
      )}

      {showAttendanceControl && (
        <AttendanceControlModal
          isOpen={showAttendanceControl}
          onClose={() => setShowAttendanceControl(false)}
          players={players}
          categories={categories}
          attendanceRecords={isSupabaseConfigured() ? (attendanceRecordsProp || []) : fraoviaDB.getAttendanceRecords(currentClub.id, currentUser)}
        />
      )}

      {/* MODAL SOLICITUDES DE APROBACIÓN DE PROFESORES */}
      {showCoachApprovalsModal && (
        <CoachApprovalsModal
          isOpen={showCoachApprovalsModal}
          onClose={() => setShowCoachApprovalsModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          requests={coachRequests}
          onApprovalsUpdated={handleLocalRefresh}
        />
      )}

      {/* MODAL IMPORTADOR EXCEL CON MESES DE PAGOS */}
      {showExcelImportModal && (
        <ExcelImportModal
          isOpen={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          categories={categories}
          disciplines={disciplines}
          onImportComplete={() => {
            // refresh data
          }}
        />
      )}

      {/* MODAL AVISOS AUTOMATIZADOS DE VENCIMIENTO DE CUOTAS */}
      {showFeeReminderModal && (
        <FeeReminderAutomationModal
          isOpen={showFeeReminderModal}
          onClose={() => setShowFeeReminderModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          players={players}
          disciplines={disciplines}
          onUpdated={handleLocalRefresh}
        />
      )}
      {/* MODAL MOTIVO DE SUSPENSIÓN */}
      <SuspendPlayerModal
        player={playerToSuspend}
        onCancel={() => setPlayerToSuspend(null)}
        onConfirm={(p, reason, note) => runSuspension(p, { reason, note })}
      />
      {/* MODAL EDITAR PERFIL & FOTO DEL JUGADOR */}
      {playerToEdit && (
        <EditPlayerModal
          isOpen={!!playerToEdit}
          onClose={() => setPlayerToEdit(null)}
          player={playerToEdit}
          currentClub={currentClub}
          currentUser={currentUser}
          disciplines={disciplines}
          categories={categories}
          onPlayerUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
