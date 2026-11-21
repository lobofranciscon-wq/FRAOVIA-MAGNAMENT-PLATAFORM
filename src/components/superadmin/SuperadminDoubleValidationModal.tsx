import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  X, 
  Key, 
  UserCheck, 
  Lock, 
  FileText, 
  Server, 
  CheckCircle2 
} from 'lucide-react';
import { User } from '../../types/fraovia';

export type ValidationActionType = 
  | 'RESET_PASSWORD' 
  | 'CHANGE_ROLE' 
  | 'TOGGLE_STATUS' 
  | 'CHANGE_SCOPE' 
  | 'TOGGLE_MULTI_SPORT' 
  | 'TOGGLE_SPORT';

export interface PendingModification {
  type: ValidationActionType;
  title: string;
  description: string;
  targetEntityName: string;
  targetEntityDetail?: string;
  previousValue?: string;
  newValue: string;
  impactLevel: 'CRÍTICO' | 'ALTO' | 'MEDIO';
  onConfirm: () => void;
}

interface SuperadminDoubleValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingChange: PendingModification | null;
  currentUser: User;
  clubName: string;
}

export const SuperadminDoubleValidationModal: React.FC<SuperadminDoubleValidationModalProps> = ({
  isOpen,
  onClose,
  pendingChange,
  currentUser,
  clubName
}) => {
  if (!isOpen || !pendingChange) return null;

  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [securityInput, setSecurityInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const REQUIRED_CONFIRM_WORD = 'CONFIRMAR';
  const isSecurityWordValid = securityInput.trim().toUpperCase() === REQUIRED_CONFIRM_WORD;
  const canApply = confirmedCheck && isSecurityWordValid && !isProcessing;

  const handleApplyChange = () => {
    if (!canApply) {
      setErrorMsg(`Debes marcar la casilla y escribir exactamente "${REQUIRED_CONFIRM_WORD}".`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    // Simulate backend synchronization with atomic certainty
    setTimeout(() => {
      try {
        pendingChange.onConfirm();
        setIsProcessing(false);
        onClose();
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMsg(err.message || 'Error al persistir el cambio en el backend');
      }
    }, 400);
  };

  const getImpactBadge = () => {
    switch (pendingChange.impactLevel) {
      case 'CRÍTICO':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'ALTO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-[#0A1124] border-2 border-amber-500/50 rounded-3xl w-full max-w-lg shadow-2xl text-white overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border-b border-amber-500/30 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Doble Validación Requerida
                </span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${getImpactBadge()}`}>
                  Impacto {pendingChange.impactLevel}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                Confirmación de Seguridad Superadmin
              </h3>
              <span className="text-xs text-slate-300">
                Club: <strong className="text-white">{clubName}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Action Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase font-mono text-[10px] tracking-wider font-bold">
                Operación Solicitada:
              </span>
              <span className="font-bold text-amber-300">{pendingChange.title}</span>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed">
              {pendingChange.description}
            </div>

            {/* Entity Affected */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Entidad afectada:</span>
                <strong className="text-white font-mono">{pendingChange.targetEntityName}</strong>
              </div>
              {pendingChange.targetEntityDetail && (
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {pendingChange.targetEntityDetail}
                </div>
              )}
            </div>

            {/* Change Comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {pendingChange.previousValue && (
                <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/20">
                  <span className="text-[9px] text-rose-300 uppercase block font-mono font-bold">Anterior:</span>
                  <span className="text-slate-300 font-mono font-bold truncate block">{pendingChange.previousValue}</span>
                </div>
              )}
              <div className={`p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 ${!pendingChange.previousValue ? 'col-span-2' : ''}`}>
                <span className="text-[9px] text-emerald-300 uppercase block font-mono font-bold">Nuevo Valor a Persistir:</span>
                <span className="text-emerald-300 font-mono font-black truncate block">{pendingChange.newValue}</span>
              </div>
            </div>
          </div>

          {/* Audit Trail Guarantee Notice */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
            <Server className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-blue-300 block">Trazabilidad Inmutable en Backend</strong>
              Esta modificación será asentada en los registros de auditoría del club a nombre de{' '}
              <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.role}) con marca temporal y validación de seguridad.
            </div>
          </div>

          {/* Step 1: Explicit Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0 mt-0.5 cursor-pointer"
            />
            <span className="text-xs text-slate-200 leading-tight">
              Entiendo el impacto de esta acción y confirmo que está autorizada por las directivas del club para aplicarse de inmediato en el servidor.
            </span>
          </label>

          {/* Step 2: Verification Input Word */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 flex items-center justify-between">
              <span>Para proceder, escribí la palabra <strong className="text-amber-400 font-mono">CONFIRMAR</strong>:</span>
              {isSecurityWordValid && (
                <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Correcto
                </span>
              )}
            </label>
            <input
              type="text"
              value={securityInput}
              onChange={(e) => setSecurityInput(e.target.value)}
              placeholder="Escribe CONFIRMAR aquí"
              className={`w-full bg-slate-950 border ${
                isSecurityWordValid ? 'border-emerald-500' : 'border-slate-700'
              } rounded-xl px-3 py-2 text-xs text-white font-mono tracking-wider uppercase focus:outline-none transition`}
            />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApplyChange}
            disabled={!canApply}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg ${
              canApply
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Guardando en Backend...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Confirmar y Guardar en Backend</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
