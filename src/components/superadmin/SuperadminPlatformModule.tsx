import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Check, 
  Clock, 
  Upload, 
  Radio, 
  Sliders, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { Club, BetaFeature, User, CommercialPlan } from '../../types/fraovia';

interface SuperadminPlatformModuleProps {
  subSection: 'plataforma_versiones' | 'plataforma_funciones' | 'plataforma_config';
  allClubs: Club[];
  allBetas: BetaFeature[];
  allPlans: CommercialPlan[];
  currentUser: User;
  onRefreshData: () => void;
  onToggleBeta: (betaId: string, clubId: string) => void;
}

export const SuperadminPlatformModule: React.FC<SuperadminPlatformModuleProps> = ({
  subSection,
  allClubs,
  allBetas,
  allPlans,
  currentUser,
  onRefreshData,
  onToggleBeta
}) => {
  // Estado para Versiones
  const [selectedTargetScope, setSelectedTargetScope] = useState<'all' | 'selected' | 'one'>('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState('2.3.9');

  // Estado para Configuración global
  const [platformName, setPlatformName] = useState('FRAOVIA Plataforma SaaS Multiclub');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(false);

  // 1. SUBSECCIÓN: VERSIONES
  if (subSection === 'plataforma_versiones') {
    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            Control de Versiones & Despliegues
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Solo el Superadmin puede aprobar, crear e implementar nuevas versiones sobre la arquitectura SaaS.
          </p>
        </div>

        {/* VERSIÓN EN PREPARACIÓN */}
        <div className="bg-[#0C162D] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-black text-white font-mono">VERSIÓN 2.4.0</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  🟡 En preparación
                </span>
              </div>
              <span className="text-xs text-slate-400">Versión actual en producción: v{publishedVersion}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                [REVISAR CAMBIOS]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPublishing(true);
                  setTimeout(() => {
                    setPublishedVersion('2.4.0');
                    setIsPublishing(false);
                  }, 800);
                }}
                disabled={isPublishing}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isPublishing ? 'PUBLICANDO...' : '[PUBLICAR]'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Lista de cambios */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Cambios de esta versión:
              </span>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Nuevo sistema de caja y arqueo simplificado</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Mejoras en fichas y carnets de socios</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Nuevas estadísticas ejecutivas sin saturación</span>
                </div>
              </div>
            </div>

            {/* Implementación y alcance */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Alcance de Implementación:
              </span>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={selectedTargetScope === 'one'} 
                    onChange={() => setSelectedTargetScope('one')} 
                    className="accent-amber-500" 
                  />
                  <span>Un club específico (Prueba piloto)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={selectedTargetScope === 'selected'} 
                    onChange={() => setSelectedTargetScope('selected')} 
                    className="accent-amber-500" 
                  />
                  <span>Clubes seleccionados</span>
                </label>
                <label className="flex items-center gap-2.5 text-white font-semibold cursor-pointer">
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={selectedTargetScope === 'all'} 
                    onChange={() => setSelectedTargetScope('all')} 
                    className="accent-amber-500" 
                  />
                  <span>● Todos los clubes de la plataforma</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. SUBSECCIÓN: FUNCIONES
  if (subSection === 'plataforma_funciones') {
    const defaultCatalog = [
      { name: 'Padrón de jugadores', status: 'activa' },
      { name: 'Cuotas y cobros', status: 'activa' },
      { name: 'Asistencia deportiva', status: 'activa' },
      { name: 'Caja y arqueos', status: 'activa' },
      { name: 'Tienda oficial', status: 'activa' },
      { name: 'Torneos y viajes', status: 'activa' },
      { name: 'Importación Excel', status: 'activa' },
      { name: 'WhatsApp automatizado', status: 'beta' },
      { name: 'Estadísticas avanzadas', status: 'beta' }
    ];

    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Catálogo de Funciones de FRAOVIA
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración de disponibilidad por plan comercial (BÁSICO, PRO, BUSINESS, ENTERPRISE) o asignación experimental.
          </p>
        </div>

        {/* CATÁLOGO DE FUNCIONES EN TABLA COMPACTA */}
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Módulos del Catálogo SaaS
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {defaultCatalog.length} funciones registradas
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {defaultCatalog.map((func) => (
              <div key={func.name} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${func.status === 'activa' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div>
                    <span className="font-bold text-white block">{func.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Estado: {func.status === 'activa' ? '🟢 Activa' : '🟡 Beta'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Disponibilidad por planes */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                      <span>BÁSICO</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                      <span>PRO</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                      <span>BUSINESS</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" defaultChecked={func.status === 'activa'} className="accent-amber-500 rounded" />
                      <span>ENTERPRISE</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EXPERIMENTALES / BETAS POR CLUB */}
        <div className="p-4 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Habilitación Experimental por Club
          </span>
          <div className="space-y-3">
            {allBetas.map(beta => (
              <div key={beta.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{beta.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                    {beta.code}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {allClubs.map(c => {
                    const isEnabled = beta.enabledClubIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onToggleBeta(beta.id, c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          isEnabled 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {c.name}: {isEnabled ? '🟢 Activo' : 'Inactivo'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. SUBSECCIÓN: CONFIGURACIÓN GLOBAL
  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400" />
          Configuración Global de FRAOVIA
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Parámetros que afectan exclusivamente a toda la plataforma (no pertenecen a un club individual).
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#0C162D] border border-slate-800 space-y-4 max-w-2xl text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Nombre de la Plataforma Global</label>
          <input
            type="text"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-bold text-white block">Modo Mantenimiento Global</span>
            <span className="text-[11px] text-slate-400">Suspende accesos temporalmente en toda la red de clubes.</span>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              maintenanceMode ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {maintenanceMode ? 'ACTIVADO' : 'DESACTIVADO'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-bold text-white block">Registro Público de Clubes</span>
            <span className="text-[11px] text-slate-400">Permitir altas directas desde la landing comercial.</span>
          </div>
          <button
            type="button"
            onClick={() => setAllowRegistration(!allowRegistration)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              allowRegistration ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {allowRegistration ? 'HABILITADO' : 'CERRADO (Solo Superadmin)'}
          </button>
        </div>
      </div>
    </div>
  );
};
