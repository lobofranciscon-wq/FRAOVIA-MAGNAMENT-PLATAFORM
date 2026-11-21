import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Receipt, ReceiptItem, PaymentMethod } from '../types/fraovia';
import { formatSupabaseError, mapReceiptFromDb } from './supabaseDataService';

export interface VoidReceiptResult {
  success: boolean;
  message: string;
  receiptNumber?: string;
  contraasientoId?: string;
}

export interface EmitReceiptInput {
  clubId: string;
  customerName: string;
  customerDni?: string;
  playerId?: string | null;
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
  items?: ReceiptItem[];
  cashBoxId?: string | null;
  issuedByUserId: string;
  category?: 'cuota' | 'inscripcion' | 'tienda' | 'proveedor' | 'sueldo' | 'mantenimiento' | 'anulacion_recibo' | 'otro';
  /** Cobro combinado: cuánto de este comprobante corresponde a cada categoría de caja (suma = amount). */
  breakdown?: { category: 'cuota' | 'inscripcion' | 'otro'; amount: number }[];
}

export interface EmitReceiptResult {
  receipt: Receipt;
  movementWarning: string | null;
}

/**
 * Servicio de comprobantes contables y recibos oficiales (Fase 2).
 * 
 * Reglas de seguridad e inmutabilidad:
 * 1. Insert SIN receipt_number (la base lo genera automáticamente de forma atómica).
 *    Se pide .select() para leer el número generado.
 * 2. Inmediatamente después, se inserta en cash_movements el movimiento de ingreso.
 *    Si falla el movimiento, se advierte con mensaje claro con el número de recibo. No se borra el recibo.
 * 3. Los comprobantes NO se pueden editar (UPDATE) ni eliminar (DELETE).
 * 4. La anulación se ejecuta de forma estrictamente atómica y auditada mediante
 *    la función PostgreSQL `void_receipt(p_receipt_id, p_reason)`.
 */
export const supabaseReceiptService = {
  /**
   * Consulta los comprobantes emitidos para el club respetando RLS
   */
  async getReceipts(clubId: string): Promise<Receipt[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('club_id', clubId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error al consultar receipts en Supabase:', error);
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapReceiptFromDb);
  },

  /**
   * Emite un recibo oficial en receipts y registra el movimiento de ingreso en cash_movements.
   */
  async emitReceipt(data: EmitReceiptInput): Promise<EmitReceiptResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado para emitir comprobantes.');
    }

    if (!data.customerName || !data.customerName.trim()) {
      throw new Error('El nombre del cliente/socio es obligatorio.');
    }

    if (data.amount < 0) {
      throw new Error('El monto del comprobante debe ser mayor o igual a 0.');
    }

    // PASO 1: Insertar en receipts SIN receipt_number y obtener datos generados con .select()
    const receiptPayload: any = {
      club_id: data.clubId,
      customer_name: data.customerName.trim(),
      customer_dni: data.customerDni?.trim() || null,
      player_id: data.playerId || null,
      concept: data.concept.trim(),
      amount: Number(data.amount),
      payment_method: data.paymentMethod,
      items: data.items || [],
      cash_box_id: data.cashBoxId || null,
      issued_by_user_id: data.issuedByUserId,
      status: 'emitido'
    };

    const { data: createdReceipt, error: receiptError } = await supabase
      .from('receipts')
      .insert(receiptPayload)
      .select()
      .single();

    if (receiptError || !createdReceipt) {
      console.error('Error al emitir recibo en Supabase:', receiptError);
      throw new Error(formatSupabaseError(receiptError));
    }

    const mappedReceipt = mapReceiptFromDb(createdReceipt);
    let movementWarning: string | null = null;

    // PASO 2: Inmediatamente después, si hay cash_box_id y amount > 0, insertar en cash_movements
    if (data.cashBoxId && Number(data.amount) > 0) {
      const validCategories = [
        'cuota', 'inscripcion', 'tienda', 'proveedor',
        'sueldo', 'mantenimiento', 'anulacion_recibo', 'otro'
      ];
      const validCategory = (data.category && validCategories.includes(data.category))
        ? data.category
        : 'cuota';

      const baseMovement = {
        club_id: data.clubId,
        cash_box_id: data.cashBoxId,
        type: 'ingreso',
        receipt_id: createdReceipt.id,
        payment_method: data.paymentMethod,
        registered_by_user_id: data.issuedByUserId
      };

      // Cobro combinado: un movimiento por categoría (cuota / inscripción / otros), todos en una sola operación
      const parts = (data.breakdown || []).filter(b => Number(b.amount) > 0);
      const partsTotal = parts.reduce((a, b) => a + Number(b.amount), 0);
      const LABELS: Record<string, string> = { cuota: 'Cuotas', inscripcion: 'Inscripción', otro: 'Seguro / ficha médica' };

      const movementPayload = parts.length > 1 && Math.abs(partsTotal - Number(data.amount)) < 0.01
        ? parts.map(b => ({
            ...baseMovement,
            amount: Number(b.amount),
            concept: `${data.concept.trim()} — ${LABELS[b.category] || b.category}`.slice(0, 250),
            category: b.category
          }))
        : {
            ...baseMovement,
            amount: Number(data.amount),
            concept: data.concept.trim(),
            category: validCategory
          };

      const { error: movError } = await supabase
        .from('cash_movements')
        .insert(movementPayload);

      if (movError) {
        console.error('Error al registrar movimiento de caja posterior al recibo:', movError);
        // AVISO CLARO: El recibo se emitió pero el movimiento de caja no se registró. No borrar el recibo.
        movementWarning = `El recibo se emitió con éxito (${createdReceipt.receipt_number}), pero el movimiento de caja no se registró: ${formatSupabaseError(movError)}`;
      }
    }

    return {
      receipt: mappedReceipt,
      movementWarning
    };
  },

  /**
   * Anula un recibo de forma oficial y atómica llamando a supabase.rpc('void_receipt')
   */
  async voidReceipt(receiptId: string, reason: string): Promise<VoidReceiptResult> {
    if (!reason || !reason.trim()) {
      throw new Error('FRAOVIA: Es obligatorio ingresar el motivo formal de anulación del comprobante.');
    }

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: 'Comprobante anulado en modo local'
      };
    }

    // Invocación RPC a la función PostgreSQL void_receipt en Supabase
    const { data, error } = await supabase.rpc('void_receipt', {
      p_receipt_id: receiptId,
      p_reason: reason.trim()
    });

    if (error) {
      console.error('Error al invocar supabase.rpc("void_receipt"):', error);
      throw new Error(formatSupabaseError(error));
    }

    return {
      success: true,
      receiptNumber: data?.receipt_number,
      contraasientoId: data?.contraasiento_id,
      message: data?.message || 'Comprobante anulado y contraasiento generado exitosamente.'
    };
  }
};
