import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';
import { Player, SuspensionReason, SUSPENSION_REASON_LABELS } from '../../types/fraovia';

interface SuspendPlayerModalProps {
  player: Player | null;
  onCancel: () => void;
  onConfirm: (player: Player, reason: SuspensionReason, note: string) => void | Promise<void>;
}

/**
 * Pide el motivo antes de suspender a un deportista (impago, mal comportamiento, etc.).
 * Para rehabilitar no hace falta motivo: se hace directo desde el botón "Reactivar".
 */
export const SuspendPlayerModal: React.FC<SuspendPlayerModalProps> = ({ player, onCancel, onConfirm }) => {
  const [reason, setReason] = useState<SuspensionReason>('impago');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason === 'otro' && !note.trim()) {
      alert('Si elegís "Otro motivo", escribí cuál es.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(player, reason, note.trim());
      setNote('');
      setReason('impago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0C162D] border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Suspender deportista</h3>
              <p className="text-xs text-slate-300">
                {player.firstName} {player.lastName} · DNI {player.dni}
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Motivo de la suspensión</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as SuspensionReason)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
          >
            {(Object.keys(SUSPENSION_REASON_LABELS) as SuspensionReason[]).map((key) => (
              <option key={key} value={key}>
                {SUSPENSION_REASON_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">
            Detalle {reason === 'otro' ? '(obligatorio)' : '(opcional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Ej: faltó el respeto al profesor en el entrenamiento del martes"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer"
          >
            {saving ? 'Guardando…' : 'Confirmar suspensión'}
          </button>
        </div>
      </form>
    </div>
  );
};
