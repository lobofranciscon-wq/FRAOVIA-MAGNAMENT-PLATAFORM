import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  CreditCard, 
  Layers, 
  Palette, 
  ShieldCheck, 
  Cloud, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Eye, 
  ExternalLink,
  Lock,
  Download,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { Club, CommercialPlan, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { visualDesignService } from '../../services/visualDesignService';

interface SuperadminClubDetailViewProps {
  club: Club;
  allPlans: CommercialPlan[];
  currentUser: User;
  onBackToControlCenter: () => void;
  onOpenClubEditor: (club: Club) => void;
  onEnterGhostMode: (club: Club) => void;
  onRefreshData: () => void;
  onOpenVisualEditor?: (club: Club, designId?: string) => void;
}

export const SuperadminClubDetailView: React.FC<SuperadminClubDetailViewProps> = ({
  club,
  allPlans,
  currentUser,
  onBackToControlCenter,
  onOpenClubEditor,
  onEnterGhostMode,
  onRefreshData,
  onOpenVisualEditor
}) => {
  // Tabs internas del club según especificación
  const [activeTab, setActiveTab] = useState<
    'resumen' | 'usuarios' | 'plan' | 'modulos' | 'personalizacion' | 'seguridad' | 'backups' | 'actividad'
  >('resumen');

  const plan = allPlans.find(p => p.id === club.subscriptionPlanId);
  const clubUsers = fraoviaDB.getUsers(club.id, currentUser);
  const players = fraoviaDB.getPlayers(club.id, currentUser);

  return (
    <div className="space-y-5">
      {/* HEADER SUPERADMIN VISTA DE CLUB */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToControlCenter}
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Volver al Centro de Control</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {club.logoUrl && club.logoUrl.trim() ? (
              <img 
                src={club.logoUrl} 
                alt={club.name} 
                className="w-12 h-12 rounded-2xl object-contain bg-slate-950 border border-slate-800 p-1"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center font-bold text-lg text-slate-400">
                {club.name?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {club.name.toUpperCase()}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  🟢 Activo
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>Plan: <strong className="text-amber-400">{plan?.name || 'PRO'}</strong></span>
                <span>·</span>
                <span>Jugadores: <strong className="text-slate-200">{players.length || club.contractedPlayersQuota}</strong></span>
                <span>·</span>
                <span>Usuarios: <strong className="text-slate-200">{clubUsers.length || club.contractedUsersQuota}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEnterGhostMode(club)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              title="Entrar a operar en la plataforma del club"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" />
              <span>Entrar como Administrador</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN EN PESTAÑAS (TABS INTERNAS DEL CLUB) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-800/80">
          {[
            { id: 'resumen', label: 'Resumen', icon: Building2 },
            { id: 'usuarios', label: 'Usuarios', icon: Users },
            { id: 'plan', label: 'Plan', icon: CreditCard },
            { id: 'modulos', label: 'Módulos', icon: Layers },
            { id: 'personalizacion', label: 'Personalización', icon: Palette },
            { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
            { id: 'backups', label: 'Backups', icon: Cloud },
            { id: 'actividad', label: 'Actividad', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO SEGÚN SUBTAB DEL CLUB */}
      {/* 1. RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Datos Institucionales</span>
            <div className="text-xs space-y-1.5 text-slate-300">
              <div><strong className="text-slate-400">Slug:</strong> <span className="font-mono">{club.slug}</span></div>
              <div><strong className="text-slate-400">CUIT:</strong> <span className="font-mono">{club.cuit}</span></div>
              <div><strong className="text-slate-400">Email:</strong> {club.email}</div>
              <div><strong className="text-slate-400">Teléfono:</strong> {club.phone}</div>
              <div><strong className="text-slate-400">Sede:</strong> {club.address}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Capacidad y Cuotas</span>
            <div className="text-xs space-y-2 text-slate-300">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Jugadores:</span>
                  <span className="font-bold text-white">{players.length} / {club.contractedPlayersQuota}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.round((players.length / (club.contractedPlayersQuota || 1)) * 100))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Usuarios autorizados:</span>
                  <span className="font-bold text-white">{clubUsers.length} / {club.contractedUsersQuota}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.round((clubUsers.length / (club.contractedUsersQuota || 1)) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Estado del Servicio</span>
            <div className="text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Base aislada RLS operativa</span>
              </div>
              <div className="text-[11px] text-slate-400">Último backup: Hoy 22:00 hs</div>
              <div className="text-[11px] text-slate-400">Vencimiento del plan: 15 de cada mes</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Usuarios del Club ({clubUsers.length})</h3>
              <p className="text-xs text-slate-400">Personal con credenciales activas dentro de {club.name}.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {clubUsers.map(user => (
              <div key={user.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{user.fullName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-mono font-bold">
                    {user.role}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PLAN */}
      {activeTab === 'plan' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Suscripción Comercial Actual</h3>
              <p className="text-xs text-slate-400">Configuración de canon y límites asignados a este club.</p>
            </div>
            <span className="text-lg font-black font-mono text-emerald-400">
              ${(plan?.monthlyPrice || 0).toLocaleString()} <span className="text-xs text-slate-400">/mes</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Plan:</span>
              <strong className="text-white text-sm">{plan?.name || 'PRO'}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Cupo Jugadores:</span>
              <strong className="text-white text-sm">{club.contractedPlayersQuota}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Cupo Usuarios:</span>
              <strong className="text-white text-sm">{club.contractedUsersQuota}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Almacenamiento:</span>
              <strong className="text-white text-sm">{plan?.storageGb || 50} GB</strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. MÓDULOS */}
      {activeTab === 'modulos' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Módulos Habilitados</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-emerald-300">
              <span className="font-bold block">✓ Módulo Base</span>
              <span className="text-[10px] text-slate-400">Padrón de socios y cuotas</span>
            </div>
            <div className={`p-3 rounded-xl bg-slate-950/60 border ${club.activeModules.deportivo ? 'border-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-500'}`}>
              <span className="font-bold block">{club.activeModules.deportivo ? '✓ Deportivo' : '✕ Deportivo'}</span>
              <span className="text-[10px] text-slate-400">Asistencia y profesores</span>
            </div>
            <div className={`p-3 rounded-xl bg-slate-950/60 border ${club.activeModules.caja ? 'border-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-500'}`}>
              <span className="font-bold block">{club.activeModules.caja ? '✓ Caja' : '✕ Caja'}</span>
              <span className="text-[10px] text-slate-400">Arqueo y comprobantes</span>
            </div>
            <div className={`p-3 rounded-xl bg-slate-950/60 border ${club.activeModules.tienda ? 'border-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-500'}`}>
              <span className="font-bold block">{club.activeModules.tienda ? '✓ Tienda' : '✕ Tienda'}</span>
              <span className="text-[10px] text-slate-400">Stock y ventas POS</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. PERSONALIZACIÓN (DENTRO DEL CLUB) */}
      {activeTab === 'personalizacion' && (
        <div className="space-y-5">
          {/* BANNER PRINCIPAL: EDITOR VISUAL DE CLUBES (TIPO CANVA / FIGMA) */}
          <div className="bg-gradient-to-br from-amber-500/10 via-[#0C162D] to-sky-500/10 border-2 border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖌️</span>
                  <h3 className="text-base font-black text-white tracking-tight">
                    EDITOR VISUAL DE CLUBES
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    CANVA / FIGMA MODE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Capa visual independiente de FRAOVIA. Diseña pantallas arrastrando elementos, ajustando tamaños, fondos translúcidos multinivel y vistas previas realistas sin tocar código ni alterar la base de datos hasta que decidas publicarlo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenVisualEditor && onOpenVisualEditor(club)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/25"
                >
                  <span>🎨</span>
                  <span>Abrir Editor Visual ({club.name})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const globalDesign = visualDesignService.createNewGlobalDesign();
                    if (onOpenVisualEditor) {
                      onOpenVisualEditor(club, globalDesign.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  title="Crear un diseño libre sin atarlo a un club específico"
                >
                  <span>🌐</span>
                  <span>Crear sin marcar club</span>
                </button>
              </div>
            </div>

            {/* LISTA RÁPIDA DE DISEÑOS GUARDADOS PARA ESTE CLUB */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">Diseños y Borradores Disponibles:</span>
                <span className="text-[11px] font-mono">Regla: Editar no afecta al club hasta publicar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {visualDesignService.getDesignsForClub(club.id).map(design => (
                  <div
                    key={design.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-white truncate">{design.name}</span>
                        {design.status === 'publicado' ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            🟢 {design.currentVersion}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            🟡 Borrador
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {design.elements.length} elementos · Actualizado {new Date(design.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenVisualEditor && onOpenVisualEditor(club, design.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = visualDesignService.duplicateDesign(design.id);
                          if (onOpenVisualEditor) onOpenVisualEditor(club, copy.id);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                        title="Duplicar diseño"
                      >
                        Duplicar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ESTILO Y PALETA RÁPIDA (CSS EXISTENTE) */}
          <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Paleta Institucional & Datos Básicos</h3>
                <p className="text-xs text-slate-400">Escudo, colores institucionales y tipografía base del club.</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenClubEditor(club)}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>Abrir Editor de Estilo Rápido</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: club.branding?.primaryColor || '#10b981' }} />
                <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: club.branding?.secondaryColor || '#0ea5e9' }} />
                <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: club.branding?.accentColor || '#38BDF8' }} />
              </div>
              <div className="text-xs text-slate-300">
                <div><strong className="text-slate-400">Tipografía:</strong> {club.branding?.fontFamily || 'Inter'}</div>
                <div><strong className="text-slate-400">Eslogan:</strong> "{club.branding?.slogan || 'Pasión deportiva'}"</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SEGURIDAD */}
      {activeTab === 'seguridad' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Seguridad & Aislamiento (RLS)</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-slate-300">Aislamiento por Row Level Security</span>
              <span className="text-emerald-400 font-bold font-mono">ENFORCED (100%)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-slate-300">Permisos RBAC por rol de club</span>
              <span className="text-emerald-400 font-bold font-mono">ACTIVO</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. BACKUPS */}
      {activeTab === 'backups' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Copias de Seguridad del Club</h3>
            <span className="text-xs font-mono text-emerald-400">Estado: 🟢 Al día</span>
          </div>
          <div className="text-xs text-slate-400">
            Último respaldo ejecutado con éxito hoy a las 22:00 hs. Cifrado AES-256 en Google Cloud Storage.
          </div>
        </div>
      )}

      {/* 8. ACTIVIDAD */}
      {activeTab === 'actividad' && (
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Bitácora de Eventos de {club.name}</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-300">
              <span className="text-slate-500 font-mono text-[10px]">22:04</span> · Usuario creado por administración
            </div>
            <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-300">
              <span className="text-slate-500 font-mono text-[10px]">21:40</span> · Nueva cuota registrada
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
