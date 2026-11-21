import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Layers, 
  DollarSign, 
  Users, 
  HardDrive, 
  ShieldCheck, 
  Plus, 
  Check 
} from 'lucide-react';
import { CommercialPlan, Club, User } from '../../types/fraovia';

interface PlanConstructorModalProps {
  planToEdit: CommercialPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: CommercialPlan) => void;
  allClubs: Club[];
}

export const PlanConstructorModal: React.FC<PlanConstructorModalProps> = ({
  planToEdit,
  isOpen,
  onClose,
  onSave,
  allClubs
}) => {
  const [formData, setFormData] = useState<CommercialPlan>(() => {
    if (planToEdit) return { ...planToEdit };
    return {
      id: `plan-${Date.now()}`,
      name: 'NUEVO PLAN SAAS',
      description: 'Descripción del paquete de servicios para clubes deportivos.',
      status: 'activo',
      monthlyPrice: 75000,
      annualPrice: 750000,
      maxPlayers: 500,
      maxLoginUsers: 8,
      storageGb: 30,
      modules: {
        base: true,
        deportivo: true,
        caja: true,
        tienda: false
      },
      features: {
        excelImport: true,
        exportSystem: true,
        attendanceTracker: true,
        advancedStats: false,
        receipts: true,
        customBranding: false,
        subCashBoxes: false
      },
      addons: {
        playerBlockSize: 100,
        playerBlockPrice: 8000,
        extraUserPrice: 4000,
        extraStorageGbPrice: 1000
      },
      maxDisciplines: 5
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {planToEdit ? `Editar Plan Comercial: ${planToEdit.name}` : 'Nuevo Plan Comercial SaaS'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* 1. INFORMACIÓN GENERAL */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              1. Identificación y Estado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="activo">Activo (Comercializable)</option>
                  <option value="inactivo">Inactivo / Oculto</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción Comercial</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 2. PRECIOS */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              2. Precios y Facturación
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Mensual ($ ARS)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Anual ($ ARS)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.annualPrice}
                  onChange={(e) => setFormData({ ...formData, annualPrice: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. CAPACIDAD */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              3. Capacidad y Límites de Contrato
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Máx. Jugadores</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Usuarios con Login</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.maxLoginUsers}
                  onChange={(e) => setFormData({ ...formData, maxLoginUsers: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Almacenamiento (GB)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.storageGb}
                  onChange={(e) => setFormData({ ...formData, storageGb: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. MÓDULOS HABILITADOS */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">
              4. Módulos Incluidos en el Plan
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.keys(formData.modules).map((modKey) => (
                <label key={modKey} className="flex items-center gap-2 p-2.5 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.modules[modKey]}
                    disabled={modKey === 'base'} // Base siempre requerido
                    onChange={(e) => setFormData({
                      ...formData,
                      modules: { ...formData.modules, [modKey]: e.target.checked }
                    })}
                  />
                  <span className="capitalize font-semibold text-slate-200">{modKey}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. FUNCIONALIDADES ESPECÍFICAS */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">
              5. Funcionalidades & Herramientas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.excelImport}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, excelImport: e.target.checked }
                  })}
                />
                <span>Importación Excel</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.exportSystem}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, exportSystem: e.target.checked }
                  })}
                />
                <span>Exportación Avanzada</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.attendanceTracker}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, attendanceTracker: e.target.checked }
                  })}
                />
                <span>Toma de Asistencia</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.subCashBoxes}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, subCashBoxes: e.target.checked }
                  })}
                />
                <span>Subpuntos de Caja</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.customBranding}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, customBranding: e.target.checked }
                  })}
                />
                <span>Personalización / Logo</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-850 rounded-xl border border-slate-700/60">
                <input
                  type="checkbox"
                  checked={formData.features.advancedStats}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: { ...formData.features, advancedStats: e.target.checked }
                  })}
                />
                <span>Estadísticas Pro</span>
              </label>
            </div>
          </div>

          {/* 6. ADICIONALES Y EXTRAS */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">
              6. Bloques y Recursos Adicionales
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Tamaño Bloque Jugadores</label>
                <input
                  type="number"
                  value={formData.addons.playerBlockSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    addons: { ...formData.addons, playerBlockSize: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Precio x Bloque ($)</label>
                <input
                  type="number"
                  value={formData.addons.playerBlockPrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    addons: { ...formData.addons, playerBlockPrice: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Precio Usuario Extra ($)</label>
                <input
                  type="number"
                  value={formData.addons.extraUserPrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    addons: { ...formData.addons, extraUserPrice: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Precio GB Extra ($)</label>
                <input
                  type="number"
                  value={formData.addons.extraStorageGbPrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    addons: { ...formData.addons, extraStorageGbPrice: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 7. PLAN PERSONALIZADO PARA UN CLUB ESPECÍFICO */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">
              7. Asignación Especial
            </h4>
            <select
              value={formData.isCustomForClubId || ''}
              onChange={(e) => setFormData({ ...formData, isCustomForClubId: e.target.value || undefined })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
            >
              <option value="">Plan General Disponible para todos los Clubes</option>
              {allClubs.map(c => (
                <option key={c.id} value={c.id}>
                  Plan Personalizado Exclusivo para: {c.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración del Plan
          </button>
        </div>
      </div>
    </div>
  );
};
