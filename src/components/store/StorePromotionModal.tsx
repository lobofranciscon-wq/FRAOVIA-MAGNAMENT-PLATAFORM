import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Percent, 
  DollarSign, 
  Check, 
  Sparkles, 
  Calendar, 
  Layers, 
  ShoppingBag,
  Info
} from 'lucide-react';
import { Club, StoreProduct, StorePromotion, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface StorePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionToEdit?: StorePromotion | null;
  products: StoreProduct[];
  currentClub: Club;
  currentUser: User;
  onSaved: (promo: StorePromotion) => void;
}

const CATEGORIES = [
  'Indumentaria',
  'Accesorios',
  'Calzado',
  'Merchandising',
  'Equipamiento Deportivo'
];

export const StorePromotionModal: React.FC<StorePromotionModalProps> = ({
  isOpen,
  onClose,
  promotionToEdit,
  products,
  currentClub,
  currentUser,
  onSaved
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const isEditing = !!promotionToEdit;

  const [name, setName] = useState(promotionToEdit?.name || '');
  const [code, setCode] = useState(promotionToEdit?.code || '');
  const [type, setType] = useState<'porcentaje' | 'monto_fijo'>(promotionToEdit?.type || 'porcentaje');
  const [value, setValue] = useState<number>(promotionToEdit?.value || 15);
  const [appliesTo, setAppliesTo] = useState<'todo_el_catalogo' | 'categoria' | 'producto'>(promotionToEdit?.appliesTo || 'todo_el_catalogo');
  const [targetCategory, setTargetCategory] = useState<string>(promotionToEdit?.targetCategory || CATEGORIES[0]);
  const [targetProductId, setTargetProductId] = useState<string>(promotionToEdit?.targetProductId || products[0]?.id || '');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(promotionToEdit?.minPurchaseAmount || 0);
  const [status, setStatus] = useState<'activa' | 'pausada'>(promotionToEdit?.status || 'activa');

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      alert('Por favor ingrese el nombre de la promoción.');
      return;
    }
    if (value <= 0) {
      alert('El valor del descuento debe ser mayor a 0.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && promotionToEdit) {
        const updated = await dataActions.updateStorePromotion(
          promotionToEdit.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase() || undefined,
            type,
            value,
            appliesTo,
            targetCategory: appliesTo === 'categoria' ? targetCategory : undefined,
            targetProductId: appliesTo === 'producto' ? targetProductId : undefined,
            minPurchaseAmount: minPurchaseAmount > 0 ? minPurchaseAmount : undefined,
            status
          },
          currentUser
        );
        onSaved(updated);
      } else {
        const created = await dataActions.addStorePromotion(
          currentClub.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase() || undefined,
            type,
            value,
            appliesTo,
            targetCategory: appliesTo === 'categoria' ? targetCategory : undefined,
            targetProductId: appliesTo === 'producto' ? targetProductId : undefined,
            minPurchaseAmount: minPurchaseAmount > 0 ? minPurchaseAmount : undefined,
            status
          },
          currentUser
        );
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar promoción');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                {isEditing ? 'Editar Promoción' : 'Nueva Promoción Comercial'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {isEditing ? `Modificar: ${promotionToEdit.name}` : 'Crear Descuento / Promo'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Name & Code */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Nombre de la Promoción *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Descuento Socios al Día, Promo Fin de Año, 20% Indumentaria..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Cupón / Código opcional
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ej: SOCIO15, PROMO20"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold tracking-wider"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Estado inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="activa">🟢 Activa para cobros</option>
                <option value="pausada">⏸️ Pausada temporalmente</option>
              </select>
            </div>
          </div>

          {/* Type & Value */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Tipo y Magnitud del Descuento
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Modalidad</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType('porcentaje')}
                    className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      type === 'porcentaje'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Porcentaje</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('monto_fijo')}
                    className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      type === 'monto_fijo'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Monto Fijo</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">
                  {type === 'porcentaje' ? 'Porcentaje de descuento (%)' : 'Monto de descuento ($ ARS)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={type === 'porcentaje' ? 100 : undefined}
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-purple-500/60 rounded-xl px-3 py-2 text-white font-mono font-bold text-base text-center"
                />
              </div>
            </div>
          </div>

          {/* Scope / Applies To */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Alcance de la Promoción
            </span>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'todo_el_catalogo', label: 'Todo el Catálogo' },
                { id: 'categoria', label: 'Por Categoría' },
                { id: 'producto', label: 'Producto Específico' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAppliesTo(opt.id as any)}
                  className={`py-2 px-2 rounded-xl font-bold text-center transition cursor-pointer text-[11px] ${
                    appliesTo === opt.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {appliesTo === 'categoria' && (
              <div className="pt-2 animate-in fade-in">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Seleccionar Categoría:</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {appliesTo === 'producto' && (
              <div className="pt-2 animate-in fade-in">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Seleccionar Producto:</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.salePrice.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Min purchase amount */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Monto mínimo de compra requerido ($ opcional)
            </label>
            <input
              type="number"
              min="0"
              value={minPurchaseAmount}
              onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
              placeholder="0 = sin mínimo"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Promoción'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
