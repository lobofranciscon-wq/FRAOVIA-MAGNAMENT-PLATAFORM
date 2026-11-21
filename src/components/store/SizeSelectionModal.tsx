import React, { useState } from 'react';
import { X, Check, ShoppingBag, Plus, Minus, AlertCircle } from 'lucide-react';
import { StoreProduct } from '../../types/fraovia';

interface SizeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StoreProduct | null;
  onConfirmAddToCart: (product: StoreProduct, size: string, quantity: number) => void;
}

export const SizeSelectionModal: React.FC<SizeSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmAddToCart
}) => {
  if (!isOpen || !product) return null;

  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['Único'];
  const sizesStock = product.sizesStock || {};

  // First available size with stock > 0
  const firstAvailableSize = sizes.find(s => (sizesStock[s] ?? product.stock) > 0) || sizes[0];

  const [selectedSize, setSelectedSize] = useState<string>(firstAvailableSize);
  const [quantity, setQuantity] = useState<number>(1);

  // Available stock for selected size
  const currentSizeStock = sizesStock[selectedSize] !== undefined 
    ? sizesStock[selectedSize] 
    : product.stock;

  const isSelectedOutOfStock = currentSizeStock <= 0;

  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentSizeStock) return currentSizeStock;
      return next;
    });
  };

  const handleConfirm = () => {
    if (isSelectedOutOfStock) return;
    onConfirmAddToCart(product, selectedSize, quantity);
    onClose();
  };

  const subtotal = product.salePrice * quantity;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal card styled cleanly like the reference screenshot (Image 3) */}
      <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
            Seleccionar talle
          </h3>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Product mini banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            {product.imageUrl && product.imageUrl.trim() ? (
              <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
            ) : (
              <ShoppingBag className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 font-mono">
              {product.category}
            </span>
            <h4 className="text-sm font-black text-slate-900 truncate">
              {product.name}
            </h4>
            <div className="text-base font-black text-slate-950 font-mono mt-0.5">
              ${product.salePrice.toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        {/* Size Selection Grid */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Talles disponibles:
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {currentSizeStock > 0 ? (
                  <span className="text-emerald-600 font-bold">{currentSizeStock} unidades en talle {selectedSize}</span>
                ) : (
                  <span className="text-rose-600 font-bold">Agotado en talle {selectedSize}</span>
                )}
              </span>
            </div>

            {/* Grid of sizes matching reference Image 3 */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                const sizeStock = sizesStock[sz] !== undefined ? sizesStock[sz] : product.stock;
                const isOutOfStock = sizeStock <= 0;

                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleSelectSize(sz)}
                    className={`py-3 px-2 rounded-2xl font-black text-sm transition cursor-pointer relative flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-slate-950 text-white shadow-md scale-102 ring-2 ring-slate-950 ring-offset-2'
                        : isOutOfStock
                        ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sz}</span>
                    <span className={`text-[9px] font-mono mt-0.5 ${
                      isSelected ? 'text-orange-300' : isOutOfStock ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {isOutOfStock ? 'Sin stock' : `${sizeStock} un.`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity selector */}
          {!isSelectedOutOfStock && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Cantidad a llevar:</span>
                <span className="text-[10px] text-slate-400 font-mono">Máximo {currentSizeStock} disponibles</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 shadow-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-black text-sm text-slate-900 w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= currentSizeStock}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Subtotal row */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold uppercase">Subtotal:</span>
            <span className="text-lg font-black font-mono text-slate-950">
              ${subtotal.toLocaleString('es-AR')}
            </span>
          </div>

          {/* Big Vibrant Green Button matching reference (Image 2 & Image 3) */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSelectedOutOfStock}
            className="w-full py-3.5 rounded-2xl bg-[#1db954] hover:bg-[#18a84b] disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-sm tracking-wider uppercase transition cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{isSelectedOutOfStock ? 'Talle Agotado' : 'SELECCIONAR TALLE & AGREGAR'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
