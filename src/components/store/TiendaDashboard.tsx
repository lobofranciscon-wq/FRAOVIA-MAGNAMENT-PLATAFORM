import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Check, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  AlertTriangle, 
  Package, 
  Receipt as ReceiptIcon, 
  Tag, 
  Search, 
  TrendingUp, 
  Percent, 
  Clock, 
  Shirt, 
  DollarSign, 
  Edit3, 
  SlidersHorizontal, 
  Coins, 
  CheckCircle2, 
  Users, 
  Eye, 
  AlertCircle, 
  Download,
  Lock,
  Unlock,
  Sparkles,
  Ticket,
  Flame,
  ShieldAlert,
  MessageCircle,
  FileText
} from 'lucide-react';
import { Club, PaymentMethod, Receipt, StoreProduct, StoreSale, StorePromotion, User, CashBox, Player } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { StoreProductModal } from './StoreProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { SizeSelectionModal } from './SizeSelectionModal';
import { StorePromotionModal } from './StorePromotionModal';
import { StoreCashBoxModal } from './StoreCashBoxModal';
import { StoreSalesAnalytics } from './StoreSalesAnalytics';
import { ReceiptTemplateModal } from '../receipts/ReceiptTemplateModal';
import { ReceiptDetailModal } from '../ReceiptDetailModal';
import { useAppTheme } from '../../context/ThemeContext';

interface TiendaDashboardProps {
  currentClub: Club;
  currentUser: User;
  products: StoreProduct[];
  sales: StoreSale[];
  onSaleCompleted: (receipt: Receipt) => void;
  onRefreshData?: () => void;
  /** Con Supabase activo estos datos vienen de la base (App.tsx). Sin Supabase se usan los locales. */
  promotions?: StorePromotion[];
  storeCashBox?: CashBox | null;
  players?: Player[];
  receipts?: Receipt[];
  initialTab?: 'pos' | 'inventario' | 'promociones' | 'ventas' | 'resumen';
}

