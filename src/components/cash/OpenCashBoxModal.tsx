import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  DollarSign, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Coins, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CashBox, Club, User } from '../../types/fraovia';
import { supabaseDataService, formatSupabaseError } from '../../services/supabaseDataService';
import { supabaseAuditService } from '../../services/supabaseAuditService';
import { useAppTheme } from '../../context/ThemeContext';

interface OpenCashBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  cashBoxes: CashBox[];
  selectedBoxId?: string;
  onBoxOpened: (updatedBox: CashBox) => void;
}

const PRESET_AMOUNTS = [50000, 100000, 150000, 200000, 300000];

export const OpenCashBoxModal: React.FC<OpenCashBoxModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  cashBoxes,
  selectedBoxId,
  onBoxOpened
}) => {
  const { theme } = useAppTheme();
  const [boxId, setBoxId] = useState<string>(selectedBoxId || cashBoxes[0]?.id || '');
  const [initialCash, setInitialCash] = useState<number>(150000);
  const [shiftName, setShiftName] = useState<string>('Turno Mañana (08:00 - 14:00)');
  const [notes, setNotes] = useState<string>('Fondo fijo de cambio inicial en billetes para operaciones del día.');
  const [useBillBreakdown, setUseBillBreakdown] = useState<boolean>(false);

  // Bill breakdown state (denominations in Argentine Pesos)
  const [bills, setBills] = useState<{ [denom: number]: number }>({
    20000: 4,
    10000: 5,
    2000: 5,
    1000: 10,
    500: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Solo DUEÑO y ADMINISTRACIÓN las administran
  const canManage = ['DUEÑO', 'ADMINISTRACIÓN'].includes(currentUser.role);
  if (!canManage) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-sm">
          <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">Permiso Denegado</h4>
          <p className="text-xs text-slate-400 mt-1">Solo los roles DUEÑO y ADMINISTRACIÓN pueden abrir y administrar cajas.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cerrar</button>
        </div>
      </div>
    );
  }

  const currentBox = cashBoxes.find(b => b.id === boxId) || cashBoxes[0];

  const handleBillCountChange = (denom: number, count: number) => {
    const updated = { ...bills, [denom]: Math.max(0, count) };
    setBills(updated);
    const sum = Object.entries(updated).reduce((acc, [d, q]) => acc + (Number(d) * q), 0);
    setInitialCash(sum);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBox) return;

    if (initialCash < 0) {
      alert('El saldo inicial en efectivo no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Marcar caja como abierta en Supabase (sin enviar current_balance)
      const openedBox = await supabaseDataService.updateCashBoxStatus(currentBox.id, 'abierta');

      // 2. Si se ingresó fondo fijo inicial en efectivo (> 0), registrar movimiento de ingreso
      if (initialCash > 0) {
        await supabaseDataService.createCashMovement({
          clubId: currentClub.id,
          cashBoxId: currentBox.id,
          type: 'ingreso',
          amount: initialCash,
          concept: `Fondo fijo de apertura - ${shiftName}`,
          category: 'otro',
          paymentMethod: 'efectivo',
          registeredByUserId: currentUser.id,
          notes: notes || undefined
        });
      }

      // 3. Auditoría inmutable
      await supabaseAuditService.logAudit({
        clubId: currentClub.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        action: 'APERTURA_CAJA',
        detail: `Apertura de turno en caja "${currentBox.name}". Turno: ${shiftName}. Fondo inicial: $${initialCash}.`,
        category: 'caja'
      });

      onBoxOpened(openedBox);
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
      <div className={`border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header with vibrant cashier styling */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Tesorería & Arqueo
                </span>
                <span className="text-xs text-emerald-100 hidden sm:inline">
                  {currentClub.name}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Apertura de Caja & Saldo Inicial
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          
          {/* Target Cash Box Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
              Seleccionar Caja o Subpunto a Abrir *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cashBoxes.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBoxId(b.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    b.id === currentBox?.id
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-bold block truncate text-xs">{b.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{b.type} · Saldo: ${b.currentBalance.toLocaleString('es-AR')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    b.status === 'abierta' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {b.status === 'abierta' ? 'Abierta' : 'Cerrada'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Inicial en Efectivo (Core feature requested by user) */}
          <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Saldo Inicial en Efectivo ($) *</span>
              </label>
              <button
                type="button"
                onClick={() => setUseBillBreakdown(!useBillBreakdown)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{useBillBreakdown ? 'Ingreso directo' : 'Desglose por billetes'}</span>
              </button>
            </div>

            {/* Direct Number Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min={0}
                step={100}
                required
                value={initialCash}
                onChange={(e) => setInitialCash(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-xl sm:text-2xl font-black focus:outline-none focus:border-emerald-500"
                placeholder="150000"
              />
            </div>

            {/* Fast Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Montos sugeridos:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCash(amt)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition cursor-pointer ${
                    initialCash === amt
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            {/* Optional Bill Breakdown Table */}
            {useBillBreakdown && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Conteo de Billetes Físicos en Caja:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[20000, 10000, 2000, 1000, 500].map((denom) => (
                    <div key={denom} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-300">${denom.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">x</span>
                        <input
                          type="number"
                          min={0}
                          value={bills[denom] || 0}
                          onChange={(e) => handleBillCountChange(denom, parseInt(e.target.value) || 0)}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-white py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Turno y Horario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Turno / Franja Horaria
              </label>
              <select
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="Turno Mañana (08:00 - 14:00)">Turno Mañana (08:00 - 14:00)</option>
                <option value="Turno Tarde (14:00 - 20:00)">Turno Tarde (14:00 - 20:00)</option>
                <option value="Turno Noche (20:00 - 00:00)">Turno Noche (20:00 - 00:00)</option>
                <option value="Jornada de Partido / Torneo">Jornada de Partido / Torneo</option>
                <option value="Turno Continuo">Turno Continuo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Responsable de la Apertura
              </label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs flex items-center justify-between">
                <span className="font-bold">{currentUser.fullName}</span>
                <span className="text-[10px] text-sky-400 font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Observaciones / Justificación de Apertura
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle o número de precinto si corresponde..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Security & Audit Notice */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold block">Registro Contable Oficial</span>
              <span>
                Esta apertura quedará asentada en el libro de auditoría inmutable del club con el usuario <strong>{currentUser.fullName}</strong> y generará el movimiento inicial en efectivo de <strong>${initialCash.toLocaleString('es-AR')}</strong>.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Abriendo...' : `Confirmar Apertura ($${initialCash.toLocaleString('es-AR')})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
