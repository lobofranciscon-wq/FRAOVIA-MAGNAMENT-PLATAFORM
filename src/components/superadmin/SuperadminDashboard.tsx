import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  Sliders, 
  Eye, 
  Ban, 
  Check, 
  Upload 
} from 'lucide-react';
import { Club, CommercialPlan, BetaFeature, AuditLog, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { SuperadminSection } from './superadminNavigation';
import { SuperadminControlCenter } from './SuperadminControlCenter';
import { SuperadminClubsList } from './SuperadminClubsList';
import { SuperadminClubDetailView } from './SuperadminClubDetailView';
import { SuperadminPlatformModule } from './SuperadminPlatformModule';
import { SuperadminMonitoringModule } from './SuperadminMonitoringModule';
import { SuperadminSystemModule } from './SuperadminSystemModule';
import { SuperadminSecurityModule } from './SuperadminSecurityModule';
import { BackupsManagementModule } from './BackupsManagementModule';
import { PlanConstructorModal } from './PlanConstructorModal';
import { ClubProfileAndEditorModal } from './ClubProfileAndEditorModal';
import { VisualEditorModal } from './visualEditor/VisualEditorModal';
import { visualDesignService } from '../../services/visualDesignService';
import { ActiveTab } from '../MobileNavBar';

interface SuperadminDashboardProps {
  currentUser: User;
  allClubs: Club[];
  allPlans: CommercialPlan[];
  allBetas: BetaFeature[];
  auditLogs: AuditLog[];
  onSelectClubToSupervise: (club: Club) => void;
  onRefreshData: () => void;
  initialSubTab?: string;
  onNavigate?: (tab: ActiveTab) => void;
  currentSection?: SuperadminSection;
  onSectionChange?: (section: SuperadminSection) => void;
}

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({
  currentUser,
  allClubs,
  allPlans,
  allBetas,
  auditLogs,
  onSelectClubToSupervise,
  onRefreshData,
  initialSubTab = 'inicio',
  onNavigate,
  currentSection: controlledSection,
  onSectionChange
}) => {
  // Map legacy tabs if received
  const resolveInitialSection = (): SuperadminSection => {
    if (initialSubTab === 'clubes' || initialSubTab === 'superadmin_clubes') return 'clubes';
    if (initialSubTab === 'planes' || initialSubTab === 'superadmin_planes') return 'sistema_planes';
    if (initialSubTab === 'backups' || initialSubTab === 'superadmin_backups') return 'backups';
    if (initialSubTab === 'betas' || initialSubTab === 'superadmin_betas') return 'plataforma_funciones';
    if (initialSubTab === 'auditoria') return 'seguridad_auditoria';
    return 'inicio';
  };

  const [internalSection, setInternalSection] = useState<SuperadminSection>(resolveInitialSection);
  const activeSection = controlledSection || internalSection;

  const handleSectionSelect = (section: SuperadminSection) => {
    if (onSectionChange) {
      onSectionChange(section);
    } else {
      setInternalSection(section);
    }
  };

  // Club actualmente bajo inspección detallada dentro del Superadmin
  const [inspectedClub, setInspectedClub] = useState<Club | null>(null);

  // Modales
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);
  const [selectedClubForEditor, setSelectedClubForEditor] = useState<Club | null>(null);

  // Visual Editor (Canva / Figma para Superadmin)
  const [visualEditorClub, setVisualEditorClub] = useState<Club | null>(null);
  const [visualEditorDesignId, setVisualEditorDesignId] = useState<string | undefined>(undefined);
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);

  // Alta de nuevo club
  const [showNewClubModal, setShowNewClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubSlug, setNewClubSlug] = useState('');
  const [newClubCuit, setNewClubCuit] = useState('');
  const [newClubPlanId, setNewClubPlanId] = useState(allPlans[0]?.id || 'plan-basico');

  const handleSavePlan = (plan: CommercialPlan) => {
    fraoviaDB.saveCommercialPlan(plan, currentUser);
    onRefreshData();
  };

  const handleToggleBeta = (betaId: string, clubId: string) => {
    fraoviaDB.toggleBetaForClub(betaId, clubId, currentUser);
    onRefreshData();
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubSlug.trim()) return;

    const plan = allPlans.find(p => p.id === newClubPlanId) || allPlans[0];
    const generatedCuit = `30-${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`;

    fraoviaDB.createClub({
      name: newClubName.trim(),
      slug: newClubSlug.trim().toLowerCase(),
      cuit: newClubCuit.trim() || generatedCuit,
      phone: '+54 11 4000-0000',
      email: `administracion@${newClubSlug.trim().toLowerCase()}.com`,
      address: 'Sede Social Central',
      logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=160&auto=format&fit=crop&q=80',
      status: 'activo',
      currentSeasonId: 'season-2026',
      subscriptionPlanId: newClubPlanId === 'sin_plan' ? (allPlans[0]?.id || 'plan-basico') : newClubPlanId,
      contractedPlayersQuota: plan?.maxPlayers || 300,
      contractedUsersQuota: plan?.maxLoginUsers || 5,
      branding: {
        primaryColor: '#10b981',
        secondaryColor: '#0ea5e9',
        accentColor: '#38BDF8',
        backgroundColor: '#070D1E',
        darkSidebar: true
      },
      activeModules: {
        base: plan?.modules.base ?? true,
        deportivo: plan?.modules.deportivo ?? true,
        caja: plan?.modules.caja ?? true,
        tienda: plan?.modules.tienda ?? false
      }
    }, currentUser);

    setShowNewClubModal(false);
    setNewClubName('');
    setNewClubSlug('');
    setNewClubCuit('');
    onRefreshData();
  };

  // Renderizador principal según activeSection
  const renderCurrentModule = () => {
    // Si estamos inspeccionando un club en particular
    if (activeSection === 'club_detalle' && inspectedClub) {
      return (
        <SuperadminClubDetailView
          club={inspectedClub}
          allPlans={allPlans}
          currentUser={currentUser}
          onBackToControlCenter={() => {
            setInspectedClub(null);
            handleSectionSelect('inicio');
          }}
          onOpenClubEditor={(club) => setSelectedClubForEditor(club)}
          onOpenVisualEditor={(club, designId) => {
            setVisualEditorClub(club);
            setVisualEditorDesignId(designId);
            setIsVisualEditorOpen(true);
          }}
          onEnterGhostMode={(club) => onSelectClubToSupervise(club)}
          onRefreshData={onRefreshData}
        />
      );
    }

    // 1. INICIO: CENTRO DE CONTROL FRAOVIA (Limpio y claro)
    if (activeSection === 'inicio') {
      return (
        <SuperadminControlCenter
          allClubs={allClubs}
          allPlans={allPlans}
          allBetas={allBetas}
          auditLogs={auditLogs}
          onNavigateSection={handleSectionSelect}
          onEnterClubView={(club) => {
            setInspectedClub(club);
            handleSectionSelect('club_detalle');
          }}
          onResolveAttentionItem={(type, clubId) => {
            if (clubId) {
              const target = allClubs.find(c => c.id === clubId);
              if (target) {
                setInspectedClub(target);
                handleSectionSelect('club_detalle');
              }
            }
          }}
        />
      );
    }

    // 2. CLUBES (Pantalla completa de instituciones)
    if (activeSection === 'clubes') {
      return (
        <SuperadminClubsList
          allClubs={allClubs}
          allPlans={allPlans}
          currentUser={currentUser}
          onEnterClubView={(club) => {
            setInspectedClub(club);
            handleSectionSelect('club_detalle');
          }}
          onNewClubClick={() => setShowNewClubModal(true)}
          onEditClubClick={(club) => setSelectedClubForEditor(club)}
          onOpenVisualEditor={(club) => {
            setVisualEditorClub(club);
            setIsVisualEditorOpen(true);
          }}
        />
      );
    }

    // 2.1 EDITOR VISUAL (ACCESO DIRECTO DESDE BARRA LATERAL)
    if (activeSection === 'editor_visual') {
      const defaultClub = inspectedClub || allClubs[0];
      return (
        <div className="bg-[#0C162D] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🖌️</span>
                <h2 className="text-lg font-black text-white tracking-tight">
                  ACCESO DIRECTO AL EDITOR VISUAL DE CLUBES
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Selecciona la institución que deseas diseñar o crea una plantilla universal libre sin club asignado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const globalDesign = visualDesignService.createNewGlobalDesign();
                setVisualEditorClub(defaultClub);
                setVisualEditorDesignId(globalDesign.id);
                setIsVisualEditorOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <span>🌐</span>
              <span>Crear sin marcar club (Plantilla Universal)</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Clubes disponibles para abrir en el editor visual:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allClubs.map(c => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.logoUrl && c.logoUrl.trim() ? (
                      <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                        {c.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Plan: {allPlans.find(p => p.id === c.subscriptionPlanId)?.name || 'PRO'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVisualEditorClub(c);
                      setIsVisualEditorOpen(true);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
                  >
                    Diseñar 🖌️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 3. PLATAFORMA (Versiones, Funciones, Config global)
    if (
      activeSection === 'plataforma_versiones' ||
      activeSection === 'plataforma_funciones' ||
      activeSection === 'plataforma_config'
    ) {
      return (
        <SuperadminPlatformModule
          subSection={activeSection}
          allClubs={allClubs}
          allBetas={allBetas}
          allPlans={allPlans}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
          onToggleBeta={handleToggleBeta}
        />
      );
    }

    // 4. MONITOREO (Actividad, Errores, Uso, Conexiones)
    if (
      activeSection === 'monitoreo_actividad' ||
      activeSection === 'monitoreo_errores' ||
      activeSection === 'monitoreo_uso' ||
      activeSection === 'monitoreo_conexiones'
    ) {
      return (
        <SuperadminMonitoringModule
          subSection={activeSection}
          allClubs={allClubs}
          auditLogs={auditLogs}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
        />
      );
    }

    // 5. SISTEMA (Planes, Usuarios, Configuración general)
    if (
      activeSection === 'sistema_planes' ||
      activeSection === 'sistema_usuarios' ||
      activeSection === 'sistema_config'
    ) {
      return (
        <SuperadminSystemModule
          subSection={activeSection}
          allPlans={allPlans}
          allClubs={allClubs}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
          onOpenCreatePlanModal={() => {
            setEditingPlan(null);
            setIsPlanModalOpen(true);
          }}
          onEditPlanModal={(plan) => {
            setEditingPlan(plan);
            setIsPlanModalOpen(true);
          }}
        />
      );
    }

    // 6. SEGURIDAD (Auditoría, Permisos, Accesos)
    if (
      activeSection === 'seguridad_auditoria' ||
      activeSection === 'seguridad_permisos' ||
      activeSection === 'seguridad_accesos'
    ) {
      return (
        <SuperadminSecurityModule
          subSection={activeSection}
          auditLogs={auditLogs}
          allClubs={allClubs}
          currentUser={currentUser}
        />
      );
    }

    // 7. BACKUPS
    if (activeSection === 'backups') {
      return (
        <BackupsManagementModule
          currentUser={currentUser}
          allClubs={allClubs}
          onRefreshData={onRefreshData}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Contenido principal del módulo seleccionado */}
      {renderCurrentModule()}

      {/* MODAL PLANES COMERCIALES */}
      <PlanConstructorModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        planToEdit={editingPlan}
        onSave={handleSavePlan}
        allClubs={allClubs}
      />

      {/* MODAL PERSONALIZACIÓN DEL CLUB (DENTRO DEL CLUB) */}
      {selectedClubForEditor && (
        <ClubProfileAndEditorModal
          isOpen={!!selectedClubForEditor}
          onClose={() => setSelectedClubForEditor(null)}
          club={selectedClubForEditor}
          currentUser={currentUser}
          onUpdated={() => {
            onRefreshData();
            const updated = fraoviaDB.getClubs(currentUser).find(c => c.id === selectedClubForEditor.id);
            if (updated) setSelectedClubForEditor(updated);
          }}
        />
      )}

      {/* MODAL ALTA DE NUEVO CLUB */}
      {showNewClubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0C162D] border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">Alta de Nuevo Club en FRAOVIA</h3>
              <button 
                onClick={() => setShowNewClubModal(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nombre Oficial del Club</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Club Deportivo Juventud Unida"
                  value={newClubName}
                  onChange={(e) => {
                    setNewClubName(e.target.value);
                    if (!newClubSlug) {
                      setNewClubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Identificador Slug (Único)</label>
                <input
                  type="text"
                  required
                  placeholder="ej: juventud-unida"
                  value={newClubSlug}
                  onChange={(e) => setNewClubSlug(e.target.value.toLowerCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>CUIT de la Institución</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewClubCuit(`30-${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
                  >
                    + Generar provisorio
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="ej: 30-71234567-9 (o dejar vacío)"
                  value={newClubCuit}
                  onChange={(e) => setNewClubCuit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  <strong className="text-amber-400 font-semibold">¿Qué es el CUIT?</strong> Es la Clave Única de Identificación Tributaria (número fiscal ante AFIP/ARCA). Si es un club de prueba o aún no lo tenés, podés dejarlo vacío o generar uno provisorio con 1 clic.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Plan Comercial Inicial</label>
                <select
                  value={newClubPlanId}
                  onChange={(e) => setNewClubPlanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none"
                >
                  <option value="sin_plan">⚡ Sin plan asignado / Modo prueba libre (Configurar luego)</option>
                  {allPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.monthlyPrice.toLocaleString()}/mes - {p.maxPlayers} jug)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewClubModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Confirmar Alta y Crear Aislamiento RLS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITOR VISUAL DE CLUBES (CANVA / FIGMA) */}
      {isVisualEditorOpen && visualEditorClub && (
        <VisualEditorModal
          isOpen={isVisualEditorOpen}
          onClose={() => {
            setIsVisualEditorOpen(false);
            setVisualEditorClub(null);
            setVisualEditorDesignId(undefined);
          }}
          club={visualEditorClub}
          allClubs={allClubs}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
          initialDesignId={visualEditorDesignId}
        />
      )}
    </div>
  );
};
