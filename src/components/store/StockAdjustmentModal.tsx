import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { StoreProduct, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StoreProduct | null;
  currentUser: User;
  onStockUpdated: (product: StoreProduct) => void;
}

const REASONS = [
  'Ingreso de mercadería / Proveedor',
  'Ajuste por conteo físico de inventario',
  'Devolución de cliente',
  'Merma / Daño / Exhibición'
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  currentUser,
  onStockUpdated
}) => {
  const { theme } = useAppTheme();
  if (!isOpen || !product) return null;

  const [delta, setDelta] = useState<number>(10);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  const newStock = Math.max(0, product.stock + delta);

  const [isSaving, setIsSaving] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (delta === 0) {
      alert('El ajuste de unidades debe ser diferente de 0.');
      return;
    }

    setIsSaving(true);
    try {
      const fullReason = customNote ? `${reason} (${customNote})` : reason;
      const updated = await dataActions.adjustStoreStock(product, delta, fullReason, currentUser);
      onStockUpdated(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al ajustar stock');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">Ajuste de Stock e Ingreso</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-black/20 hover:bg-black/30 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs">
          <div>
            <span className="text-[10px] text-orange-400 font-mono uppercase block">{product.sku}</span>
            <h4 className="font-black text-white text-sm mt-0.5">{product.name}</h4>
            <span className="text-slate-400">Stock registrado actual: <strong>{product.stock} unidades</strong></span>
          </div>

          {/* Quick buttons */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Atajos rápidos de ingreso:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[+5, +10, +25, +50].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setDelta(qty)}
                  className={`py-1.5 rounded-xl font-bold font-mono transition cursor-pointer border ${
                    delta === qty ? 'bg-orange-500 text-slate-950 border-orange-400' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Delta input */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Cantidad a modificar (positiva suma, negativa resta):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDelta(prev => prev - 1)}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-base hover:bg-slate-800 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-center text-white font-mono font-bold text-base"
              />
              <button
                type="button"
                onClick={() => setDelta(prev => prev + 1)}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-base hover:bg-slate-800 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* New Stock Preview */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Stock resultante después del ajuste:</span>
            <span className="text-base font-black font-mono text-emerald-400">
              {newStock} unidades
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Motivo del ajuste *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observación adicional (opcional)</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="ej: Factura proveedor #9928"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
