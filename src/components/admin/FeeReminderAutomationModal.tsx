import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Send, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Sliders, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Search,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Club, Discipline, FeeReminderAutomationConfig, Player, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface FeeReminderAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  /** Con Supabase activo se pasan los datos reales del club. */
  players?: Player[];
  disciplines?: Discipline[];
  onUpdated: () => void;
}

export const FeeReminderAutomationModal: React.FC<FeeReminderAutomationModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  players: playersProp,
  disciplines: disciplinesProp,
  onUpdated
}) => {
  if (!isOpen) return null;

  const currentConfig = currentClub.feeReminderAutomation;
  const clubPlayers = isSupabaseConfigured() ? (playersProp || []) : fraoviaDB.getPlayers(currentClub.id, currentUser);
  const clubDisciplines = isSupabaseConfigured() ? (disciplinesProp || []) : fraoviaDB.getDisciplines(currentClub.id, currentUser);

  // Automation rules state
  const [enabled, setEnabled] = useState<boolean>(currentConfig?.enabled ?? true);
  const [startDayOfMonth, setStartDayOfMonth] = useState<number>(currentConfig?.startDayOfMonth ?? 1);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(currentConfig?.dueDayOfMonth ?? 10);
  const [graceDays, setGraceDays] = useState<number>(currentConfig?.graceDays ?? 5);
  const [cbuAlias, setCbuAlias] = useState<string>(currentConfig?.cbuAlias || 'SAN.MARTIN.CUOTAS');
  const [autoSendOnMonthStart, setAutoSendOnMonthStart] = useState<boolean>(currentConfig?.autoSendOnMonthStart ?? true);
  const [messageTemplate, setMessageTemplate] = useState<string>(
    currentConfig?.messageTemplate || 
    '¡Hola {socio}! Te recordamos desde la Administración de {club} que la cuota social de {mes} por un valor de ${monto} está próxima a vencer el día {fecha_vencimiento}. Podes regularizar por transferencia al Alias: {cbu_alias}. ¡Muchas gracias!'
  );

  // Active section tab
  const [activeTab, setActiveTab] = useState<'reglas' | 'destinatarios' | 'previsualizacion'>('destinatarios');

  // Filters for players list
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('all');
  const [filterBalanceType, setFilterBalanceType] = useState<'all_debtors' | 'upcoming_due'>('all_debtors');

  // Calculate recipients
  const eligiblePlayers = useMemo(() => {
    return clubPlayers.filter(p => {
      // Must not be restricted
      if (p.isRestricted) return false;
      
      // Has fee due or positive balance (debtor)
      const hasDebt = (p.monthlyFeeDue > 0) || (p.balance > 0);
      if (!hasDebt) return false;

      // Filter discipline
      if (selectedDisciplineId !== 'all' && p.disciplineId !== selectedDisciplineId) {
        return false;
      }

      // Filter search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        if (!fullName.includes(term) && !p.dni.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [clubPlayers, selectedDisciplineId, searchTerm]);

  // Selected player IDs for batch execution
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => 
    eligiblePlayers.map(p => p.id)
  );

  const isAllSelected = eligiblePlayers.length > 0 && selectedPlayerIds.length === eligiblePlayers.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(eligiblePlayers.map(p => p.id));
    }
  };

  const toggleSelectPlayer = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Build personalized message for a given player
  const buildPlayerMessage = (player: Player) => {
    const currentMonthName = new Date().toLocaleDateString('es-AR', { month: 'long' });
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
    const amount = player.monthlyFeeDue > 0 ? player.monthlyFeeDue : (player.balance > 0 ? player.balance : 8500);

    return messageTemplate
      .replace(/{socio}/g, `${player.firstName} ${player.lastName}`)
      .replace(/{club}/g, currentClub.name)
      .replace(/{mes}/g, capitalizedMonth)
      .replace(/{monto}/g, amount.toLocaleString('es-AR'))
      .replace(/{fecha_vencimiento}/g, `${dueDayOfMonth} de ${capitalizedMonth}`)
      .replace(/{cbu_alias}/g, cbuAlias || 'ADMINISTRACION.CLUB');
  };

  // Launch single WhatsApp message
  const handleSendSingleWhatsApp = (player: Player) => {
    const cleanPhone = (player.phone || player.emergencyContact?.phone || '').replace(/[^0-9]/g, '');
    const message = buildPlayerMessage(player);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // Execute batch dispatch simulation
  const [isDispatching, setIsDispatching] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  const handleExecuteBatchDispatch = async () => {
    if (selectedPlayerIds.length === 0) {
      alert('Por favor selecciona al menos un socio de la lista para despachar los avisos.');
      return;
    }

    setIsDispatching(true);
    try {
      const res = await dataActions.registerFeeReminderBatch(currentClub, selectedPlayerIds, currentUser);
      setBatchSuccessMessage(res.message);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar el envío');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSaveAutomationRules = async () => {
    try {
      await dataActions.saveFeeReminderAutomation(
        currentClub,
        {
          enabled,
          startDayOfMonth,
          dueDayOfMonth,
          graceDays,
          cbuAlias: cbuAlias.trim(),
          autoSendOnMonthStart,
          messageTemplate: messageTemplate.trim()
        },
        currentUser
      );
      onUpdated();
      alert('¡Reglas de automatización de vencimiento de cuotas guardadas correctamente!');
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B1528] border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Clock className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Administración & Cobranzas
                </span>
                <span className="text-xs text-emerald-200">{currentClub.name}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Avisos Automatizados de Vencimiento de Cuotas
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-bold bg-slate-950/50">
          <button
            onClick={() => setActiveTab('destinatarios')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'destinatarios'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Socios Próximos a Vencer ({eligiblePlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reglas')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'reglas'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración de Fechas & Cronograma</span>
          </button>

          <button
            onClick={() => setActiveTab('previsualizacion')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'previsualizacion'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Plantilla de Mensaje WhatsApp</span>
          </button>
        </div>

        {/* Success Alert Banner if batch sent */}
        {batchSuccessMessage && (
          <div className="p-3 mx-5 mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{batchSuccessMessage}</span>
            </div>
            <button onClick={() => setBatchSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* TAB 1: DESTINATARIOS & DISPARO */}
          {activeTab === 'destinatarios' && (
            <div className="space-y-4">
              
              {/* Top controls: Filter & Select All */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar socio por nombre o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white text-xs"
                    />
                  </div>

                  <select
                    value={selectedDisciplineId}
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="all">Todas las disciplinas</option>
                    {clubDisciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    {isAllSelected ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                  </button>

                  <button
                    onClick={handleExecuteBatchDispatch}
                    disabled={isDispatching || selectedPlayerIds.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isDispatching ? 'Despachando...' : `Enviar Avisos a ${selectedPlayerIds.length} Socios`}</span>
                  </button>
                </div>
              </div>

              {/* Status info strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Inicio del aviso:</span>
                  <span className="font-bold text-emerald-400">Día {startDayOfMonth} de cada mes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Vencimiento aproximado:</span>
                  <span className="font-bold text-amber-400">Día {dueDayOfMonth} de cada mes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Último despacho masivo:</span>
                  <span className="font-mono text-slate-300">{currentConfig?.lastRunDate || 'No registrado aún'}</span>
                </div>
              </div>

              {/* Table of Players */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                          />
                        </th>
                        <th className="p-3">Socio / Jugador</th>
                        <th className="p-3">Contacto WhatsApp</th>
                        <th className="p-3">Disciplina</th>
                        <th className="p-3 text-right">Saldo / Cuota</th>
                        <th className="p-3 text-center">Acción Directa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {eligiblePlayers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No se encontraron socios con cuotas o saldos pendientes según los filtros actuales.
                          </td>
                        </tr>
                      ) : (
                        eligiblePlayers.map(player => {
                          const isSelected = selectedPlayerIds.includes(player.id);
                          const discipline = clubDisciplines.find(d => d.id === player.disciplineId);
                          const amount = player.monthlyFeeDue > 0 ? player.monthlyFeeDue : player.balance;

                          return (
                            <tr key={player.id} className={`hover:bg-slate-900/60 transition ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectPlayer(player.id)}
                                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                                />
                              </td>
                              <td className="p-3 font-medium text-white">
                                <div>
                                  <span>{player.firstName} {player.lastName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono block">DNI: {player.dni}</span>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-300">
                                {player.phone || player.emergencyContact?.phone || (
                                  <span className="text-slate-500 italic">Sin teléfono</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-400">
                                {discipline?.name || 'Deportes'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-amber-400">
                                ${amount.toLocaleString('es-AR')}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSendSingleWhatsApp(player)}
                                  className="px-2.5 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-[10px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                                  title="Enviar WhatsApp personalizado con 1 clic"
                                >
                                  <MessageCircle className="w-3 h-3 stroke-[2.5]" />
                                  <span>Enviar WA</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REGLAS Y FECHAS APROXIMADAS */}
          {activeTab === 'reglas' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="font-black text-white text-xs uppercase tracking-wider">
                      Automatización Mensual de Cobranzas
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Envío programado de recordatorios de pago para socios con cuotas activas.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      {enabled ? 'Habilitada' : 'Pausada'}
                    </span>
                  </label>
                </div>

                {/* Day pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Día de Inicio de Avisos *
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={startDayOfMonth}
                        onChange={(e) => setStartDayOfMonth(parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <option key={d} value={d}>Día {d} de cada mes</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Comienza a enviar cuando arranca el mes.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Fecha Estimada de Vencimiento *
                    </label>
                    <select
                      value={dueDayOfMonth}
                      onChange={(e) => setDueDayOfMonth(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-amber-300"
                    >
                      {[5, 10, 12, 15, 20, 25].map(d => (
                        <option key={d} value={d}>Día {d} del mes</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      Fecha límite informada al socio en el texto.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Días de Gracia Adicionales
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={graceDays}
                      onChange={(e) => setGraceDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Tolerancia antes del estado moroso (+{graceDays} días).
                    </span>
                  </div>
                </div>

                {/* CBU / Alias */}
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Alias CBU / CVU para Transferencias Institucionales
                  </label>
                  <input
                    type="text"
                    value={cbuAlias}
                    onChange={(e) => setCbuAlias(e.target.value)}
                    placeholder="SAN.MARTIN.CUOTAS"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Se reemplaza automáticamente en la variable &#123;cbu_alias&#125;.
                  </span>
                </div>

                {/* Auto send toggle */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">Envío Automático al Iniciar el Mes</span>
                      <span className="text-[10px] text-slate-400">
                        El sistema generará el lote de avisos el día {startDayOfMonth} para todos los socios con cuota pendiente.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSendOnMonthStart}
                    onChange={(e) => setAutoSendOnMonthStart(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PLANTILLA DE MENSAJE & PREVIEW */}
          {activeTab === 'previsualizacion' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Template Editor */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-black text-white text-xs uppercase tracking-wider block">
                  Editor de Plantilla de Mensaje
                </span>

                <textarea
                  rows={6}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed"
                />

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Variables Disponibles:</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;socio&#125;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;club&#125;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;mes&#125;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;monto&#125;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;fecha_vencimiento&#125;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">&#123;cbu_alias&#125;</span>
                  </div>
                </div>
              </div>

              {/* Simulated WhatsApp Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Vista Previa del Mensaje en WhatsApp</span>
                  </span>

                  <div className="p-4 rounded-2xl bg-[#0b141a] border border-slate-800 text-xs text-slate-100 shadow-inner relative">
                    <div className="bg-[#005c4b] p-3 rounded-2xl rounded-tr-none text-white text-xs leading-relaxed shadow space-y-1 max-w-[90%] ml-auto">
                      <p className="whitespace-pre-line">
                        {buildPlayerMessage(clubPlayers[0] || {
                          id: 'sample',
                          firstName: 'Martín',
                          lastName: 'González',
                          monthlyFeeDue: 8500,
                          balance: 8500
                        } as any)}
                      </p>
                      <span className="text-[9px] text-emerald-200/80 float-right mt-1 font-mono">
                        {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic text-center">
                  Canal remitente: {currentClub.whatsappConfig?.adminPhone || '+54 9 11 4782-9011'} (Administración Oficial).
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {enabled 
              ? `Avisos programados para iniciar el día ${startDayOfMonth} con vencimiento el día ${dueDayOfMonth}.`
              : 'Automatización pausada temporalmente.'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSaveAutomationRules}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Reglas de Vencimiento</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
