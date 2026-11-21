import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  FolderTree, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Phone, 
  Mail, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Camera, 
  Search, 
  Layers, 
  PauseCircle, 
  PlayCircle, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Check, 
  AlertCircle,
  Building2,
  X
} from 'lucide-react';
import { Category, Club, Discipline, Player, User, SuspensionReason, SUSPENSION_REASON_LABELS } from '../../types/fraovia';
import { SuspendPlayerModal } from './SuspendPlayerModal';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { EditPlayerModal } from './EditPlayerModal';
import { PlayerImage } from '../common/PlayerImage';
import { useAppTheme } from '../../context/ThemeContext';

interface CategoriesAndCoachesModuleProps {
  currentClub: Club;
  currentUser: User;
  allUsers: User[];
  categories: Category[];
  disciplines: Discipline[];
  players: Player[];
  onRefreshData: () => void;
  onOpenNewPlayerModal?: () => void;
}

export const CategoriesAndCoachesModule: React.FC<CategoriesAndCoachesModuleProps> = ({
  currentClub,
  currentUser,
  allUsers,
  categories,
  disciplines,
  players,
  onRefreshData,
  onOpenNewPlayerModal
}) => {
  const { theme } = useAppTheme();
  const [activeSubTab, setActiveSubTab] = useState<'profesores' | 'categorias'>('profesores');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  
  // Selected category to view roster
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  
  // Modals state
  const [coachForCategoryAssignment, setCoachForCategoryAssignment] = useState<User | null>(null);
  const [showNewCoachModal, setShowNewCoachModal] = useState<boolean>(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToSuspend, setPlayerToSuspend] = useState<Player | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Coach Form State
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachPhone, setNewCoachPhone] = useState('+54 11 ');
  const [newCoachSelectedCatIds, setNewCoachSelectedCatIds] = useState<string[]>([]);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDisciplineId, setNewCatDisciplineId] = useState(disciplines[0]?.id || '');
  const [newCatAgeGroup, setNewCatAgeGroup] = useState('14 - 15 años');
  const [newCatGender, setNewCatGender] = useState<'Masculino' | 'Femenino' | 'Mixto'>('Masculino');
  const [newCatFee, setNewCatFee] = useState<number>(22000);
  const [newCatSchedule, setNewCatSchedule] = useState('Mar y Jue 18:00');
  const [newCatBlockName, setNewCatBlockName] = useState('Bloque Azul');

  // Filter club coaches
  const clubCoaches = useMemo(() => {
    return allUsers.filter(u => u.clubId === currentClub.id && u.role === 'PROFESOR');
  }, [allUsers, currentClub.id]);

  // Color blocks available
  const colorBlocks = ['Bloque Blanco', 'Bloque Azul', 'Bloque Oro', 'Bloque Rojo', 'Bloque Verde'];

  // Helper to find coach assigned to a category
  const getCoachForCategory = (catId: string) => {
    return clubCoaches.find(c => c.scope?.categoryIds?.includes(catId));
  };

  // Players of currently selected category in tab 2
  const currentCategoryPlayers = useMemo(() => {
    if (!selectedCategoryId) return [];
    return players.filter(p => p.categoryId === selectedCategoryId);
  }, [players, selectedCategoryId]);

  // Toast helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- COACH ACTIONS ---
  const handleToggleCoachStatus = (coach: User) => {
    try {
      const updated = fraoviaDB.toggleUserStatus(coach.id, currentUser);
      showToast(
        updated.status === 'activo'
          ? `Profesor ${updated.fullName} habilitado para el club.`
          : `Profesor ${updated.fullName} deshabilitado.`
      );
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveCoachCategoryAssignments = (coachId: string, assignedCatIds: string[]) => {
    try {
      fraoviaDB.assignCategoriesToCoach(coachId, assignedCatIds, currentUser);
      showToast(`Categorías y grupos actualizados con éxito.`);
      setCoachForCategoryAssignment(null);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      fraoviaDB.createCoach({
        fullName: newCoachName.trim(),
        email: newCoachEmail.trim(),
        phone: newCoachPhone.trim(),
        categoryIds: newCoachSelectedCatIds,
        clubId: currentClub.id
      }, currentUser);
      showToast(`Profesor ${newCoachName} incorporado al club con éxito.`);
      setShowNewCoachModal(false);
      setNewCoachName('');
      setNewCoachEmail('');
      setNewCoachSelectedCatIds([]);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await dataActions.createCategory(currentClub.id, {
        disciplineId: newCatDisciplineId,
        name: newCatName.trim(),
        ageGroup: newCatAgeGroup.trim(),
        gender: newCatGender,
        monthlyFee: Number(newCatFee),
        trainingSchedule: newCatSchedule.trim(),
        colorBlockName: newCatBlockName
      }, currentUser);
      showToast(`Categoría "${created.name}" creada con éxito.`);
      setShowNewCategoryModal(false);
      setNewCatName('');
      setSelectedCategoryId(created.id);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAssignCoachToCategory = (catId: string, targetCoachId: string) => {
    try {
      // Find previous coach and remove category from them
      clubCoaches.forEach(c => {
        if (c.scope?.categoryIds?.includes(catId) && c.id !== targetCoachId) {
          const filtered = c.scope.categoryIds.filter(id => id !== catId);
          fraoviaDB.assignCategoriesToCoach(c.id, filtered, currentUser);
        }
      });

      // Add category to target coach if not empty
      if (targetCoachId) {
        const target = clubCoaches.find(c => c.id === targetCoachId);
        if (target) {
          const current = target.scope?.categoryIds || [];
          if (!current.includes(catId)) {
            fraoviaDB.assignCategoriesToCoach(target.id, [...current, catId], currentUser);
          }
        }
      }
      showToast(`Profesor a cargo actualizado.`);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // --- PLAYER ACTIONS ---
  const handleTransferPlayerCategory = async (player: Player, newCatId: string) => {
    try {
      await dataActions.changePlayerCategory(player, newCatId, currentUser);
      const catName = categories.find(c => c.id === newCatId)?.name || 'nueva categoría';
      showToast(`${player.firstName} ${player.lastName} transferido a "${catName}".`);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleChangePlayerBlock = async (player: Player, newBlock: string) => {
    try {
      await dataActions.changePlayerColorBlock(player, newBlock, currentUser);
      showToast(`Bloque de ${player.firstName} cambiado a "${newBlock}".`);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePlayerSuspension = async (player: Player) => {
    if (player.status !== 'suspendido') {
      setPlayerToSuspend(player); // pide el motivo antes de suspender
      return;
    }
    await runSuspension(player, undefined);
  };

  const runSuspension = async (player: Player, info: { reason: SuspensionReason; note?: string } | undefined) => {
    try {
      const updated = await dataActions.togglePlayerSuspension(player, info, currentUser);
      setPlayerToSuspend(null);
      showToast(
        updated.status === 'suspendido'
          ? `Deportista ${updated.firstName} ${updated.lastName} SUSPENDIDO (${info ? SUSPENSION_REASON_LABELS[info.reason] : ''}).`
          : `Deportista ${updated.firstName} ${updated.lastName} REHABILITADO con éxito.`
      );
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-sky-600/90 text-white font-bold text-xs flex items-center justify-between shadow-2xl backdrop-blur-md border border-sky-400/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #0B172C 100%)',
          borderColor: '#14B8A6'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Gobernanza Deportiva & Cuerpos Técnicos
                </span>
                <span className="text-xs text-teal-200">{currentClub.name}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Gestión de Categorías & Profesores
              </h2>
              <p className="text-xs text-teal-100 max-w-xl">
                Habilita o deshabilita profesores, asigna los grupos y categorías a su cargo, y administra los planteles con cambio de grupo y suspensión por impago.
              </p>
            </div>
          </div>

          {/* Quick Creation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewCoachModal(true)}
              className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 text-teal-300 hover:text-white border border-teal-400/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>+ Nuevo Profesor</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewCategoryModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-700/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Categoría</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SUBTABS SWITCHER */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0C162D] rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('profesores')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'profesores'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>1. Profesores & Cuerpos Técnicos ({clubCoaches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categorias')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'categorias'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>2. Categorías & Planteles ({categories.length})</span>
        </button>
      </div>

      {/* ========================================================
          OPTION 1: SECCIÓN DE PROFESORES
         ======================================================== */}
      {activeSubTab === 'profesores' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Profesores</span>
              <div className="text-2xl font-black text-white font-mono">{clubCoaches.length}</div>
              <span className="text-[10px] text-teal-400">Docentes en plantel</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Habilitados en Cancha</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {clubCoaches.filter(c => c.status === 'activo').length}
              </div>
              <span className="text-[10px] text-slate-400">Acceso a planillas y asistencia</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Deshabilitados</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {clubCoaches.filter(c => c.status !== 'activo').length}
              </div>
              <span className="text-[10px] text-amber-300">Acceso revocado temporalmente</span>
            </div>
          </div>

          {/* Coach Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubCoaches.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-[#0C162D] rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="font-semibold">No hay profesores dados de alta en este club.</p>
                <button
                  type="button"
                  onClick={() => setShowNewCoachModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold transition hover:bg-teal-500"
                >
                  Registrar Primer Profesor
                </button>
              </div>
            ) : (
              clubCoaches.map(coach => {
                const isEnabled = coach.status === 'activo';
                const assignedCategoryIds = coach.scope?.categoryIds || [];
                const assignedCats = categories.filter(c => assignedCategoryIds.includes(c.id));
                const totalStudents = players.filter(p => assignedCategoryIds.includes(p.categoryId)).length;

                return (
                  <div
                    key={coach.id}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 shadow-md ${
                      isEnabled
                        ? 'bg-[#0C162D] border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/70 border-amber-500/40 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top: Photo, Name, Status Badge & Toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-teal-400 overflow-hidden shrink-0">
                            {coach.avatarUrl && coach.avatarUrl.trim() ? (
                              <img src={coach.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              coach.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{coach.fullName}</h4>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isEnabled 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}>
                                {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {coach.email}
                              </span>
                              {coach.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  {coach.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleCoachStatus(coach)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                            isEnabled
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                          title={isEnabled ? 'Deshabilitar acceso a este profesor' : 'Habilitar profesor en el club'}
                        >
                          {isEnabled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{isEnabled ? 'Deshabilitar' : 'Habilitar'}</span>
                        </button>
                      </div>

                      {/* Grupos y Categorías que Maneja */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <FolderTree className="w-3.5 h-3.5 text-teal-400" />
                            Grupos y Categorías Asignadas ({assignedCats.length}):
                          </span>
                          <span className="text-white font-mono text-[11px]">
                            {totalStudents} deportistas a cargo
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                          {assignedCats.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic">
                              Sin grupos asignados. Toca en "Designar Grupos" para vincular categorías.
                            </span>
                          ) : (
                            assignedCats.map(cat => (
                              <span
                                key={cat.id}
                                className="px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-bold"
                              >
                                {cat.name} ({cat.ageGroup})
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: Designar / Quitar Grupos */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {isEnabled ? '● Acceso activo a planteles' : '● Acceso suspendido'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setCoachForCategoryAssignment(coach)}
                        className="px-3.5 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <FolderTree className="w-3.5 h-3.5 text-teal-400" />
                        <span>Designar o Quitar Grupos</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          OPTION 2: SECCIÓN DE CATEGORÍAS & PLANTELES
         ======================================================== */}
      {activeSubTab === 'categorias' && (
        <div className="space-y-5">
          {/* Categories Selector Tabs */}
          <div className="p-3.5 rounded-2xl bg-[#0C162D] border border-slate-800 flex items-center gap-2 overflow-x-auto">
            {categories.map(cat => {
              const count = players.filter(p => p.categoryId === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;
              const coach = getCoachForCategory(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Category Detail Panel */}
          {selectedCategoryId && (() => {
            const currentCat = categories.find(c => c.id === selectedCategoryId);
            if (!currentCat) return null;

            const assignedCoach = getCoachForCategory(currentCat.id);
            const disc = disciplines.find(d => d.id === currentCat.disciplineId);

            return (
              <div className="p-5 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-5 shadow-xl">
                {/* Category Header with Assigned Coach Dropdown */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{currentCat.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                        {currentCat.ageGroup}
                      </span>
                      {disc && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold font-mono">
                          {disc.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-4">
                      {currentCat.trainingSchedule && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {currentCat.trainingSchedule}
                        </span>
                      )}
                      <span>Cuota mensual: <strong>${currentCat.monthlyFee.toLocaleString('es-AR')}</strong></span>
                      <span>Bloque: <strong>{currentCat.colorBlockName || 'General'}</strong></span>
                    </div>
                  </div>

                  {/* Assign Coach Selector */}
                  <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <GraduationCap className="w-4 h-4 text-teal-400" />
                    <span className="text-xs text-slate-400 font-medium">Profesor a Cargo:</span>
                    <select
                      value={assignedCoach?.id || ''}
                      onChange={(e) => handleAssignCoachToCategory(currentCat.id, e.target.value)}
                      className="bg-slate-900 border border-teal-500/30 text-teal-300 font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="">Sin Profesor Asignado</option>
                      {clubCoaches.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.status === 'activo' ? 'Habilitado' : 'Deshabilitado'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Listado de Jugadores de la Categoría */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      Listado de Jugadores en este Plantel ({currentCategoryPlayers.length})
                    </h4>

                    {onOpenNewPlayerModal && (
                      <button
                        type="button"
                        onClick={onOpenNewPlayerModal}
                        className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Inscribir Alumno a esta Categoría</span>
                      </button>
                    )}
                  </div>

                  {currentCategoryPlayers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
                      No hay jugadores inscriptos en esta categoría todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentCategoryPlayers.map(player => {
                        const isSuspended = player.status === 'suspendido';
                        const isDebtor = player.balance > 0;

                        return (
                          <div
                            key={player.id}
                            className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                              isSuspended 
                                ? 'bg-amber-950/20 border-amber-500/40' 
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative group shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-400">
                                  <PlayerImage
                                    photoPathOrUrl={player.photoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    fallbackInitials={`${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPlayerToEdit(player)}
                                  className="absolute inset-0 bg-slate-950/70 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                                  title="Subir foto"
                                >
                                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                                </button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <strong className="text-xs font-bold text-white truncate block">
                                    {player.firstName} {player.lastName}
                                  </strong>
                                  {player.jerseyNumber !== undefined && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                                      #{player.jerseyNumber}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono">
                                  DNI {player.dni} {player.position ? `· ${player.position}` : ''}
                                </div>

                                <div className="flex items-center gap-1.5 mt-1">
                                  {isSuspended ? (
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      ⏸️ SUSPENDIDO
                                    </span>
                                  ) : isDebtor ? (
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      Deuda: ${player.balance.toLocaleString('es-AR')}
                                    </span>
                                  ) : player.pendingFirstPayment ? (
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                      Sin pagos
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      Al Día
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dropdowns: Reassign Category & Bloque de Color */}
                            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Transferir Categoría:</label>
                                <select
                                  value={player.categoryId}
                                  onChange={(e) => handleTransferPlayerCategory(player, e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[10px] font-bold focus:outline-none"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Bloque de Color:</label>
                                <select
                                  value={player.colorBlockName || colorBlocks[0]}
                                  onChange={(e) => handleChangePlayerBlock(player, e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sky-300 text-[10px] font-bold focus:outline-none"
                                >
                                  {colorBlocks.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Bottom Actions: Suspender por Impago & Editar Ficha */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleTogglePlayerSuspension(player)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 border ${
                                  isSuspended
                                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-600/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {isSuspended ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                <span>{isSuspended ? 'Rehabilitar' : 'Suspender Impago'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPlayerToEdit(player)}
                                className="px-2.5 py-1 bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-xl text-[10px] font-bold hover:bg-sky-600/30 transition"
                              >
                                Editar Ficha & Foto
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================
          MODAL: DESIGNAR O QUITAR GRUPOS A UN PROFESOR
         ======================================================== */}
      {coachForCategoryAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Designar Grupos a {coachForCategoryAssignment.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Marca o desmarca las categorías asignadas a este profesor.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCoachForCategoryAssignment(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkbox List of Categories */}
            <div className="max-h-64 overflow-y-auto space-y-2 py-1">
              {categories.map(cat => {
                const isAssigned = (coachForCategoryAssignment.scope?.categoryIds || []).includes(cat.id);

                return (
                  <label 
                    key={cat.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isAssigned 
                        ? 'bg-teal-950/40 border-teal-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-500">{cat.ageGroup} · {cat.trainingSchedule || 'Sin horario'}</div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={isAssigned}
                      onChange={(e) => {
                        const current = coachForCategoryAssignment.scope?.categoryIds || [];
                        const updated = e.target.checked
                          ? [...current, cat.id]
                          : current.filter(id => id !== cat.id);
                        setCoachForCategoryAssignment({
                          ...coachForCategoryAssignment,
                          scope: {
                            ...coachForCategoryAssignment.scope,
                            categoryIds: updated
                          }
                        });
                      }}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCoachForCategoryAssignment(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveCoachCategoryAssignments(
                  coachForCategoryAssignment.id,
                  coachForCategoryAssignment.scope?.categoryIds || []
                )}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition cursor-pointer shadow"
              >
                Guardar Designación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ALTA DE NUEVO PROFESOR
         ======================================================== */}
      {showNewCoachModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateCoach}
            className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Alta de Nuevo Profesor</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewCoachModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo y Título</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Prof. Federico Gómez"
                  value={newCoachName}
                  onChange={(e) => setNewCoachName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Correo Electrónico (Acceso al sistema)</label>
                <input 
                  type="email"
                  required
                  placeholder="profesor@club.com"
                  value={newCoachEmail}
                  onChange={(e) => setNewCoachEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Teléfono Móvil / WhatsApp</label>
                <input 
                  type="text"
                  placeholder="+54 11 5555-1234"
                  value={newCoachPhone}
                  onChange={(e) => setNewCoachPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Designar Categorías Iniciales:</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                      <span>{c.name}</span>
                      <input 
                        type="checkbox"
                        checked={newCoachSelectedCatIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCoachSelectedCatIds(prev => [...prev, c.id]);
                          } else {
                            setNewCoachSelectedCatIds(prev => prev.filter(id => id !== c.id));
                          }
                        }}
                        className="rounded text-teal-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowNewCoachModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition cursor-pointer shadow"
              >
                Crear Profesor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL: ALTA DE NUEVA CATEGORÍA
         ======================================================== */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateCategory}
            className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Nueva Categoría Deportiva</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewCategoryModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Sub 13 Formativas"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Disciplina</label>
                  <select
                    value={newCatDisciplineId}
                    onChange={(e) => setNewCatDisciplineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Rango de Edad</label>
                  <input 
                    type="text"
                    placeholder="12 - 13 años"
                    value={newCatAgeGroup}
                    onChange={(e) => setNewCatAgeGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Arancel Mensual ($)</label>
                  <input 
                    type="number"
                    required
                    value={newCatFee}
                    onChange={(e) => setNewCatFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Bloque de Color</label>
                  <select
                    value={newCatBlockName}
                    onChange={(e) => setNewCatBlockName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sky-300 font-bold focus:outline-none"
                  >
                    {colorBlocks.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Días y Horarios de Entrenamiento</label>
                <input 
                  type="text"
                  placeholder="Ej: Lun, Mié y Vie 18:30"
                  value={newCatSchedule}
                  onChange={(e) => setNewCatSchedule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition cursor-pointer shadow"
              >
                Crear Categoría
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      <SuspendPlayerModal
        player={playerToSuspend}
        onCancel={() => setPlayerToSuspend(null)}
        onConfirm={(p, reason, note) => runSuspension(p, { reason, note })}
      />
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
            onRefreshData();
            setPlayerToEdit(null);
          }}
        />
      )}

    </div>
  );
};
