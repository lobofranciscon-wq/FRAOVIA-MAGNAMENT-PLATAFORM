import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Sparkles,
  Users,
  ChevronRight
} from 'lucide-react';
import { Club, Player, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';

interface UpcomingDuesWidgetProps {
  currentClub: Club;
  currentUser: User;
  players: Player[];
  onOpenReminderModal: () => void;
  onRefresh?: () => void;
}

export const UpcomingDuesWidget: React.FC<UpcomingDuesWidgetProps> = ({
  currentClub,
  currentUser,
  players,
  onOpenReminderModal,
  onRefresh
}) => {
  const [timeWindowDays, setTimeWindowDays] = useState<number>(7);
  const [isQuickSending, setIsQuickSending] = useState<boolean>(false);
  const [quickSentSuccess, setQuickSentSuccess] = useState<boolean>(false);

  const feeConfig = currentClub.feeReminderAutomation;
  const dueDayOfMonth = feeConfig?.dueDayOfMonth ?? 10;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthName = today.toLocaleDateString('es-AR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Calculate days remaining to due date
  let daysUntilDue = dueDayOfMonth - currentDay;
  if (daysUntilDue < 0) {
    // If due date has passed this month, calculate to next month's due date
    const lastDayCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    daysUntilDue = (lastDayCurrentMonth - currentDay) + dueDayOfMonth;
  }

  // Filter players with balance or monthly fees due
  const debtors = useMemo(() => {
    return players.filter(p => !p.isRestricted && (p.monthlyFeeDue > 0 || p.balance > 0));
  }, [players]);

  // Total amount pending among these players
  const totalPendingAmount = useMemo(() => {
    return debtors.reduce((acc, p) => acc + (p.monthlyFeeDue > 0 ? p.monthlyFeeDue : p.balance), 0);
  }, [debtors]);

  // Quick single-click batch send
  const handleQuickSend = async () => {
    if (debtors.length === 0 || isQuickSending) return;
    setIsQuickSending(true);
    try {
      const playerIds = debtors.map(p => p.id);
      await dataActions.registerFeeReminderBatch(currentClub, playerIds, currentUser);
      setQuickSentSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setQuickSentSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al despachar avisos');
    } finally {
      setIsQuickSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#121c33] via-[#0b1426] to-[#141226] text-white shadow-xl relative overflow-hidden transition-all duration-300">
      
      {/* Background glowing aura */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Side: Summary & Count */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-6 h-6 stroke-[2.3] animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Control de Vencimientos
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Vence el {dueDayOfMonth} de {capitalizedMonth} ({daysUntilDue === 0 ? '¡Vence Hoy!' : `faltan ${daysUntilDue} días`})
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-xl sm:text-2xl font-black text-white font-mono">
                {debtors.length} socios
              </h4>
              <span className="text-xs font-semibold text-amber-300">
                con cuota próxima a vencer
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                · Saldo total estimado: <strong className="text-slate-200">${totalPendingAmount.toLocaleString('es-AR')}</strong>
              </span>
            </div>

            {/* Avatars Preview & Channel info */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              <div className="flex -space-x-1.5 overflow-hidden">
                {debtors.slice(0, 4).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 text-slate-200 text-[10px] font-bold flex items-center justify-center uppercase shadow-sm"
                    title={`${p.firstName} ${p.lastName}`}
                  >
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                ))}
                {debtors.length > 4 && (
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center justify-center">
                    +{debtors.length - 4}
                  </div>
                )}
              </div>

              <span>
                Canal: <strong className="text-emerald-400 font-mono">WhatsApp Oficial</strong>
              </span>

              {feeConfig?.lastRunDate && (
                <span className="hidden sm:inline text-slate-500">
                  · Último envío: {feeConfig.lastRunDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Direct Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto self-end md:self-auto justify-end">
          
          {quickSentSuccess ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡{debtors.length} avisos despachados con éxito!</span>
            </div>
          ) : (
            <>
              {/* Secondary button: Open full automated modal */}
              <button
                type="button"
                onClick={onOpenReminderModal}
                className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="Configurar plantilla, días de gracia y fechas de vencimiento"
              >
                <span>Configurar Reglas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Direct Quick Action button */}
              <button
                type="button"
                onClick={handleQuickSend}
                disabled={isQuickSending || debtors.length === 0}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-teal-500 disabled:opacity-50 text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4 text-white stroke-[2.5]" />
                <span>
                  {isQuickSending ? 'Enviando Avisos...' : `Enviar Recordatorio de Pago (${debtors.length})`}
                </span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
