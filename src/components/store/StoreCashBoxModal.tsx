import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  Check, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Lock, 
  Unlock, 
  User as UserIcon,
  FileText
} from 'lucide-react';
import { CashBox, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface StoreCashBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'abrir' | 'cerrar';
  storeCashBox: CashBox;
  currentUser: User;
  onCashBoxUpdated: (box: CashBox) => void;
}

export const StoreCashBoxModal: React.FC<StoreCashBoxModalProps> = ({
  isOpen,
  onClose,
  mode,
  storeCashBox,
  currentUser,
  onCashBoxUpdated
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const isOpening = mode === 'abrir';

  // Opening form state
  const [shiftName, setShiftName] = useState('Turno Tienda Oficial');
  const [initialCash, setInitialCash] = useState<number>(15000);
  const [openNotes, setOpenNotes] = useState('Fondo inicial de efectivo para cambio de mostrador');

  // Closing form state
  const [countedCash, setCountedCash] = useState<number>(storeCashBox.currentBalance);
  const [closeNotes, setCloseNotes] = useState('');

  const difference = countedCash - storeCashBox.currentBalance;

  const [isSaving, setIsSaving] = useState(false);

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updatedBox = await dataActions.openStoreCashBox(
        storeCashBox,
        initialCash,
        shiftName,
        openNotes,
        currentUser
      );
      onCashBoxUpdated(updatedBox);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al abrir caja de tienda');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updatedBox = await dataActions.closeStoreCashBox(
        storeCashBox,
        countedCash,
        closeNotes,
        currentUser
      );
      onCashBoxUpdated(updatedBox);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al cerrar caja de tienda');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${
          isOpening 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
            : 'bg-gradient-to-r from-amber-600 to-rose-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              {isOpening ? <Unlock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                Caja Independiente de Tienda
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                {isOpening ? 'Apertura de Turno de Ventas' : 'Cierre de Caja & Arqueo'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        {isOpening ? (
          <form onSubmit={handleOpenSubmit} className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="font-bold block text-xs">Apertura Independiente de Mostrador</span>
              <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                Esta caja opera de manera autónoma respecto a la tesorería general del club, permitiendo controlar con precisión el fondo de cambio y las ventas de la tienda.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Nombre del Turno *</label>
              <input
                type="text"
                required
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="ej: Turno Mañana Tienda, Jornada Fin de Semana..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">
                Fondo Inicial en Efectivo para Cambio ($ ARS) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={initialCash}
                onChange={(e) => setInitialCash(Number(e.target.value))}
                className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl px-3 py-2.5 text-white font-mono font-black text-lg text-center"
              />
              <span className="text-[10px] text-slate-500 block">
                Dinero en billetes físicos con el que se inicia la caja para dar cambio a clientes.
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Responsable de Caja:</span>
              <span className="font-bold text-white font-mono">{currentUser.fullName}</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Observaciones iniciales</label>
              <input
                type="text"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar & Abrir Caja</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCloseSubmit} className="p-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Saldo teórico registrado en sistema:</span>
                <span className="font-black text-white font-mono text-base">
                  ${storeCashBox.currentBalance.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Incluye fondo inicial en efectivo y todas las ventas asentadas en este turno.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">
                Conteo Físico Real del Dinero en Efectivo ($ ARS) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full bg-slate-900 border border-amber-500/60 rounded-xl px-3 py-2.5 text-white font-mono font-black text-lg text-center"
              />
              <span className="text-[10px] text-slate-500 block">
                Total de billetes físicos contados al momento del arqueo de cierre.
              </span>
            </div>

            {/* Difference indicator */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono font-bold ${
              difference === 0 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                : difference > 0 
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}>
              <span>Diferencia de Arqueo:</span>
              <span className="text-sm">
                {difference === 0 ? '✓ Caja Exacta ($0)' : difference > 0 ? `+ $${difference.toLocaleString('es-AR')} (Sobrante)` : `- $${Math.abs(difference).toLocaleString('es-AR')} (Faltante)`}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Motivo / Notas de Cierre</label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="ej: Arqueo sin novedades, dinero guardado en tesorería"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Cerrar Caja & Finalizar Turno</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
