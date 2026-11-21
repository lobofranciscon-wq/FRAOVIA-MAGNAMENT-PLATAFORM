import React, { useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Save, 
  Plus, 
  Calendar,
  MessageSquare,
  TrendingUp,
  ShieldAlert,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
  MapPin,
  Search,
  CheckCircle2,
  DollarSign,
  UserPlus,
  Send,
  Eye,
  Camera,
  Layers,
  HeartPulse,
  Filter,
  FileSpreadsheet,
  ClipboardCheck
} from 'lucide-react';
import { AttendanceRecord, Category, Club, CoachApprovalRequest, Discipline, Player, ProvisionalPlayer, User } from '../../types/fraovia';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { PlayerProfileModal } from './PlayerProfileModal';
import { ProvisionalListModal } from './ProvisionalListModal';
import { ExcelImportModal } from '../admin/ExcelImportModal';
import { AttendanceDashboardView } from '../attendance/AttendanceDashboardView';

interface ProfesorDashboardProps {
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  players: Player[];
  attendanceRecords: AttendanceRecord[];
  onAttendanceSaved: () => void;
  provisionalPlayers?: ProvisionalPlayer[];
  coachRequests?: CoachApprovalRequest[];
}

export const ProfesorDashboard: React.FC<ProfesorDashboardProps> = ({
  currentClub,
  currentUser,
  disciplines,
  categories,
  players,
  attendanceRecords,
  onAttendanceSaved,
  provisionalPlayers: provisionalPlayersProp,
  coachRequests: coachRequestsProp
}) => {
  // 1. Scoped Categories: Only categories assigned to the coach by Administration
  const coachCategories = categories.filter(c => {
    if (currentUser.role === 'PROFESOR' && currentUser.scope?.categoryIds?.length) {
      return currentUser.scope.categoryIds.includes(c.id);
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<'planteles' | 'provisorio' | 'asistencia'>('planteles');
  const [selectedCatId, setSelectedCatId] = useState<string>(coachCategories[0]?.id || categories[0]?.id || '');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected player for profile modal
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);

  // Provisional list modal state
  const [showProvisionalModal, setShowProvisionalModal] = useState<boolean>(false);
  const [showCoachExcelImport, setShowCoachExcelImport] = useState<boolean>(false);

  // Attendance state

  const activeCategory = coachCategories.find(c => c.id === selectedCatId) || coachCategories[0];
  const activeDiscipline = disciplines.find(d => d.id === activeCategory?.disciplineId);
  const categoryPlayers = players.filter(p => p.categoryId === activeCategory?.id);

  // Filtered by payment status & search
  const filteredCategoryPlayers = categoryPlayers.filter(p => {
    if (paymentFilter === 'paid' && p.balance > 0) return false;
    if (paymentFilter === 'pending' && p.balance <= 0) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match = `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) || p.dni.includes(term);
      if (!match) return false;
    }
    return true;
  });

  // Calculate payment stats across all assigned categories
  const totalAssignedPlayers = players.filter(p => coachCategories.some(c => c.id === p.categoryId));
  const paidCount = totalAssignedPlayers.filter(p => p.balance <= 0).length;
  const pendingCount = totalAssignedPlayers.filter(p => p.balance > 0).length;

  // Provisional list for coach
  const provisionalPlayers = isSupabaseConfigured()
    ? (provisionalPlayersProp || [])
    : fraoviaDB.getProvisionalPlayers(currentClub.id, currentUser);
  const draftProvisionalCount = provisionalPlayers.filter(p => p.status === 'borrador').length;
  const coachRequests = isSupabaseConfigured()
    ? (coachRequestsProp || [])
    : fraoviaDB.getCoachApprovalRequests(currentClub.id, currentUser);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner: PROFESOR */}
      <div 
        className="p-4 sm:p-5 rounded-3xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
          borderColor: '#10B981'
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Sector Técnico & Deportivo
                </span>
                <span className="text-xs text-emerald-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Panel del Profesor: {currentUser.fullName}
              </h2>
              <p className="text-xs text-emerald-100">
                Categorías asignadas por Administración, control de mensualidades y listado provisorio de aspirantes.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setShowCoachExcelImport(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow border border-white/20"
              title="Importar alumnos desde planilla Excel con historial de meses pagos"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Importar Excel</span>
            </button>
            <button
              onClick={() => setShowProvisionalModal(true)}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/25 ring-2 ring-amber-300/60"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Listado Provisorio ({draftProvisionalCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('asistencia')}
              className="px-3.5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Tomar Asistencia</span>
            </button>
          </div>
        </div>

        {/* Coach Overview Bar */}
        <div className="mt-4 pt-3.5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Categorías Asignadas</span>
            <span className="text-base font-black text-white font-mono">{coachCategories.length} categorías</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Total Alumnos en Planteles</span>
            <span className="text-base font-black text-white font-mono">{totalAssignedPlayers.length} deportistas</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Cuotas al Día (Pagadas)</span>
            <span className="text-base font-black text-emerald-300 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {paidCount} al día
            </span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Cuotas Pendientes (Mora)</span>
            <span className="text-base font-black text-amber-300 font-mono flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {pendingCount} con deuda
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Planteles & Cuotas / Listado Provisorio / Asistencia */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('planteles')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'planteles'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mis Categorías & Estado de Cuotas</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
            {coachCategories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('provisorio')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'provisorio'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Listado Provisorio & Solicitudes</span>
          {draftProvisionalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
              {draftProvisionalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('asistencia')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'asistencia'
              ? 'border-sky-500 text-sky-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Entrenamientos & Asistencias</span>
        </button>
      </div>

      {/* TAB 1: MIS CATEGORÍAS & ESTADO DE CUOTAS */}
      {activeTab === 'planteles' && (
        <div className="space-y-6">
          
          {/* Section: Category Cards (Assigned by Administration) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Categorías a mi cargo</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Vinculadas al usuario por Administración)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Toca una categoría para ver el listado de deportistas y su estado de mensualidad.
                </p>
              </div>
            </div>

            {/* Grid of coach categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {coachCategories.map((cat) => {
                const catPlayers = players.filter(p => p.categoryId === cat.id);
                const catPaid = catPlayers.filter(p => p.balance <= 0).length;
                const catPending = catPlayers.filter(p => p.balance > 0).length;
                const isSelected = activeCategory?.id === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 ring-2 ring-emerald-500/40'
                        : 'bg-[#0C162D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}>
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm leading-tight">{cat.name}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {cat.gender} · {cat.divisionTier || 'Formativa'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-emerald-400 translate-x-1' : 'text-slate-600'}`} />
                    </div>

                    {/* Dues Status Summary for this category */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{catPaid} al día</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{catPending} pendientes</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {catPlayers.length} total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Selected Category Player Roster with Payment Badges & Profile triggers */}
          {activeCategory && (
            <div className="p-5 rounded-3xl border border-[#1B2B4C] bg-[#0C162D] space-y-4 shadow-xl">
              
              {/* Header with filters and search */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Plantel: {activeCategory.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      {categoryPlayers.length} jugadores
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toca a cualquier jugador para abrir su ficha completa, editar su foto de perfil y ver datos familiares.
                  </p>
                </div>

                {/* Filter buttons: Todos / Al Día / Cuota Pendiente */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setPaymentFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        paymentFilter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos ({categoryPlayers.length})
                    </button>
                    <button
                      onClick={() => setPaymentFilter('paid')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        paymentFilter === 'paid' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Al Día ({categoryPlayers.filter(p => p.balance <= 0).length})</span>
                    </button>
                    <button
                      onClick={() => setPaymentFilter('pending')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        paymentFilter === 'pending' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-rose-300'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>Con Deuda ({categoryPlayers.filter(p => p.balance > 0).length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Roster Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar jugador por nombre, apellido o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Players Grid / Cards */}
              {filteredCategoryPlayers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold">No se encontraron deportistas con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCategoryPlayers.map((player) => {
                    const isPaid = player.balance <= 0;

                    return (
                      <div
                        key={player.id}
                        onClick={() => setSelectedPlayerForProfile(player)}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition cursor-pointer flex items-center justify-between gap-3 group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {/* Player Photo / Avatar */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group-hover:border-emerald-400 transition">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-black text-sm">
                                {player.firstName[0]}{player.lastName[0]}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs group-hover:text-emerald-400 transition">
                                {player.firstName} {player.lastName}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">DNI: {player.dni}</span>
                              {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                  🎓 Becado ({player.scholarshipPercent}%)
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {player.emergencyContact && (
                                <span className="text-slate-400 truncate max-w-[140px]">
                                  Tutor: {player.emergencyContact.name}
                                </span>
                              )}
                              <span>·</span>
                              <span className={`text-[10px] font-bold ${
                                player.medicalCertificateValid ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {player.medicalCertificateValid ? 'Apto Vigente' : 'Apto Vencido'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Status Badge (Central Requirement) */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}>
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                                <span>Al Día</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                                <span>Debe ${player.balance.toLocaleString('es-AR')}</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <Eye className="w-3 h-3" />
                            <span>Ver ficha</span>
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
      )}

      {/* TAB 2: LISTADO PROVISORIO & SOLICITUDES A ADMINISTRACIÓN */}
      {activeTab === 'provisorio' && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Flujo de Altas de Alumnos
              </span>
              <h3 className="text-base font-black text-white">
                Listado Provisorio de Pre-Inscripción de Aspirantes
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                El profesor puede cargar aspirantes a prueba en sus categorías asignadas. Una vez completado el listado, presiona <strong>"Solicitar Aprobación a Administración"</strong> para que el personal de Secretaría revise los datos uno por uno o dé el alta formal definitiva a todos.
              </p>
            </div>

            <button
              onClick={() => setShowProvisionalModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Gestionar Aspirantes & Enviar Solicitud</span>
            </button>
          </div>

          {/* Provisional Aspirants in Draft */}
          <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Aspirantes cargados por el profesor ({provisionalPlayers.length})
              </h4>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {draftProvisionalCount} en borrador listos para enviar
              </span>
            </div>

            {provisionalPlayers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <UserPlus className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="font-semibold">No tienes aspirantes en el listado provisorio actualmente.</p>
                <button
                  onClick={() => setShowProvisionalModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  + Cargar Primer Aspirante
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {provisionalPlayers.map((p) => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-slate-500 m-2.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{p.firstName} {p.lastName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">DNI: {p.dni}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                              {cat?.name || 'Categoría'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Tel: {p.phone} {p.emergencyContact && `· Tutor: ${p.emergencyContact.name}`}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'borrador' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        p.status === 'pendiente_aprobacion' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                        p.status === 'aprobado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.status === 'borrador' ? 'En borrador' :
                         p.status === 'pendiente_aprobacion' ? 'Enviado a Secretaría' :
                         p.status === 'aprobado' ? 'Aprobado y Activo' : 'Rechazado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Previously Submitted Requests */}
          <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Historial de Solicitudes Enviadas a Administración ({coachRequests.length})
            </h4>

            {coachRequests.length === 0 ? (
              <p className="text-xs text-slate-500">Aún no has enviado solicitudes de alta formal.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {coachRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{req.categoryName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.requestDate).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {req.players.length} aspirantes postulados {req.coachNotes && `· "${req.coachNotes}"`}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      req.status === 'pendiente' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      req.status === 'aprobado_total' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      req.status === 'aprobado_parcial' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {req.status === 'pendiente' ? 'Esperando Aprobación de Secretaría' :
                       req.status === 'aprobado_total' ? 'Aprobado 100% en Padrón' :
                       req.status === 'aprobado_parcial' ? 'Aprobado Parcial' : 'Rechazado'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASISTENCIA EN CANCHA (vista única de asistencia) */}
      {activeTab === 'asistencia' && (
        <AttendanceDashboardView
          currentClub={currentClub}
          currentUser={currentUser}
          disciplines={disciplines}
          categories={coachCategories}
          players={players}
          attendanceRecords={attendanceRecords}
          receipts={[]}
          onAttendanceSaved={onAttendanceSaved}
          provisionalPlayers={provisionalPlayers}
          coachRequests={coachRequests}
        />
      )}


      {/* MODAL FICHA & PERFIL DEL DEPORTISTA */}
      {selectedPlayerForProfile && (
        <PlayerProfileModal
          isOpen={!!selectedPlayerForProfile}
          onClose={() => setSelectedPlayerForProfile(null)}
          player={selectedPlayerForProfile}
          category={activeCategory}
          discipline={activeDiscipline}
          currentClub={currentClub}
          currentUser={currentUser}
          onPlayerUpdated={(updated) => {
            setSelectedPlayerForProfile(updated);
            onAttendanceSaved();
          }}
        />
      )}

      {/* MODAL LISTADO PROVISORIO & ALTA FORMAL */}
      {showProvisionalModal && (
        <ProvisionalListModal
          isOpen={showProvisionalModal}
          onClose={() => setShowProvisionalModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          categories={coachCategories}
          disciplines={disciplines}
          provisionalPlayers={provisionalPlayers}
          onListUpdated={() => {
            onAttendanceSaved();
          }}
        />
      )}


      {/* MODAL IMPORTADOR EXCEL PARA EL PROFESOR */}
      {showCoachExcelImport && (
        <ExcelImportModal
          isOpen={showCoachExcelImport}
          onClose={() => setShowCoachExcelImport(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          categories={coachCategories}
          disciplines={disciplines}
          onImportComplete={() => {
            onAttendanceSaved();
          }}
        />
      )}

    </div>
  );
};
