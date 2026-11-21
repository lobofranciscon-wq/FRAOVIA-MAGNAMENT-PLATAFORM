import React, { useState } from 'react';
import { 
  Rocket, 
  X, 
  Building2, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Search,
  Sparkles
} from 'lucide-react';
import { Club } from '../../../types/fraovia';
import { SavedDesign } from './visualEditorTypes';

interface PublishDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: SavedDesign;
  currentClub: Club;
  allClubs: Club[];
  onConfirmPublish: (
    target: 'this_club' | 'selected_clubs' | 'all_clubs',
    selectedClubIds: string[]
  ) => void;
}

export const PublishDesignModal: React.FC<PublishDesignModalProps> = ({
  isOpen,
  onClose,
  design,
  currentClub,
  allClubs,
  onConfirmPublish
}) => {
  const [targetScope, setTargetScope] = useState<'this_club' | 'selected_clubs' | 'all_clubs'>('this_club');
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([currentClub.id]);
  const [clubSearch, setClubSearch] = useState('');

  if (!isOpen) return null;

  const toggleClubSelection = (clubId: string) => {
    setSelectedClubIds(prev => 
      prev.includes(clubId) 
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const filteredClubs = allClubs.filter(c => 
    c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
    c.slug.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const handleConfirm = () => {
    if (targetScope === 'selected_clubs' && selectedClubIds.length === 0) {
      alert('Por favor selecciona al menos un club para aplicar el diseño.');
      return;
    }
    onConfirmPublish(targetScope, selectedClubIds);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Rocket className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                IMPLEMENTAR DISEÑO
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {design.currentVersion}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Diseño: <strong className="text-slate-200">"{design.name}"</strong>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destino de la publicación */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            ¿Dónde querés aplicar este diseño?
          </label>

          <div className="space-y-2">
            {/* Opción 1: Solo este club */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
              targetScope === 'this_club'
                ? 'bg-amber-500/10 border-amber-500/40 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="targetScope"
                checked={targetScope === 'this_club'}
                onChange={() => setTargetScope('this_club')}
                className="mt-1 accent-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-white">
                  Solo este club ({currentClub.name})
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Aplica exclusivamente a la interfaz visual del club que estás editando.
                </span>
              </div>
            </label>

            {/* Opción 2: Clubes seleccionados */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
              targetScope === 'selected_clubs'
                ? 'bg-amber-500/10 border-amber-500/40 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="targetScope"
                checked={targetScope === 'selected_clubs'}
                onChange={() => setTargetScope('selected_clubs')}
                className="mt-1 accent-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-white">
                  Clubes seleccionados
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Elige específicamente qué instituciones adoptarán esta composición gráfica.
                </span>
              </div>
            </label>

            {/* Si elige seleccionados, desplegar lista */}
            {targetScope === 'selected_clubs' && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar club..."
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredClubs.map(c => {
                    const isSelected = selectedClubIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleClubSelection(c.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                          isSelected 
                            ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30' 
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.logoUrl && c.logoUrl.trim() ? (
                            <img src={c.logoUrl} alt={c.name} className="w-5 h-5 rounded-md object-contain bg-slate-950" />
                          ) : (
                            <div className="w-5 h-5 rounded-md bg-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-400">
                              {c.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <span className="font-semibold">{c.name}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {selectedClubIds.length} club(es) seleccionado(s)
                </div>
              </div>
            )}

            {/* Opción 3: Todos los clubes */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
              targetScope === 'all_clubs'
                ? 'bg-amber-500/10 border-amber-500/40 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}>
              <input
                type="radio"
                name="targetScope"
                checked={targetScope === 'all_clubs'}
                onChange={() => setTargetScope('all_clubs')}
                className="mt-1 accent-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-white">
                  Todos los clubes ({allClubs.length} instituciones)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Aplica este diseño como estándar global en toda la red FRAOVIA.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Nota de Seguridad */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Garantía de Aislamiento:</strong> Esta acción solamente actualiza la capa de presentación visual. La base de datos, los permisos por rol y las políticas RLS permanecen intactas e inalteradas.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <Rocket className="w-4 h-4 stroke-[2.5]" />
            <span>Confirmar implementación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
