import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building2, 
  Users, 
  Wallet, 
  Activity, 
  Layers, 
  Key, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save, 
  Plus, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Palette, 
  ShieldCheck, 
  Sparkles,
  Sliders,
  Share2,
  ListTree,
  Network
} from 'lucide-react';
import { Club, Discipline, Category, User, CashBox, UserRole } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { ClubGraphCanvas } from './ClubGraphCanvas';
import { ClubBrandingCssModule } from './ClubBrandingCssModule';
import { 
  SuperadminDoubleValidationModal, 
  PendingModification 
} from './SuperadminDoubleValidationModal';

interface ClubMindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  currentUser: User;
  onUpdated: () => void;
  onEnterClubDirectly: (club: Club) => void;
}

export const ClubMindMapModal: React.FC<ClubMindMapModalProps> = ({
  isOpen,
  onClose,
  club,
  currentUser,
  onUpdated,
  onEnterClubDirectly
}) => {
  if (!isOpen) return null;

  // View Mode: 'mindmap' (visual nodes & arrows) or 'frontend_editor' (modify what they see)
  const [activeView, setActiveView] = useState<'mindmap' | 'frontend_editor'>('mindmap');
  
  // Display style for mindmap: 'graph' (interactive React Flow nodes) or 'tree' (hierarchical card tree)
  const [mindmapDisplayMode, setMindmapDisplayMode] = useState<'graph' | 'tree'>('graph');

  const [selectedBranch, setSelectedBranch] = useState<'all' | 'deportes' | 'usuarios' | 'cajas' | 'backend'>('all');

  // Real-time data from database
  const clubUsers = useMemo(() => fraoviaDB.getUsers(club.id, currentUser), [club.id, currentUser]);
  const clubDisciplines = useMemo(() => fraoviaDB.getDisciplines(club.id, currentUser), [club.id, currentUser]);
  const clubCategories = useMemo(() => fraoviaDB.getCategories(club.id, currentUser), [club.id, currentUser]);
  const clubCashBoxes = useMemo(() => fraoviaDB.getCashBoxes(club.id, currentUser), [club.id, currentUser]);
  const allClubsList = useMemo(() => fraoviaDB.getClubs(currentUser), [currentUser]);

  // Passwords visibility state by userId: Record<string, boolean>
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Password modification modal/form state
  const [userToEditPassword, setUserToEditPassword] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [approvalNoteVal, setApprovalNoteVal] = useState('Solicitud de recuperación de clave por olvido');

  // New discipline quick add in Mindmap
  const [showAddSport, setShowAddSport] = useState(false);
  const [sportName, setSportName] = useState('');
  const [sportCode, setSportCode] = useState('');
  const [sportCoordinator, setSportCoordinator] = useState('');

  // QUICK PERMISSIONS DRAWER STATE (To edit permissions quickly per branch/node)
  const [permissionsDrawer, setPermissionsDrawer] = useState<{
    isOpen: boolean;
    branch: 'deportes' | 'usuarios' | 'cajas';
    selectedUser?: User | null;
    selectedSport?: Discipline | null;
  }>({
    isOpen: false,
    branch: 'usuarios',
    selectedUser: null,
    selectedSport: null
  });

  // DOUBLE VALIDATION CONFIRMATION MODAL STATE
  const [pendingValidation, setPendingValidation] = useState<PendingModification | null>(null);

  // Frontend Editor State (what the club users see)
  const [frontPrimaryColor, setFrontPrimaryColor] = useState(club.branding?.primaryColor || '#0284C7');
  const [frontSecondaryColor, setFrontSecondaryColor] = useState(club.branding?.secondaryColor || '#0369A1');
  const [frontLogoUrl, setFrontLogoUrl] = useState(club.logoUrl || '');
  const [frontWatermarkUrl, setFrontWatermarkUrl] = useState(club.branding?.watermarkUrl || club.logoUrl || '');
  const [frontWatermarkOpacity, setFrontWatermarkOpacity] = useState(club.branding?.watermarkOpacity ?? 0.18);
  const [frontModules, setFrontModules] = useState({
    base: club.activeModules.base,
    deportivo: club.activeModules.deportivo,
    caja: club.activeModules.caja,
    tienda: club.activeModules.tienda,
    multiSportIsolation: club.activeModules.multiSportIsolation ?? true
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Toggle reveal password
  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Handle password save with Double Validation
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEditPassword || !newPasswordVal.trim()) return;

    const targetUser = userToEditPassword;
    const newPass = newPasswordVal.trim();
    const note = approvalNoteVal.trim();

    setPendingValidation({
      type: 'RESET_PASSWORD',
      title: 'Restablecimiento de Contraseña de Acceso',
      description: `Se modificará la contraseña para el usuario ${targetUser.fullName}. La constancia asentada es: "${note}".`,
      targetEntityName: targetUser.fullName,
      targetEntityDetail: `${targetUser.email} (${targetUser.role})`,
      previousValue: targetUser.password ? '•••••••• (Cifrada)' : 'Sin contraseña',
      newValue: `${newPass} (Nueva Clave)`,
      impactLevel: 'CRÍTICO',
      onConfirm: () => {
        fraoviaDB.updateUserPassword(
          targetUser.id,
          newPass,
          currentUser,
          note
        );
        showFeedback(`Contraseña actualizada con éxito para ${targetUser.fullName}`);
        setUserToEditPassword(null);
        setNewPasswordVal('');
        onUpdated();
      }
    });
  };

  // Handle Add Sport from Mind Map
  const handleAddSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportName.trim() || !sportCode.trim()) return;

    try {
      fraoviaDB.addClubDiscipline(club.id, sportName.trim(), sportCode.trim(), sportCoordinator.trim(), currentUser);
      showFeedback(`Deporte "${sportName}" agregado al mapa de ${club.name}`);
      setSportName('');
      setSportCode('');
      setSportCoordinator('');
      setShowAddSport(false);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Quick Permission: Change User Role with Double Validation
  const handleQuickChangeRole = (targetUser: User, newRole: UserRole) => {
    if (targetUser.role === newRole) return;

    setPendingValidation({
      type: 'CHANGE_ROLE',
      title: 'Modificación de Rol y Jerarquía RBAC',
      description: `El usuario ${targetUser.fullName} cambiará de rol jerárquico. Esto redefine de inmediato sus permisos de lectura y escritura en los módulos del club.`,
      targetEntityName: targetUser.fullName,
      targetEntityDetail: `${targetUser.email}`,
      previousValue: targetUser.role,
      newValue: newRole,
      impactLevel: newRole === 'DUEÑO' || newRole === 'ADMINISTRACIÓN' ? 'CRÍTICO' : 'ALTO',
      onConfirm: () => {
        targetUser.role = newRole;
        fraoviaDB.updateUser(targetUser, currentUser);
        showFeedback(`Rol de ${targetUser.fullName} cambiado a ${newRole}`);
        onUpdated();
      }
    });
  };

  // Quick Permission: Toggle User Status with Double Validation
  const handleQuickToggleUserStatus = (targetUser: User, newStatus: 'activo' | 'restringido' | 'deshabilitado') => {
    const targetState = newStatus === 'activo' ? 'activo' : 'deshabilitado';
    const isDeactivating = targetState === 'deshabilitado';

    setPendingValidation({
      type: 'TOGGLE_STATUS',
      title: isDeactivating ? 'Suspensión de Acceso a Cuenta' : 'Reactivación de Acceso de Usuario',
      description: isDeactivating
        ? `Se bloqueará el acceso al sistema para ${targetUser.fullName}. No podrá iniciar sesión ni registrar cobros ni asistencias en el club.`
        : `Se reactivará la cuenta de ${targetUser.fullName}, restaurando su acceso normal según su rol.`,
      targetEntityName: targetUser.fullName,
      targetEntityDetail: `${targetUser.email} (${targetUser.role})`,
      previousValue: targetUser.status?.toUpperCase() || 'ACTIVO',
      newValue: targetState.toUpperCase(),
      impactLevel: 'ALTO',
      onConfirm: () => {
        fraoviaDB.toggleClubUserStatus(targetUser.id, targetState, currentUser);
        showFeedback(`Estado de ${targetUser.fullName} cambiado a ${targetState.toUpperCase()}`);
        onUpdated();
      }
    });
  };

  // Quick Permission: Toggle User Sport Scope (Discipline Access) with Double Validation
  const handleQuickToggleUserDiscipline = (targetUser: User, disciplineId: string) => {
    const currentIds = targetUser.scope?.disciplineIds || [];
    const isRemoving = currentIds.includes(disciplineId);
    const discName = clubDisciplines.find(d => d.id === disciplineId)?.name || 'Disciplina';

    setPendingValidation({
      type: 'CHANGE_SCOPE',
      title: isRemoving ? 'Revocación de Alcance Deportivo' : 'Asignación de Alcance Deportivo',
      description: isRemoving
        ? `Se revocará el permiso para gestionar "${discName}" a ${targetUser.fullName}. Ya no tendrá visibilidad de este deporte.`
        : `Se concederá acceso y permisos operativos sobre "${discName}" a ${targetUser.fullName}.`,
      targetEntityName: `${targetUser.fullName} ➔ ${discName}`,
      targetEntityDetail: targetUser.email,
      previousValue: isRemoving ? 'Acceso Habilitado' : 'Sin Acceso',
      newValue: isRemoving ? 'Acceso Revocado' : 'Acceso Concedido',
      impactLevel: 'MEDIO',
      onConfirm: () => {
        const updatedIds = isRemoving
          ? currentIds.filter(id => id !== disciplineId)
          : [...currentIds, disciplineId];

        targetUser.scope = {
          ...targetUser.scope,
          disciplineIds: updatedIds
        };

        fraoviaDB.updateUser(targetUser, currentUser);
        showFeedback(`Alcance de ${discName} actualizado para ${targetUser.fullName}`);
        onUpdated();
      }
    });
  };

  // Quick Permission: Toggle Sport Active Status with Double Validation
  const handleQuickToggleSportActive = (sportId: string, currentActive: boolean) => {
    const disc = clubDisciplines.find(d => d.id === sportId);
    const willActivate = !currentActive;

    setPendingValidation({
      type: 'TOGGLE_SPORT',
      title: willActivate ? 'Reactivación de Disciplina Deportiva' : 'Pausa Temporal de Disciplina Deportiva',
      description: willActivate
        ? `Se reactivará "${disc?.name || 'Disciplina'}" en el club. Volverá a estar visible en cuotas, socios y asistencias.`
        : `Se pausará "${disc?.name || 'Disciplina'}". Quedará archivada y no se emitirán nuevas cobranzas automáticas.`,
      targetEntityName: disc?.name || 'Disciplina',
      targetEntityDetail: `Código: ${disc?.code || 'N/A'}`,
      previousValue: currentActive ? 'ACTIVA' : 'PAUSADA',
      newValue: willActivate ? 'ACTIVA' : 'PAUSADA',
      impactLevel: 'MEDIO',
      onConfirm: () => {
        fraoviaDB.toggleClubDisciplineStatus(sportId, willActivate, currentUser);
        showFeedback(`Disciplina "${disc?.name}" ${willActivate ? 'activada' : 'pausada'} con éxito`);
        onUpdated();
      }
    });
  };

  // Quick Permission: Toggle Multi-Sport Isolation for the Club with Double Validation
  const handleQuickToggleMultiSport = (enabled: boolean) => {
    setPendingValidation({
      type: 'TOGGLE_MULTI_SPORT',
      title: enabled ? 'Activación de Aislamiento Multideporte' : 'Desactivación de Aislamiento Multideporte',
      description: enabled
        ? `Cada deporte pasará a operar como una subentidad independiente con sus propias cajas y balances estancos dentro de ${club.name}.`
        : `Se unificarán las cajas y los registros deportivos bajo la administración general del club.`,
      targetEntityName: `Aislamiento Multideporte · ${club.name}`,
      previousValue: club.activeModules.multiSportIsolation ? 'HABILITADO' : 'DESHABILITADO',
      newValue: enabled ? 'HABILITADO' : 'DESHABILITADO',
      impactLevel: 'ALTO',
      onConfirm: () => {
        fraoviaDB.toggleClubMultiSportIsolation(club.id, enabled, currentUser);
        setFrontModules(prev => ({ ...prev, multiSportIsolation: enabled }));
        showFeedback(`Aislamiento multideporte ${enabled ? 'habilitado' : 'deshabilitado'}`);
        onUpdated();
      }
    });
  };

  // Handle Save Frontend Configuration (what they see)
  const handleSaveFrontend = () => {
    try {
      fraoviaDB.updateClubBranding(
        club.id,
        {
          primaryColor: frontPrimaryColor,
          secondaryColor: frontSecondaryColor,
          watermarkUrl: frontWatermarkUrl,
          watermarkOpacity: frontWatermarkOpacity
        },
        frontLogoUrl,
        currentUser
      );

      // Save active modules to club
      club.logoUrl = frontLogoUrl;
      club.activeModules = { ...frontModules };
      
      showFeedback(`¡Front-End de ${club.name} actualizado con éxito! Los usuarios verán estos cambios en su portal.`);
      onUpdated();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#070D1E] border border-[#1A2B4C] rounded-3xl w-full max-w-7xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0A1329] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {club.logoUrl && club.logoUrl.trim() ? (
                <img src={club.logoUrl} alt={club.name} className="w-9 h-9 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-sky-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{club.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  MAPA MENTAL ESTRUCTURAL
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold hidden sm:inline">
                  CUIT: {club.cuit}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualización de grafos de departamentos (deportes, usuarios, caja) y editor de permisos por rama.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Mind Map vs Front-End Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveView('mindmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'mindmap'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mapa Mental (Back End)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('frontend_editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'frontend_editor'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Modificar Front-End (Lo que ven)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in ${
            feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* MODAL MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ========================================================
              VIEW 1: MAPA MENTAL INTERACTIVO (GRAFO DEPARTAMENTAL)
             ======================================================== */}
          {activeView === 'mindmap' && (
            <div className="space-y-4">
              
              {/* Controls bar: Switch between Graph View and Tree View + Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                
                {/* Graph vs Tree toggle */}
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMindmapDisplayMode('graph')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        mindmapDisplayMode === 'graph'
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>🗺️ Grafo Interactivo (Nodos & Flechas)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMindmapDisplayMode('tree')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        mindmapDisplayMode === 'tree'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ListTree className="w-3.5 h-3.5" />
                      <span>📋 Vista Árbol Detallada</span>
                    </button>
                  </div>

                  {/* Quick Branch Permissions Trigger */}
                  <button
                    type="button"
                    onClick={() => setPermissionsDrawer({
                      isOpen: true,
                      branch: 'usuarios'
                    })}
                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>⚙️ Editor de Permisos por Rama</span>
                  </button>
                </div>

                {/* Option to enter personalized platform IF DESIRED */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnterClubDirectly(club);
                  }}
                  className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                  title="Solo si deseás ingresar a la interfaz personalizada de usuario de este club"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Entrar a plataforma personalizada (Modo Sigiloso)</span>
                </button>
              </div>

              {/* -------------------------------------------------------------
                  MODE A: INTERACTIVE GRAPH CANVAS (REACT FLOW)
                 ------------------------------------------------------------- */}
              {mindmapDisplayMode === 'graph' && (
                <div className="space-y-3">
                  <ClubGraphCanvas
                    club={club}
                    disciplines={clubDisciplines}
                    categories={clubCategories}
                    users={clubUsers}
                    cashBoxes={clubCashBoxes}
                    onOpenFrontEditor={() => setActiveView('frontend_editor')}
                    onOpenSportPermissions={(sport) => {
                      setPermissionsDrawer({
                        isOpen: true,
                        branch: 'deportes',
                        selectedSport: sport
                      });
                    }}
                    onOpenUserPermissions={(usr) => {
                      setPermissionsDrawer({
                        isOpen: true,
                        branch: 'usuarios',
                        selectedUser: usr
                      });
                    }}
                    onOpenBranchPermissions={(branchKey) => {
                      setPermissionsDrawer({
                        isOpen: true,
                        branch: branchKey as any
                      });
                    }}
                    onToggleSportActive={handleQuickToggleSportActive}
                    onEditUserPassword={(usr) => {
                      setUserToEditPassword(usr);
                      setNewPasswordVal(usr.password || '');
                    }}
                    onAddNewSport={() => setShowAddSport(true)}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------
                  MODE B: TREE / HIERARCHICAL DETAILED CARDS VIEW
                 ------------------------------------------------------------- */}
              {mindmapDisplayMode === 'tree' && (
                <div className="space-y-6">
                  
                  {/* Central Node Display */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 border-2 border-sky-400 shadow-xl max-w-xl mx-auto text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center">
                      {club.logoUrl && club.logoUrl.trim() ? (
                        <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-7 h-7 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                        Nodo Central · Institución
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">{club.name}</h3>
                      <span className="text-xs text-sky-200 font-mono">CUIT: {club.cuit}</span>
                    </div>
                  </div>

                  {/* Branches Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Rama 1: Deportes */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white">Deportes & Disciplinas ({clubDisciplines.length})</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddSport(!showAddSport)}
                          className="px-2 py-0.5 bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 rounded text-[10px] font-bold"
                        >
                          + Agregar
                        </button>
                      </div>

                      <div className="space-y-2">
                        {clubDisciplines.map(disc => (
                          <div key={disc.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white">{disc.name}</span>
                              <span className="text-[10px] font-mono text-emerald-400 ml-1.5">({disc.code})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPermissionsDrawer({
                                isOpen: true,
                                branch: 'deportes',
                                selectedSport: disc
                              })}
                              className="text-[10px] text-emerald-300 font-bold hover:underline"
                            >
                              Permisos
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rama 2: Usuarios & Accesos */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-sky-500/30 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-sky-400" />
                          <h4 className="text-xs font-bold text-white">Usuarios & Accesos ({clubUsers.length})</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPermissionsDrawer({
                            isOpen: true,
                            branch: 'usuarios'
                          })}
                          className="px-2 py-0.5 bg-sky-600/30 text-sky-200 border border-sky-500/40 rounded text-[10px] font-bold"
                        >
                          Editar Roles
                        </button>
                      </div>

                      <div className="space-y-2">
                        {clubUsers.map(u => (
                          <div key={u.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div className="truncate pr-2">
                              <span className="font-bold text-white truncate block">{u.fullName}</span>
                              <span className="text-[10px] text-sky-400 font-mono">({u.role})</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToEditPassword(u);
                                  setNewPasswordVal(u.password || '');
                                }}
                                className="text-[10px] text-amber-400 font-bold"
                              >
                                Clave
                              </button>
                              <button
                                type="button"
                                onClick={() => setPermissionsDrawer({
                                  isOpen: true,
                                  branch: 'usuarios',
                                  selectedUser: u
                                })}
                                className="text-[10px] text-sky-300 font-bold hover:underline"
                              >
                                Permisos
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rama 3: Cajas */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white">Cajas & Tesorería ({clubCashBoxes.length})</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Saldos en Vivo</span>
                      </div>

                      <div className="space-y-2">
                        {clubCashBoxes.map(b => (
                          <div key={b.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white">{b.name}</span>
                              <span className="text-[10px] text-slate-400 block">{b.type.toUpperCase()}</span>
                            </div>
                            <span className="font-mono font-bold text-emerald-400">
                              ${b.currentBalance.toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              VIEW 2: MODIFICAR EL FRONT-END (LO QUE ELLOS VEN)
             ======================================================== */}
          {activeView === 'frontend_editor' && (
            <div className="space-y-4 animate-in fade-in">
              <ClubBrandingCssModule
                initialClub={club}
                allClubs={allClubsList}
                currentUser={currentUser}
                onUpdated={onUpdated}
              />
            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          QUICK PERMISSIONS & STRUCTURE DRAWER
         ======================================================== */}
      {permissionsDrawer.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0C152B] border-l border-sky-500/40 p-5 text-white flex flex-col h-full shadow-2xl overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {permissionsDrawer.branch === 'usuarios' && 'Permisos de Usuarios & Roles'}
                    {permissionsDrawer.branch === 'deportes' && 'Estructura & Alcance de Deportes'}
                    {permissionsDrawer.branch === 'cajas' && 'Permisos de Cajas & Tesorería'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Edición rápida en vivo</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPermissionsDrawer({ isOpen: false, branch: 'usuarios' })}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Drawer Branch Tabs */}
            <div className="flex items-center gap-1.5 my-4 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['usuarios', 'deportes', 'cajas'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setPermissionsDrawer(prev => ({ ...prev, branch: b }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer uppercase font-mono ${
                    permissionsDrawer.branch === b
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* BRANCH 1: USUARIOS & PERMISOS */}
            {permissionsDrawer.branch === 'usuarios' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Modificá el rol, estado y deportes asignados a cada directivo o profesor del club.
                </p>

                <div className="space-y-3">
                  {clubUsers.map(usr => (
                    <div key={usr.id} className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-sm text-white block">{usr.fullName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{usr.email}</span>
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                          usr.status === 'activo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {usr.status}
                        </span>
                      </div>

                      {/* Quick Role Selector */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Rol en el Club:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {(['DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'PROFESOR', 'TIENDA'] as UserRole[]).map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleQuickChangeRole(usr, r)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                usr.role === r
                                  ? 'bg-sky-600 text-white shadow'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Discipline Scope (Checkboxes) for Coach/Admin */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Deportes que puede administrar (Alcance):
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {clubDisciplines.map(d => {
                            const isAssigned = usr.scope?.disciplineIds?.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => handleQuickToggleUserDiscipline(usr, d.id)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                                  isAssigned
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}
                              >
                                <span className="truncate">{d.name}</span>
                                {isAssigned && <Check className="w-3 h-3 text-emerald-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Status and Password */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleUserStatus(usr, usr.status === 'activo' ? 'deshabilitado' : 'activo')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.status === 'activo'
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            {usr.status === 'activo' ? 'Pausar Acceso' : 'Reactivar'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setUserToEditPassword(usr);
                            setNewPasswordVal(usr.password || '');
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Key className="w-3 h-3" />
                          <span>Cambiar Clave</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BRANCH 2: DEPORTES & MULTISPORT */}
            {permissionsDrawer.branch === 'deportes' && (
              <div className="space-y-4">
                
                {/* Global Multi-Sport Isolation Switch */}
                <div className="p-3.5 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/40 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Aislamiento Multideporte</h4>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Permite que cada deporte funcione como una subentidad con valores y cajas independientes.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={club.activeModules.multiSportIsolation !== false}
                    onChange={(e) => handleQuickToggleMultiSport(e.target.checked)}
                    className="w-5 h-5 rounded text-sky-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* List of Sports with Status Toggle */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Disciplinas Activas en el Club:
                  </span>

                  {clubDisciplines.map(d => (
                    <div key={d.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs text-white">{d.name}</strong>
                          <span className="text-[10px] font-mono text-emerald-400">({d.code})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Coordinador: {d.coordinatorName || 'Sin asignar'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickToggleSportActive(d.id, d.active !== false)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          d.active !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {d.active !== false ? 'Activo' : 'Pausado'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Sport Button */}
                <button
                  type="button"
                  onClick={() => setShowAddSport(true)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Nueva Disciplina al Club</span>
                </button>
              </div>
            )}

            {/* BRANCH 3: CAJAS & TESORERIA */}
            {permissionsDrawer.branch === 'cajas' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Arqueos de tesorería y vinculación de puntos de cobro por deporte.
                </p>

                <div className="space-y-2.5">
                  {clubCashBoxes.map(b => (
                    <div key={b.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{b.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                          {b.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Saldo actual:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          ${b.currentBalance.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* POPUP MODAL: AGREGAR DEPORTE RÁPIDO */}
      {showAddSport && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C162D] border border-emerald-500/40 rounded-2xl w-full max-w-md p-5 text-white shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Activity className="w-4 h-4" />
                <span>Agregar Deporte al Club</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSport(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSport} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Nombre de la Disciplina</label>
                <input
                  type="text"
                  placeholder="Ej: Hockey sobre Césped"
                  value={sportName}
                  onChange={(e) => setSportName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Código (3 o 4 letras)</label>
                  <input
                    type="text"
                    placeholder="HCK"
                    value={sportCode}
                    onChange={(e) => setSportCode(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Coordinador a Cargo</label>
                  <input
                    type="text"
                    placeholder="Prof. Juan Pérez"
                    value={sportCoordinator}
                    onChange={(e) => setSportCoordinator(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSport(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Crear Deporte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: MODIFICAR / RESETEAR CONTRASEÑA */}
      {userToEditPassword && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C162D] border border-amber-500/40 rounded-2xl w-full max-w-md p-5 text-white shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Restablecer Contraseña de Usuario</span>
              </div>
              <button
                type="button"
                onClick={() => setUserToEditPassword(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Usuario destino:</span>
              <strong className="text-sm text-white block">{userToEditPassword.fullName}</strong>
              <span className="text-[11px] text-sky-400 font-mono block">{userToEditPassword.email} ({userToEditPassword.role})</span>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  required
                  placeholder="Ingrese nueva contraseña segura"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Constancia de Aprobación del Directivo</label>
                <input
                  type="text"
                  value={approvalNoteVal}
                  onChange={(e) => setApprovalNoteVal(e.target.value)}
                  required
                  placeholder="Ej: Aprobado por Presidente por WhatsApp tras olvido"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToEditPassword(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Nueva Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: DOBLE VALIDACIÓN DE SUPERADMIN PARA CAMBIOS CRÍTICOS */}
      {pendingValidation && (
        <SuperadminDoubleValidationModal
          isOpen={!!pendingValidation}
          onClose={() => setPendingValidation(null)}
          pendingChange={pendingValidation}
          currentUser={currentUser}
          clubName={club.name}
        />
      )}

    </div>
  );
};
