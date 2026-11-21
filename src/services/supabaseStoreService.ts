import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CashBox, PaymentMethod, Receipt, StoreProduct, StorePromotion, StoreSale } from '../types/fraovia';
import { formatSupabaseError, mapCashBoxFromDb, mapReceiptFromDb } from './supabaseDataService';

// ------------------------------------------------------------------------------
// Conversores base de datos -> app
// ------------------------------------------------------------------------------
export function mapStoreProductFromDb(row: any): StoreProduct {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    costPrice: Number(row.cost_price) || 0,
    salePrice: Number(row.sale_price) || 0,
    stock: Number(row.stock) || 0,
    minStockAlert: Number(row.min_stock_alert) || 0,
    imageUrl: row.image_url || undefined,
    status: row.status || 'disponible',
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    sizesStock: row.sizes_stock && typeof row.sizes_stock === 'object' ? row.sizes_stock : {},
    description: row.description || undefined
  };
}

export function mapStorePromotionFromDb(row: any): StorePromotion {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    code: row.code || undefined,
    type: row.type,
    value: Number(row.value) || 0,
    appliesTo: row.applies_to,
    targetCategory: row.target_category || undefined,
    targetProductId: row.target_product_id || undefined,
    minPurchaseAmount: row.min_purchase_amount !== null && row.min_purchase_amount !== undefined ? Number(row.min_purchase_amount) : undefined,
    status: row.status,
    validUntil: row.valid_until || undefined,
    createdByUserId: row.created_by_user_id || '',
    createdAt: row.created_at
  };
}

export function mapStoreSaleFromDb(row: any): StoreSale {
  const items = Array.isArray(row.store_sale_items) ? row.store_sale_items : [];
  return {
    id: row.id,
    clubId: row.club_id,
    receiptId: row.receipt_id || '',
    cashierUserId: row.cashier_user_id,
    total: Number(row.total) || 0,
    subtotal: row.subtotal !== null && row.subtotal !== undefined ? Number(row.subtotal) : undefined,
    discountAmount: Number(row.discount_amount) || 0,
    appliedPromotionName: row.applied_promotion_name || undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    customerName: row.customer_name || undefined,
    items: items.map((it: any) => ({
      productId: it.product_id,
      productName: it.product_name || 'Producto',
      size: it.size || undefined,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unit_price) || 0,
      total: Number(it.subtotal) || 0
    })),
    timestamp: row.created_at
  };
}

function promoToDb(p: Partial<StorePromotion>) {
  const out: any = {};
  if (p.name !== undefined) out.name = p.name.trim();
  if (p.code !== undefined) out.code = p.code ? p.code.trim().toUpperCase() : null;
  if (p.type !== undefined) out.type = p.type;
  if (p.value !== undefined) out.value = p.value;
  if (p.appliesTo !== undefined) out.applies_to = p.appliesTo;
  if (p.targetCategory !== undefined) out.target_category = p.targetCategory || null;
  if (p.targetProductId !== undefined) out.target_product_id = p.targetProductId || null;
  if (p.minPurchaseAmount !== undefined) out.min_purchase_amount = p.minPurchaseAmount || null;
  if (p.status !== undefined) out.status = p.status;
  if (p.validUntil !== undefined) out.valid_until = p.validUntil || null;
  return out;
}

function productToDb(p: Partial<StoreProduct>) {
  const out: any = {};
  if (p.name !== undefined) out.name = p.name.trim();
  if (p.sku !== undefined) out.sku = p.sku.trim();
  if (p.category !== undefined) out.category = p.category;
  if (p.costPrice !== undefined) out.cost_price = p.costPrice;
  if (p.salePrice !== undefined) out.sale_price = p.salePrice;
  if (p.stock !== undefined) out.stock = Math.max(0, Math.round(p.stock));
  if (p.minStockAlert !== undefined) out.min_stock_alert = p.minStockAlert;
  if (p.imageUrl !== undefined) out.image_url = p.imageUrl || null;
  if (p.status !== undefined) out.status = p.status;
  if (p.sizes !== undefined) out.sizes = p.sizes || [];
  if (p.sizesStock !== undefined) out.sizes_stock = p.sizesStock || {};
  if (p.description !== undefined) out.description = p.description || null;
  return out;
}

export interface StoreSaleItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface StoreSalePayload {
  clubId: string;
  receiptId?: string;
  cashBoxId?: string;
  cashierUserId: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  items: StoreSaleItemPayload[];
}

