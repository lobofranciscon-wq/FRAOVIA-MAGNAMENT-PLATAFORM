import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Check, 
  AlertTriangle, 
  Eye, 
  Users, 
  Wallet, 
  ShoppingBag, 
  FileText, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types/fraovia';
import { ROLE_PERMISSIONS_MATRIX } from '../../services/rbac';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  isOpen,
  onClose,
  currentRole
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole === 'GENERAL' ? 'DUEÑO' : currentRole);

  if (!isOpen) return null;

  // The 4 official club roles + Superadmin platform governor
  const displayRoles: { role: UserRole; label: string; isClubRole: boolean }[] = [
    { role: 'DUEÑO', label: '1. Dueño o Gerente', isClubRole: true },
    { role: 'ADMINISTRACIÓN', label: '2. Administración', isClubRole: true },
    { role: 'TIENDA', label: '3. Tienda', isClubRole: true },
    { role: 'PROFESOR', label: '4. Profesor', isClubRole: true },
    { role: 'SUPERADMIN', label: 'SuperAdmin FRAOVIA', isClubRole: false }
  ];

  const roleData = ROLE_PERMISSIONS_MATRIX[selectedRole];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                4 Roles del Club & Desglose de Responsabilidades
              </h2>
              <p className="text-xs text-slate-400">
                Límites y facultades diferenciadas para garantizar la integridad institucional.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Roles Selector Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          {displayRoles.map((item) => (
            <button
              key={item.role}
              onClick={() => setSelectedRole(item.role)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedRole === item.role
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item.label}</span>
              {item.isClubRole && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 text-blue-200">
                  Club
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-300">
          {/* Role Header Banner */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{roleData.displayName}</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${roleData.badgeColor}`}>
                  {roleData.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{roleData.description}</p>
            </div>

            {roleData.isScopedToAssignedCategoriesOnly && (
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 whitespace-nowrap">
                Alcance Restringido a Categorías Asignadas
              </span>
            )}
          </div>

          {/* Breakdown of responsibilities */}
          {roleData.breakdown && (
            <div className="p-4 bg-blue-950/20 rounded-2xl border border-blue-900/40 space-y-2.5">
              <span className="font-bold text-blue-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Desglose Operativo del Sector: {roleData.breakdown.sector}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {roleData.breakdown.responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{resp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities vs Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allowed Capabilities */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Check className="w-4 h-4" /> Facultades Habilitadas
              </span>
              <ul className="space-y-2 text-slate-300 text-[11px]">
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Acceso a Caja General del Club</span>
                  <span className={roleData.canAccessGeneralCash ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canAccessGeneralCash ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Emisión de Recibos Oficiales</span>
                  <span className={roleData.canEmitReceipts ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canEmitReceipts ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Anulación de Recibos (Contraasiento)</span>
                  <span className={roleData.canVoidReceipts ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canVoidReceipts ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Toma de Asistencia Deportiva</span>
                  <span className={roleData.canTakeAttendance ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canTakeAttendance ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Punto de Venta Mostrador (POS)</span>
                  <span className={roleData.canProcessStoreSale ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canProcessStoreSale ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50">
                  <span>Cierre de Temporada Deportiva</span>
                  <span className={roleData.canCloseSeason ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {roleData.canCloseSeason ? 'AUTORIZADO' : 'DENEGADO'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Strict Limitations */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Lock className="w-4 h-4" /> Limitaciones & Bloqueos de Seguridad
              </span>
              <ul className="space-y-2 text-slate-300 text-[11px]">
                {roleData.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/15 border border-rose-900/30">
                    <span className="text-rose-400 font-bold mt-0.5">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Los 4 roles operan con políticas de Row Level Security (RLS) en la base de datos PostgreSQL.</span>
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
