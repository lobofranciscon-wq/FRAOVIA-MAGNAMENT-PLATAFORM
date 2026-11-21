import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MessageCircle, 
  X, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';

interface SubscriptionExpiryBannerProps {
  currentClub: Club | null;
  currentUser: User;
}

export const SubscriptionExpiryBanner: React.FC<SubscriptionExpiryBannerProps> = ({
  currentClub,
  currentUser
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const alertConfig = currentClub?.subscriptionAlert;

  // Check if banner should be displayed
  const isEnabled = alertConfig && alertConfig.mode !== 'disabled';
  const isSuperadmin = currentUser.role === 'SUPERADMIN';
  const isAllowedRole = !alertConfig?.showToRoles || 
                        alertConfig.showToRoles.includes(currentUser.role) || 
                        isSuperadmin;

  useEffect(() => {
    if (!isEnabled || !alertConfig?.expirationDate) return;

    const calculateTime = () => {
      const expTime = new Date(alertConfig.expirationDate).getTime();
      const now = new Date().getTime();
      const diff = expTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isEnabled, alertConfig?.expirationDate]);

  if (!isEnabled || !isAllowedRole || isDismissed || !currentClub) {
    return null;
  }

  const isCountdown = alertConfig.mode === 'cuenta_regresiva';
  const isUrgent = timeLeft.days <= 3;
  const formattedExpDate = new Date(alertConfig.expirationDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleContactSupport = () => {
    const phone = (alertConfig.supportContact || '+54 9 11 4782-9011').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola Soporte FRAOVIA, me comunico desde ${currentClub.name} para renovar nuestra suscripción mensual del sistema que vence el ${formattedExpDate}.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Minimized chip view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in">
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-3.5 py-2 rounded-2xl shadow-2xl border flex items-center gap-2 text-xs font-black transition cursor-pointer ${
            isUrgent || timeLeft.isExpired
              ? 'bg-rose-950 border-rose-500 text-rose-300'
              : 'bg-amber-950 border-amber-500 text-amber-300'
          }`}
        >
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          <span>Vencimiento SaaS: {isCountdown ? `${timeLeft.days}d ${timeLeft.hours}h` : formattedExpDate}</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside 
      aria-label="Alerta de suscripción del club"
      className={`w-full border-b select-none transition-all duration-300 relative z-40 ${
        timeLeft.isExpired
          ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-rose-600 text-white'
          : isUrgent
            ? 'bg-gradient-to-r from-rose-950 via-amber-950 to-rose-950 border-rose-500/80 text-white shadow-lg shadow-rose-950/40'
            : 'bg-gradient-to-r from-[#1A1305] via-[#2A1D07] to-[#1A1305] border-amber-500/60 text-amber-100 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Information */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isUrgent || timeLeft.isExpired
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            {isCountdown ? (
              <Clock className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                timeLeft.isExpired
                  ? 'bg-rose-500 text-white'
                  : isUrgent
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {timeLeft.isExpired ? 'Suscripción Vencida' : isCountdown ? 'Cuenta Regresiva de Vencimiento' : 'Aviso Institucional'}
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                {currentClub.name}
              </span>
            </div>

            <p className="text-xs font-medium text-slate-200 mt-0.5 leading-snug">
              {alertConfig.customMessage || (
                timeLeft.isExpired 
                  ? `El plan mensual de tu club ha vencido el ${formattedExpDate}. Por favor renueva tu canon para evitar el bloqueo del servicio.`
                  : `Tu plan mensual está a punto de vencer el ${formattedExpDate}. Regularice para mantener habilitados los módulos y el padrón sin interrupciones.`
              )}
            </p>
          </div>
        </div>

        {/* Center / Right: Countdown Display (if countdown mode) & Actions */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
          
          {/* LIVE COUNTDOWN TIMER BLOCK */}
          {isCountdown && !timeLeft.isExpired && (
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-2xl font-mono text-center shadow-inner">
              <div className="px-1.5">
                <span className="text-sm sm:text-base font-black text-amber-300 block leading-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans block">Días</span>
              </div>
              <span className="text-amber-400/80 font-bold">:</span>
              <div className="px-1.5">
                <span className="text-sm sm:text-base font-black text-amber-300 block leading-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans block">Hs</span>
              </div>
              <span className="text-amber-400/80 font-bold">:</span>
              <div className="px-1.5">
                <span className="text-sm sm:text-base font-black text-amber-300 block leading-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans block">Min</span>
              </div>
              <span className="text-amber-400/80 font-bold">:</span>
              <div className="px-1.5">
                <span className="text-sm sm:text-base font-black text-rose-400 block leading-tight">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans block">Seg</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleContactSupport}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow ${
              isUrgent || timeLeft.isExpired
                ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Renovar Plan con Soporte</span>
          </button>

          {/* Controls: Minimize / Close */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Minimizar aviso"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Ocultar por esta sesión"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </aside>
  );
};
