import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Camera, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles,
  ArrowRightLeft,
  X,
  Check,
  Ban,
  CreditCard
} from 'lucide-react';
import { Club, Category, Discipline, Player, User, SuspensionReason } from '../../types/fraovia';
import { SuspendPlayerModal } from './SuspendPlayerModal';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { EditPlayerModal } from './EditPlayerModal';
import { PlayerImage } from '../common/PlayerImage';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface CategoriasProfesoresModuleProps {
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  players: Player[];
  /** Usuarios del club: con Supabase vienen de la base. */
  clubUsers?: User[];
  onRefreshData?: () => void;
  onOpenNewPlayerModal?: () => void;
  onOpenNewReceiptModal?: () => void;
}

export const CategoriasProfesoresModule: React.FC<CategoriasProfesoresModuleProps> = ({
  currentClub,
  currentUser,
  disciplines,
  categories,
  players,
  clubUsers,
  onRefreshData,
  onOpenNewPlayerModal,
  onOpenNewReceiptModal
}) => {
  // Main tab switcher: 'profesores' | 'categorias'
  const [activeSubTab, setActiveSubTab] = useState<'profesores' | 'categorias'>('categorias');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  
  // Modal states
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToSuspend, setPlayerToSuspend] = useState<Player | null>(null);
  const [showNewCoachModal, setShowNewCoachModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [coachForGroupsModal, setCoachForGroupsModal] = useState<User | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  // New coach form state
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachPhone, setNewCoachPhone] = useState('');
  const [newCoachSelectedCatIds, setNewCoachSelectedCatIds] = useState<string[]>([]);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDisciplineId, setNewCatDisciplineId] = useState(disciplines[0]?.id || '');
  const [newCatAgeGroup, setNewCatAgeGroup] = useState('Juveniles');
  const [newCatGender, setNewCatGender] = useState<'Masculino' | 'Femenino' | 'Mixto'>('Masculino');
  const [newCatFee, setNewCatFee] = useState<number>(22000);
  const [newCatSchedule, setNewCatSchedule] = useState('Lun, Mié y Vie 18:00');
  const [newCatCoachId, setNewCatCoachId] = useState('');

  // Groups assignment temp state
  const [tempAssignedCatIds, setTempAssignedCatIds] = useState<string[]>([]);

  // Fetch coaches for this club
  const allClubUsers = isSupabaseConfigured() ? (clubUsers || []) : fraoviaDB.getUsers(currentClub.id, currentUser);
  // Contraseña temporal de un profesor recién creado (se muestra una sola vez)
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [isCreatingCoach, setIsCreatingCoach] = useState(false);
  const coaches = allClubUsers.filter(u => u.role === 'PROFESOR');

  // Toggle category expansion
  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategoryIds(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Handle coach status toggle (Habilitar / Deshabilitar)
  const handleToggleCoachStatus = async (coach: User) => {
    try {
      await dataActions.toggleUserStatus(coach, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado del profesor');
    }
  };

  // Open modal to assign/unassign groups to a coach
  const handleOpenAssignGroups = (coach: User) => {
    setCoachForGroupsModal(coach);
    setTempAssignedCatIds(coach.scope?.categoryIds || []);
  };

  // Save assigned groups for coach
  const handleSaveAssignedGroups = async () => {
    if (!coachForGroupsModal) return;
    try {
      await dataActions.assignCategoriesToCoach(coachForGroupsModal, tempAssignedCatIds, categories, currentUser);
      setCoachForGroupsModal(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar asignación');
    }
  };

  // Handle assign coach to a category
  const handleAssignCoachToCategory = async (catId: string, coachId: string) => {
    try {
      const selectedCoach = coaches.find(c => c.id === coachId) || null;
      const cat = categories.find(c => c.id === catId);
      if (!cat) throw new Error('Categoría no encontrada');
      await dataActions.assignCoachToCategory(cat, selectedCoach, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al asignar profesor');
    }
  };

  // Handle player category change
  const handleChangePlayerCategory = async (playerId: string, newCatId: string) => {
    try {
      const target = players.find(p => p.id === playerId);
      if (!target) throw new Error('Deportista no encontrado');
      await dataActions.changePlayerCategory(target, newCatId, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar categoría');
    }
  };

  // Handle player suspension for non-payment
  const handleToggleSuspendPlayer = async (player: Player) => {
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
      alert(err.message || 'Error al suspender jugador');
    }
  };

  // Handle player color block change
  const handleChangePlayerColorBlock = async (playerId: string, blockName: string) => {
    try {
      const target = players.find(p => p.id === playerId);
      if (!target) throw new Error('Deportista no encontrado');
      await dataActions.changePlayerColorBlock(target, blockName, currentUser);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar bloque');
    }
  };

  // Create new coach
  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingCoach) return;
    if (!newCoachName.trim() || !newCoachEmail.trim()) {
      alert('Nombre y correo son obligatorios');
      return;
    }
    setIsCreatingCoach(true);
    try {
      const { tempPassword } = await dataActions.createCoach({
        fullName: newCoachName.trim(),
        email: newCoachEmail.trim(),
        phone: newCoachPhone.trim(),
        categoryIds: newCoachSelectedCatIds,
        clubId: currentClub.id
      }, categories, currentUser);
      if (tempPassword) {
        setCreatedCredentials({ name: newCoachName.trim(), email: newCoachEmail.trim().toLowerCase(), password: tempPassword });
      }

      setShowNewCoachModal(false);
      setNewCoachName('');
      setNewCoachEmail('');
      setNewCoachPhone('');
      setNewCoachSelectedCatIds([]);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al crear profesor');
    } finally {
      setIsCreatingCoach(false);
    }
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }
    try {
      const coach = coaches.find(c => c.id === newCatCoachId);
      await dataActions.createCategory(currentClub.id, {
        disciplineId: newCatDisciplineId || disciplines[0]?.id || 'disc-general',
        name: newCatName.trim(),
        ageGroup: newCatAgeGroup,
        gender: newCatGender,
        monthlyFee: Number(newCatFee) || 0,
        trainingSchedule: newCatSchedule.trim(),
        coachId: newCatCoachId || undefined,
        coachName: coach ? coach.fullName : undefined
      } as any, currentUser);

      setShowNewCategoryModal(false);
      setNewCatName('');
      setNewCatSchedule('Lun, Mié y Vie 18:00');
      setNewCatCoachId('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error al crear categoría');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(c => {
    if (selectedDiscipline !== 'all' && c.disciplineId !== selectedDiscipline) return false;
    if (searchTerm.trim() && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Filter coaches
  const filteredCoaches = coaches.filter(c => {
    if (searchTerm.trim() && !c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && !c.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Color block options
  const COLOR_BLOCK_OPTIONS = ['Azul', 'Rojo', 'Blanco', 'Oro', 'Negro', 'Verde'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Credenciales del profesor recién creado (se muestran una sola vez) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Profesor creado con éxito
            </div>
            <p className="text-xs text-slate-300">
              Entregale estos datos a <strong className="text-white">{createdCredentials.name}</strong>. La contraseña
              <strong className="text-amber-300"> no se vuelve a mostrar</strong>: anotala o copiala ahora.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs font-mono">
              <div><span className="text-slate-500">Correo: </span><span className="text-white select-all">{createdCredentials.email}</span></div>
              <div><span className="text-slate-500">Contraseña temporal: </span><span className="text-emerald-300 font-bold select-all">{createdCredentials.password}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try { navigator.clipboard.writeText(`Correo: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.password}`); } catch {}
                }}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800"
              >
                Copiar datos
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Ya los anoté
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top Banner / Switcher */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0B152A] to-teal-950/40 rounded-2xl border border-teal-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-teal-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-400" />
                Gestión Deportiva & Docente
              </span>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                {currentClub.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Categorías & Profesores del Club
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Habilita o deshabilita profesores, asigna y traslada grupos, revisa los planteles y gestiona suspensiones por impago en 1 clic.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeSubTab === 'profesores' ? (
              <button
                type="button"
                onClick={() => setShowNewCoachModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Alta de Profesor</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Categoría</span>
                </button>
                {onOpenNewPlayerModal && (
                  <button
                    type="button"
                    onClick={onOpenNewPlayerModal}
                    className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-sky-600/20 flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Inscribir Jugador</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global KPIs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Profesores Totales</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{coaches.length}</div>
            <div className="text-[10px] text-teal-400 mt-0.5 font-medium">
              {coaches.filter(c => c.status === 'activo').length} activos · {coaches.filter(c => c.status !== 'activo').length} pausados
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Categorías Activas</span>
            <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">{categories.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              En {disciplines.length} disciplinas deportivas
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Deportistas en Planteles</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{players.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {players.filter(p => p.status === 'activo').length} al día · {players.filter(p => p.status === 'moroso').length} morosos
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Suspendidos por Impago</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
              {players.filter(p => p.status === 'suspendido').length}
            </div>
            <div className="text-[10px] text-rose-400/80 mt-0.5 font-medium">
              Acceso a cancha inhabilitado
            </div>
          </div>
        </div>

        {/* Big Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('categorias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'categorias'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Categorías del Club ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profesores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'profesores'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <span>Profesores & Entrenadores ({coaches.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#0C162D] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeSubTab === 'categorias' ? "Buscar por nombre de categoría..." : "Buscar profesor por nombre o email..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {activeSubTab === 'categorias' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Disciplina:</span>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todas las disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================
          SUB-TAB A: CATEGORÍAS & PLANTELES CON JUGADORES
         ======================================================== */}
      {activeSubTab === 'categorias' && (
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center bg-[#0C162D] border border-slate-800 rounded-2xl">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">No se encontraron categorías</p>
              <p className="text-xs text-slate-400 mt-1">Intenta con otros filtros o da de alta una categoría.</p>
            </div>
          ) : (
            filteredCategories.map(cat => {
              const disc = disciplines.find(d => d.id === cat.disciplineId);
              const catPlayers = players.filter(p => p.categoryId === cat.id);
              const isExpanded = !!expandedCategoryIds[cat.id];
              const assignedCoach = coaches.find(c => c.id === cat.coachId) || (cat.coachName ? { fullName: cat.coachName } : null);

              return (
                <div 
                  key={cat.id}
                  className="rounded-2xl border border-slate-800 bg-[#0C162D] overflow-hidden shadow-lg transition hover:border-slate-700"
                >
                  {/* Category Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950/80 to-[#0F1E38]/60 border-b border-slate-800/80">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-white">{cat.name}</h3>
                          {disc && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                              {disc.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300">
                            {cat.ageGroup || 'Sin franja'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {cat.trainingSchedule || 'Días a confirmar'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            Cuota: ${cat.monthlyFee.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Coach Selector & Action Button */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5">
                        <GraduationCap className="w-4 h-4 text-teal-400 shrink-0" />
                        <div className="text-left">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Profesor a Cargo</span>
                          <select
                            value={cat.coachId || ''}
                            onChange={(e) => handleAssignCoachToCategory(cat.id, e.target.value)}
                            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                          >
                            <option value="" className="bg-slate-900 text-slate-400">Sin profesor asignado</option>
                            {coaches.map(coach => (
                              <option key={coach.id} value={coach.id} className="bg-slate-900 text-white">
                                {coach.fullName} {coach.status !== 'activo' ? '(Pausado)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow ${
                          isExpanded 
                            ? 'bg-slate-800 text-white border border-slate-700' 
                            : 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 border border-teal-500/30'
                        }`}
                      >
                        <Users className="w-4 h-4 text-teal-400" />
                        <span>{catPlayers.length} Jugadores</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Players in this Category */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-slate-950/40 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="text-xs text-slate-400">
                          Listado de chicos en <strong className="text-white">{cat.name}</strong>. Cambia categoría, bloque o suspende por impago directamente.
                        </div>
                        {onOpenNewPlayerModal && (
                          <button
                            type="button"
                            onClick={onOpenNewPlayerModal}
                            className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Inscribir en esta categoría</span>
                          </button>
                        )}
                      </div>

                      {catPlayers.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No hay jugadores inscriptos en esta categoría todavía.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800/80">
                                <th className="pb-2.5">Deportista</th>
                                <th className="pb-2.5">Bloque de Color</th>
                                <th className="pb-2.5">Profesor Titular</th>
                                <th className="pb-2.5">Estado / Cuota</th>
                                <th className="pb-2.5 text-right">Acciones Directas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                              {catPlayers.map(player => {
                                const isSuspended = player.status === 'suspendido';
                                const isMoroso = player.status === 'moroso' || player.balance > 0;

                                return (
                                  <tr key={player.id} className="hover:bg-slate-900/40 transition">
                                    {/* Player Info with Photo */}
                                    <td className="py-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative group">
                                          <PlayerImage
                                            photoPathOrUrl={player.photoUrl}
                                            alt={player.firstName}
                                            className="w-full h-full object-cover"
                                            fallbackInitials={`${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setPlayerToEdit(player)}
                                            className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition"
                                            title="Cambiar foto"
                                          >
                                            <Camera className="w-3 h-3 text-sky-400" />
                                          </button>
                                        </div>
                                        <div>
                                          <strong className="text-white font-bold block">
                                            {player.firstName} {player.lastName}
                                          </strong>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            DNI {player.dni} {player.dominantSide ? `· ${player.dominantSide}` : ''}
                                          </span>
                                          {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                                            <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                              🎓 Becado ({player.scholarshipPercent}%)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Bloque de Color */}
                                    <td className="py-3">
                                      <select
                                        value={player.colorBlockName || 'Azul'}
                                        onChange={(e) => handleChangePlayerColorBlock(player.id, e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none cursor-pointer"
                                      >
                                        {COLOR_BLOCK_OPTIONS.map(b => (
                                          <option key={b} value={b}>Bloque {b}</option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* Profesor Titular */}
                                    <td className="py-3">
                                      <span className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                                        {player.coachName || assignedCoach?.fullName || 'Lucas Benítez'}
                                      </span>
                                    </td>

                                    {/* Estado / Cuota */}
                                    <td className="py-3">
                                      <div className="space-y-0.5">
                                        {isSuspended ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                            <Ban className="w-3 h-3" />
                                            SUSPENDIDO IMPAGO
                                          </span>
                                        ) : isMoroso ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            <AlertTriangle className="w-3 h-3" />
                                            Debe ${player.balance.toLocaleString('es-AR')}
                                          </span>
                                        ) : player.pendingFirstPayment ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                            Sin pagos
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                            <Check className="w-3 h-3" />
                                            Al Día
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Quick Actions */}
                                    <td className="py-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {/* Cambiar de categoría selector */}
                                        <div className="relative inline-block text-left" title="Cambiar a otra categoría">
                                          <select
                                            value={player.categoryId}
                                            onChange={(e) => handleChangePlayerCategory(player.id, e.target.value)}
                                            className="bg-slate-900 border border-sky-500/30 hover:border-sky-500 text-sky-300 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                                          >
                                            <option value={cat.id}>Mover Categoría...</option>
                                            {categories.filter(c => c.id !== cat.id).map(otherCat => (
                                              <option key={otherCat.id} value={otherCat.id}>
                                                ➔ {otherCat.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Suspender por impago Toggle */}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSuspendPlayer(player)}
                                          title={isSuspended ? "Reactivar jugador" : "Suspender de entrenamientos por impago"}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                                            isSuspended
                                              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                                              : 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
                                          }`}
                                        >
                                          {isSuspended ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                              <span>Reactivar</span>
                                            </>
                                          ) : (
                                            <>
                                              <Ban className="w-3 h-3 text-rose-400" />
                                              <span>Suspender</span>
                                            </>
                                          )}
                                        </button>

                                        {/* Cobrar Cuota Rápido */}
                                        {onOpenNewReceiptModal && (
                                          <button
                                            type="button"
                                            onClick={onOpenNewReceiptModal}
                                            title="Cobrar cuota o registrar pago"
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                                          >
                                            <CreditCard className="w-3 h-3 text-emerald-400" />
                                            <span>Cobrar</span>
                                          </button>
                                        )}

                                        {/* Editar Ficha & Foto */}
                                        <button
                                          type="button"
                                          onClick={() => setPlayerToEdit(player)}
                                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                                          title="Editar ficha completa y foto del deportista"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB B: PROFESORES & ENTRENADORES DEL CLUB
         ======================================================== */}
      {activeSubTab === 'profesores' && (
        <div className="space-y-4">
          {filteredCoaches.length === 0 ? (
            <div className="p-8 text-center bg-[#0C162D] border border-slate-800 rounded-2xl">
              <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">No se encontraron profesores registrados</p>
              <p className="text-xs text-slate-400 mt-1">Da de alta al cuerpo técnico para comenzar a asignar planteles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCoaches.map(coach => {
                const isEnabled = coach.status === 'activo';
                const assignedCategoryIds = coach.scope?.categoryIds || [];
                const assignedCats = categories.filter(c => assignedCategoryIds.includes(c.id));
                const totalStudentsUnderCare = players.filter(p => assignedCategoryIds.includes(p.categoryId)).length;

                return (
                  <div
                    key={coach.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                      isEnabled 
                        ? 'bg-[#0C162D] border-slate-800 hover:border-slate-700' 
                        : 'bg-slate-950/60 border-rose-500/20 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Coach Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-base shrink-0 shadow-inner ${
                            isEnabled 
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {coach.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white text-sm sm:text-base">{coach.fullName}</h4>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isEnabled 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}>
                                {isEnabled ? 'HABILITADO' : 'DESHABILITADO'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {coach.email}
                              </span>
                              {coach.phone && (
                                <span className="flex items-center gap-1 font-mono text-[11px]">
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
                          title={isEnabled ? "Deshabilitar profesor del sistema" : "Habilitar profesor"}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                            isEnabled
                              ? 'bg-rose-600/15 text-rose-300 border-rose-500/30 hover:bg-rose-600/25'
                              : 'bg-emerald-600/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/25'
                          }`}
                        >
                          {isEnabled ? (
                            <>
                              <UserX className="w-3.5 h-3.5 text-rose-400" />
                              <span>Deshabilitar</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Habilitar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Grupos y Categorías que maneja */}
                      <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-teal-400" />
                            Grupos y Categorías Asignadas ({assignedCats.length}):
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            {totalStudentsUnderCare} alumnos a cargo
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                          {assignedCats.length === 0 ? (
                            <span className="text-xs text-amber-400/90 italic">
                              ⚠️ No tiene grupos asignados todavía.
                            </span>
                          ) : (
                            assignedCats.map(cat => (
                              <span
                                key={cat.id}
                                className="px-2.5 py-1 rounded-lg bg-teal-950/40 text-teal-300 border border-teal-500/30 text-xs font-medium flex items-center gap-1"
                              >
                                <span>{cat.name}</span>
                                <span className="text-[10px] text-teal-400/80 font-mono">
                                  ({players.filter(p => p.categoryId === cat.id).length})
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignGroups(coach)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white border border-teal-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
                        <span>Designar o Quitar Grupos</span>
                      </button>

                      {coach.phone && (
                        <a
                          href={`https://wa.me/${coach.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: ALTA DE NUEVO PROFESOR
         ======================================================== */}
      {showNewCoachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C162D] border border-teal-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                <h3 className="font-black text-white text-base">Registrar Nuevo Profesor</h3>
              </div>
              <button
                onClick={() => setShowNewCoachModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoach} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre Completo y Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Prof. Javier Zanetti"
                  value={newCoachName}
                  onChange={(e) => setNewCoachName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="profesor@club.org.ar"
                    value={newCoachEmail}
                    onChange={(e) => setNewCoachEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 5555-4321"
                    value={newCoachPhone}
                    onChange={(e) => setNewCoachPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Asignar Grupos Iniciales</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {categories.map(cat => {
                    const isChecked = newCoachSelectedCatIds.includes(cat.id);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCoachSelectedCatIds(prev => [...prev, cat.id]);
                            } else {
                              setNewCoachSelectedCatIds(prev => prev.filter(id => id !== cat.id));
                            }
                          }}
                          className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCoachModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-teal-600/30"
                >
                  Guardar Profesor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ALTA DE NUEVA CATEGORÍA
         ======================================================== */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C162D] border border-teal-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                <h3 className="font-black text-white text-base">Crear Nueva Categoría</h3>
              </div>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sub 13 Formativas, Escuelita, Primera"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Disciplina Deportiva</label>
                  <select
                    value={newCatDisciplineId}
                    onChange={(e) => setNewCatDisciplineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Franja de Edad</label>
                  <input
                    type="text"
                    placeholder="12 - 13 años"
                    value={newCatAgeGroup}
                    onChange={(e) => setNewCatAgeGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cuota Mensual ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newCatFee}
                    onChange={(e) => setNewCatFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Profesor Asignado</label>
                  <select
                    value={newCatCoachId}
                    onChange={(e) => setNewCatCoachId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Sin profesor (Asignar luego)</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Días y Horarios de Entrenamiento</label>
                <input
                  type="text"
                  placeholder="Ej. Mar y Jue 17:30, Sáb 10:00"
                  value={newCatSchedule}
                  onChange={(e) => setNewCatSchedule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-teal-600/30"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DESIGNAR O QUITAR GRUPOS A UN PROFESOR
         ======================================================== */}
      {coachForGroupsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C162D] border border-teal-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-base">Asignar Grupos y Categorías</h3>
                <p className="text-xs text-teal-400 mt-0.5">{coachForGroupsModal.fullName}</p>
              </div>
              <button
                onClick={() => setCoachForGroupsModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecciona o desmarca las categorías deportivas que estarán bajo la conducción y supervisión de este profesor:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {categories.map(cat => {
                const isSelected = tempAssignedCatIds.includes(cat.id);
                const count = players.filter(p => p.categoryId === cat.id).length;

                return (
                  <label 
                    key={cat.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-teal-950/40 border-teal-500/40 text-white' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempAssignedCatIds(prev => [...prev, cat.id]);
                          } else {
                            setTempAssignedCatIds(prev => prev.filter(id => id !== cat.id));
                          }
                        }}
                        className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-950"
                      />
                      <span className="font-bold text-xs">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {count} alumnos
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCoachForGroupsModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedGroups}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer text-xs shadow-lg shadow-teal-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Asignación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR PERFIL & FOTO DEL JUGADOR
         ======================================================== */}
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
          categories={categories}
          disciplines={disciplines}
          currentUser={currentUser}
          onPlayerUpdated={() => {
            setPlayerToEdit(null);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
