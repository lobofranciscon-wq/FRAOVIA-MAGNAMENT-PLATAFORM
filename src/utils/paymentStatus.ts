import { Player, Receipt } from '../types/fraovia';

const NEW_PLAYER_WINDOW_DAYS = 90;

/**
 * Un deportista recién cargado todavía no pagó nada: no debe verse "Al día" ni con meses pagados.
 * Se considera "pendiente de primer pago" si:
 *  - se pasó la lista de comprobantes y no tiene ninguno vigente (no anulado),
 *  - no tiene deuda registrada ni está suspendido,
 *  - y se inscribió hace poco (los jugadores importados de años anteriores no se ven afectados).
 */
export function isPendingFirstPayment(player: Player, receipts?: Receipt[]): boolean {
  if (!receipts) return false;
  if ((player.balance || 0) > 0) return false;
  if (player.status === 'suspendido') return false;

  const joined = player.joinedDate ? new Date(player.joinedDate).getTime() : 0;
  if (!joined || Date.now() - joined > NEW_PLAYER_WINDOW_DAYS * 24 * 60 * 60 * 1000) return false;

  return !receipts.some(r => r.playerId === player.id && r.status !== 'anulado');
}
