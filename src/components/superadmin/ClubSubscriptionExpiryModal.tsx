import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  MessageCircle
} from 'lucide-react';
import { Club, SubscriptionAlertConfig, SubscriptionAlertMode, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface ClubSubscriptionExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  currentUser: User;
  onSaved: () => void;
}

export const ClubSubscriptionExpiryModal: React.FC<ClubSubscriptionExpiryModalProps> = ({
  isOpen,
  onClose,
  club,
  currentUser,
  onSaved
}) => {
  if (!isOpen) return null;

  const currentConfig = club.subscriptionAlert;

  const [mode, setMode] = useState<SubscriptionAlertMode>(
    currentConfig?.mode || 'disabled'
  );

  // Expiration date formatted for input datetime-local
  const initialDateStr = currentConfig?.expirationDate 
    ? new Date(currentConfig.expirationDate).toISOString().slice(0, 16)
    : new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 16);

  const [expirationDate, setExpirationDate] = useState<string>(initialDateStr);
  const [customMessage, setCustomMessage] = useState<string>(
    currentConfig?.customMessage || ''
  );
  const [supportContact, setSupportContact] = useState<string>(
    currentConfig?.supportContact || '+54 9 11 4782-9011'
  );

  // Quick Date Shortcut Helpers
  const handleSetQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(23, 59, 0, 0);
    setExpirationDate(d.toISOString().slice(0, 16));
  };

  const handleSetEndOfMonth = () => {
    const d = new Date();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0, 0);
    setExpirationDate(nextMonth.toISOString().slice(0, 16));
  };

  const handleSave = () => {
    try {
      fraoviaDB.updateClubSubscriptionAlert(
        club.id,
        {
          mode,
          expirationDate: new Date(expirationDate).toISOString(),
          customMessage: customMessage.trim() || undefined,
          supportContact: supportContact.trim()
        },
        currentUser
      );

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la alerta de vencimiento');
    }
  };

  const formattedPreviewDate = new Date(expirationDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B1528] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Clock className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                Gestión Superadmin SaaS
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Alerta de Vencimiento de Suscripción · {club.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Mode Selector (3 options: Deshabilitado, Solo Cartel, Cuenta Regresiva) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Selecciona el Tipo de Aviso de Vencimiento:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Deshabilitado */}
              <div 
                onClick={() => setMode('disabled')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  mode === 'disabled'
                    ? 'bg-slate-900 border-slate-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold block uppercase mb-1">
                    ⚪ Modo Inactivo
                  </span>
                  <h4 className="font-black text-xs text-slate-200">Deshabilitado</h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    No se muestra ninguna advertencia ni banner al club.
                  </p>
                </div>
                {mode === 'disabled' && (
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block">✓ Seleccionado</span>
                )}
              </div>

              {/* Option 2: Solo Cartel */}
              <div 
                onClick={() => setMode('cartel')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  mode === 'cartel'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold block uppercase mb-1 text-amber-400">
                    ⚠️ Notificación Fija
                  </span>
                  <h4 className="font-black text-xs text-white">Solo Cartel de Aviso</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cartel institucional visible en la cabecera indicando fecha de vencimiento.
                  </p>
                </div>
                {mode === 'cartel' && (
                  <span className="text-[10px] font-bold text-amber-400 mt-2 block">✓ Seleccionado</span>
                )}
              </div>

              {/* Option 3: Cuenta Regresiva */}
              <div 
                onClick={() => setMode('cuenta_regresiva')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  mode === 'cuenta_regresiva'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-200 shadow-md shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold block uppercase mb-1 text-rose-400">
                    ⏳ Reloj Activo
                  </span>
                  <h4 className="font-black text-xs text-white">Cuenta Regresiva en Vivo</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Temporizador dinámico [Días:Hs:Min:Seg] con alerta de urgencia.
                  </p>
                </div>
                {mode === 'cuenta_regresiva' && (
                  <span className="text-[10px] font-bold text-rose-400 mt-2 block">✓ Seleccionado</span>
                )}
              </div>
            </div>
          </div>

          {/* Form details (only active if mode != disabled) */}
          {mode !== 'disabled' && (
            <div className="space-y-4 pt-3 border-t border-slate-800/80 animate-in fade-in">
              
              {/* Expiration date picker & shortcuts */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Fecha y Hora Límite del Vencimiento Mensual *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {formattedPreviewDate}
                  </span>
                </div>

                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                />

                {/* Quick date buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Atajos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(3)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    +3 días (Urgente)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(7)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    +7 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(15)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    +15 días
                  </button>
                  <button
                    type="button"
                    onClick={handleSetEndOfMonth}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold"
                  >
                    Fin de Mes
                  </button>
                </div>
              </div>

              {/* Custom message & Support phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Mensaje de Alerta Personalizado (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej: El canon del plan Pro vence este fin de mes. Por favor regularice para mantener el servicio activo."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Teléfono WhatsApp de Renovación (Soporte) *
                  </label>
                  <input
                    type="text"
                    value={supportContact}
                    onChange={(e) => setSupportContact(e.target.value)}
                    placeholder="+54 9 11 4782-9011"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Canal al que redirige el botón "Renovar Plan con Soporte".
                  </span>
                </div>
              </div>

              {/* LIVE SIMULATED PREVIEW OF THE BANNER */}
              <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Vista Previa de cómo lo verá el Club {club.name}:</span>
                </span>

                <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                  mode === 'cuenta_regresiva'
                    ? 'bg-rose-950/60 border-rose-500/50 text-white'
                    : 'bg-amber-950/60 border-amber-500/50 text-amber-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {mode === 'cuenta_regresiva' ? (
                      <Clock className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider block text-amber-300">
                        {mode === 'cuenta_regresiva' ? 'Cuenta Regresiva Activa' : 'Aviso Institucional'}
                      </span>
                      <p className="text-[11px] font-medium leading-tight">
                        {customMessage || `Tu plan mensual vencerá el ${formattedPreviewDate}. Regularice para evitar la suspensión del servicio.`}
                      </p>
                    </div>
                  </div>

                  {mode === 'cuenta_regresiva' && (
                    <div className="bg-black/60 border border-white/10 px-2 py-1 rounded-xl font-mono text-[10px] text-amber-300 shrink-0 font-black">
                      12d : 08h : 34m : 12s
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {mode === 'disabled' 
              ? 'La alerta de vencimiento se guardará desactivada.'
              : `Alerta configurada en modo '${mode === 'cuenta_regresiva' ? 'Cuenta Regresiva' : 'Solo Cartel'}'.`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
