import React, { useState } from 'react';
import { 
  Calendar, 
  Lock, 
  CheckCircle, 
  Plus, 
  AlertTriangle, 
  History,
  Archive
} from 'lucide-react';
import { Club, Season, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';

interface SeasonsModuleProps {
  currentClub: Club;
  currentUser: User;
  seasons: Season[];
  onSeasonsUpdated: () => void;
}

export const SeasonsModule: React.FC<SeasonsModuleProps> = ({
  currentClub,
  currentUser,
  seasons,
  onSeasonsUpdated
}) => {
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonYear, setSeasonYear] = useState<number>(2027);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonName.trim()) return;
    try {
      await dataActions.createSeason(currentClub, { name: seasonName, year: seasonYear }, currentUser);
      setShowNewSeasonModal(false);
      setSeasonName('');
      onSeasonsUpdated();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear la temporada.');
    }
  };

  const handleCloseSeason = async (season: Season) => {
    if (confirm(`¿Confirmas el CIERRE de la ${season.name}? Los datos históricos se conservarán inmutables para consulta.`)) {
      try {
        await dataActions.closeSeason(currentClub, season, currentUser);
        onSeasonsUpdated();
      } catch (err: any) {
        alert(err.message || 'No se pudo cerrar la temporada.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-indigo-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Gestión de Temporadas Deportivas
            </span>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              Historial Preservado
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
            Ciclos y Años Deportivos de {currentClub.name}
          </h1>
          <p className="text-xs text-slate-400">
            Cerrar una temporada congela los balances y planillas sin perder historial ni eliminar datos.
          </p>
        </div>

        <button
          onClick={() => setShowNewSeasonModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Temporada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seasons.map((season) => {
          const isActiva = season.status === 'activa';
          const isCerrada = season.status === 'cerrada';

          return (
            <div
              key={season.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isActiva 
                  ? 'bg-slate-900 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/20' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-slate-100">{season.year}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    isActiva ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    isCerrada ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {season.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm">{season.name}</h4>
                <p className="text-xs text-slate-400">
                  Período: {season.startDate} al {season.endDate}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {isActiva ? (
                  <button
                    onClick={() => handleCloseSeason(season)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Cerrar Temporada
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5" /> Histórico Inmutable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showNewSeasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">Abrir Nueva Temporada</h3>
            <form onSubmit={handleCreateSeason} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Temporada Oficial 2027"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Año Calendario</label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSeasonModal(false)}
                  className="px-3 py-1.5 text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-xl"
                >
                  Crear Temporada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