/**
 * Servicio de Tienda Oficial (Merchandising e Indumentaria).
 * 
 * Reglas de negocio y base de datos:
 * 1. Para asentar una venta:
 *    Paso 1: Se inserta el encabezado en `store_sales`.
 *    Paso 2: Se insertan las líneas en `store_sale_items` vinculadas al `sale_id`.
 * 2. Descuento automático de stock: El trigger PostgreSQL `trg_deduct_stock` en
 *    `store_sale_items` descuenta las unidades de `store_products` automáticamente.
 * 3. Alertas de inventario crítico: Se leen directamente desde la vista SQL `store_low_stock`.
 */
export const supabaseStoreService = {
  /**
   * Registra una venta completa insertando secuencialmente en store_sales y luego store_sale_items.
   */
  async processSale(payload: StoreSalePayload) {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        saleId: `sale-local-${Date.now()}`
      };
    }

    // PASO 1: Inserción en la tabla principal `store_sales`
    const { data: saleData, error: saleError } = await supabase
      .from('store_sales')
      .insert({
        club_id: payload.clubId,
        receipt_id: payload.receiptId || null,
        cash_box_id: payload.cashBoxId || null,
        cashier_user_id: payload.cashierUserId,
        customer_name: payload.customerName,
        total: payload.total,
        payment_method: payload.paymentMethod
      })
      .select('id')
      .single();

    if (saleError || !saleData) {
      console.error('Error al insertar en store_sales:', saleError);
      throw new Error(`Error al registrar venta de tienda: ${saleError?.message}`);
    }

    const saleId = saleData.id;

    // PASO 2: Inserción en `store_sale_items` vinculando con sale_id
    const saleItems = payload.items.map(item => ({
      club_id: payload.clubId,
      sale_id: saleId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('store_sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Error al insertar en store_sale_items:', itemsError);
      throw new Error(`Error al registrar los ítems de la venta: ${itemsError.message}`);
    }

    return {
      success: true,
      saleId
    };
  },

  /**
   * Consulta los productos con alerta de stock crítico utilizando la VISTA SQL `store_low_stock`
   */
  async getLowStockAlerts(clubId: string) {
    if (!isSupabaseConfigured()) return [];

    // Consulta directa a la vista de base de datos `store_low_stock`
    const { data, error } = await supabase
      .from('store_low_stock')
      .select('*')
      .eq('club_id', clubId);

    if (error) {
      console.error('Error al consultar vista store_low_stock:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Consulta todos los productos de la tienda del club
   */
  async getStoreProducts(clubId: string) {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('club_id', clubId)
      .order('name');

    if (error) {
      console.error('Error al consultar store_products:', error);
      return [];
    }

    return data || [];
  },

  // ----------------------------------------------------------------------------
  // PRODUCTOS
  // ----------------------------------------------------------------------------
  async fetchProducts(clubId: string): Promise<StoreProduct[]> {
    if (!isSupabaseConfigured() || !clubId) return [];
    const { data, error } = await supabase.from('store_products').select('*').eq('club_id', clubId).order('name');
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapStoreProductFromDb);
  },

  async createProduct(clubId: string, p: Omit<StoreProduct, 'id' | 'clubId' | 'status'>): Promise<StoreProduct> {
    const payload = {
      ...productToDb({ ...p, status: p.stock <= 0 ? 'agotado' : 'disponible' }),
      club_id: clubId
    };
    const { data, error } = await supabase.from('store_products').insert(payload).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapStoreProductFromDb(data);
  },

  async updateProduct(productId: string, updates: Partial<StoreProduct>): Promise<StoreProduct> {
    const payload = productToDb(updates);
    if (updates.stock !== undefined) {
      if (updates.stock <= 0) payload.status = 'agotado';
      else if (updates.status === undefined || updates.status === 'agotado') payload.status = 'disponible';
    }
    const { data, error } = await supabase.from('store_products').update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', productId).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapStoreProductFromDb(data);
  },

  /** Si el producto ya tiene ventas no se puede borrar: se lo pasa a "discontinuado" para conservar el historial. */
  async deleteProduct(productId: string): Promise<'eliminado' | 'discontinuado'> {
    const { error } = await supabase.from('store_products').delete().eq('id', productId);
    if (!error) return 'eliminado';
    if (String(error.code) === '23503' || /foreign key|violates/i.test(error.message || '')) {
      const { error: e2 } = await supabase.from('store_products')
        .update({ status: 'discontinuado', updated_at: new Date().toISOString() }).eq('id', productId);
      if (e2) throw new Error(formatSupabaseError(e2));
      return 'discontinuado';
    }
    throw new Error(formatSupabaseError(error));
  },

  async adjustStock(productId: string, delta: number, reason: string): Promise<StoreProduct> {
    const { data, error } = await supabase.rpc('adjust_store_stock', {
      p_product_id: productId, p_delta: delta, p_reason: reason
    });
    if (error) throw new Error(formatSupabaseError(error));
    return mapStoreProductFromDb(data);
  },

  // ----------------------------------------------------------------------------
  // PROMOCIONES
  // ----------------------------------------------------------------------------
  async fetchPromotions(clubId: string): Promise<StorePromotion[]> {
    if (!isSupabaseConfigured() || !clubId) return [];
    const { data, error } = await supabase.from('store_promotions').select('*').eq('club_id', clubId).order('created_at', { ascending: false });
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapStorePromotionFromDb);
  },

  async createPromotion(clubId: string, userId: string, p: Omit<StorePromotion, 'id' | 'createdAt' | 'clubId' | 'createdByUserId'>): Promise<StorePromotion> {
    const payload = { ...promoToDb(p), club_id: clubId, created_by_user_id: userId };
    const { data, error } = await supabase.from('store_promotions').insert(payload).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapStorePromotionFromDb(data);
  },

  async updatePromotion(id: string, updates: Partial<StorePromotion>): Promise<StorePromotion> {
    const { data, error } = await supabase.from('store_promotions').update(promoToDb(updates)).eq('id', id).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapStorePromotionFromDb(data);
  },

  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase.from('store_promotions').delete().eq('id', id);
    if (error) throw new Error(formatSupabaseError(error));
  },

  // ----------------------------------------------------------------------------
  // VENTAS
  // ----------------------------------------------------------------------------
  async fetchSales(clubId: string): Promise<StoreSale[]> {
    if (!isSupabaseConfigured() || !clubId) return [];
    const { data, error } = await supabase
      .from('store_sales')
      .select('*, store_sale_items(*)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapStoreSaleFromDb);
  },

  /** Venta atómica: recibo + movimiento de caja + venta + ítems + stock, todo en una sola transacción. */
  async processSaleAtomic(params: {
    cashBoxId: string;
    customerName: string;
    customerDni?: string;
    paymentMethod: PaymentMethod;
    items: { productId: string; quantity: number; size?: string }[];
    discountAmount?: number;
    promotionName?: string;
  }): Promise<Receipt> {
    const { data, error } = await supabase.rpc('process_store_sale', {
      p_cash_box_id: params.cashBoxId,
      p_customer_name: params.customerName,
      p_customer_dni: params.customerDni || null,
      p_payment_method: params.paymentMethod,
      p_items: params.items.map(i => ({ productId: i.productId, quantity: i.quantity, size: i.size || null })),
      p_discount: params.discountAmount || 0,
      p_promotion_name: params.promotionName || null
    });
    if (error) throw new Error(formatSupabaseError(error));

    const receiptId = (data as any)?.receipt_id;
    const { data: rec, error: recErr } = await supabase.from('receipts').select('*').eq('id', receiptId).single();
    if (recErr || !rec) throw new Error('La venta se registró, pero no se pudo leer el comprobante: ' + formatSupabaseError(recErr));
    return mapReceiptFromDb(rec);
  },

  // ----------------------------------------------------------------------------
  // CAJA DE TIENDA (turnos)
  // ----------------------------------------------------------------------------
  async getOrCreateStoreCashBox(): Promise<CashBox> {
    const { data, error } = await supabase.rpc('get_or_create_store_cash_box');
    if (error) throw new Error(formatSupabaseError(error));
    return mapCashBoxFromDb(data);
  },

  async openCashBox(boxId: string, initialCash: number, shiftName: string, notes: string): Promise<CashBox> {
    const { data, error } = await supabase.rpc('open_cash_box', {
      p_box_id: boxId, p_initial_cash: initialCash, p_shift_name: shiftName, p_notes: notes
    });
    if (error) throw new Error(formatSupabaseError(error));
    return mapCashBoxFromDb(data);
  },

  async closeCashBox(boxId: string, countedCash: number, notes: string): Promise<CashBox> {
    const { data, error } = await supabase.rpc('close_cash_box', {
      p_box_id: boxId, p_counted_cash: countedCash, p_notes: notes
    });
    if (error) throw new Error(formatSupabaseError(error));
    return mapCashBoxFromDb(data);
  }
};
