import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  ArrowRight, 
  Sliders, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { Club, CommercialPlan, User } from '../../types/fraovia';

interface SuperadminClubsListProps {
  allClubs: Club[];
  allPlans: CommercialPlan[];
  currentUser: User;
  onEnterClubView: (club: Club) => void;
  onNewClubClick: () => void;
  onEditClubClick: (club: Club) => void;
  onOpenVisualEditor?: (club: Club) => void;
}

export const SuperadminClubsList: React.FC<SuperadminClubsListProps> = ({
  allClubs,
  allPlans,
  currentUser,
  onEnterClubView,
  onNewClubClick,
  onEditClubClick,
  onOpenVisualEditor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'activo' | 'inactivo'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Filter clubs
  const filteredClubs = allClubs.filter(club => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match = club.name.toLowerCase().includes(term) || club.slug.toLowerCase().includes(term) || club.cuit.includes(term);
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && club.status !== statusFilter) {
      return false;
    }
    if (planFilter !== 'ALL' && club.subscriptionPlanId !== planFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              Gestión de Clubes
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {allClubs.length} totales
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Administración centralizada de organizaciones deportivas aisladas (Multi-Tenant RLS).
          </p>
        </div>

        <button
          type="button"
          onClick={onNewClubClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVO CLUB</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
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

        {/* Filtro por estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
        >
          <option value="ALL">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        {/* Filtro por plan */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
        >
          <option value="ALL">Todos los planes</option>
          {allPlans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* TABLA O LISTA PROFESIONAL DE CLUBES */}
      <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-4">CLUB</th>
                <th className="p-4">PLAN</th>
                <th className="p-4 text-center">JUGADORES</th>
                <th className="p-4 text-center">USUARIOS</th>
                <th className="p-4">ESTADO</th>
                <th className="p-4">ÚLTIMA ACTIVIDAD</th>
                <th className="p-4 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredClubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron clubes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredClubs.map((club, idx) => {
                  const plan = allPlans.find(p => p.id === club.subscriptionPlanId);
                  const isThird = idx === 2; // For mock 'Revisar' demonstration
                  const statusLabel = isThird ? 'Revisar' : club.status === 'activo' ? 'Activo' : 'Inactivo';
                  const statusColor = isThird 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : club.status === 'activo' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                  const lastActivity = idx === 0 ? 'Hace 4 min' : idx === 1 ? 'Hace 18 min' : idx === 2 ? 'Hace 10 min' : 'Hace 1 h';

                  return (
                    <tr 
                      key={club.id}
                      className="hover:bg-slate-900/50 transition"
                    >
                      {/* CLUB */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {club.logoUrl && club.logoUrl.trim() ? (
                            <img 
                              src={club.logoUrl} 
                              alt={club.name} 
                              className="w-9 h-9 rounded-xl object-contain bg-slate-950 border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                              {club.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white hover:text-sky-300 transition cursor-pointer" onClick={() => onEnterClubView(club)}>
                              {club.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {club.slug} · CUIT: {club.cuit}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PLAN */}
                      <td className="p-4">
                        <span className="font-bold text-amber-400">
                          {plan?.name || 'PRO'}
                        </span>
                      </td>

                      {/* JUGADORES */}
                      <td className="p-4 text-center font-mono font-bold text-slate-300">
                        {club.contractedPlayersQuota || 128}
                      </td>

                      {/* USUARIOS */}
                      <td className="p-4 text-center font-mono font-bold text-slate-300">
                        {club.contractedUsersQuota || 8}
                      </td>

                      {/* ESTADO */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isThird ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {statusLabel}
                        </span>
                      </td>

                      {/* ÚLTIMA ACTIVIDAD */}
                      <td className="p-4 text-slate-400 text-xs font-mono">
                        {lastActivity}
                      </td>

                      {/* ACCIÓN */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onOpenVisualEditor && (
                            <button
                              type="button"
                              onClick={() => onOpenVisualEditor(club)}
                              title="Abrir Editor Visual tipo Canva/Figma para este club"
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/30 transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span>🖌️</span>
                              <span className="hidden sm:inline">Diseño</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEnterClubView(club)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-1"
                          >
                            <span>ENTRAR</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditClubClick(club)}
                            title="Editar parámetros y configuración"
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
