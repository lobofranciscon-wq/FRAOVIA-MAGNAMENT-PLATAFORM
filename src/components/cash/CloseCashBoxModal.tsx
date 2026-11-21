import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Calculator, 
  Coins, 
  FileText
} from 'lucide-react';
import { CashBox, Club, User } from '../../types/fraovia';
import { supabaseDataService, formatSupabaseError } from '../../services/supabaseDataService';
import { supabaseAuditService } from '../../services/supabaseAuditService';
import { useAppTheme } from '../../context/ThemeContext';

interface CloseCashBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  cashBox: CashBox;
  onBoxClosed: (updatedBox: CashBox) => void;
}

export const CloseCashBoxModal: React.FC<CloseCashBoxModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  cashBox,
  onBoxClosed
}) => {
  const { theme } = useAppTheme();
  const [countedCash, setCountedCash] = useState<number>(cashBox.currentBalance);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Solo DUEÑO y ADMINISTRACIÓN las administran
  const canManage = ['DUEÑO', 'ADMINISTRACIÓN'].includes(currentUser.role);
  if (!canManage) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">Permiso Denegado</h4>
          <p className="text-xs text-slate-400 mt-1">Solo los roles DUEÑO y ADMINISTRACIÓN pueden cerrar cajas.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cerrar</button>
        </div>
      </div>
    );
  }

  const systemBalance = cashBox.currentBalance;
  const difference = countedCash - systemBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash < 0) {
      alert('El monto contado no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Cierre en Supabase sin tocar current_balance
      const closed = await supabaseDataService.updateCashBoxStatus(cashBox.id, 'cerrada');

      // 2. Bitácora de auditoría inmutable
      await supabaseAuditService.logAudit({
        clubId: currentClub.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        action: 'CIERRE_CAJA',
        detail: `Cierre de caja "${cashBox.name}". Saldo sistema: $${systemBalance}. Contado: $${countedCash}. Diferencia: $${difference}. ${notes ? `Obs: ${notes}` : ''}`,
        category: 'caja'
      });

      onBoxClosed(closed);
      onClose();
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-800 via-slate-900 to-purple-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-slate-200 font-bold">
                Arqueo & Cierre de Turno
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Cierre de Caja: {cashBox.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo en Sistema</span>
              <span className="text-lg font-black text-white font-mono block mt-0.5">
                ${systemBalance.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Estado Actual</span>
              <span className="text-lg font-black text-amber-400 font-mono block mt-0.5 uppercase">
                {cashBox.status}
              </span>
            </div>
          </div>

          {/* Counted Cash Input */}
          <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 space-y-2">
            <label className="text-xs font-black uppercase text-amber-400 flex items-center justify-between">
              <span>Dinero Físico Contado en Caja ($) *</span>
              <Coins className="w-4 h-4" />
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min={0}
                required
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-xl font-black focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Difference indicator */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              difference === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : difference > 0
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span>Diferencia de Arqueo:</span>
              <span className="font-mono">
                {difference === 0 ? 'Exacto ($0)' : difference > 0 ? `Sobrante: +$${difference.toLocaleString('es-AR')}` : `Faltante: -$${Math.abs(difference).toLocaleString('es-AR')}`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Observaciones de Cierre / Justificación
            </label>
            <input
              type="text"
              placeholder="ej: Recuento verificado con tesorería, fondo retirado al sobre #12"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Caja'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
