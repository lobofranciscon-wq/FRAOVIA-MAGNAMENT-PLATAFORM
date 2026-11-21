import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Camera, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  FolderTree, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  Building2, 
  Edit3, 
  DollarSign, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw,
  Award,
  Upload,
  MessageCircle,
  MoreVertical,
  Send,
  X,
  ExternalLink,
  HeartPulse
} from 'lucide-react';
import { Category, Club, Discipline, Player, Receipt, User, SuspensionReason, SUSPENSION_REASON_LABELS } from '../../types/fraovia';
import { SuspendPlayerModal } from './SuspendPlayerModal';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { playerPhotoService } from '../../services/playerPhotoService';
import { PlayerImage } from '../common/PlayerImage';
import { EditPlayerModal } from './EditPlayerModal';
import { PlayerScholarshipModal } from '../scholarships/PlayerScholarshipModal';
import { useAppTheme } from '../../context/ThemeContext';

interface PlayersManagementModuleProps {
  currentClub: Club;
  currentUser: User;
  players: Player[];
  categories: Category[];
  disciplines: Discipline[];
  allUsers: User[];
  onOpenNewPlayerModal: () => void;
  onOpenNewReceiptModal?: (player?: Player) => void;
  onNavigateToCategoriesAndCoaches?: () => void;
  onRefreshData: () => void;
}