export const TiendaDashboard: React.FC<TiendaDashboardProps> = ({
  currentClub,
  currentUser,
  products,
  sales,
  onSaleCompleted,
  onRefreshData,
  promotions: promotionsProp,
  storeCashBox: storeCashBoxProp,
  players: playersProp,
  receipts: receiptsProp,
  initialTab = 'pos'
}) => {
  const { theme } = useAppTheme();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'pos' | 'inventario' | 'promociones' | 'ventas' | 'resumen'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Independent Store Cash Box
  const usingSupabase = isSupabaseConfigured();
  const storeCashBox: CashBox = usingSupabase
    ? (storeCashBoxProp || {
        id: '',
        clubId: currentClub.id,
        name: 'Caja Mostrador Tienda Oficial',
        type: 'tienda',
        responsibleUserId: currentUser.id,
        currentBalance: 0,
        status: 'cerrada'
      })
    : fraoviaDB.getOrCreateStoreCashBox(currentClub.id, currentUser);
  const [showCashBoxModal, setShowCashBoxModal] = useState<boolean>(false);
  const [cashBoxModalMode, setCashBoxModalMode] = useState<'abrir' | 'cerrar'>('abrir');

  // Promotions & Discounts state
  const promotions = usingSupabase ? (promotionsProp || []) : fraoviaDB.getStorePromotions(currentClub.id, currentUser);
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [promoToEdit, setPromoToEdit] = useState<StorePromotion | null>(null);
  const [appliedPromotion, setAppliedPromotion] = useState<StorePromotion | null>(null);
  const [couponInput, setCouponInput] = useState<string>('');
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number>(0);

  // POS State
  const [cart, setCart] = useState<{ product: StoreProduct; quantity: number; selectedSize?: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [customerDni, setCustomerDni] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('all');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);

  // Modals state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<StoreProduct | null>(null);
  const [showStockModal, setShowStockModal] = useState<boolean>(false);
  const [productForStock, setProductForStock] = useState<StoreProduct | null>(null);
  const [selectedProductForSizeModal, setSelectedProductForSizeModal] = useState<StoreProduct | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [selectedReceiptForWatermarkModal, setSelectedReceiptForWatermarkModal] = useState<Receipt | null>(null);

  // Players list for autocomplete
  const clubPlayers = usingSupabase ? (playersProp || []) : fraoviaDB.getPlayers(currentClub.id, currentUser);
  const filteredPlayers = playerSearchQuery.trim()
    ? clubPlayers.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
        p.dni.includes(playerSearchQuery)
      ).slice(0, 5)
    : [];

  // Cart operations with specific size and quantity support
  const addToCart = (product: StoreProduct, size?: string, quantity: number = 1) => {
    const sizeStock = (size && product.sizesStock && product.sizesStock[size] !== undefined)
      ? product.sizesStock[size]
      : product.stock;

    if (sizeStock <= 0) {
      alert(`El artículo "${product.name}"${size ? ` en talle ${size}` : ''} se encuentra agotado.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === size);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > sizeStock) {
          alert(`No hay más stock disponible para este talle (Disponibles: ${sizeStock}).`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize: size || product.sizes?.[0] }];
    });
  };

  const updateCartQty = (productId: string, size: string | undefined, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedSize === size) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const sizeStock = (size && item.product.sizesStock && item.product.sizesStock[size] !== undefined)
            ? item.product.sizesStock[size]
            : item.product.stock;
          if (newQty > sizeStock) {
            alert('Límite de stock alcanzado.');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as typeof cart;
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size)));
  };

  // Subtotal before discounts
  const subtotalCart = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);

  // Discount calculation
  let calculatedDiscount = 0;
  let activePromoLabel = '';

  if (appliedPromotion && appliedPromotion.status === 'activa') {
    activePromoLabel = appliedPromotion.name;
    if (appliedPromotion.appliesTo === 'todo_el_catalogo') {
      if (appliedPromotion.type === 'porcentaje') {
        calculatedDiscount = Math.round((subtotalCart * appliedPromotion.value) / 100);
      } else {
        calculatedDiscount = appliedPromotion.value;
      }
    } else if (appliedPromotion.appliesTo === 'categoria') {
      const eligibleItemsTotal = cart
        .filter(i => i.product.category === appliedPromotion.targetCategory)
        .reduce((acc, i) => acc + (i.product.salePrice * i.quantity), 0);
      calculatedDiscount = appliedPromotion.type === 'porcentaje'
        ? Math.round((eligibleItemsTotal * appliedPromotion.value) / 100)
        : Math.min(eligibleItemsTotal, appliedPromotion.value);
    } else if (appliedPromotion.appliesTo === 'producto') {
      const eligibleItemsTotal = cart
        .filter(i => i.product.id === appliedPromotion.targetProductId)
        .reduce((acc, i) => acc + (i.product.salePrice * i.quantity), 0);
      calculatedDiscount = appliedPromotion.type === 'porcentaje'
        ? Math.round((eligibleItemsTotal * appliedPromotion.value) / 100)
        : Math.min(eligibleItemsTotal, appliedPromotion.value);
    }
  } else if (manualDiscountPercent > 0) {
    activePromoLabel = `Descuento Manual ${manualDiscountPercent}%`;
    calculatedDiscount = Math.round((subtotalCart * manualDiscountPercent) / 100);
  }

  // Cap discount so total is not negative
  calculatedDiscount = Math.min(subtotalCart, Math.max(0, calculatedDiscount));
  const totalCart = Math.max(0, subtotalCart - calculatedDiscount);

  // Coupon apply
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = promotions.find(p => p.code?.toUpperCase() === code && p.status === 'activa');
    if (found) {
      setAppliedPromotion(found);
      setManualDiscountPercent(0);
      setCouponInput('');
    } else {
      alert(`El cupón "${code}" no es válido o no está activo.`);
    }
  };

  // Checkout directly linked to independent Store Cash Box!
  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    // Check if store cash box is open!
    if (storeCashBox.status === 'cerrada') {
      if (confirm('La Caja de Tienda está CERRADA.\n\n¿Deseas abrir la caja ahora con el fondo inicial para habilitar las ventas?')) {
        setCashBoxModalMode('abrir');
        setShowCashBoxModal(true);
      }
      return;
    }

    setIsProcessing(true);

    try {
      const finalCustomerName = selectedPlayer 
        ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` 
        : customerName.trim() || 'Cliente Mostrador';

      const finalDni = selectedPlayer ? selectedPlayer.dni : customerDni.trim() || undefined;

      const receipt = await dataActions.processStoreSale(
        {
          clubId: currentClub.id,
          cashBoxId: storeCashBox.id,
          customerName: finalCustomerName,
          customerDni: finalDni,
          paymentMethod,
          discountAmount: calculatedDiscount > 0 ? calculatedDiscount : undefined,
          promotionName: activePromoLabel || undefined,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize
          }))
        },
        currentUser
      );

      setLastReceipt(receipt);
      onSaleCompleted(receipt);
      setCart([]);
      setCustomerName('');
      setCustomerDni('');
      setSelectedPlayer(null);
      setPlayerSearchQuery('');
      setAppliedPromotion(null);
      setManualDiscountPercent(0);

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Error al procesar la venta: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (confirm(`¿Eliminar "${name}" del catálogo oficial?\n\nSi ya tiene ventas registradas, se conserva como "discontinuado" para no perder el historial.`)) {
      try {
        const result = await dataActions.deleteStoreProduct(product, currentUser);
        if (result === 'discontinuado') {
          alert(`"${name}" tiene ventas registradas: quedó como discontinuado y ya no se puede vender.`);
        }
        if (onRefreshData) onRefreshData();
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el producto.');
      }
    }
  };

  // Filtered products for POS
  const filteredProducts = products.filter(p => {
    if (posCategoryFilter !== 'all' && p.category !== posCategoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    }
    return true;
  });

  // Calculate live stats
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner: TIENDA - Comercial */}
      <div 
        className="p-4 sm:p-5 rounded-3xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 50%, #7C2D12 100%)',
          borderColor: '#F97316'
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Sector Comercial & Merchandising
                </span>
                <span className="text-xs text-orange-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Tienda Oficial del Club & Punto de Venta
              </h2>
              <p className="text-xs text-orange-100">
                Catálogo con stock por talle, promociones comerciales y caja de mostrador independiente.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3.5 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Configurar WhatsApp de la Tienda y Plantilla con Escudo/Marca de Agua"
            >
              <MessageCircle className="w-4 h-4 stroke-[2.5]" />
              <span>WhatsApp & Plantilla Tienda</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'resumen' ? 'pos' : 'resumen')}
              className={`px-3.5 py-2.5 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow ${
                activeTab === 'resumen'
                  ? 'bg-orange-500 text-slate-950'
                  : 'bg-black/30 hover:bg-black/40 text-orange-200 border border-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>{activeTab === 'resumen' ? 'Volver al Mostrador' : 'Análisis de Ventas'}</span>
            </button>
            <button
              onClick={() => {
                setPromoToEdit(null);
                setShowPromoModal(true);
              }}
              className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>+ Crear Promoción</span>
            </button>
            <button
              onClick={() => {
                setProductToEdit(null);
                setShowProductModal(true);
              }}
              className="px-3.5 py-2.5 bg-white text-orange-950 hover:bg-orange-50 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              <span>+ Nuevo Artículo</span>
            </button>
          </div>
        </div>

        {/* Live Metrics strip & INDEPENDENT CASH BOX STATUS */}
        <div className="mt-4 pt-3.5 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-orange-200 uppercase font-semibold block">Catálogo Oficial</span>
            <span className="text-base font-black text-white font-mono">{products.length} productos ({totalStockUnits} un.)</span>
          </div>

          <div>
            <span className="text-[10px] text-orange-200 uppercase font-semibold block">Promociones Activas</span>
            <span className="text-base font-black text-purple-200 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {promotions.filter(p => p.status === 'activa').length} promociones
            </span>
          </div>

          <div>
            <span className="text-[10px] text-orange-200 uppercase font-semibold block">Ventas de Tienda</span>
            <span className="text-base font-black text-white font-mono">${totalSalesRevenue.toLocaleString('es-AR')}</span>
          </div>

          {/* Independent Cash Box Status Banner */}
          <div className="p-2 rounded-2xl bg-black/25 border border-white/20 flex items-center justify-between gap-2">
            <div>
              <span className="text-[9px] text-orange-200 uppercase font-bold block flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>Caja de Tienda (Independiente)</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${storeCashBox.status === 'abierta' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                <span className="font-mono font-black text-white text-xs">
                  {storeCashBox.status === 'abierta' ? `$${storeCashBox.currentBalance.toLocaleString('es-AR')}` : 'CERRADA'}
                </span>
              </div>
            </div>

            {storeCashBox.status === 'abierta' ? (
              <button
                onClick={() => {
                  setCashBoxModalMode('cerrar');
                  setShowCashBoxModal(true);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] transition cursor-pointer shrink-0"
              >
                Cerrar Turno
              </button>
            ) : (
              <button
                onClick={() => {
                  setCashBoxModalMode('abrir');
                  setShowCashBoxModal(true);
                }}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] transition cursor-pointer shrink-0"
              >
                Abrir Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'pos'
              ? 'border-orange-500 text-orange-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Punto de Venta (Mostrador)</span>
          {cart.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 font-black text-[10px]">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('promociones')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'promociones'
              ? 'border-purple-500 text-purple-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Promociones & Descuentos</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
            {promotions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inventario')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'inventario'
              ? 'border-orange-500 text-orange-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catálogo & Stock</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ventas')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ventas'
              ? 'border-orange-500 text-orange-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial de Ventas</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resumen')}
          className={`pb-3 px-3 sm:px-4 border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'resumen'
              ? 'border-orange-500 text-orange-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Análisis de Ventas Rápidas</span>
        </button>
      </div>

      {/* CASH BOX CLOSED ALERT IN POS */}
      {storeCashBox.status === 'cerrada' && activeTab === 'pos' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-300 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-black text-white text-sm">
                La Caja de Mostrador de la Tienda se encuentra cerrada
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Para registrar cobros y emitir tickets independientes de la tesorería general, debes abrir el turno de caja e ingresar el fondo de cambio inicial.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCashBoxModalMode('abrir');
              setShowCashBoxModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow flex items-center gap-1.5 shrink-0"
          >
            <Unlock className="w-4 h-4" />
            <span>Abrir Caja de Tienda</span>
          </button>
        </div>
      )}

      {/* SUCCESS TICKET ALERT & RECIBO OFICIAL (COMPARTIR TRAS OCURRIDO) */}
      {lastReceipt && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0A221B] to-[#0C162D] border-2 border-emerald-500/40 text-emerald-300 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Cobro Registrado & Recibo Emitido
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {lastReceipt.receiptNumber}
                </span>
              </div>
              <h4 className="font-black text-white text-sm sm:text-base mt-0.5">
                ¡Venta cobrada con éxito e imputada en Caja de Tienda!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Comprobante oficial por <strong className="text-emerald-400 font-mono">${lastReceipt.amount.toLocaleString('es-AR')}</strong> emitido a <strong>{lastReceipt.customerName}</strong> ({lastReceipt.paymentMethod.toUpperCase()}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setSelectedReceiptForWatermarkModal(lastReceipt)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              title="Ver el comprobante oficial con escudo del club, marca de agua e imprimir"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Recibo Oficial</span>
            </button>
            <button
              onClick={() => {
                const itemsList = lastReceipt.items.map(it => `• ${it.quantity}x ${it.description} ($${it.total.toLocaleString('es-AR')})`).join('\n');
                const storeMsg = 
`🛍️ *TIENDA OFICIAL - ${currentClub.name.toUpperCase()}*

📜 *COMPROBANTE OFICIAL DE COMPRA*
━━━━━━━━━━━━━━━━━━━━
*Nº de Ticket:* ${lastReceipt.receiptNumber}
*Fecha:* ${new Date(lastReceipt.date).toLocaleString('es-AR')}
*Cliente:* ${lastReceipt.customerName}
*Medio de Pago:* ${lastReceipt.paymentMethod.toUpperCase()}

*DETALLE DE ARTÍCULOS:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL COBRADO:* $${lastReceipt.amount.toLocaleString('es-AR')}
━━━━━━━━━━━━━━━━━━━━
Canal Oficial Tienda: ${currentClub.whatsappConfig?.storePhone || '+54 9 11 5566-7788'}

_¡Gracias por vestir los colores oficiales del club!_`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(storeMsg)}`, '_blank');
              }}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
              title="Compartir comprobante por WhatsApp al socio/cliente"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Compartir por WhatsApp</span>
            </button>
            <button
              onClick={() => setLastReceipt(null)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: PUNTO DE VENTA (POS) */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Area: Product Catalog Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Search and Category filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de producto o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0C162D] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {['all', 'Indumentaria', 'Accesorios', 'Calzado', 'Merchandising'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPosCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                      posCategoryFilter === cat
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Cards Grid - Boca/Adidas Style matching Image 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                const installmentPrice = Math.round(product.salePrice / 3);

                return (
                  <div
                    key={product.id}
                    className="p-4 rounded-3xl bg-[#0C162D] border border-slate-800 hover:border-orange-500/50 transition-all duration-200 flex flex-col justify-between space-y-3 group shadow-md"
                  >
                    <div className="space-y-3">
                      {/* Product Image Container */}
                      <div className="w-full h-48 sm:h-52 rounded-2xl bg-white p-3 overflow-hidden relative flex items-center justify-center shadow-inner">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}

                        {/* Top Right Brand / Club Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/85 text-white text-[9px] font-bold tracking-wider uppercase font-mono shadow">
                            {currentClub.name.substring(0, 14)}
                          </span>
                        </div>

                        {/* Top Left Stock Status */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow ${
                            isOutOfStock ? 'bg-rose-500 text-white' :
                            isLowStock ? 'bg-amber-400 text-slate-950 font-bold' :
                            'bg-emerald-600 text-white font-mono'
                          }`}>
                            {isOutOfStock ? 'Agotado' : `${product.stock} un.`}
                          </span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <div>
                        <span className="text-[10px] font-mono text-orange-400 uppercase font-bold block">
                          {product.category}
                        </span>
                        <h4 className="font-bold text-white text-sm leading-snug mt-0.5 line-clamp-2">
                          {product.name}
                        </h4>
                      </div>

                      {/* Big Bold Price matching Image 2 */}
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                          ${product.salePrice.toLocaleString('es-AR')}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Hasta 3 cuotas en caja de <strong className="text-slate-200">${installmentPrice.toLocaleString('es-AR')}</strong>
                        </span>
                      </div>

                      {/* Tienda badge & sizes indicator */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-white text-[10px] font-bold">
                          Tienda Oficial
                        </span>
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="flex items-center gap-1">
                            {product.sizes.slice(0, 4).map((sz) => (
                              <span key={sz} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                {sz}
                              </span>
                            ))}
                            {product.sizes.length > 4 && (
                              <span className="text-[9px] text-slate-500 font-mono">+{product.sizes.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Big Vibrant Green Button matching Image 2 */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedProductForSizeModal(product)}
                        className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          isOutOfStock 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#1db954] hover:bg-[#18a84b] hover:shadow-emerald-500/20 text-white shadow-emerald-500/10 active:scale-98'
                        }`}
                      >
                        <Shirt className="w-4 h-4 stroke-[2.5]" />
                        <span>{isOutOfStock ? 'ARTÍCULO AGOTADO' : 'SELECCIONAR TALLE'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Checkout & Cash Box Integration (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-3xl border-2 border-orange-500/40 bg-[#0C162D] space-y-4 flex flex-col justify-between shadow-2xl">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-400" />
                  <h3 className="font-black text-white text-sm">Mostrador de Cobro</h3>
                </div>
                <span className="text-xs text-orange-400 font-mono font-bold">{cart.length} artículos</span>
              </div>

              {/* CAJA INDEPENDIENTE DE TIENDA STATUS CARD */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white text-xs block">{storeCashBox.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {storeCashBox.status === 'abierta' ? `Turno: ${storeCashBox.shiftName || 'Mostrador'}` : 'Caja Cerrada'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                    storeCashBox.status === 'abierta' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {storeCashBox.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                  <span className="text-slate-400 font-mono">Saldo actual en caja:</span>
                  <span className="font-black font-mono text-emerald-400 text-sm">
                    ${storeCashBox.currentBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Customer Selector: Member or Guest */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Cliente / Socio que compra:
                </label>

                {selectedPlayer ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {selectedPlayer.firstName} {selectedPlayer.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">DNI: {selectedPlayer.dni}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlayer(null);
                        setPlayerSearchQuery('');
                      }}
                      className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar socio por nombre o DNI..."
                        value={playerSearchQuery}
                        onChange={(e) => setPlayerSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {filteredPlayers.length > 0 && (
                      <div className="p-1 bg-slate-900 border border-slate-700 rounded-xl space-y-1 animate-in fade-in">
                        {filteredPlayers.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPlayer(p);
                              setCustomerName(`${p.firstName} ${p.lastName}`);
                              setCustomerDni(p.dni);
                              setPlayerSearchQuery('');
                            }}
                            className="p-2 rounded-lg hover:bg-orange-500/20 text-xs text-white cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-bold">{p.firstName} {p.lastName}</span>
                            <span className="font-mono text-[10px] text-slate-400">DNI: {p.dni}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="O ingresar nombre cliente mostrador..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Detalle de Artículos:</span>
                <div className="max-h-44 overflow-y-auto space-y-1.5 divide-y divide-slate-800/80 text-xs pr-1">
                  {cart.length === 0 ? (
                    <div className="text-slate-500 text-center py-5 text-xs">
                      El carrito está vacío.<br />Selecciona un talle en un artículo.
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={`${item.product.id}-${item.selectedSize || ''}-${idx}`} className="pt-2 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-bold block truncate">{item.product.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 font-mono font-bold text-orange-400">
                                Talle: {item.selectedSize}
                              </span>
                            )}
                            <span className="font-mono">${item.product.salePrice.toLocaleString('es-AR')} c/u</span>
                          </div>
                        </div>

                        {/* Qty controller */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white px-1">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                          <span className="font-mono font-bold text-orange-300 ml-1">
                            ${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                            className="text-rose-400 hover:text-white p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECCIÓN DE PROMOCIÓN / DESCUENTO APLICADO AL CARRITO */}
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Promoción / Descuento</span>
                  </span>
                  {(appliedPromotion || manualDiscountPercent > 0) && (
                    <button
                      onClick={() => {
                        setAppliedPromotion(null);
                        setManualDiscountPercent(0);
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline font-bold"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                {/* Quick Promos Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {promotions.filter(p => p.status === 'activa').slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAppliedPromotion(p);
                        setManualDiscountPercent(0);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold truncate shrink-0 transition cursor-pointer border ${
                        appliedPromotion?.id === p.id 
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-slate-900 text-purple-300 border-purple-500/30 hover:border-purple-400'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Coupon input */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    placeholder="Código de cupón (ej: SOCIO15)..."
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

            </div>

            {/* Total, Discounts & Checkout Area */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              
              {/* Financial breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal artículos:</span>
                  <span className="font-mono font-bold">${subtotalCart.toLocaleString('es-AR')}</span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{activePromoLabel}:</span>
                    </span>
                    <span className="font-mono">-${calculatedDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-white pt-1 border-t border-slate-800/80">
                  <span className="text-xs uppercase font-bold text-slate-300">Total a Cobrar:</span>
                  <span className="text-2xl font-black text-orange-400 font-mono">
                    ${totalCart.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Forma de Pago:</span>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  {(['efectivo', 'transferencia', 'tarjeta', 'otro'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method as any)}
                      className={`py-2 rounded-xl font-bold uppercase transition cursor-pointer text-center ${
                        paymentMethod === method
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-black rounded-xl text-sm transition cursor-pointer shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{isProcessing ? 'Procesando Cobro & Emisión de Recibo...' : 'Cobrar Venta & Emitir Recibo'}</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center pt-0.5">
                <ReceiptIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Emite comprobante oficial e impacta en Caja de Tienda</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GESTIÓN DE PROMOCIONES Y DESCUENTOS */}
      {activeTab === 'promociones' && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-[#0C162D] space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Promociones Comerciales & Descuentos</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cree descuentos porcentuales o en monto fijo para socios, categorías enteras o productos de la tienda.
              </p>
            </div>

            <button
              onClick={() => {
                setPromoToEdit(null);
                setShowPromoModal(true);
              }}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nueva Promoción</span>
            </button>
          </div>

          {/* Promotions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                      promo.status === 'activa' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {promo.status === 'activa' ? '✓ Activa' : '⏸️ Pausada'}
                    </span>

                    {promo.code && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
                        {promo.code}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-white text-sm">{promo.name}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Alcance: {promo.appliesTo === 'todo_el_catalogo' ? 'Todo el Catálogo' : promo.appliesTo === 'categoria' ? `Categoría "${promo.targetCategory}"` : 'Artículo individual'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Beneficio:</span>
                    <span className="text-lg font-black font-mono text-purple-400">
                      {promo.type === 'porcentaje' ? `${promo.value}% OFF` : `-$${promo.value.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      try {
                        await dataActions.updateStorePromotion(
                          promo.id,
                          { status: promo.status === 'activa' ? 'pausada' : 'activa' },
                          currentUser
                        );
                        if (onRefreshData) onRefreshData();
                      } catch (err: any) {
                        alert(err.message || 'No se pudo cambiar el estado de la promoción.');
                      }
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white"
                  >
                    {promo.status === 'activa' ? 'Pausar' : 'Reactivar'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPromoToEdit(promo);
                        setShowPromoModal(true);
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-lg"
                      title="Editar promoción"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar la promoción "${promo.name}"?`)) {
                          try {
                            await dataActions.deleteStorePromotion(promo, currentUser);
                            if (onRefreshData) onRefreshData();
                          } catch (err: any) {
                            alert(err.message || 'No se pudo eliminar la promoción.');
                          }
                        }
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg"
                      title="Eliminar promoción"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGO & CONTROL DE STOCK */}
      {activeTab === 'inventario' && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-[#0C162D] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Catálogo & Stock Oficial de Artículos</h3>
              <p className="text-xs text-slate-400">
                Gestione precios, márgenes de ganancia, stock específico por talle e ingresos de mercadería.
              </p>
            </div>

            <button
              onClick={() => {
                setProductToEdit(null);
                setShowProductModal(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nuevo Artículo</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU en inventario..."
                value={inventorySearchTerm}
                onChange={(e) => setInventorySearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={inventoryCategoryFilter}
                onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Indumentaria">Indumentaria</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Calzado">Calzado</option>
                <option value="Merchandising">Merchandising</option>
                <option value="Equipamiento Deportivo">Equipamiento Deportivo</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setInventoryStockFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                      inventoryStockFilter === st
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : st === 'in_stock' ? 'Con Stock' : st === 'low_stock' ? 'Bajo Stock' : 'Agotados'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Desglose de Talles & Stock</th>
                  <th className="py-3 px-3 font-mono text-right">Costo</th>
                  <th className="py-3 px-3 font-mono text-right">Venta</th>
                  <th className="py-3 px-3 text-center">Margen</th>
                  <th className="py-3 px-4 text-center">Total Stock</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {products
                  .filter(p => {
                    if (inventoryCategoryFilter !== 'all' && p.category !== inventoryCategoryFilter) return false;
                    if (inventoryStockFilter === 'low_stock' && !(p.stock > 0 && p.stock <= p.minStockAlert)) return false;
                    if (inventoryStockFilter === 'out_of_stock' && p.stock > 0) return false;
                    if (inventoryStockFilter === 'in_stock' && p.stock <= 0) return false;
                    if (inventorySearchTerm.trim()) {
                      const term = inventorySearchTerm.toLowerCase();
                      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
                    }
                    return true;
                  })
                  .map((p) => {
                  const isLowStock = p.stock > 0 && p.stock <= p.minStockAlert;
                  const isOutOfStock = p.stock <= 0;
                  const margin = p.costPrice > 0 ? Math.round(((p.salePrice - p.costPrice) / p.costPrice) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-600 m-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            {p.description && <span className="text-[10px] text-slate-400">{p.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3 px-3 text-slate-400">{p.category}</td>
                      <td className="py-3 px-3">
                        {p.sizes && p.sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.sizes.map((s) => {
                              const qty = p.sizesStock?.[s] ?? 0;
                              return (
                                <span 
                                  key={s} 
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                    qty <= 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 line-through' : 'bg-slate-900 border-slate-700 text-slate-300'
                                  }`}
                                >
                                  {s}: {qty}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-600">Único</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">${p.costPrice.toLocaleString('es-AR')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">${p.salePrice.toLocaleString('es-AR')}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold font-mono text-[10px]">
                          +{margin}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                          isOutOfStock ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          isLowStock ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse' :
                          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {p.stock} un.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setProductForStock(p);
                              setShowStockModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-orange-400 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Ingresar stock o ajustar conteo"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Stock</span>
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-xl transition cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-xl transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORIAL DE VENTAS */}
      {activeTab === 'ventas' && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-[#0C162D] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Ventas Emitidas & Comprobantes</h3>
              <p className="text-xs text-slate-400">
                Registro histórico de operaciones en mostrador y cajas de tienda.
              </p>
            </div>
            <span className="text-xs text-orange-400 font-mono font-bold">
              Total facturado: ${totalSalesRevenue.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="space-y-2">
            {sales.map((sale) => (
              <div key={sale.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{sale.customerName || 'Cliente Mostrador'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-orange-400 font-mono font-bold text-[10px] border border-slate-800 uppercase">
                      {sale.paymentMethod}
                    </span>
                    {sale.appliedPromotionName && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{sale.appliedPromotionName}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {sale.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(sale.timestamp).toLocaleString('es-AR')} · Recibo #{sale.receiptId}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400 font-mono block">
                      ${sale.total.toLocaleString('es-AR')}
                    </span>
                    {sale.discountAmount && sale.discountAmount > 0 && (
                      <span className="text-[10px] text-purple-400 font-mono">
                        Ahorro: -${sale.discountAmount.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const allRecs = usingSupabase ? (receiptsProp || []) : fraoviaDB.getReceipts(currentClub.id, currentUser);
                        const rec = allRecs.find(r => r.id === sale.receiptId) || {
                          id: sale.receiptId,
                          clubId: sale.clubId,
                          receiptNumber: sale.receiptId,
                          date: sale.timestamp,
                          customerName: sale.customerName || 'Cliente Mostrador',
                          concept: 'Venta Mostrador Tienda Oficial',
                          amount: sale.total,
                          paymentMethod: sale.paymentMethod,
                          items: sale.items.map(i => ({
                            description: i.productName,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            total: i.total
                          })),
                          issuedByUserId: sale.cashierUserId,
                          status: 'emitido' as const
                        };
                        setSelectedReceiptForWatermarkModal(rec);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Ver comprobante oficial con escudo y marca de agua"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Comprobante</span>
                    </button>

                    <button
                      onClick={() => {
                        const itemsList = sale.items.map(it => `• ${it.quantity}x ${it.productName} ($${it.total.toLocaleString('es-AR')})`).join('\n');
                        const storeMsg = 
`🛍️ *TIENDA OFICIAL - ${currentClub.name.toUpperCase()}*

📜 *COMPROBANTE OFICIAL DE COMPRA*
━━━━━━━━━━━━━━━━━━━━
*Nº de Ticket:* ${sale.receiptId}
*Fecha:* ${new Date(sale.timestamp).toLocaleString('es-AR')}
*Cliente:* ${sale.customerName || 'Cliente Mostrador'}
*Medio de Pago:* ${sale.paymentMethod.toUpperCase()}

*DETALLE:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL COBRADO:* $${sale.total.toLocaleString('es-AR')}
━━━━━━━━━━━━━━━━━━━━
Canal WhatsApp Tienda: ${currentClub.whatsappConfig?.storePhone || '+54 9 11 5566-7788'}

_¡Gracias por vestir los colores oficiales del club!_`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(storeMsg)}`, '_blank');
                      }}
                      className="p-1.5 px-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Enviar ticket por WhatsApp de la Tienda"
                    >
                      <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANÁLISIS DE VENTAS RÁPIDAS & VISUALIZACIÓN DE DATOS */}
      {activeTab === 'resumen' && (
        <StoreSalesAnalytics sales={sales} products={products} />
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {showProductModal && (
        <StoreProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          productToEdit={productToEdit}
          currentClub={currentClub}
          currentUser={currentUser}
          onProductSaved={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL AJUSTE DE STOCK */}
      {showStockModal && productForStock && (
        <StockAdjustmentModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          product={productForStock}
          currentUser={currentUser}
          onStockUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL SELECCIONAR TALLE & CANTIDAD (ESTILO IMAGEN 3) */}
      {selectedProductForSizeModal && (
        <SizeSelectionModal
          isOpen={!!selectedProductForSizeModal}
          onClose={() => setSelectedProductForSizeModal(null)}
          product={selectedProductForSizeModal}
          onConfirmAddToCart={(prod, size, quantity) => {
            addToCart(prod, size, quantity);
          }}
        />
      )}

      {/* MODAL CREAR / EDITAR PROMOCIÓN */}
      {showPromoModal && (
        <StorePromotionModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          promotionToEdit={promoToEdit}
          products={products}
          currentClub={currentClub}
          currentUser={currentUser}
          onSaved={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL APERTURA / CIERRE DE CAJA DE TIENDA */}
      {showCashBoxModal && (
        <StoreCashBoxModal
          isOpen={showCashBoxModal}
          onClose={() => setShowCashBoxModal(false)}
          mode={cashBoxModalMode}
          storeCashBox={storeCashBox}
          currentUser={currentUser}
          onCashBoxUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL CONFIGURACIÓN PLANTILLA Y WHATSAPP TIENDA */}
      {showTemplateModal && (
        <ReceiptTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          initialSector="tienda"
          onSaved={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* MODAL DETALLE DE COMPROBANTE CON ESCUDO Y MARCA DE AGUA */}
      {selectedReceiptForWatermarkModal && (
        <ReceiptDetailModal
          isOpen={!!selectedReceiptForWatermarkModal}
          onClose={() => setSelectedReceiptForWatermarkModal(null)}
          receipt={selectedReceiptForWatermarkModal}
          currentClub={currentClub}
          currentUser={currentUser}
          onReceiptUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

    </div>
  );
};
