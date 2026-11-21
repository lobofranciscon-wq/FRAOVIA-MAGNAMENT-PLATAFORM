import React, { useMemo, useState } from 'react';
import { 
  CalendarCheck, 
  Users, 
  BarChart3, 
  DollarSign, 
  CloudRain, 
  CloudLightning, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HeartPulse, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Download, 
  Activity, 
  AlertCircle,
  TrendingUp,
  Percent,
  Check,
  X,
  Phone,
  Droplets,
  Zap,
  Info
} from 'lucide-react';
import { 
  AttendanceRecord, 
  Category, 
  Club, 
  CoachApprovalRequest, 
  Discipline, 
  Player, 
  ProvisionalPlayer, 
  Receipt, 
  User 
} from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface AttendanceDashboardViewProps {
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  players: Player[];
  attendanceRecords: AttendanceRecord[];
  receipts?: Receipt[];
  onAttendanceSaved: () => void;
  provisionalPlayers?: ProvisionalPlayer[];
  coachRequests?: CoachApprovalRequest[];
}

type MainTab = 'tomar' | 'listado' | 'dashboard';
type DashboardSubMode = 'asistencia' | 'pagos';
type AttendanceStatus = 'presente' | 'ausente' | 'justificado' | 'lesionado';

const SUSPENSION_REASONS = [
  { id: 'lluvia', label: 'Lluvia / Tormenta eléctrica', icon: CloudLightning, color: 'text-sky-400' },
  { id: 'clima', label: 'Clima adverso (Frío / Ola de calor / Viento)', icon: CloudRain, color: 'text-blue-300' },
  { id: 'mantenimiento', label: 'Cancha anegada / Mantenimiento de predio', icon: AlertTriangle, color: 'text-amber-400' },
  { id: 'feriado', label: 'Feriado o asueto institucional', icon: Calendar, color: 'text-purple-300' },
  { id: 'fuerza_mayor', label: 'Fuerza mayor / Corte de luz o agua', icon: Zap, color: 'text-rose-400' },
  { id: 'otro', label: 'Otro motivo institucional', icon: Info, color: 'text-slate-300' }
] as const;

