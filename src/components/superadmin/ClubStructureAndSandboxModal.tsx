import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building2, 
  Users, 
  Wallet, 
  Activity, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Rocket, 
  Trash2, 
  Play, 
  Plus, 
  Check, 
  ShieldCheck, 
  Clock, 
  Tag, 
  Eye, 
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { Club, ClubStagingDraft, Discipline, CashBox, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface ClubStructureAndSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  currentUser: User;
  onUpdated: () => void;
  onEnterGhostMode?: (club: Club) => void;
}

export const ClubStructureAndSandboxModal: React.FC<ClubStructureAndSandboxModalProps> = ({
  isOpen,
  onClose,
  club,
  currentUser,
  onUpdated,
  onEnterGhostMode
}) => {
  if (!isOpen) return null;

  // Active view tab inside modal
  const [activeTab, setActiveTab] = useState<'estructura' | 'sandbox' | 'prueba_paralelo'>('estructura');
  
  // Real-time entities of the club
  const clubUsers = useMemo(() => fraoviaDB.getUsers(club.id, currentUser), [club.id, currentUser]);
  const clubDisciplines = useMemo(() => fraoviaDB.getDisciplines(club.id, currentUser), [club.id, currentUser]);
  const clubCashBoxes = useMemo(() => fraoviaDB.getCashBoxes(club.id, currentUser), [club.id, currentUser]);

  // Form for adding new discipline in structural inspector
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);
  const [newDiscName, setNewDiscName] = useState('');
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscCoordinator, setNewDiscCoordinator] = useState('');

  // Draft / Sandbox state (initialized from club.stagingDraft if present)
  const existingDraft = club.stagingDraft;
  const [draftVersionName, setDraftVersionName] = useState(existingDraft?.versionName || `v${((club.versionNumber || 1.0) + 0.1).toFixed(1)} Beta`);
  const [draftNotes, setDraftNotes] = useState(existingDraft?.notes || 'Prueba de nuevos módulos y deportes aislados sin afectar a producción.');
  
  const [draftModules, setDraftModules] = useState({
    base: existingDraft?.modifiedModules?.base ?? club.activeModules.base,
    deportivo: existingDraft?.modifiedModules?.deportivo ?? club.activeModules.deportivo,
    caja: existingDraft?.modifiedModules?.caja ?? club.activeModules.caja,
    tienda: existingDraft?.modifiedModules?.tienda ?? club.activeModules.tienda,
    multiSportIsolation: existingDraft?.modifiedModules?.multiSportIsolation ?? (club.activeModules.multiSportIsolation ?? true)
  });

  const [draftQuotaPlayers, setDraftQuotaPlayers] = useState<number>(
    existingDraft?.contractedPlayersQuota ?? club.contractedPlayersQuota
  );
  const [draftQuotaUsers, setDraftQuotaUsers] = useState<number>(
    existingDraft?.contractedUsersQuota ?? club.contractedUsersQuota
  );

  const [draftDisciplines, setDraftDisciplines] = useState(
    existingDraft?.disciplinesDraft ?? clubDisciplines.map(d => ({ ...d }))
  );

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Toggle user enabled/disabled
  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'activo' ? 'deshabilitado' : 'activo';
      fraoviaDB.toggleClubUserStatus(userId, newStatus, currentUser);
      showFeedback(`Estado de usuario actualizado a ${newStatus}`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Toggle discipline active/inactive in production
  const handleToggleDiscipline = (discId: string, currentActive: boolean) => {
    try {
      fraoviaDB.toggleClubDisciplineStatus(discId, !currentActive, currentUser);
      showFeedback(`Deporte ${!currentActive ? 'activado' : 'pausado'} con éxito`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Toggle multi-sport isolation in production
  const handleToggleMultiSport = (enabled: boolean) => {
    try {
      fraoviaDB.toggleClubMultiSportIsolation(club.id, enabled, currentUser);
      showFeedback(`Aislamiento multideporte ${enabled ? 'habilitado' : 'deshabilitado'}`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Add new discipline in production
  const handleCreateDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscName.trim() || !newDiscCode.trim()) return;
    try {
      fraoviaDB.addClubDiscipline(club.id, newDiscName.trim(), newDiscCode.trim(), newDiscCoordinator.trim(), currentUser);
      setNewDiscName('');
      setNewDiscCode('');
      setNewDiscCoordinator('');
      setShowAddDiscipline(false);
      showFeedback(`Deporte ${newDiscName} creado con éxito`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // SANDBOX: Save Draft to continue modifying later
  const handleSaveDraftForLater = () => {
    try {
      const draft: ClubStagingDraft = {
        id: existingDraft?.id || `draft-${Date.now()}`,
        clubId: club.id,
        versionName: draftVersionName,
        createdAt: existingDraft?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'borrador',
        authorSuperadminEmail: currentUser.email,
        notes: draftNotes,
        modifiedModules: draftModules,
        contractedPlayersQuota: draftQuotaPlayers,
        contractedUsersQuota: draftQuotaUsers,
        statusMode: club.status,
        disciplinesDraft: draftDisciplines,
        cashBoxesDraft: clubCashBoxes.map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          active: b.status === 'abierta',
          currentBalance: b.currentBalance
        })),
        enabledUserIds: clubUsers.filter(u => u.status === 'activo').map(u => u.id),
        disabledUserIds: clubUsers.filter(u => u.status === 'deshabilitado').map(u => u.id)
      };

      fraoviaDB.saveClubStagingDraft(club.id, draft, currentUser);
      showFeedback('¡Versión de prueba guardada exitosamente! Podés continuar editándola cuando quieras.');
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // SANDBOX: Apply New Version to Production
  const handleApplyNewVersion = () => {
    if (!confirm(`¿Confirmás promover esta versión (${draftVersionName}) a producción para ${club.name}? Los usuarios recibirán la nueva configuración inmediatamente.`)) {
      return;
    }

    try {
      // First save current state into draft to ensure latest values are applied
      const draft: ClubStagingDraft = {
        id: existingDraft?.id || `draft-${Date.now()}`,
        clubId: club.id,
        versionName: draftVersionName,
        createdAt: existingDraft?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'borrador',
        authorSuperadminEmail: currentUser.email,
        notes: draftNotes,
        modifiedModules: draftModules,
        contractedPlayersQuota: draftQuotaPlayers,
        contractedUsersQuota: draftQuotaUsers,
        statusMode: club.status,
        disciplinesDraft: draftDisciplines,
        cashBoxesDraft: clubCashBoxes.map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          active: b.status === 'abierta',
          currentBalance: b.currentBalance
        })),
        enabledUserIds: clubUsers.filter(u => u.status === 'activo').map(u => u.id),
        disabledUserIds: clubUsers.filter(u => u.status === 'deshabilitado').map(u => u.id)
      };
      fraoviaDB.saveClubStagingDraft(club.id, draft, currentUser);
      fraoviaDB.applyClubStagingDraft(club.id, currentUser);
      showFeedback('¡Nueva versión aplicada a producción con éxito!');
      onUpdated();
      setActiveTab('estructura');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // SANDBOX: Discard Draft
  const handleDiscardDraft = () => {
    if (!confirm('¿Estás seguro de descartar este borrador de versión? Se perderán las modificaciones no aplicadas.')) return;
    try {
      fraoviaDB.discardClubStagingDraft(club.id, currentUser);
      showFeedback('Borrador de versión descartado');
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0A1224] border border-[#1E2E52] rounded-3xl w-full max-w-5xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0C162D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {club.logoUrl && club.logoUrl.trim() ? (
                <img src={club.logoUrl} alt={club.name} className="w-9 h-9 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-sky-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white">{club.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v{club.versionNumber || 1.0} Producción
                </span>
                {club.stagingDraft && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    Borrador de Prueba Pendiente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                CUIT: {club.cuit} · {clubDisciplines.length} deportes habilitados · {clubUsers.length} usuarios registrados · {clubCashBoxes.length} cajas activas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEnterGhostMode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEnterGhostMode(club);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Ingresar como Superadmin en Modo Sigiloso (100% invisible para el club)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ingreso Sigiloso</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackMsg && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* MODAL NAVIGATION TABS */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#070D1E] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('estructura')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'estructura'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏛️ Estructura del Club (Deportes, Usuarios, Cajas)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 relative ${
                activeTab === 'sandbox'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>🧪 Versión de Prueba / Sandbox Aislado</span>
              {club.stagingDraft && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prueba_paralelo')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'prueba_paralelo'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-4 h-4 text-purple-400" />
              <span>🖥️ Probar Versión en Paralelo</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ========================================================
              TAB 1: ESTRUCTURA DEL CLUB
             ======================================================== */}
          {activeTab === 'estructura' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Feature highlight: Multi-Sport Isolation Switch */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        Extensión de Gestión Independiente
                      </span>
                      <span className="text-xs font-bold text-white">
                        Aislamiento Multideporte
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Si está activo, en la parte administrativa el club puede tocar o filtrar por un deporte específico (ej: Básquet) y tener valores, cobros, niños y cajas de manera 100% aislada como si fuera una entidad independiente dentro del mismo club.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold font-mono ${club.activeModules.multiSportIsolation ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {club.activeModules.multiSportIsolation ? 'HABILITADO' : 'DESHABILITADO'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleMultiSport(!club.activeModules.multiSportIsolation)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      club.activeModules.multiSportIsolation ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      club.activeModules.multiSportIsolation ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* SECTION: DEPORTES / DISCIPLINAS HABILITADAS */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Deportes & Disciplinas Habilitadas ({clubDisciplines.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddDiscipline(!showAddDiscipline)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Deporte</span>
                  </button>
                </div>

                {/* Form to add a new sport */}
                {showAddDiscipline && (
                  <form onSubmit={handleCreateDiscipline} className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3 animate-in fade-in">
                    <span className="text-xs font-bold text-emerald-300 block">Alta de Nueva Disciplina Deportiva</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre (ej: Hockey sobre Césped)"
                        value={newDiscName}
                        onChange={(e) => setNewDiscName(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                      />
                      <input
                        type="text"
                        placeholder="Código corto (ej: HCK)"
                        value={newDiscCode}
                        onChange={(e) => setNewDiscCode(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                      />
                      <input
                        type="text"
                        placeholder="Coordinador (ej: Prof. Luciana Aymar)"
                        value={newDiscCoordinator}
                        onChange={(e) => setNewDiscCoordinator(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDiscipline(false)}
                        className="px-3 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Crear y Habilitar
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clubDisciplines.map(disc => (
                    <div key={disc.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{disc.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {disc.code}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Coord: {disc.coordinatorName || 'No asignado'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono ${disc.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {disc.active ? 'ACTIVO' : 'PAUSADO'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleDiscipline(disc.id, disc.active)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            disc.active ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                            disc.active ? 'translate-x-4' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: USUARIOS Y ACCESOS DEL CLUB */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">
                      Usuarios & Cuentas Registradas ({clubUsers.length} de {club.contractedUsersQuota} cupo)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Habilitar / Deshabilitar Accesos
                  </span>
                </div>

                <div className="overflow-x-auto max-h-56 border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070D1E] text-slate-400">
                      <tr>
                        <th className="p-2.5">Nombre Completo</th>
                        <th className="p-2.5">Email / Usuario</th>
                        <th className="p-2.5">Rol Institucional</th>
                        <th className="p-2.5">Teléfono</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {clubUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-white">{user.fullName}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">{user.email}</td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">{user.phone || '-'}</td>
                          <td className="p-2.5">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              user.status === 'activo' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                            }`}>
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                user.status === 'activo'
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {user.status === 'activo' ? 'Deshabilitar' : 'Habilitar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION: CAJAS Y PUNTOS DE COBRO */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      Cajas & Puntos de Cobro ({clubCashBoxes.length})
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">Arqueos y subcajas por disciplina</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clubCashBoxes.map(box => (
                    <div key={box.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{box.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                          {box.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Saldo actual:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          ${box.currentBalance.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Estado:</span>
                        <span className={`font-mono font-bold ${box.status === 'abierta' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {box.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 2: VERSIÓN DE PRUEBA / SANDBOX AISLADO
             ======================================================== */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Sandbox notice header */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-black text-amber-300">
                  <Sliders className="w-4 h-4" />
                  <span>ENTORNO DE PRUEBAS & VERSIONADO AISLADO (SANDBOX)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Cualquier cambio que realices aquí (modificar cupos, cambiar módulos o agregar deportes) queda guardado en un <strong>borrador de prueba</strong> sin afectar ni interferir directamente en la operativa en vivo de los usuarios de <strong>{club.name}</strong>. Podés guardar para seguir modificando luego, probar la versión en una ventana en paralelo y finalmente promover a producción cuando esté 100% validado.
                </p>
              </div>

              {/* Version details form */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Configuración del Borrador de Versión</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Borrador Aislado
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nombre o Etiqueta de la Versión</label>
                    <input
                      type="text"
                      value={draftVersionName}
                      onChange={(e) => setDraftVersionName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Notas de la Versión / Cambios de Prueba</label>
                    <input
                      type="text"
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Quotas & Modules in Draft */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Parámetros de Prueba (Sin afectar producción)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-xs text-slate-400">Cupo de Deportistas de Prueba</label>
                      <input
                        type="number"
                        value={draftQuotaPlayers}
                        onChange={(e) => setDraftQuotaPlayers(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-xs text-slate-400">Cupo de Usuarios de Prueba</label>
                      <input
                        type="number"
                        value={draftQuotaUsers}
                        onChange={(e) => setDraftQuotaUsers(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Modules Toggles in Draft */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 block">Módulos Habilitados en este Borrador:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'base', label: 'Módulo Base' },
                        { key: 'deportivo', label: 'Deportivo' },
                        { key: 'caja', label: 'Tesorería & Cajas' },
                        { key: 'tienda', label: 'Tienda Oficial POS' },
                        { key: 'multiSportIsolation', label: 'Aislamiento Multideporte' }
                      ].map(mod => (
                        <label key={mod.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <input
                            type="checkbox"
                            checked={(draftModules as any)[mod.key]}
                            onChange={(e) => setDraftModules({
                              ...draftModules,
                              [mod.key]: e.target.checked
                            })}
                            className="rounded text-sky-600 focus:ring-0"
                          />
                          <span>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS: GUARDAR BORRADOR, PROBAR EN PARALELO, APLICAR A PRODUCCIÓN */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {club.stagingDraft ? (
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Descartar Borrador</span>
                    </button>
                  ) : <div />}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón 1: Guardar para seguir modificando luego */}
                    <button
                      type="button"
                      onClick={handleSaveDraftForLater}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
                      title="Queda guardada la versión hasta donde modificaste para volver a editarla luego sin afectar usuarios"
                    >
                      <Save className="w-4 h-4 text-amber-400" />
                      <span>Guardar para seguir modificando luego</span>
                    </button>

                    {/* Botón 2: Probar versión en paralelo */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('prueba_paralelo')}
                      className="px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
                      title="Abre la ventana de prueba en paralelo para ver cómo funciona sin tocar la versión del usuario"
                    >
                      <Play className="w-4 h-4 text-purple-300" />
                      <span>Probar Versión (Ventana Paralela)</span>
                    </button>

                    {/* Botón 3: Aplicar nueva versión */}
                    <button
                      type="button"
                      onClick={handleApplyNewVersion}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-300"
                      title="Aplica la nueva versión de manera definitiva y promueve los cambios a producción"
                    >
                      <Rocket className="w-4 h-4 stroke-[2.5]" />
                      <span>Aplicar Nueva Versión</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB 3: VENTANA DE PRUEBA EN PARALELO
             ======================================================== */}
          {activeTab === 'prueba_paralelo' && (
            <div className="space-y-4 animate-in fade-in">
              
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-bold text-purple-200">
                    SIMULACIÓN EN PARALELO DE LA VERSIÓN: <strong>{draftVersionName}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  100% AISLADA DE PRODUCCIÓN
                </span>
              </div>

              {/* Parallel Device Screen Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-400" />
                    <span>Vista previa funcional de la interfaz que verán los usuarios</span>
                  </div>
                  <span className="font-mono text-purple-400 font-bold">Modo Sandbox Activo</span>
                </div>

                {/* Simulated Administration Preview */}
                <div className="p-4 rounded-xl bg-[#070D1E] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">
                        {club.name} · Versión de Prueba
                      </span>
                      <h4 className="text-base font-black text-white">Panel Administrativo Simulado</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold font-mono">
                        Cupo: {draftQuotaPlayers} socios
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold font-mono">
                        Usuarios: {draftQuotaUsers}
                      </span>
                    </div>
                  </div>

                  {/* Simulated Multi-Sport Switcher */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sky-300">
                        Aislamiento Multideporte: {draftModules.multiSportIsolation ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <span className="text-[10px] text-slate-400">Simulación interactiva</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold">
                        🌐 Consolidado ({draftQuotaPlayers} socios)
                      </span>
                      {draftDisciplines.map(d => (
                        <span key={d.id} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                          {d.name} ({d.code})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Modules preview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border ${draftModules.base ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      Módulo Base: {draftModules.base ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${draftModules.deportivo ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      Deportivo: {draftModules.deportivo ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${draftModules.caja ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      Tesorería: {draftModules.caja ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${draftModules.tienda ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      Tienda POS: {draftModules.tienda ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>

                </div>

                {/* Bottom Call to Action inside parallel tester */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sandbox')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a la edición del borrador</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraftForLater}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Guardar Borrador
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyNewVersion}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Promover a Producción</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
