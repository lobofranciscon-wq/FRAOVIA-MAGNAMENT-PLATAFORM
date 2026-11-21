import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  Check, 
  AlertCircle, 
  DollarSign, 
  Percent, 
  Sparkles,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Category, Club, Player, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { formatSupabaseError } from '../../services/supabaseDataService';

interface PlayerScholarshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  categories: Category[];
  currentClub: Club;
  currentUser: User;
  onUpdated: () => void;
}

export const PlayerScholarshipModal: React.FC<PlayerScholarshipModalProps> = ({
  isOpen,
  onClose,
  player,
  categories,
  currentClub,
  currentUser,
  onUpdated
}) => {
  if (!isOpen || !player) return null;

  const category = categories.find(c => c.id === player.categoryId);
  const baseMonthlyFee = category?.monthlyFee || 22000;

  const [selectedType, setSelectedType] = useState<'ninguna' | 'media' | 'completa' | 'personalizada'>('ninguna');
  const [customPercent, setCustomPercent] = useState<number>(50);
  const [scholarshipReason, setScholarshipReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from player data
  useEffect(() => {
    if (player) {
      const p = player.scholarshipPercent ?? 0;
      if (p === 100) {
        setSelectedType('completa');
        setCustomPercent(100);
      } else if (p === 50) {
        setSelectedType('media');
        setCustomPercent(50);
      } else if (p > 0) {
        setSelectedType('personalizada');
        setCustomPercent(p);
      } else {
        setSelectedType('ninguna');
        setCustomPercent(0);
      }
      setScholarshipReason(player.scholarshipReason || '');
    }
  }, [player]);

  const activePercent = 
    selectedType === 'ninguna' ? 0 :
    selectedType === 'media' ? 50 :
    selectedType === 'completa' ? 100 :
    customPercent;

  // Exact math
  const discountAmount = Math.round(baseMonthlyFee * (activePercent / 100));
  const finalMonthlyFee = Math.max(0, baseMonthlyFee - discountAmount);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dataActions.setPlayerScholarship(
        player,
        activePercent,
        scholarshipReason.trim(),
        currentUser
      );
      onUpdated();
      onClose();
    } catch (err: any) {
      alert('Error al asignar beca: ' + formatSupabaseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-5 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>Becar Deportista</span>
                {activePercent > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activePercent === 100 ? 'Beca Completa (100%)' : `Beca ${activePercent}%`}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {player.firstName} {player.lastName} · DNI: {player.dni}
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

        {/* Info Strip: Category & Base Fee */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Categoría Asignada:</span>
            <strong className="text-white font-bold">{category?.name || 'General'}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[11px] block">Arancel Base Regular:</span>
            <strong className="text-amber-400 font-mono font-bold">${baseMonthlyFee.toLocaleString('es-AR')}/mes</strong>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Options */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 block">
              Seleccionar Nivel de Beca / Exención:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option 1: Sin Beca */}
              <div
                onClick={() => setSelectedType('ninguna')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedType === 'ninguna'
                    ? 'bg-slate-900 border-slate-500 ring-1 ring-slate-400'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Sin Beca (0%)</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedType === 'ninguna' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'}`}>
                    {selectedType === 'ninguna' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">Abona el arancel completo regular (${baseMonthlyFee.toLocaleString('es-AR')})</span>
              </div>

              {/* Option 2: Media Beca (50%) */}
              <div
                onClick={() => setSelectedType('media')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedType === 'media'
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-400 text-amber-200'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300 text-xs">Media Beca (50%)</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedType === 'media' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'}`}>
                    {selectedType === 'media' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[11px] text-slate-300">50% de bonificación institucional (-${(baseMonthlyFee * 0.5).toLocaleString('es-AR')})</span>
              </div>

              {/* Option 3: Beca Completa (100%) */}
              <div
                onClick={() => setSelectedType('completa')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-1 sm:col-span-2 ${
                  selectedType === 'completa'
                    ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-400 text-emerald-200'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-emerald-300 text-xs">Beca Completa (100% Exento)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedType === 'completa' ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-700'}`}>
                    {selectedType === 'completa' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[11px] text-emerald-300/90 font-medium">
                  ★ El deportista NO abona cuota mensual ($0/mes). Queda registrado en el padrón con cobertura 100%.
                </span>
              </div>

              {/* Option 4: Personalizada */}
              <div
                onClick={() => setSelectedType('personalizada')}
                className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 sm:col-span-2 ${
                  selectedType === 'personalizada'
                    ? 'bg-sky-500/15 border-sky-500/60 ring-1 ring-sky-400 text-sky-200'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300 text-xs">Porcentaje Personalizado</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedType === 'personalizada' ? 'border-sky-400 bg-sky-400 text-slate-950' : 'border-slate-700'}`}>
                    {selectedType === 'personalizada' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                {selectedType === 'personalizada' && (
                  <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Porcentaje de descuento:</span>
                      <strong className="font-mono text-sky-400 text-xs">{customPercent}% off</strong>
                    </div>
                    <input 
                      type="range"
                      min="5"
                      max="95"
                      step="5"
                      value={customPercent}
                      onChange={(e) => setCustomPercent(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>5%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>95%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CUADRO DE CERTEZA MATEMÁTICA Y NÚMEROS EXACTOS */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cálculo Exacto de Cuota Social</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800/80">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Arancel Base</span>
                <strong className="text-slate-200 font-mono text-xs">${baseMonthlyFee.toLocaleString('es-AR')}</strong>
              </div>

              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Bonificación ({activePercent}%)</span>
                <strong className="text-amber-400 font-mono text-xs">-${discountAmount.toLocaleString('es-AR')}</strong>
              </div>

              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <span className="text-[10px] text-amber-300 font-bold block">Cuota Neta Mensual</span>
                <strong className="text-white font-mono text-sm font-black">
                  {finalMonthlyFee === 0 ? '$0 (Exento)' : `$${finalMonthlyFee.toLocaleString('es-AR')}`}
                </strong>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-snug pt-1">
              ✓ <strong>Certeza contable:</strong> Este valor neto de <strong>${finalMonthlyFee.toLocaleString('es-AR')}</strong> es el que se aplicará automáticamente en los recibos, reportes y caja del club.
            </div>
          </div>

          {/* Motivo o resolución */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 text-xs">
                Motivo / Resolución de la Beca:
              </label>
              <div className="flex gap-1 text-[10px]">
                {['Mérito Deportivo', 'Beca Social', 'Hermanos'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setScholarshipReason(preset)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <input 
              type="text"
              placeholder="ej: Resolución directiva 14/2026 - Convocado a Selección"
              value={scholarshipReason}
              onChange={(e) => setScholarshipReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition cursor-pointer shadow-lg shadow-amber-500/25 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{activePercent === 0 ? 'Guardar sin Beca' : `Confirmar Beca (${activePercent}%)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