export const AttendanceDashboardView: React.FC<AttendanceDashboardViewProps> = ({
  currentClub,
  currentUser,
  disciplines,
  categories,
  players,
  attendanceRecords,
  receipts = [],
  onAttendanceSaved
}) => {
  const { theme } = useAppTheme();

  // Scope: if user is PROFESOR with category scope, only show assigned categories
  const scopedCategories = useMemo(() => {
    if (currentUser.role === 'PROFESOR' && currentUser.scope?.categoryIds?.length) {
      return categories.filter(c => currentUser.scope!.categoryIds!.includes(c.id));
    }
    return categories;
  }, [currentUser, categories]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<MainTab>('tomar');

  // Dashboard sub-option: Asistencia (default) vs Pagos
  const [dashboardSubMode, setDashboardSubMode] = useState<DashboardSubMode>('asistencia');

  // Category filter
  const [selectedCatId, setSelectedCatId] = useState<string>(scopedCategories[0]?.id || categories[0]?.id || '');
  const activeCategory = scopedCategories.find(c => c.id === selectedCatId) || scopedCategories[0] || categories[0];
  const activeDiscipline = disciplines.find(d => d.id === activeCategory?.disciplineId);

  // Players of selected category
  const categoryPlayers = useMemo(() => {
    return players.filter(p => p.categoryId === activeCategory?.id && p.status !== 'inactivo');
  }, [players, activeCategory]);

  // ----------------------------------------------------------------------
  // TOMAR ASISTENCIA FORM STATE
  // ----------------------------------------------------------------------
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionTitle, setSessionTitle] = useState('Entrenamiento Táctico y Físico');
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState<'lluvia' | 'clima' | 'mantenimiento' | 'feriado' | 'fuerza_mayor' | 'otro'>('lluvia');
  const [suspensionNotes, setSuspensionNotes] = useState<string>('');
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ----------------------------------------------------------------------
  // LISTADO ALFABÉTICO STATE
  // ----------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listCategoryFilter, setListCategoryFilter] = useState<string>('all');
  const [listSortOrder, setListSortOrder] = useState<'az' | 'za' | 'pct_asc' | 'pct_desc'>('az');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // ----------------------------------------------------------------------
  // DASHBOARD DE PAGOS STATE
  // ----------------------------------------------------------------------
  const [paymentMonthFilter, setPaymentMonthFilter] = useState<string>('MAR');
  const [paymentDebtorSearch, setPaymentDebtorSearch] = useState<string>('');
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<string>('all');

  // Set all present / absent helpers
  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    categoryPlayers.forEach(p => {
      next[p.id] = status;
    });
    setAttendanceState(next);
  };

  const handleToggleStatus = (playerId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!activeCategory) return;
    setIsSaving(true);

    try {
      if (isSuspended) {
        // Record suspended session
        const newRecord: Omit<AttendanceRecord, 'id'> = {
          clubId: currentClub.id,
          categoryId: activeCategory.id,
          date: sessionDate,
          sessionTitle: sessionTitle || 'Entrenamiento Suspendido',
          recordedByUserId: currentUser.id,
          isSuspended: true,
          suspensionReason,
          suspensionNotes: suspensionNotes.trim() || undefined,
          entries: []
        };
        await dataActions.recordAttendance(newRecord, currentUser);
      } else {
        // Normal attendance record
        const entries = categoryPlayers.map(p => ({
          playerId: p.id,
          status: attendanceState[p.id] || 'presente',
          notes: playerNotes[p.id]?.trim() || undefined
        }));

        const newRecord: Omit<AttendanceRecord, 'id'> = {
          clubId: currentClub.id,
          categoryId: activeCategory.id,
          date: sessionDate,
          sessionTitle: sessionTitle || 'Entrenamiento Regular',
          recordedByUserId: currentUser.id,
          isSuspended: false,
          entries
        };
        await dataActions.recordAttendance(newRecord, currentUser);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onAttendanceSaved();
    } catch (err: any) {
      alert('Error al guardar asistencia: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------------------------
  // COMPUTED STATS: SESSIONS & PLAYERS ATTENDANCE
  // ----------------------------------------------------------------------
  const scopedCategoryIds = useMemo(() => new Set(scopedCategories.map(c => c.id)), [scopedCategories]);

  // Filter attendance records by scoped categories
  const relevantAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter(r => scopedCategoryIds.has(r.categoryId));
  }, [attendanceRecords, scopedCategoryIds]);

  // Suspended sessions
  const suspendedSessions = useMemo(() => {
    return relevantAttendanceRecords.filter(r => r.isSuspended);
  }, [relevantAttendanceRecords]);

  // Completed (non-suspended) sessions
  const activeSessions = useMemo(() => {
    return relevantAttendanceRecords.filter(r => !r.isSuspended);
  }, [relevantAttendanceRecords]);

  // Rain-suspended sessions
  const rainSuspendedSessions = useMemo(() => {
    return suspendedSessions.filter(s => s.suspensionReason === 'lluvia');
  }, [suspendedSessions]);

  // Compute stats per player
  interface PlayerAttendanceStats {
    player: Player;
    categoryName: string;
    disciplineName: string;
    totalPossible: number;
    presente: number;
    ausente: number;
    justificado: number;
    lesionado: number;
    totalAttended: number; // presente
    percentage: number | null;
    missedDates: { date: string; sessionTitle: string; status: AttendanceStatus; notes?: string }[];
  }

  const allPlayersStats: PlayerAttendanceStats[] = useMemo(() => {
    const list: PlayerAttendanceStats[] = [];

    // Filter relevant players belonging to scoped categories
    const scopedPlayers = players.filter(p => scopedCategoryIds.has(p.categoryId) && p.status !== 'inactivo');

    for (const p of scopedPlayers) {
      const cat = categories.find(c => c.id === p.categoryId);
      const disc = disciplines.find(d => d.id === cat?.disciplineId);

      // Sessions for this player's category
      const playerCategorySessions = activeSessions.filter(s => s.categoryId === p.categoryId);

      let presente = 0;
      let ausente = 0;
      let justificado = 0;
      let lesionado = 0;
      const missedDates: { date: string; sessionTitle: string; status: AttendanceStatus; notes?: string }[] = [];

      for (const session of playerCategorySessions) {
        const entry = session.entries.find(e => e.playerId === p.id);
        if (!entry) continue;

        if (entry.status === 'presente') {
          presente++;
        } else if (entry.status === 'ausente') {
          ausente++;
          missedDates.push({
            date: session.date,
            sessionTitle: session.sessionTitle,
            status: 'ausente',
            notes: entry.notes
          });
        } else if (entry.status === 'justificado') {
          justificado++;
          missedDates.push({
            date: session.date,
            sessionTitle: session.sessionTitle,
            status: 'justificado',
            notes: entry.notes
          });
        } else if (entry.status === 'lesionado') {
          lesionado++;
          missedDates.push({
            date: session.date,
            sessionTitle: session.sessionTitle,
            status: 'lesionado',
            notes: entry.notes
          });
        }
      }

      const totalRecorded = presente + ausente + justificado + lesionado;
      const pct = totalRecorded > 0 ? Math.round((presente / totalRecorded) * 100) : null;

      list.push({
        player: p,
        categoryName: cat?.name || 'Categoría',
        disciplineName: disc?.name || 'Deporte',
        totalPossible: totalRecorded,
        presente,
        ausente,
        justificado,
        lesionado,
        totalAttended: presente,
        percentage: pct,
        missedDates: missedDates.sort((a, b) => b.date.localeCompare(a.date))
      });
    }

    return list;
  }, [players, scopedCategoryIds, categories, disciplines, activeSessions]);

  // Alphabetical sorted list with filters
  const alphabeticalPlayersList = useMemo(() => {
    let list = [...allPlayersStats];

    // Filter by category
    if (listCategoryFilter !== 'all') {
      list = list.filter(item => item.player.categoryId === listCategoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        `${item.player.lastName} ${item.player.firstName}`.toLowerCase().includes(q) ||
        item.player.dni.includes(q)
      );
    }

    // Sort order
    list.sort((a, b) => {
      if (listSortOrder === 'az') {
        const nameA = `${a.player.lastName} ${a.player.firstName}`.toLowerCase();
        const nameB = `${b.player.lastName} ${b.player.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (listSortOrder === 'za') {
        const nameA = `${a.player.lastName} ${a.player.firstName}`.toLowerCase();
        const nameB = `${b.player.lastName} ${b.player.firstName}`.toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (listSortOrder === 'pct_desc') {
        return (b.percentage ?? -1) - (a.percentage ?? -1);
      }
      if (listSortOrder === 'pct_asc') {
        return (a.percentage ?? 999) - (b.percentage ?? 999);
      }
      return 0;
    });

    return list;
  }, [allPlayersStats, listCategoryFilter, searchQuery, listSortOrder]);

  // Global attendance stats for Dashboard
  const globalAttendanceStats = useMemo(() => {
    let totalPresente = 0;
    let totalAusente = 0;
    let totalJustificado = 0;
    let totalLesionado = 0;

    for (const s of allPlayersStats) {
      totalPresente += s.presente;
      totalAusente += s.ausente;
      totalJustificado += s.justificado;
      totalLesionado += s.lesionado;
    }

    const totalEntries = totalPresente + totalAusente + totalJustificado + totalLesionado;
    const globalPct = totalEntries > 0 ? Math.round((totalPresente / totalEntries) * 100) : 0;

    // Top performers (perfect attendance)
    const topPerformers = allPlayersStats
      .filter(s => s.percentage !== null && s.percentage >= 85)
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, 5);

    // At-risk players (< 60%)
    const atRiskPlayers = allPlayersStats
      .filter(s => s.percentage !== null && s.percentage < 60 && s.totalPossible >= 2)
      .sort((a, b) => (a.percentage || 0) - (b.percentage || 0))
      .slice(0, 5);

    return {
      totalPresente,
      totalAusente,
      totalJustificado,
      totalLesionado,
      totalEntries,
      globalPct,
      topPerformers,
      atRiskPlayers
    };
  }, [allPlayersStats]);

  // ----------------------------------------------------------------------
  // COMPUTED STATS: DASHBOARD DE PAGOS
  // ----------------------------------------------------------------------
  const paymentDashboardStats = useMemo(() => {
    const relevantPlayers = players.filter(p => {
      if (paymentCategoryFilter !== 'all' && p.categoryId !== paymentCategoryFilter) return false;
      return scopedCategoryIds.has(p.categoryId) && p.status !== 'inactivo';
    });

    const totalPlayersCount = relevantPlayers.length;

    // Paying players (al día)
    const payingPlayers = relevantPlayers.filter(p => p.balance <= 0);

    // Debtor players (adeudan)
    const debtorPlayers = relevantPlayers.filter(p => p.balance > 0);

    // Month fee collection on time ("en tiempo y forma"):
    // Check receipts for cuotas:
    // Receipts created on or before day 10 of the month are considered "en tiempo y forma"
    const feeReceipts = receipts.filter(r => {
      if (r.status === 'anulado') return false;
      const concept = (r.concept || '').toLowerCase();
      return concept.includes('cuota') || concept.includes('mensualidad') || concept.includes('arancel');
    });

    let onTimeReceiptsCount = 0;
    let lateReceiptsCount = 0;

    for (const r of feeReceipts) {
      const recDate = new Date(r.date);
      const dayOfMonth = recDate.getDate();
      const dueDay = currentClub.feeReminderAutomation?.dueDayOfMonth || 10;
      if (dayOfMonth <= dueDay) {
        onTimeReceiptsCount++;
      } else {
        lateReceiptsCount++;
      }
    }

    const totalFeeReceipts = onTimeReceiptsCount + lateReceiptsCount;
    const onTimePercentage = totalFeeReceipts > 0 ? Math.round((onTimeReceiptsCount / totalFeeReceipts) * 100) : 85;

    // Build debtors details with exact months owed
    const debtorList = debtorPlayers.map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const fee = p.monthlyFeeDue || cat?.monthlyFee || 22000;
      const monthsOwedCount = Math.max(1, Math.ceil(p.balance / fee));

      // Calculate which specific months are owed
      const owedMonthsList: string[] = [];
      if (p.monthlyPayments) {
        Object.entries(p.monthlyPayments).forEach(([mName, status]) => {
          if (status === 'A') {
            owedMonthsList.push(mName);
          }
        });
      }

      // If no explicit monthlyPayments entry is marked 'A', compute based on monthsCount
      if (owedMonthsList.length === 0) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const currentMonthIdx = new Date().getMonth();
        for (let i = 0; i < monthsOwedCount; i++) {
          const mIdx = (currentMonthIdx - i + 12) % 12;
          owedMonthsList.unshift(monthNames[mIdx]);
        }
      }

      return {
        player: p,
        categoryName: cat?.name || 'Categoría',
        balanceOwed: p.balance,
        monthlyFee: fee,
        monthsOwedCount,
        owedMonthsText: owedMonthsList.join(', ') || 'Marzo 2026',
        phone: p.phone,
        tutorName: p.emergencyContact?.name
      };
    });

    // Filter debtors by search
    const filteredDebtors = debtorList.filter(d => {
      if (!paymentDebtorSearch.trim()) return true;
      const term = paymentDebtorSearch.toLowerCase().trim();
      return `${d.player.lastName} ${d.player.firstName}`.toLowerCase().includes(term) ||
             d.player.dni.includes(term) ||
             d.categoryName.toLowerCase().includes(term);
    });

    const totalDebtAmount = debtorPlayers.reduce((acc, p) => acc + p.balance, 0);

    return {
      totalPlayersCount,
      payingCount: payingPlayers.length,
      debtorCount: debtorPlayers.length,
      debtorPercentage: totalPlayersCount > 0 ? Math.round((debtorPlayers.length / totalPlayersCount) * 100) : 0,
      payingPercentage: totalPlayersCount > 0 ? Math.round((payingPlayers.length / totalPlayersCount) * 100) : 0,
      totalDebtAmount,
      onTimeReceiptsCount,
      lateReceiptsCount,
      onTimePercentage,
      filteredDebtors
    };
  }, [players, paymentCategoryFilter, scopedCategoryIds, receipts, currentClub, categories, paymentDebtorSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* TOP INSTITUTIONAL HEADER */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 50%, #022C22 100%)',
          borderColor: '#059669'
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-400/30 shadow-inner">
              <CalendarCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Módulo Deportivo · Cancha & Tesorería
                </span>
                <span className="text-[10px] font-bold text-slate-300 font-mono">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Control de Asistencia & Rendimiento
              </h2>
            </div>
          </div>

          {/* Quick Stats in Banner */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-right">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Tasa de Asistencia</span>
              <span className="text-lg font-black text-white font-mono">{globalAttendanceStats.globalPct}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[10px] text-sky-200 block font-semibold uppercase">Sesiones Registradas</span>
              <span className="text-lg font-black text-white font-mono">{relevantAttendanceRecords.length}</span>
            </div>
            {rainSuspendedSessions.length > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/40">
                <span className="text-[10px] text-blue-200 block font-semibold uppercase flex items-center gap-1 justify-end">
                  <CloudLightning className="w-3 h-3 text-amber-300" />
                  Suspendidas por Lluvia
                </span>
                <span className="text-lg font-black text-amber-300 font-mono">{rainSuspendedSessions.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories Pills Filter */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-300 text-[11px] font-bold shrink-0">Categoría Activa:</span>
          {scopedCategories.map(cat => {
            const isSelected = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-80 font-mono">({cat.ageGroup})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NAVIGATION TABS: TOMAR ASISTENCIA | LISTADO ALFABÉTICO | DASHBOARD */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('tomar')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'tomar'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Tomar Asistencia de Hoy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listado')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'listado'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Listado Alfabético (A-Z) & Faltas</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {allPlayersStats.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'border-sky-500 text-sky-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <span>Apartado de Dashboard</span>
        </button>
      </div>

      {/* ======================================================================
          TAB 1: TOMAR ASISTENCIA DE HOY (CON OPCIÓN DE SUSPENSIÓN POR LLUVIA)
         ====================================================================== */}
      {activeTab === 'tomar' && (
        <div className="space-y-6">

          {/* Form Configuration Card */}
          <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Planilla de Cancha · {activeCategory?.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeDiscipline?.name || 'Fútbol'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete los presentes, o si no se entrena marque la opción de suspender el turno con o sin motivo.
                </p>
              </div>

              {/* Suspension Toggle Switch */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">
                  ¿Sesión Suspendida?
                </span>
                <button
                  type="button"
                  onClick={() => setIsSuspended(!isSuspended)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    isSuspended ? 'bg-rose-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
                <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded ${
                  isSuspended ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isSuspended ? 'SUSPENDIDO' : 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Inputs: Date and Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Fecha del Entrenamiento</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Título / Contenido de la Sesión</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Ej: Físico, Táctico y Fútbol en Espacios Reducidos"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* IF SUSPENDED: SUSPENSION CONFIG & WEATHER RAIN WIDGET */}
            {isSuspended && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Opciones de Suspensión (Puede elegir un motivo y agregar o no una justificación)</span>
                </div>

                {/* Reason Select Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {SUSPENSION_REASONS.map(r => {
                    const Icon = r.icon;
                    const isSelected = suspensionReason === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSuspensionReason(r.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-400 text-white font-bold ring-1 ring-rose-400 shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${r.color}`} />
                        <span className="text-[11px] leading-tight truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Reason Text */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Detalle o Por Qué de la Suspensión (Opcional)
                  </label>
                  <textarea
                    value={suspensionNotes}
                    onChange={(e) => setSuspensionNotes(e.target.value)}
                    rows={2}
                    placeholder="Escriba aquí si desea agregar un por qué para las familias y administración (opcional)..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {/* 🌧️ WEATHER CLOUD + LIGHTNING + RAINDROPS WIDGET ("como el clima honda") */}
                {suspensionReason === 'lluvia' && (
                  <div className="p-5 rounded-2xl border text-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#060D1F] via-[#0C1A35] to-[#0A162B] border-sky-500/50">
                    {/* Background glow circle */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      {/* Left: Weather animated symbol & alert info */}
                      <div className="flex items-center gap-4">
                        
                        {/* Animated Weather Station Icon (Cloud + Lightning + Rain) */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-sky-400/40 flex items-center justify-center relative shadow-lg shrink-0 overflow-hidden group">
                          {/* Pulsing lightning flash effect in background */}
                          <div className="absolute inset-0 bg-yellow-400/5 animate-pulse" />

                          {/* Cloud SVG Body */}
                          <svg className="w-10 h-10 text-slate-200 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                          </svg>

                          {/* Lightning bolt inside / under cloud */}
                          <svg className="w-5 h-5 text-amber-300 absolute z-20 top-7 left-5 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)] animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>

                          {/* Raindrop particles */}
                          <div className="absolute bottom-1 left-3 w-1 h-2 bg-sky-400 rounded-full animate-ping opacity-75" />
                          <div className="absolute bottom-1 right-3 w-1 h-2 bg-blue-400 rounded-full animate-ping opacity-75 delay-150" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono flex items-center gap-1">
                              <CloudLightning className="w-3 h-3 text-amber-300" />
                              Alerta Meteorológica Activa
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Radar de Cancha
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                            <span>Suspensión Oficial por Lluvia & Tormenta</span>
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5 max-w-lg leading-relaxed">
                            Precipitaciones continuas en el predio deportivo. Se suspende la actividad para resguardar la seguridad de los alumnos y preservar el campo de juego.
                          </p>
                        </div>
                      </div>

                      {/* Right: Weather badge metrics */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0">
                        <span className="text-xs text-sky-300 font-mono font-bold flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          Precipitación Intensa
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Canchas Anuladas
                        </span>
                        {suspensionNotes && (
                          <div className="mt-1 px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-semibold border border-white/15 max-w-xs truncate">
                            Nota: &quot;{suspensionNotes}&quot;
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NORMAL ATTENDANCE: PLAYER CHECKLIST */}
            {!isSuspended && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-slate-400">
                    Alumnos en plantilla: <strong className="text-white">{categoryPlayers.length} deportistas</strong>
                  </div>
                  
                  {/* Quick bulk actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAll('presente')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition border border-emerald-500/40 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Todos Presentes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAll('ausente')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition border border-rose-500/40 cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Todos Ausentes</span>
                    </button>
                  </div>
                </div>

                {categoryPlayers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-xs">No hay jugadores activos asignados a esta categoría.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {categoryPlayers.map((p, idx) => {
                      const currentStatus = attendanceState[p.id] || 'presente';
                      return (
                        <div 
                          key={p.id}
                          className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono font-bold text-slate-500 w-5">
                              {idx + 1}.
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {p.lastName}, {p.firstName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  DNI: {p.dni}
                                </span>
                                {p.balance > 0 && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                    Deuda
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="Nota individual (ej: llegó tarde, molestia física)..."
                                value={playerNotes[p.id] || ''}
                                onChange={(e) => setPlayerNotes({ ...playerNotes, [p.id]: e.target.value })}
                                className="mt-1 w-full max-w-sm px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          {/* 4 Status Toggle Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            {(['presente', 'ausente', 'justificado', 'lesionado'] as const).map(st => {
                              const isSelected = currentStatus === st;
                              const label = st === 'presente' ? 'Presente' : st === 'ausente' ? 'Ausente' : st === 'justificado' ? 'Justificado' : 'Lesionado';
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleToggleStatus(p.id, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${
                                    isSelected
                                      ? st === 'presente' ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                                      : st === 'ausente' ? 'bg-rose-600 text-white border-rose-500 shadow'
                                      : st === 'justificado' ? 'bg-amber-600 text-white border-amber-500 shadow'
                                      : 'bg-sky-600 text-white border-sky-500 shadow'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {isSuspended ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Se registrará la fecha como suspendida en el historial del club.
                  </span>
                ) : (
                  <span>Fecha seleccionada: <strong className="text-white font-mono">{sessionDate}</strong></span>
                )}
              </span>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Asistencia registrada con éxito!
                  </span>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAttendance}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg ${
                    isSuspended 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : isSuspended ? 'Registrar Suspensión' : 'Guardar Asistencia de Hoy'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================================
          TAB 2: LISTADO ALFABÉTICO (A-Z) & DÍAS DE FALTA
         ====================================================================== */}
      {activeTab === 'listado' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por apellido, nombre o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={listCategoryFilter}
                onChange={(e) => setListCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-bold"
              >
                <option value="all">Todas las categorías ({scopedCategories.length})</option>
                {scopedCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 whitespace-nowrap">Ordenar:</span>
              <select
                value={listSortOrder}
                onChange={(e) => setListSortOrder(e.target.value as any)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-bold"
              >
                <option value="az">Alfabético: A a Z</option>
                <option value="za">Alfabético: Z a A</option>
                <option value="pct_desc">Mayor % Asistencia</option>
                <option value="pct_asc">Menor % Asistencia (Alerta)</option>
              </select>
            </div>
          </div>

          {/* Player Cards Alphabetical List */}
          <div className="space-y-3">
            {alphabeticalPlayersList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-[#0C162D] rounded-2xl border border-slate-800">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-xs">No se encontraron deportistas con los filtros seleccionados.</p>
              </div>
            ) : (
              alphabeticalPlayersList.map((item, idx) => {
                const isExpanded = expandedPlayerId === item.player.id;
                const pct = item.percentage;
                const pctColor = pct === null ? 'text-slate-500' : pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400';
                const barColor = pct === null ? 'bg-slate-700' : pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <div
                    key={item.player.id}
                    className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Left: Player Info & Category */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs font-mono shrink-0">
                          {item.player.photoUrl ? (
                            <img src={item.player.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span>{item.player.lastName.charAt(0)}{item.player.firstName.charAt(0)}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-white">
                              {item.player.lastName}, {item.player.firstName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                              {item.categoryName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              DNI: {item.player.dni}
                            </span>
                          </div>
                          
                          {/* Attendance summary counter */}
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                            <span>
                              Asistencias: <strong className="text-emerald-300 font-mono">{item.presente}</strong> / {item.totalPossible} entrenamientos
                            </span>
                            <span>·</span>
                            <span>
                              Faltas totales: <strong className="text-rose-300 font-mono">{item.ausente + item.justificado + item.lesionado}</strong>
                            </span>
                            {item.player.phone && (
                              <>
                                <span>·</span>
                                <span className="text-[11px] text-slate-500 font-mono">Tel: {item.player.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Percentage & Progress Bar */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Porcentaje</span>
                          <span className={`text-xl font-black font-mono ${pctColor}`}>
                            {pct !== null ? `${pct}%` : 'S/D'}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct || 0}%` }}
                          />
                        </div>

                        {/* Toggle Missed Days Details */}
                        <button
                          type="button"
                          onClick={() => setExpandedPlayerId(isExpanded ? null : item.player.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Ver días de falta y asistencias"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>

                    {/* DÍAS DE FALTA (EXACT DATES MISSED) */}
                    <div className="pt-2 border-t border-slate-800/80">
                      {item.missedDates.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>100% Asistencia Perfecta · Sin faltas registradas</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Días de Falta ({item.missedDates.length}):
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {item.missedDates.map((miss, mIdx) => {
                              const badgeStyle = 
                                miss.status === 'ausente' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                                miss.status === 'justificado' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                                'bg-sky-500/15 text-sky-300 border-sky-500/30';
                              
                              const statusLabel = miss.status === 'ausente' ? 'Ausente' : miss.status === 'justificado' ? 'Justificado' : 'Lesionado';

                              return (
                                <div 
                                  key={mIdx}
                                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 font-mono ${badgeStyle}`}
                                >
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span className="font-bold">{miss.date}</span>
                                  <span className="text-[10px] opacity-80 uppercase">({statusLabel})</span>
                                  {miss.notes && (
                                    <span className="text-[10px] italic font-sans truncate max-w-xs">
                                      · &quot;{miss.notes}&quot;
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* EXPANDED FULL TIMELINE DETAILS */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="font-bold text-white text-[11px]">Desglose de Asistencias</span>
                          <span className="text-[10px] text-slate-400 font-mono">Total clases: {item.totalPossible}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-400 block font-semibold">Presente</span>
                            <span className="text-base font-black text-emerald-300 font-mono">{item.presente}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            <span className="text-[10px] text-rose-400 block font-semibold">Ausente</span>
                            <span className="text-base font-black text-rose-300 font-mono">{item.ausente}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <span className="text-[10px] text-amber-400 block font-semibold">Justificado</span>
                            <span className="text-base font-black text-amber-300 font-mono">{item.justificado}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30">
                            <span className="text-[10px] text-sky-400 block font-semibold">Lesionado</span>
                            <span className="text-base font-black text-sky-300 font-mono">{item.lesionado}</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ======================================================================
          TAB 3: APARTADO DE DASHBOARD (CON OPCIÓN POR DEFECTO ASISTENCIA / OPCIÓN PAGOS)
         ====================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* Sub-Mode Selector: Asistencia (default) vs Pagos */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0C162D] border border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">Tablero Analítico Institucional</h3>
                <p className="text-[11px] text-slate-400">Seleccione la métrica a visualizar:</p>
              </div>
            </div>

            {/* Toggle switch between Asistencia and Pagos */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDashboardSubMode('asistencia')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  dashboardSubMode === 'asistencia'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Dashboard de Asistencia</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200">
                  Defecto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardSubMode('pagos')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  dashboardSubMode === 'pagos'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Dashboard de Pagos</span>
              </button>
            </div>
          </div>

          {/* SUB-MODE 1: DASHBOARD DE ASISTENCIA */}
          {dashboardSubMode === 'asistencia' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Top KPIs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    % Asistencia Global
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {globalAttendanceStats.globalPct}%
                  </div>
                  <span className="text-[11px] text-slate-500">Promedio general del club</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Entrenamientos Dictados
                  </span>
                  <div className="text-2xl font-black text-white font-mono">
                    {activeSessions.length} sesiones
                  </div>
                  <span className="text-[11px] text-slate-500">En cancha efectivas</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Asistencias
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {globalAttendanceStats.totalPresente} presentes
                  </div>
                  <span className="text-[11px] text-slate-500">{globalAttendanceStats.totalAusente} faltas registradas</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-between">
                    <span>Sesiones Suspendidas</span>
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {suspendedSessions.length} fechas
                  </div>
                  <span className="text-[11px] text-blue-300 font-mono font-semibold">
                    {rainSuspendedSessions.length} por alerta de lluvia
                  </span>
                </div>
              </div>

              {/* RAIN SUSPENSIONS WEATHER RADAR CARDS */}
              {rainSuspendedSessions.length > 0 && (
                <div className="p-5 rounded-2xl border bg-gradient-to-br from-[#060D1F] via-[#0C1A35] to-[#0A162B] border-sky-500/40 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <CloudLightning className="w-5 h-5 text-amber-300 animate-pulse" />
                      <span className="text-sm font-black">Historial de Entrenamientos Suspendidos por Lluvia & Clima</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {rainSuspendedSessions.length} alertas meteorológicas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rainSuspendedSessions.map((rainSession) => {
                      const cat = categories.find(c => c.id === rainSession.categoryId);
                      return (
                        <div 
                          key={rainSession.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-500/30 flex items-start gap-3"
                        >
                          {/* Weather symbol */}
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-sky-400/30 flex items-center justify-center relative shrink-0 shadow">
                            <CloudRain className="w-6 h-6 text-sky-400" />
                            <Zap className="w-3.5 h-3.5 text-amber-300 absolute -bottom-1 -right-1" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">
                                {rainSession.sessionTitle}
                              </span>
                              <span className="text-[10px] text-sky-300 font-mono shrink-0">
                                {rainSession.date}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Categoría: {cat?.name || 'General'}
                            </span>
                            <p className="text-[11px] text-slate-300 mt-1 italic leading-tight">
                              {rainSession.suspensionNotes || 'Suspendido por alerta meteorológica de tormenta y preservación del césped.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Breakdown & Top Honors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Cuadro de Honor: 100% Asistencia */}
                <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Cuadro de Honor (Asistencia Perfecta / Destacada)
                    </h4>
                  </div>

                  {globalAttendanceStats.topPerformers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">
                      No hay registros suficientes para calcular el cuadro de honor.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {globalAttendanceStats.topPerformers.map((s, idx) => (
                        <div key={s.player.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{s.player.lastName}, {s.player.firstName}</span>
                              <span className="text-[10px] text-slate-400">{s.categoryName}</span>
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-400 font-mono">{s.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alerta de Inasistencias */}
                <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Alerta de Inasistencias (Alumnos en Riesgo &lt; 60%)
                    </h4>
                  </div>

                  {globalAttendanceStats.atRiskPlayers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Excelente! No hay alumnos en riesgo de abandono o faltas críticas.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {globalAttendanceStats.atRiskPlayers.map((s) => (
                        <div key={s.player.id} className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{s.player.lastName}, {s.player.firstName}</span>
                            <span className="text-[10px] text-rose-300 font-mono">
                              {s.ausente} faltas de {s.totalPossible} clases · {s.categoryName}
                            </span>
                          </div>
                          <span className="text-sm font-black text-rose-400 font-mono">{s.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* SUB-MODE 2: DASHBOARD DE PAGOS (JUGADORES QUE PAGAN, LOS QUE ADEUDAN QUÉ MES, % EN TIEMPO Y FORMA) */}
          {dashboardSubMode === 'pagos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Payment Top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* 1. Jugadores al Día (Pagan) */}
                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Jugadores que Pagan (Al Día)
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {paymentDashboardStats.payingCount} jugadores
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {paymentDashboardStats.payingPercentage}% del padrón al día
                  </span>
                </div>

                {/* 2. Jugadores que Adeudan */}
                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Jugadores que Adeudan
                  </span>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {paymentDashboardStats.debtorCount} morosos
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Saldo total: ${paymentDashboardStats.totalDebtAmount.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* 3. % Abonado en Tiempo y Forma */}
                <div className="p-4 rounded-2xl bg-[#0C162D] border border-emerald-500/40 space-y-1 relative overflow-hidden bg-gradient-to-br from-[#0C162D] to-emerald-950/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    % en Tiempo y Forma
                  </span>
                  <div className="text-2xl font-black text-emerald-300 font-mono">
                    {paymentDashboardStats.onTimePercentage}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Abonado antes del día {currentClub.feeReminderAutomation?.dueDayOfMonth || 10} del mes
                  </span>
                </div>

                {/* 4. Fuera de término */}
                <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Abonados con Recargo / Fuera de Término
                  </span>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {paymentDashboardStats.lateReceiptsCount} pagos
                  </div>
                  <span className="text-[11px] text-slate-500">Cobrados post-vencimiento</span>
                </div>

              </div>

              {/* Progress Visual Gauge */}
              <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Cumplimiento de Cobranza del Mes:</span>
                  <span className="text-emerald-400 font-mono">
                    {paymentDashboardStats.onTimePercentage}% en tiempo y forma
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${paymentDashboardStats.onTimePercentage}%` }}
                    title="En tiempo y forma"
                  />
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${100 - paymentDashboardStats.onTimePercentage}%` }}
                    title="Mora o fuera de término"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                  <span className="text-emerald-400">● {paymentDashboardStats.payingCount} al día</span>
                  <span className="text-rose-400">● {paymentDashboardStats.debtorCount} adeudan cuota</span>
                </div>
              </div>

              {/* DETALLE DE JUGADORES QUE ADEUDAN Y QUÉ MES ADEUDAN */}
              <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Padrón de Deudores: Detalle de Meses Adeudados ({paymentDashboardStats.filteredDebtors.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lista nominal de socios que no han abonado, indicando con precisión qué cuotas deben y saldo acumulado.
                    </p>
                  </div>

                  {/* Search debtor */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar deudor..."
                      value={paymentDebtorSearch}
                      onChange={(e) => setPaymentDebtorSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {paymentDashboardStats.filteredDebtors.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-emerald-300">¡No hay deudores en esta selección! Todos los alumnos están al día.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {paymentDashboardStats.filteredDebtors.map((d) => {
                      const whatsappText = encodeURIComponent(
                        `Hola ${d.player.firstName}, te recordamos desde el Club ${currentClub.name} que registras un saldo pendiente de $${d.balanceOwed.toLocaleString('es-AR')} correspondiente a las cuotas de: ${d.owedMonthsText}. Por favor regularizalo en administración. ¡Muchas gracias!`
                      );
                      const whatsappUrl = d.phone ? `https://wa.me/${d.phone.replace(/[^0-9]/g, '')}?text=${whatsappText}` : null;

                      return (
                        <div
                          key={d.player.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-300 font-mono text-xs shrink-0">
                              {d.player.lastName.charAt(0)}{d.player.firstName.charAt(0)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-white">
                                  {d.player.lastName}, {d.player.firstName}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                                  {d.categoryName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  DNI: {d.player.dni}
                                </span>
                              </div>

                              {/* QUÉ MES ADEUDA (EXACT BREAKDOWN) */}
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 font-mono">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  Adeuda: {d.owedMonthsText}
                                </span>
                                {d.monthsOwedCount > 1 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                                    {d.monthsOwedCount} meses vencidos
                                  </span>
                                )}
                                {d.tutorName && (
                                  <span className="text-[11px] text-slate-400">
                                    · Tutor: {d.tutorName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Debt Balance & WhatsApp Action */}
                          <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deuda Total</span>
                              <span className="text-base font-black text-rose-400 font-mono">
                                ${d.balanceOwed.toLocaleString('es-AR')}
                              </span>
                            </div>

                            {whatsappUrl ? (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                                title="Enviar recordatorio por WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Recordar Cuota</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Sin teléfono</span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
