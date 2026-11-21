import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Key, 
  UserCheck, 
  CheckCircle2, 
  Search, 
  Lock, 
  Shield, 
  Laptop, 
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { AuditLog, Club, User } from '../../types/fraovia';

interface SuperadminSecurityModuleProps {
  subSection: 'seguridad_auditoria' | 'seguridad_permisos' | 'seguridad_accesos';
  auditLogs: AuditLog[];
  allClubs: Club[];
  currentUser: User;
}

export const SuperadminSecurityModule: React.FC<SuperadminSecurityModuleProps> = ({
  subSection,
  auditLogs,
  allClubs,
  currentUser
}) => {
  const [auditSearch, setAuditSearch] = useState('');

  // 1. SUBSECCIÓN: AUDITORÍA
  if (subSection === 'seguridad_auditoria') {
    const filteredLogs = auditLogs.filter(log => {
      if (!auditSearch.trim()) return true;
      const term = auditSearch.toLowerCase();
      return (
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.detail.toLowerCase().includes(term)
      );
    });

    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Auditoría Global de Acciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico inmutable de operaciones sensibles en la plataforma.
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Tabla de Auditoría */}
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Usuario</th>
                  <th className="p-3.5">Club</th>
                  <th className="p-3.5">Acción</th>
                  <th className="p-3.5">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredLogs.map(log => {
                  const club = allClubs.find(c => c.id === log.clubId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {log.userName} <span className="text-[10px] text-slate-500 font-mono font-normal">({log.role})</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{club ? club.name : 'Plataforma'}</td>
                      <td className="p-3.5 font-semibold text-sky-400">{log.action}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          ✓ EXITOSO
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. SUBSECCIÓN: PERMISOS (RBAC)
  if (subSection === 'seguridad_permisos') {
    const rolesList = [
      { name: 'SUPERADMIN', scope: 'Control total de la plataforma y todas las instituciones' },
      { name: 'DUEÑO / GERENTE', scope: 'Gestión institucional completa, balances y configuración del club' },
      { name: 'ADMINISTRACIÓN', scope: 'Padrón de socios, cuotas, cobros, comprobantes y caja' },
      { name: 'PROFESOR', scope: 'Asistencias, categorías asignadas y fichas deportivas' },
      { name: 'TIENDA', scope: 'Caja de punto de venta, inventario y productos' }
    ];

    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            Matriz de Roles & Permisos (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Definición de privilegios globales aplicados mediante políticas Row Level Security.
          </p>
        </div>

        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs shadow-xl">
          {rolesList.map(r => (
            <div key={r.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-white text-xs block">{r.name}</span>
                <span className="text-[11px] text-slate-400">{r.scope}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 self-start sm:self-auto font-bold">
                ENFORCED RLS
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. SUBSECCIÓN: ACCESOS
  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          Control de Accesos & Sesiones Activas
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditoría de inicios de sesión, dispositivos concurrentes y prevención de accesos sospechosos.
        </p>
      </div>

      {/* Resumen de infraestructura de seguridad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#0C162D] border border-slate-800">
          <span className="text-slate-400 text-[10px] block font-semibold">Aislamiento de Clubes</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Operativo
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C162D] border border-slate-800">
          <span className="text-slate-400 text-[10px] block font-semibold">Control de Permisos</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Operativo
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C162D] border border-slate-800">
          <span className="text-slate-400 text-[10px] block font-semibold">Autenticación</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Operativa
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C162D] border border-slate-800">
          <span className="text-slate-400 text-[10px] block font-semibold">Auditoría Criptográfica</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Operativa
          </span>
        </div>
      </div>

      {/* Sesiones Recientes */}
      <div className="bg-[#0C162D] border border-slate-800 rounded-2xl p-4 space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Inicios de Sesión Recientes
        </span>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-sky-400" />
              <div>
                <span className="font-bold text-white block">francisco (Superadmin)</span>
                <span className="text-[11px] text-slate-400">Chrome en Linux · IP: 181.44.20.12</span>
              </div>
            </div>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">Activo ahora</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Clara Domínguez (Administración)</span>
                <span className="text-[11px] text-slate-400">Safari en iPhone · Club San Martín</span>
              </div>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Hace 4 min</span>
          </div>
        </div>
      </div>
    </div>
  );
};
