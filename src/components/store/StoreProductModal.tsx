import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Package, 
  Tag, 
  DollarSign, 
  Image as ImageIcon, 
  Layers, 
  Check, 
  AlertCircle, 
  Sparkles,
  Camera,
  Shirt,
  Percent,
  UploadCloud,
  Trash2
} from 'lucide-react';
import { Club, StoreProduct, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface StoreProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: StoreProduct | null;
  currentClub: Club;
  currentUser: User;
  onProductSaved: (product: StoreProduct) => void;
}

const CATEGORIES = [
  'Indumentaria',
  'Accesorios',
  'Calzado',
  'Merchandising',
  'Equipamiento Deportivo'
];

const PRESET_SIZES = ['4', '6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];

const SAMPLE_PRODUCT_IMAGES = [
  { name: 'Camiseta Titular', url: 'https://images.unsplash.com/photo-1577210897949-1f56f9435827?w=600&auto=format&fit=crop&q=80' },
  { name: 'Short Deportivo', url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80' },
  { name: 'Campera Térmica', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80' },
  { name: 'Gorra del Club', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80' },
  { name: 'Pelota Oficial', url: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=600&auto=format&fit=crop&q=80' },
  { name: 'Botella Térmica', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80' }
];

export const StoreProductModal: React.FC<StoreProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  currentClub,
  currentUser,
  onProductSaved
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const isEditing = !!productToEdit;

  const [name, setName] = useState(productToEdit?.name || '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [category, setCategory] = useState(productToEdit?.category || 'Indumentaria');
  const [costPrice, setCostPrice] = useState<number>(productToEdit?.costPrice || 8000);
  const [salePrice, setSalePrice] = useState<number>(productToEdit?.salePrice || 16000);
  const [minStockAlert, setMinStockAlert] = useState<number>(productToEdit?.minStockAlert || 5);
  const [imageUrl, setImageUrl] = useState(productToEdit?.imageUrl || SAMPLE_PRODUCT_IMAGES[0].url);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(productToEdit?.sizes || ['S', 'M', 'L', 'XL']);
  
  // Stock per size dictionary
  const [sizesStock, setSizesStock] = useState<Record<string, number>>(() => {
    if (productToEdit?.sizesStock && Object.keys(productToEdit.sizesStock).length > 0) {
      return { ...productToEdit.sizesStock };
    }
    const initialSizes = productToEdit?.sizes || ['S', 'M', 'L', 'XL'];
    const initialMap: Record<string, number> = {};
    const defaultQty = productToEdit ? Math.max(1, Math.floor(productToEdit.stock / (initialSizes.length || 1))) : 10;
    initialSizes.forEach(s => {
      initialMap[s] = defaultQty;
    });
    return initialMap;
  });

  const [customSizeInput, setCustomSizeInput] = useState<string>('');
  const [status, setStatus] = useState<'disponible' | 'agotado' | 'discontinuado'>(productToEdit?.status || 'disponible');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total stock is sum of sizes stock if sizes exist, else manual number
  const totalStock = selectedSizes.length > 0
    ? selectedSizes.reduce((acc, sz) => acc + (sizesStock[sz] ?? 0), 0)
    : (productToEdit?.stock || 0);

  // Calculate margin
  const marginPercent = costPrice > 0 ? Math.round(((salePrice - costPrice) / costPrice) * 100) : 0;
  const netProfit = salePrice - costPrice;

  useEffect(() => {
    if (!isEditing && !sku) {
      const prefix = currentClub.name.substring(0, 2).toUpperCase();
      const catCode = category.substring(0, 3).toUpperCase();
      const rnd = Math.floor(100 + Math.random() * 900);
      setSku(`${prefix}-${catCode}-${rnd}`);
    }
  }, [category, currentClub.name, isEditing, sku]);

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
      if (sizesStock[size] === undefined) {
        setSizesStock(prev => ({ ...prev, [size]: 10 }));
      }
    }
  };

  const handleSizeStockChange = (size: string, qty: number) => {
    setSizesStock(prev => ({
      ...prev,
      [size]: Math.max(0, qty)
    }));
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes([...selectedSizes, trimmed]);
      setSizesStock(prev => ({ ...prev, [trimmed]: 10 }));
      setCustomSizeInput('');
    }
  };

  // La foto se reduce antes de guardarla (máx. 480 px, JPEG): así la base no se llena de imágenes pesadas
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const src = uploadEvent.target?.result as string | undefined;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        const maxSide = 480;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { setImageUrl(src); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => alert('No se pudo leer la imagen. Probá con otro archivo (JPG o PNG).');
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      alert('Por favor ingrese el nombre del producto.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && productToEdit) {
        const updated = await dataActions.updateStoreProduct(
          productToEdit.id,
          {
            name: name.trim(),
            sku: sku.trim(),
            category,
            costPrice,
            salePrice,
            stock: totalStock,
            minStockAlert,
            imageUrl: imageUrl.trim() || undefined,
            sizes: selectedSizes,
            sizesStock: sizesStock,
            status: totalStock <= 0 ? 'agotado' : status,
            description: description.trim() || undefined
          },
          currentUser
        );
        onProductSaved(updated);
      } else {
        const created = await dataActions.addStoreProduct(
          currentClub.id,
          {
            name: name.trim(),
            sku: sku.trim(),
            category,
            costPrice,
            salePrice,
            stock: totalStock,
            minStockAlert,
            imageUrl: imageUrl.trim() || undefined,
            sizes: selectedSizes,
            sizesStock: sizesStock,
            description: description.trim() || undefined
          },
          currentUser
        );
        onProductSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-amber-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  {isEditing ? 'Edición de Artículo' : 'Nuevo Artículo Oficial'}
                </span>
                <span className="text-xs text-orange-200">
                  {currentClub.name}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {isEditing ? `Modificar: ${productToEdit.name}` : 'Crear Producto en Tienda'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Producto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Camiseta Oficial Titular San Martín 2026"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SKU / Código</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SM-IND-001"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción corta (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Microfibra dry-fit con escudo bordado"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Pricing & Profit Margin Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
              Estructura de Precios & Rentabilidad
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Precio Costo ($ ARS)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Precio Venta ($ ARS) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-orange-500/60 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase">Margen Comercial</span>
                <div className="text-emerald-400 font-mono font-bold text-sm flex items-center justify-center gap-1">
                  <span>+{marginPercent}%</span>
                  <span className="text-[10px] text-slate-400">(+$ {netProfit.toLocaleString('es-AR')})</span>
                </div>
              </div>
            </div>
          </div>

          {/* FOTO DEL PRODUCTO EN GRANDE (SIN RUTAS NI TEXTO BASE64) */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                Foto del Producto
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Subir foto desde tu dispositivo</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Big photo preview */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 hover:border-orange-500/80 transition flex items-center justify-center cursor-pointer group shadow-inner"
            >
              {imageUrl ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt="Foto del producto" 
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <Camera className="w-8 h-8 text-orange-400 mb-1" />
                    <span className="font-bold text-xs">Haga clic para cambiar o subir otra foto</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-orange-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Toca aquí para seleccionar una imagen</span>
                    <span className="text-[10px] text-slate-500">Soporta fotos de celular, PNG, JPG</span>
                  </div>
                </div>
              )}
            </div>

            {/* Presets oficiales rápidos */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold block">O selecciona una muestra oficial:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {SAMPLE_PRODUCT_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] shrink-0 transition cursor-pointer ${
                      imageUrl === img.url 
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-5 h-5 rounded-md object-cover" />
                    <span>{img.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TALLES DISPONIBLES */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                Talles Habilitados
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedSizes.length} talles activos
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIZES.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Custom size input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                placeholder="Agregar talle personalizado (ej: 40, 42, 10 infantil)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                + Agregar Talle
              </button>
            </div>
          </div>

          {/* STOCK POR CADA TALLE (CANTIDAD ESPECÍFICA POR TALLE) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                  Cantidad & Stock por Talle
                </span>
                <span className="text-[10px] text-slate-400">
                  Indica la cantidad disponible para cada talle habilitado.
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Stock Total:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {totalStock} unidades
                </span>
              </div>
            </div>

            {selectedSizes.length === 0 ? (
              <p className="text-slate-500 text-center py-3 italic">
                Selecciona al menos un talle arriba para asignar stock.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {selectedSizes.map((sz) => (
                  <div key={sz} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-between space-y-1">
                    <span className="text-xs font-bold text-white font-mono flex items-center justify-between">
                      <span>Talle {sz}</span>
                      {(sizesStock[sz] ?? 0) === 0 ? (
                        <span className="text-[9px] text-rose-400 font-bold uppercase">Agotado</span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-bold font-mono">{(sizesStock[sz] ?? 0)} un.</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={sizesStock[sz] ?? 0}
                        onChange={(e) => handleSizeStockChange(sz, Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-white font-mono font-bold text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alerta stock mínimo */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="text-[10px] text-slate-400 uppercase font-bold">
                Alerta de Stock Crítico (Mínimo):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-center text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">unidades</span>
              </div>
            </div>
          </div>

          {/* Estado del Producto */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado de Comercialización</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="disponible">✓ Activo / Disponible para venta</option>
                <option value="discontinuado">✕ Discontinuado (Ocultar de ventas)</option>
              </select>
            </div>
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
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-orange-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