// Utility: Automatic 1:1 Square Crop & High-Res Resize for Sports Credential Photos
const optimizePlayerPhotoToSquare = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        // Center crop 1:1
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const PlayersManagementModule: React.FC<PlayersManagementModuleProps> = ({
  currentClub,
  currentUser,
  players,
  categories,
  disciplines,
  allUsers,
  onOpenNewPlayerModal,
  onOpenNewReceiptModal,
  onNavigateToCategoriesAndCoaches,
  onRefreshData
}) => {
  const { theme } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'al_dia' | 'moroso' | 'suspendido' | 'apto_vencido' | 'becados'>('all');
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToSuspend, setPlayerToSuspend] = useState<Player | null>(null);
  const [playerToScholarship, setPlayerToScholarship] = useState<Player | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick Action Menu & Modals State
  const [activeMenuPlayerId, setActiveMenuPlayerId] = useState<string | null>(null);
  const [showBatchDuesModal, setShowBatchDuesModal] = useState<boolean>(false);
  const [medicalPlayerModal, setMedicalPlayerModal] = useState<Player | null>(null);
  const [batchNotifMessage, setBatchNotifMessage] = useState(
    `Estimada familia, le recordamos desde ${currentClub.name} que se encuentran al cobro las cuotas sociales del mes. Agradecemos regularizar el saldo para mantener la matrícula deportiva activa.`
  );

  // Available coaches in this club
  const clubCoaches = useMemo(() => {
    return allUsers.filter(u => u.clubId === currentClub.id && u.role === 'PROFESOR');
  }, [allUsers, currentClub.id]);

  // Color Blocks list
  const colorBlocks = useMemo(() => {
    const set = new Set<string>();
    players.forEach(p => {
      if (p.colorBlockName) set.add(p.colorBlockName);
    });
    categories.forEach(c => {
      if (c.colorBlockName) set.add(c.colorBlockName);
    });
    if (set.size === 0) {
      return ['Bloque Blanco', 'Bloque Azul', 'Bloque Oro', 'Bloque Rojo'];
    }
    return Array.from(set);
  }, [players, categories]);

  // Helper to find professor assigned to a category
  const getCoachForCategory = (catId: string) => {
    const found = clubCoaches.find(c => c.scope?.categoryIds?.includes(catId));
    return found ? found.fullName : 'Sin Asignar';
  };

  // Recent 5 players
  const recentPlayers = useMemo(() => {
    return [...players].slice(0, 5);
  }, [players]);

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      // Search
      const searchMatch = !searchTerm.trim() || 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm);

      if (!searchMatch) return false;

      // Discipline filter
      if (selectedDiscipline !== 'all' && p.disciplineId !== selectedDiscipline) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      // Block filter
      if (selectedBlock !== 'all' && p.colorBlockName !== selectedBlock) return false;

      // Status filter
      if (selectedStatus === 'al_dia' && p.balance > 0) return false;
      if (selectedStatus === 'moroso' && (p.balance <= 0 || p.status === 'suspendido')) return false;
      if (selectedStatus === 'suspendido' && p.status !== 'suspendido') return false;
      if (selectedStatus === 'apto_vencido' && p.medicalCertificateValid) return false;
      if (selectedStatus === 'becados' && (!p.scholarshipPercent || p.scholarshipPercent <= 0)) return false;

      return true;
    });
  }, [players, searchTerm, selectedDiscipline, selectedCategory, selectedBlock, selectedStatus]);

  // Player Metrics
  const totalCount = players.length;
  const quota = currentClub.contractedPlayersQuota || 800;
  const quotaPercent = Math.min(100, Math.round((totalCount / quota) * 100));
  const paidCount = players.filter(p => p.balance <= 0 && p.status !== 'suspendido').length;
  const debtCount = players.filter(p => p.balance > 0 && p.status !== 'suspendido').length;
  const suspendedCount = players.filter(p => p.status === 'suspendido').length;
  const scholarshipCount = players.filter(p => (p.scholarshipPercent || 0) > 0).length;
  const validMedicalCount = players.filter(p => p.medicalCertificateValid).length;
  const validMedicalPercent = totalCount > 0 ? Math.round((validMedicalCount / totalCount) * 100) : 0;

  // Debtors for Batch WhatsApp Dues Notifications
  const debtorsList = useMemo(() => {
    return players.filter(p => p.balance > 0);
  }, [players]);

  const totalDebtAmount = useMemo(() => {
    return debtorsList.reduce((acc, p) => acc + p.balance, 0);
  }, [debtorsList]);

  // Actions
  const handleDirectPhotoFileChange = async (player: Player, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadRes = await playerPhotoService.uploadPlayerPhoto(currentClub.id, file);
      // Guardar la RUTA (club_id/uuid.ext) en la base de datos
      await dataActions.updatePlayerPhoto(player, uploadRes.filePath, currentUser);
      setNotification(`Foto subida al almacenamiento y actualizada para ${player.firstName} ${player.lastName}`);
      setTimeout(() => setNotification(null), 3500);
      onRefreshData();
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    }
  };

  const handleSendWhatsAppToTutor = (player: Player) => {
    const rawPhone = player.emergencyContact?.phone || player.phone;
    const clean = rawPhone.replace(/[^\d]/g, '');
    if (!clean) {
      alert(`No hay teléfono registrado para el tutor de ${player.firstName}. Puedes agregarlo editando su ficha.`);
      return;
    }
    const tutorName = player.emergencyContact?.name || 'Familia';
    const text = encodeURIComponent(
      `Hola ${tutorName}, le escribimos desde el Club ${currentClub.name} respecto a ${player.firstName} ${player.lastName}.${player.balance > 0 ? ` Le recordamos que registra un saldo pendiente de cuota social de $${player.balance.toLocaleString('es-AR')}.` : ' Su ficha deportiva se encuentra al día.'} Saludos cordiales.`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  const handleToggleSuspension = async (player: Player) => {
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
      setNotification(
        updated.status === 'suspendido'
          ? `Deportista ${updated.firstName} ${updated.lastName} fue SUSPENDIDO (${info ? SUSPENSION_REASON_LABELS[info.reason] : ''}).`
          : `Deportista ${updated.firstName} ${updated.lastName} fue REHABILITADO con éxito.`
      );
      setTimeout(() => setNotification(null), 3500);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Error al cambiar estado');
    }
  };

  const handleChangeBlock = async (player: Player, newBlock: string) => {
    try {
      await dataActions.changePlayerColorBlock(player, newBlock, currentUser);
      setNotification(`Bloque cambiado a "${newBlock}" para ${player.firstName} ${player.lastName}`);
      setTimeout(() => setNotification(null), 3000);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleChangeCategory = async (player: Player, newCatId: string) => {
    try {
      await dataActions.changePlayerCategory(player, newCatId, currentUser);
      const catName = categories.find(c => c.id === newCatId)?.name || 'nueva categoría';
      setNotification(`${player.firstName} ${player.lastName} fue transferido a "${catName}".`);
      setTimeout(() => setNotification(null), 3000);
      onRefreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-sky-600/90 text-white font-bold text-xs flex items-center justify-between shadow-2xl backdrop-blur-md border border-sky-400/40 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* HEADER BANNER OFICIAL DEL PADRÓN */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)',
          borderColor: currentClub.branding?.primaryColor || '#0284C7'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden shrink-0">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Padrón & Gestión de Deportistas
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Padrón Oficial de Jugadores & Fichas
              </h2>
              <p className="text-xs text-sky-100 max-w-xl">
                Control censo de deportistas, asignación de bloques por color, profesores a cargo, aptos médicos y suspensión por impago.
              </p>
            </div>
          </div>

          {/* Top Actions: Cobranzas en Lote WhatsApp, Categorías/Profesores & Alta de Jugador */}
          <div className="flex flex-wrap items-center gap-2.5">
            {debtorsList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBatchDuesModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                title="Notificar cuotas del mes por WhatsApp a todos los morosos en un solo clic"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Notificar Cuotas ({debtorsList.length})</span>
              </button>
            )}

            {onNavigateToCategoriesAndCoaches && (
              <button
                type="button"
                onClick={onNavigateToCategoriesAndCoaches}
                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-sky-300 hover:text-white border border-sky-400/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
              >
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span>Gestionar Categorías & Profesores</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNewPlayerModal}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Inscribir Nuevo Jugador</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS STRIP: Estadísticas completas de los jugadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-sky-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Jugadores</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          <span className="text-[10px] text-sky-300 font-semibold">{quotaPercent}% cupo ({quota})</span>
        </div>

        {/* Metric 2: Bloques */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-blue-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Bloques Color</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{colorBlocks.length}</div>
          <span className="text-[10px] text-blue-300 font-semibold">Grupos activos</span>
        </div>

        {/* Metric 3: Categorías */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-teal-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Categorías</span>
            <FolderTree className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{categories.length}</div>
          <span className="text-[10px] text-teal-300 font-semibold">{clubCoaches.length} profesores</span>
        </div>

        {/* Metric 4: Al Día */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-emerald-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Al Día</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{paidCount}</div>
          <span className="text-[10px] text-slate-400">Sin saldos pendientes</span>
        </div>

        {/* Metric 5: Con Deuda */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-rose-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Con Deuda</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{debtCount}</div>
          <span className="text-[10px] text-rose-300 font-semibold">Mora activa</span>
        </div>

        {/* Metric 6: Suspendidos */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-amber-500/30 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Suspendidos</span>
            <PauseCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{suspendedCount}</div>
          <span className="text-[10px] text-amber-300 font-semibold">{validMedicalPercent}% apto vigente</span>
        </div>
      </div>

      {/* ÚLTIMOS DEPORTISTAS AGREGADOS (CARRUSEL RÁPIDO) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs uppercase font-bold text-white tracking-wider">
              Últimos Deportistas Inscriptos Recientemente
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Incorporaciones del plantel</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {recentPlayers.map(p => {
            const cat = categories.find(c => c.id === p.categoryId);
            const coachName = getCoachForCategory(p.categoryId);

            return (
              <div 
                key={p.id}
                onClick={() => setPlayerToEdit(p)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition cursor-pointer flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                  <PlayerImage
                    photoPathOrUrl={p.photoUrl}
                    alt={`${p.firstName} ${p.lastName}`}
                    fallbackInitials={`${p.firstName[0]}${p.lastName[0]}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="font-bold text-xs text-white truncate group-hover:text-sky-300 transition">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {cat?.name || 'Categoría'}
                  </div>
                  <div className="text-[9px] text-teal-400 truncate flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3 h-3 shrink-0" />
                    <span>{coachName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por DNI, nombre o apellido de socio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
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

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Discipline */}
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="all">Todas las Disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Bloque de Color */}
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="all">Todos los Bloques</option>
              {colorBlocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none font-bold"
            >
              <option value="all">Todos los Estados</option>
              <option value="al_dia">✅ Al Día (Sin deuda)</option>
              <option value="moroso">⚠️ Con Deuda (Morosos)</option>
              <option value="suspendido">⏸️ Suspendidos por Impago</option>
              <option value="apto_vencido">🩺 Apto Médico Vencido</option>
              <option value="becados">🎓 Becados ({scholarshipCount})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Mostrando <strong>{filteredPlayers.length}</strong> de {players.length} jugadores</span>
          {(searchTerm || selectedDiscipline !== 'all' || selectedCategory !== 'all' || selectedBlock !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDiscipline('all');
                setSelectedCategory('all');
                setSelectedBlock('all');
                setSelectedStatus('all');
              }}
              className="text-sky-400 hover:underline cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* DIRECTORY OF PLAYERS (CARDS VIEW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-[#0C162D] rounded-2xl border border-slate-800 space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">No se encontraron deportistas</h4>
            <p className="text-xs">Prueba con otros términos de búsqueda o filtros.</p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const cat = categories.find(c => c.id === player.categoryId);
            const disc = disciplines.find(d => d.id === player.disciplineId);
            const coachName = getCoachForCategory(player.categoryId);
            const isSuspended = player.status === 'suspendido';
            const isDebtor = player.balance > 0;

            return (
              <div 
                key={player.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-md ${
                  isSuspended 
                    ? 'bg-amber-950/20 border-amber-500/40 opacity-85'
                    : player.scholarshipPercent && player.scholarshipPercent > 0
                      ? 'bg-[#0C162D] border-amber-500/60 hover:border-amber-400 ring-1 ring-amber-500/20'
                      : 'bg-[#0C162D] border-slate-800 hover:border-slate-700'
                }`}
              >
                {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                  <div className="-mt-1 -mx-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-500/10 to-amber-500/25 border border-amber-500/50 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wide text-amber-300">
                        🎓 BECADO ({player.scholarshipPercent}% BONIFICADO)
                      </div>
                      {player.scholarshipReason && (
                        <div className="text-[10px] text-amber-200/80 truncate">{player.scholarshipReason}</div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  {/* Top: Avatar, Name, DNI, Dorsal */}
                  <div className="flex items-start gap-3">
                    <div className="relative group shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
                        <PlayerImage
                          photoPathOrUrl={player.photoUrl}
                          alt={`${player.firstName} ${player.lastName}`}
                          fallbackInitials={`${player.firstName[0]}${player.lastName[0]}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayerToEdit(player)}
                        title="Cambiar foto de este jugador"
                        className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-sky-400" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-sm font-bold text-white truncate block">
                          {player.firstName} {player.lastName}
                        </strong>
                        {player.jerseyNumber !== undefined && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>DNI {player.dni}</span>
                        {player.position && <span>· {player.position}</span>}
                      </div>

                      {/* State Badges: Al Día / Deuda / Suspendido */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {isSuspended ? (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏸️ SUSPENDIDO{player.suspensionReason ? ` · ${SUSPENSION_REASON_LABELS[player.suspensionReason as SuspensionReason] || player.suspensionReason}` : ''}
                          </span>
                        ) : isDebtor ? (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Deuda: ${player.balance.toLocaleString('es-AR')}
                          </span>
                        ) : player.pendingFirstPayment ? (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Sin pagos · cobrar inscripción
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Al Día
                          </span>
                        )}

                        {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs">
                            <GraduationCap className="w-2.5 h-2.5 text-amber-400" />
                            <span>
                              {player.scholarshipPercent === 100 
                                ? 'Beca 100% (Exento)' 
                                : player.scholarshipPercent === 50 
                                  ? 'Media Beca (50%)' 
                                  : `Beca ${player.scholarshipPercent}%`}
                            </span>
                          </span>
                        )}

                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                          player.medicalCertificateValid ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                          {player.medicalCertificateValid ? '● Apto OK' : '● Apto Vencido'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category, Professor & Color Block Strip */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    {/* Category & Change selector */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Categoría:</span>
                      <select
                        value={player.categoryId}
                        onChange={(e) => handleChangeCategory(player, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-[11px] focus:outline-none focus:border-sky-500"
                        title="Cambiar categoría del jugador"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Professor a cargo */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-teal-400" />
                        Profesor:
                      </span>
                      <span className="text-[11px] font-bold text-teal-300 truncate max-w-[160px]">
                        {coachName}
                      </span>
                    </div>

                    {/* Bloque de Color & Selector */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-sky-400" />
                        Bloque Color:
                      </span>
                      <select
                        value={player.colorBlockName || colorBlocks[0]}
                        onChange={(e) => handleChangeBlock(player, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sky-300 font-bold text-[11px] focus:outline-none focus:border-sky-500"
                        title="Cambiar bloque de color"
                      >
                        {colorBlocks.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  {/* Suspender / Reanudar button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSuspension(player)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-[11px] border ${
                      isSuspended
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border-amber-500/30'
                    }`}
                    title={isSuspended ? 'Rehabilitar ficha de jugador' : 'Suspender ficha por falta de pago'}
                  >
                    {isSuspended ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{isSuspended ? 'Rehabilitar' : 'Suspender'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Becar button */}
                    <button
                      type="button"
                      onClick={() => setPlayerToScholarship(player)}
                      className={`px-2.5 py-1.5 font-bold rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] border ${
                        player.scholarshipPercent && player.scholarshipPercent > 0
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title="Asignar o editar beca (Media beca 50%, Beca completa 100% o personalizada)"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{player.scholarshipPercent && player.scholarshipPercent > 0 ? `Beca ${player.scholarshipPercent}%` : 'Becar'}</span>
                    </button>

                    {onOpenNewReceiptModal && isDebtor && (
                      <button
                        type="button"
                        onClick={() => onOpenNewReceiptModal(player)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                        title="Registrar cobro / comprobante oficial"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPlayerToEdit(player)}
                      className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 hover:text-white border border-sky-500/30 font-bold rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Camera className="w-3 h-3 text-sky-400" />
                      <span>Ficha & Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL EDITAR FICHA Y FOTO DE JUGADOR */}
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
            onRefreshData();
            setPlayerToEdit(null);
          }}
        />
      )}

      {/* MODAL BECAR JUGADOR (EXENCIÓN DE CUOTA MENSUAL 50%, 100%, ETC.) */}
      {playerToScholarship && (
        <PlayerScholarshipModal
          isOpen={!!playerToScholarship}
          onClose={() => setPlayerToScholarship(null)}
          player={playerToScholarship}
          categories={categories}
          currentClub={currentClub}
          currentUser={currentUser}
          onUpdated={() => {
            onRefreshData();
            setPlayerToScholarship(null);
          }}
        />
      )}

    </div>
  );
};
