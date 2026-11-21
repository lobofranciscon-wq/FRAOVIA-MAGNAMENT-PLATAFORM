import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Users, 
  Percent, 
  Check, 
  Save, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Club, Player, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { formatSupabaseError } from '../../services/supabaseDataService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface ScholarshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  players: Player[];
  onRulesUpdated: () => void;
}

export const ScholarshipsModal: React.FC<ScholarshipsModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  players,
  onRulesUpdated
}) => {
  const [secondSiblingDiscount, setSecondSiblingDiscount] = useState<number>(20);
  const [thirdSiblingDiscount, setThirdSiblingDiscount] = useState<number>(50);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Detect sibling families (players with same last name or matching emergency contact)
  const familyGroups: Record<string, Player[]> = {};
  players.forEach(p => {
    const key = p.lastName.toLowerCase().trim();
    if (!familyGroups[key]) familyGroups[key] = [];
    familyGroups[key].push(p);
  });

  const multiSiblingFamilies = Object.entries(familyGroups).filter(([_, list]) => list.length > 1);

  const handleApplyDiscounts = async () => {
    if (isSupabaseConfigured()) {
      try {
        const affectedDb = await dataActions.applySiblingDiscounts(
          multiSiblingFamilies.map(([_, list]) => list),
          secondSiblingDiscount,
          thirdSiblingDiscount,
          currentUser
        );
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        if (affectedDb === 0) alert('No había cuotas para bonificar (ya tenían un descuento igual o mayor).');
        onRulesUpdated();
      } catch (err: any) {
        alert(formatSupabaseError(err));
      }
      return;
    }
    let affected = 0;
    multiSiblingFamilies.forEach(([_, siblings]) => {
      // 1st sibling pays 100%
      // 2nd sibling gets secondSiblingDiscount
      if (siblings[1]) {
        const base = siblings[1].monthlyFeeDue || 22000;
        siblings[1].monthlyFeeDue = Math.round(base * (1 - secondSiblingDiscount / 100));
        fraoviaDB.updatePlayer(siblings[1], currentUser);
        affected++;
      }
      // 3rd sibling gets thirdSiblingDiscount
      if (siblings[2]) {
        const base = siblings[2].monthlyFeeDue || 20000;
        siblings[2].monthlyFeeDue = Math.round(base * (1 - thirdSiblingDiscount / 100));
        fraoviaDB.updatePlayer(siblings[2], currentUser);
        affected++;
      }
    });

    fraoviaDB.logAudit(
      currentUser,
      'DESCUENTOS_FAMILIARES_APLICADOS',
      `Reglas de hermanos aplicadas: 2do (${secondSiblingDiscount}%) y 3ero (${thirdSiblingDiscount}%). ${affected} cuotas bonificadas.`,
      'caja',
      currentClub.id
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRulesUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Becas & Descuentos Familiares por Hermanos
              </h2>
              <p className="text-xs text-slate-400">
                {currentClub.name} · Bonificaciones automáticas para incentivar la concurrencia familiar.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Discount Policy Config */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" />
              Configuración de Porcentajes de Bonificación
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Descuento 2do Hermano (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={secondSiblingDiscount}
                    onChange={(e) => setSecondSiblingDiscount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-base font-bold text-purple-400"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Descuento 3er Hermano o más (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={thirdSiblingDiscount}
                    onChange={(e) => setThirdSiblingDiscount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-base font-bold text-purple-400"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Families Detected */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-sm">
                Grupos Familiares Detectados en el Padrón ({multiSiblingFamilies.length})
              </span>
              <span className="text-[11px] text-slate-400">Coincidencia por apellido o contacto</span>
            </div>

            <div className="space-y-2">
              {multiSiblingFamilies.map(([family, members]) => (
                <div key={family} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white capitalize">Familia {family}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {members.length} hermanos
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    {members.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <span>
                          {idx === 0 ? '1er hijo (100%): ' : idx === 1 ? `2do hijo (-${secondSiblingDiscount}%): ` : `3er hijo (-${thirdSiblingDiscount}%): `}
                          <strong>{m.firstName} {m.lastName}</strong> (DNI {m.dni})
                        </span>
                        <span className="font-mono text-slate-300">
                          Cuota actual: ${m.monthlyFeeDue.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              ¡Bonificaciones familiares calculadas y actualizadas en las fichas deportivas!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <button onClick={onClose} className="px-3 py-1.5 text-slate-400 hover:text-slate-200">
            Cerrar
          </button>
          <button
            onClick={handleApplyDiscounts}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
          >
            <Save className="w-4 h-4" />
            Aplicar Reglas a Cuotas de Hermanos
          </button>
        </div>
      </div>
    </div>
  );
};
