import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, CheckCircle, Sliders } from 'lucide-react';
import { User, UserRole } from '../../types/fraovia';
import { ROLE_PERMISSIONS_MATRIX } from '../../services/rbac';

interface RestrictedSectorNoticeProps {
  attemptedSectorName: string;
  currentUser: User;
  onBackToAllowed: () => void;
}

export const RestrictedSectorNotice: React.FC<RestrictedSectorNoticeProps> = ({
  attemptedSectorName,
  currentUser,
  onBackToAllowed
}) => {
  const roleInfo = ROLE_PERMISSIONS_MATRIX[currentUser.role];

  return (
    <div className="p-6 max-w-xl mx-auto my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-5 text-center">
      <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
          Acceso Restringido por Política RBAC
        </span>
        <h2 className="text-lg font-bold text-white">
          Sector No Autorizado: {attemptedSectorName}
        </h2>
        <p className="text-xs text-slate-400">
          Tu rol actual <strong>({currentUser.role})</strong> no posee privilegios para interactuar con este módulo según la arquitectura de seguridad multi-rol de FRAOVIA.
        </p>
      </div>

      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-left space-y-2 text-xs">
        <span className="font-bold text-slate-300 block">Limitaciones de tu perfil:</span>
        <ul className="space-y-1.5 text-slate-400">
          {roleInfo.limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-rose-400 text-sm leading-none">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onBackToAllowed}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Panel Principal
        </button>
      </div>
    </div>
  );
};
