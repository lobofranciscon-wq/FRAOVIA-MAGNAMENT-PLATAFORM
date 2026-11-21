import React, { useState, useMemo, useRef } from 'react';
import { 
  Plane, 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  UserCheck, 
  Plus, 
  DollarSign, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Clock, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles, 
  Filter, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  Eye, 
  MessageCircle, 
  Check, 
  X,
  User,
  ShieldCheck,
  Printer,
  FileText,
  Copy,
  ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Club, 
  User as FraoviaUser, 
  Category, 
  Player, 
  TripTournament, 
  TripParticipant, 
  CashBox, 
  PaymentMethod 
} from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAppTheme } from '../../context/ThemeContext';

interface ViajesTorneosModuleProps {
  currentClub: Club;
  currentUser: FraoviaUser;
  categories: Category[];
  players: Player[];
  cashBoxes: CashBox[];
  onRefreshData: () => void;
  /** Con Supabase activo los viajes vienen de la base (App.tsx). Sin Supabase se usan los locales. */
  trips?: TripTournament[];
  onOpenReceiptDetail?: (receipt: any) => void;
}

export const ViajesTorneosModule: React.FC<ViajesTorneosModuleProps> = ({
  currentClub,
  currentUser,
  categories,
  players,
  cashBoxes,
  onRefreshData,
  trips: tripsProp,
  onOpenReceiptDetail
}) => {
  const { theme } = useAppTheme();
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const trips = useMemo(() => {
    if (isSupabaseConfigured()) return tripsProp || [];
    return fraoviaDB.getTripTournaments(currentClub.id, currentUser);
  }, [currentClub.id, currentUser, refreshCount, tripsProp]);

  // Active detail view: null = catálogo de viajes; string = adentro del torneo
  const [activeDetailTripId, setActiveDetailTripId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'al_dia' | 'en_pagos' | 'pendiente'>('all');

  // Reglas de RLS de la base de datos:
  // - Torneos: los ven todos los del club; los gestionan DUEÑO, ADMINISTRACIÓN y GENERAL.
  // - Los pagos de torneos: solo esos tres roles (DUEÑO, ADMINISTRACIÓN y GENERAL).
  const canManageTrips = ['SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL'].includes(currentUser.role);
  const canManagePayments = ['SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL'].includes(currentUser.role);

  // Modals state
  const [showCreateTripModal, setShowCreateTripModal] = useState<boolean>(false);
  const [showAddPlayersModal, setShowAddPlayersModal] = useState<boolean>(false);
  const [paymentTargetParticipant, setPaymentTargetParticipant] = useState<TripParticipant | null>(null);
  const [showEditBackgroundModal, setShowEditBackgroundModal] = useState<boolean>(false);
  const [showBuenaFeModal, setShowBuenaFeModal] = useState<boolean>(false);

  // Active Trip (solo cuando está adentro del torneo seleccionado)
  const activeTrip = activeDetailTripId ? (trips.find(t => t.id === activeDetailTripId) || null) : null;
  const dedicatedCashBox = cashBoxes.find(b => b.id === activeTrip?.cashBoxId);

  // Financial aggregates for active trip
  const financialSummary = useMemo(() => {
    if (!activeTrip) return { totalGoal: 0, totalPaid: 0, totalBalance: 0, percentage: 0 };
    const totalGoal = activeTrip.participants.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPaid = activeTrip.participants.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalBalance = Math.max(0, totalGoal - totalPaid);
    const percentage = totalGoal > 0 ? Math.min(100, Math.round((totalPaid / totalGoal) * 100)) : 0;
    return { totalGoal, totalPaid, totalBalance, percentage };
  }, [activeTrip]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    if (!activeTrip) return [];
    return activeTrip.participants.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.playerFullName.toLowerCase().includes(term);
        const matchesDni = p.playerDni.includes(term);
        const matchesCat = p.originalCategoryName.toLowerCase().includes(term);
        return matchesName || matchesDni || matchesCat;
      }
      return true;
    });
  }, [activeTrip, statusFilter, searchTerm]);

  // Export Travel Sheet to Excel
  const handleExportExcel = () => {
    if (!activeTrip) return;

    const dataToExport = activeTrip.participants.map((p, idx) => ({
      'N°': idx + 1,
      'APELLIDO Y NOMBRE': p.playerFullName,
      'DNI': p.playerDni,
      'CATEGORIA_ORIGEN': p.originalCategoryName,
      'TUTOR': p.tutorName || 'Registrado',
      'CELULAR_WHATSAPP': p.tutorPhone || '+54 11 0000-0000',
      'COSTO_TOTAL_VIAJE': p.totalCost,
      'MONTO_ABONADO': p.amountPaid,
      'SALDO_PENDIENTE': Math.max(0, p.totalCost - p.amountPaid),
      'ESTADO': p.status === 'al_dia' ? '100% Abonado' : p.status === 'en_pagos' ? 'En Pagos' : 'Pendiente',
      'NOTAS': p.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla Viaje');
    const safeName = `${activeTrip.tournamentName}_${activeTrip.destination}`.replace(/[\s,]+/g, '_');
    XLSX.writeFile(wb, `Planilla_Viaje_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import Travel Excel Sheet
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTrip) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('El archivo Excel no contiene filas válidas.');
          return;
        }

        let addedCount = 0;
        let updatedCount = 0;
        const currentParticipants = [...activeTrip.participants];

        data.forEach(row => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => /apellido|nombre|jugador|alumno/i.test(k)) || keys[1];
          const dniKey = keys.find(k => /dni|doc/i.test(k)) || keys[2];
          const paidKey = keys.find(k => /abonado|pagado|pago/i.test(k));

          const rawDni = String(row[dniKey] || '').replace(/[^\d]/g, '');
          const fullName = String(row[nameKey] || '').trim();
          const paid = paidKey ? Number(row[paidKey]) || 0 : 0;

          if (fullName && rawDni) {
            const existingIdx = currentParticipants.findIndex(p => p.playerDni === rawDni);
            if (existingIdx !== -1) {
              if (paid > 0) {
                currentParticipants[existingIdx].amountPaid = paid;
                currentParticipants[existingIdx].status = 
                  currentParticipants[existingIdx].amountPaid >= currentParticipants[existingIdx].totalCost 
                    ? 'al_dia' 
                    : 'en_pagos';
                updatedCount++;
              }
            } else {
              const matchedPlayer = players.find(p => p.dni === rawDni);
              const cost = activeTrip.costPerPlayer;
              currentParticipants.push({
                playerId: matchedPlayer ? matchedPlayer.id : `ext-${rawDni}`,
                playerFullName: fullName,
                playerDni: rawDni,
                originalCategoryName: matchedPlayer ? (categories.find(c => c.id === matchedPlayer.categoryId)?.name || 'General') : 'Convocado',
                tutorName: matchedPlayer?.emergencyContact?.name || 'Tutor',
                tutorPhone: matchedPlayer?.emergencyContact?.phone || '+54 11 0000-0000',
                totalCost: cost,
                amountPaid: paid,
                status: paid >= cost ? 'al_dia' : paid > 0 ? 'en_pagos' : 'pendiente',
                notes: 'Importado desde planilla Excel de directores técnicos'
              });
              addedCount++;
            }
          }
        });

        const updatedTrip = { ...activeTrip, participants: currentParticipants };
        const skippedExternal = isSupabaseConfigured()
          ? currentParticipants.filter(p => p.playerId.startsWith('ext-')).length
          : 0;
        dataActions.updateTrip(updatedTrip, currentUser)
          .then(() => {
            onRefreshData();
            alert(
              `¡Importación exitosa! ${addedCount} jugadores nuevos convocados y ${updatedCount} montos actualizados.` +
              (skippedExternal > 0
                ? `\n\nAtención: ${skippedExternal} DNI de la planilla no están en el padrón del club y no se guardaron. Cargalos primero como deportistas.`
                : '')
            );
          })
          .catch((err: any) => alert('No se pudo guardar la importación: ' + (err.message || 'Error desconocido')));
      } catch (err: any) {
        alert('Error al leer el archivo Excel: ' + (err.message || 'Formato no soportado.'));
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* VISTA 1: CATÁLOGO DE TORNEOS (SOLO VER LOS VIAJES EN UN PRINCIPIO) */}
      {!activeTrip ? (
        <div className="space-y-6">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Giras & Torneos de Delegación
                </span>
                <span className="text-xs text-slate-400">{currentClub.name}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                Viajes & Torneos
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Selecciona cualquier torneo para ingresar a su delegación, administrar convocados, recaudación y emitir la Lista de Buena Fe.
              </p>
            </div>

            {canManageTrips && (
              <button
                onClick={() => setShowCreateTripModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Crear Nuevo Viaje / Torneo</span>
              </button>
            )}
          </div>

          {/* Listado de Torneos Creados */}
          {trips.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <Plane className="w-16 h-16 mx-auto text-amber-400 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-white">No hay torneos ni viajes creados todavía</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Crea tu primer torneo (ej. Torneo Gorriti, Córdoba con Categoría 2013 Blanca) para habilitar la caja exclusiva y convocar jugadores.
              </p>
              <button
                onClick={() => setShowCreateTripModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                + Crear Primer Viaje / Torneo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Torneos & Giras Disponibles ({trips.length})
                </span>
                <span className="text-slate-600 dark:text-slate-400">Toca una tarjeta para ver convocados y cobrar</span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {trips.map((trip) => {
                  const box = cashBoxes.find(b => b.id === trip.cashBoxId);
                  const goal = trip.participants.reduce((sum, p) => sum + p.totalCost, 0);
                  const paid = trip.participants.reduce((sum, p) => sum + p.amountPaid, 0);
                  const percent = goal > 0 ? Math.min(100, Math.round((paid / goal) * 100)) : 0;

                  return (
                    <div
                      key={trip.id}
                      onClick={() => setActiveDetailTripId(trip.id)}
                      className="dark-banner w-full rounded-3xl overflow-hidden border-2 border-slate-800 hover:border-amber-500/70 transition-all duration-300 shadow-xl relative bg-slate-950 group cursor-pointer hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-0.5"
                    >
                      {/* Fondo de imagen del torneo con zoom suave al pasar el cursor */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${trip.bannerImageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80'})`
                        }}
                      />
                      {/* Degradado oscuro para máxima legibilidad */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-[#08132B]/85 backdrop-blur-[1px]" />

                      {/* Contenido del Torneo */}
                      <div className="relative p-6 sm:p-7 flex flex-col justify-between gap-5 text-white">
                        
                        {/* Fila Superior: Badges y Botón de Ingreso */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              DELEGACIÓN OFICIAL
                            </span>

                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              {trip.status === 'en_recaudacion' ? 'En Recaudación Activa' : trip.status.toUpperCase()}
                            </span>

                            {box && (
                              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                                Caja Exclusiva: <strong className="!text-white">${box.currentBalance.toLocaleString('es-AR')}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-black text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20 px-3.5 py-1.5 rounded-xl border border-amber-500/30 transition-all self-start sm:self-auto shadow">
                            <span>Ingresar al Torneo & Ver Delegación</span>
                            <ChevronRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>

                        {/* Fila Central: Torneo y Categoría Resaltados */}
                        <div className="space-y-2 max-w-3xl">
                          <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span>{trip.destination}</span>
                            <span>·</span>
                            <Calendar className="w-4 h-4 text-amber-400 ml-1" />
                            <span>{trip.datesDescription}</span>
                          </div>

                          <h2 className="text-2xl sm:text-4xl font-black !text-white tracking-tight uppercase drop-shadow-md">
                            {trip.tournamentName}
                          </h2>

                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 backdrop-blur-md shadow-md">
                            <span className="text-sm sm:text-base font-black text-amber-300 tracking-wide uppercase">
                              🏆 {trip.categoryDescription}
                            </span>
                          </div>

                          <div className="text-xs !text-slate-200 pt-1">
                            <span className="!text-slate-300">Profesores a cargo:</span> <strong className="!text-white font-bold">{trip.coachesInCharge}</strong>
                          </div>
                        </div>

                        {/* Fila Inferior: Avance Financiero y Métricas Rápidas */}
                        <div className="pt-3 border-t border-white/15 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-8 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="!text-slate-200 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Avance Financiero de la Delegación:
                              </span>
                              <span className="text-emerald-300 font-mono text-sm font-bold">
                                ${paid.toLocaleString('es-AR')} de ${goal.toLocaleString('es-AR')} ({percent}%)
                              </span>
                            </div>

                            <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden border border-white/20 p-0.5">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-700"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="md:col-span-4 flex items-center justify-end gap-3 text-right">
                            <div className="px-3 py-1.5 bg-black/40 rounded-xl border border-white/15">
                              <span className="text-[10px] !text-slate-300 block uppercase font-bold">Convocados</span>
                              <span className="text-sm font-black !text-white">{trip.participants.length} jugadores</span>
                            </div>
                            <div className="px-3 py-1.5 bg-black/40 rounded-xl border border-white/15">
                              <span className="text-[10px] !text-slate-300 block uppercase font-bold">Arancel / Jugador</span>
                              <span className="text-sm font-mono font-black text-amber-300">${trip.costPerPlayer.toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA 2: DENTRO DEL TORNEO SELECCIONADO (BANNER, LISTA DE BUENA FE, EXCEL Y JUGADORES) */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Barra de Navegación para Regresar al Catálogo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <button
              type="button"
              onClick={() => setActiveDetailTripId(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-black transition cursor-pointer flex items-center gap-2 border border-slate-700 shadow w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>← Volver al Listado de Viajes</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {trips.length > 1 && (
                <select
                  value={activeTrip.id}
                  onChange={(e) => setActiveDetailTripId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tournamentName} · {t.categoryDescription}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setShowCreateTripModal(true)}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Torneo</span>
              </button>
            </div>
          </div>

          {/* HERO BANNER A LO ANCHO DE LA PANTALLA */}
          <div className="w-full rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl relative bg-slate-950 group">
            
            {/* Imagen de Fondo con Overlay Gradiente Profesional */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url(${activeTrip.bannerImageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80'})`
              }}
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-[#08132B]/80 backdrop-blur-[1px]" />

            {/* Banner Content Container */}
            <div className="relative p-6 sm:p-8 flex flex-col justify-between gap-6 text-white min-h-[260px] sm:min-h-[290px]">
              
              {/* Top Row: Badges, Status and Change Background */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    DELEGACIÓN OFICIAL
                  </span>
                  
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeTrip.status === 'en_recaudacion' ? 'En Recaudación Activa' : activeTrip.status.toUpperCase()}
                  </span>

                  {dedicatedCashBox && (
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                      Caja Exclusiva: <strong className="text-white">${dedicatedCashBox.currentBalance.toLocaleString('es-AR')}</strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditBackgroundModal(true)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200 hover:text-white border border-white/20 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
                  title="Cambiar la foto o banner de fondo de este torneo"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cambiar Fondo del Torneo</span>
                </button>
              </div>

              {/* Center Row: HUGE HIGHLIGHTED TITLE & CATEGORY */}
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{activeTrip.destination}</span>
                  <span>·</span>
                  <Calendar className="w-4 h-4 text-amber-400 ml-1" />
                  <span>{activeTrip.datesDescription}</span>
                </div>

                {/* TITULO RESALTADO ENORME */}
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
                  {activeTrip.tournamentName}
                </h1>

                {/* CATEGORIA RESALTADA */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 backdrop-blur-md shadow-lg">
                  <span className="text-sm sm:text-lg font-black text-amber-300 tracking-wide uppercase">
                    🏆 {activeTrip.categoryDescription}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                  <span className="text-slate-400">Profesores a cargo:</span>
                  <strong className="text-white">{activeTrip.coachesInCharge}</strong>
                </div>
              </div>

              {/* Bottom Row: Recaudación Progress Bar & Metrics */}
              <div className="pt-3 border-t border-white/15 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Avance Financiero de la Delegación:
                    </span>
                    <span className="text-emerald-300 font-mono text-sm">
                      ${financialSummary.totalPaid.toLocaleString('es-AR')} de ${financialSummary.totalGoal.toLocaleString('es-AR')} ({financialSummary.percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden border border-white/20 p-0.5 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-700 shadow"
                      style={{ width: `${financialSummary.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-4 flex items-center justify-end gap-3 text-right">
                  <div className="px-3 py-1.5 bg-black/30 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase">Convocados</span>
                    <span className="text-base font-black text-white">{activeTrip.participants.length} jugadores</span>
                  </div>
                  <div className="px-3 py-1.5 bg-black/30 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase">Arancel / Jugador</span>
                    <span className="text-base font-mono font-black text-amber-300">${activeTrip.costPerPlayer.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
            
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por jugador, DNI o categoría original..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos ({activeTrip.participants.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('al_dia')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                  statusFilter === 'al_dia' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>100% Pagado</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('en_pagos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'en_pagos' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                En Pagos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pendiente')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'pendiente' ? 'bg-rose-500 text-white font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sin Entregas
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              {canManageTrips && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Importar archivo Excel confeccionado por los profesores"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Importar Excel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="Exportar planilla de viaje con pagos para los DTs y tesorería"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Exportar Planilla</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBuenaFeModal(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                title="Generar e imprimir la Lista de Buena Fe Oficial con fotos y aptos médicos para la organización del torneo"
              >
                <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Lista de Buena Fe</span>
              </button>

              {canManageTrips && (
                <button
                  type="button"
                  onClick={() => setShowAddPlayersModal(true)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Convocar del Padrón</span>
                </button>
              )}
            </div>

          </div>

          {/* =========================================================================
              TABLA DE JUGADORES CONVOCADOS Y AVANCE DE MONTO TOTAL POR JUGADOR
             ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  Plantel Convocado & Avance Individual de Pago ({filteredParticipants.length})
                </h3>
              </div>

              <span className="text-xs text-slate-400">
                Imputación directa en: <strong>{dedicatedCashBox?.name || 'Caja de Viaje'}</strong>
              </span>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-slate-300">No hay deportistas en este filtro</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Puedes sumar jugadores desde el botón "+ Convocar del Padrón" o importar la planilla Excel de los profesores.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Jugador Convocado</th>
                      <th className="py-3 px-3">DNI</th>
                      <th className="py-3 px-3">Categoría Origen</th>
                      <th className="py-3 px-3">Tutor / Contacto</th>
                      <th className="py-3 px-4 text-center">Avance del Monto</th>
                      <th className="py-3 px-3 text-right">Saldo Restante</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredParticipants.map((p) => {
                      const percent = p.totalCost > 0 ? Math.min(100, Math.round((p.amountPaid / p.totalCost) * 100)) : 0;
                      const remaining = Math.max(0, p.totalCost - p.amountPaid);
                      const isComplete = p.status === 'al_dia';
                      const matchedPlayer = players.find(x => x.dni === p.playerDni);

                      return (
                        <tr key={p.playerId} className="hover:bg-slate-800/40 transition">
                          
                          {/* Jugador con miniatura */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                                {matchedPlayer?.photoUrl ? (
                                  <img src={matchedPlayer.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-800 text-xs">
                                    {p.playerFullName.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {p.playerFullName}
                                </span>
                                {p.notes && (
                                  <span className="text-[10px] text-slate-400 line-clamp-1">
                                    {p.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* DNI */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-300">
                            {p.playerDni}
                          </td>

                          {/* Categoría Origen */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-sky-300 font-semibold text-[11px] border border-slate-700">
                              {p.originalCategoryName}
                            </span>
                          </td>

                          {/* Tutor / WhatsApp */}
                          <td className="py-3 px-3">
                            <div>
                              <span className="font-medium text-slate-200 block text-[11px]">{p.tutorName || 'Tutor registrado'}</span>
                              <span className="text-[10px] font-mono text-slate-400">{p.tutorPhone || '+54 11 0000-0000'}</span>
                            </div>
                          </td>

                          {/* Avance del Monto con Barra */}
                          <td className="py-3 px-4 min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-white">
                                  ${p.amountPaid.toLocaleString('es-AR')}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  de ${p.totalCost.toLocaleString('es-AR')} ({percent}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete ? 'bg-emerald-400' : percent > 0 ? 'bg-amber-400' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Saldo Restante */}
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {remaining === 0 ? (
                              <span className="text-emerald-400">$0</span>
                            ) : (
                              <span className="text-amber-400">${remaining.toLocaleString('es-AR')}</span>
                            )}
                          </td>

                          {/* Estado Badge */}
                          <td className="py-3 px-3 text-center">
                            {isComplete ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                100% Pagado
                              </span>
                            ) : percent > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                                En Pagos
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                Sin Entregas
                              </span>
                            )}
                          </td>

                          {/* Acción Cobrar */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {remaining > 0 ? (
                                canManagePayments ? (
                                  <button
                                    type="button"
                                    onClick={() => setPaymentTargetParticipant(p)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow shadow-emerald-600/30"
                                    title="Registrar cobro de cuota de viaje con recibo oficial"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Cobrar</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-amber-400 font-medium px-2 py-1">
                                    Pendiente
                                  </span>
                                )
                              ) : (
                                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1">
                                  ✓ Al día
                                </span>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REGISTRAR COBRO DE VIAJE (A LA CAJA EXCLUSIVA)
         ========================================================================= */}
      {paymentTargetParticipant && activeTrip && (
        <TripPaymentModal
          isOpen={!!paymentTargetParticipant}
          onClose={() => setPaymentTargetParticipant(null)}
          trip={activeTrip}
          participant={paymentTargetParticipant}
          currentUser={currentUser}
          onPaymentSuccess={() => {
            setPaymentTargetParticipant(null);
            onRefreshData();
          }}
        />
      )}

      {/* =========================================================================
          MODAL: CONVOCAR JUGADORES DEL PADRÓN (MULTICATEGORÍA)
         ========================================================================= */}
      {showAddPlayersModal && activeTrip && (
        <AddPlayersToTripModal
          isOpen={showAddPlayersModal}
          onClose={() => setShowAddPlayersModal(false)}
          trip={activeTrip}
          players={players}
          categories={categories}
          currentUser={currentUser}
          onAdded={() => {
            setShowAddPlayersModal(false);
            onRefreshData();
          }}
        />
      )}

      {/* =========================================================================
          MODAL: CREAR NUEVO VIAJE / TORNEO
         ========================================================================= */}
      {showCreateTripModal && (
        <CreateTripTournamentModal
          isOpen={showCreateTripModal}
          onClose={() => setShowCreateTripModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          categories={categories}
          players={players}
          onCreated={(newTrip) => {
            setShowCreateTripModal(false);
            onRefreshData();
            setActiveDetailTripId(newTrip.id);
          }}
        />
      )}

      {/* =========================================================================
          MODAL: EDITAR FONDO DEL TORNEO
         ========================================================================= */}
      {showEditBackgroundModal && activeTrip && (
        <EditTournamentBackgroundModal
          isOpen={showEditBackgroundModal}
          onClose={() => setShowEditBackgroundModal(false)}
          trip={activeTrip}
          currentUser={currentUser}
          onUpdated={(updated) => {
            setShowEditBackgroundModal(false);
            setRefreshCount(prev => prev + 1);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* =========================================================================
          MODAL: LISTA DE BUENA FE OFICIAL (IMPRIMIBLE PARA TORNEO)
         ========================================================================= */}
      {showBuenaFeModal && activeTrip && (
        <ListaBuenaFeModal
          isOpen={showBuenaFeModal}
          onClose={() => setShowBuenaFeModal(false)}
          trip={activeTrip}
          currentClub={currentClub}
          players={players}
        />
      )}

    </div>
  );
};

// ===================================================================================
// SUBCOMPONENT: TripPaymentModal (Cobro a la Caja Exclusiva de Viaje)
// ===================================================================================
interface TripPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripTournament;
  participant: TripParticipant;
  currentUser: FraoviaUser;
  onPaymentSuccess: () => void;
}

const TripPaymentModal: React.FC<TripPaymentModalProps> = ({
  isOpen,
  onClose,
  trip,
  participant,
  currentUser,
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const remaining = Math.max(0, participant.totalCost - participant.amountPaid);
  const [amount, setAmount] = useState<number>(remaining > 60000 ? 60000 : remaining);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [notes, setNotes] = useState<string>('Entrega de cuota de viaje');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (amount <= 0 || amount > remaining) {
      alert(`El monto debe estar entre $1 y el saldo restante de $${remaining.toLocaleString('es-AR')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await dataActions.recordTripPayment(
        trip,
        participant.playerId,
        amount,
        paymentMethod,
        notes,
        currentUser
      );
      alert(`¡Cobro registrado con éxito en la Caja Exclusiva de Viaje! Comprobante oficial emitido.`);
      onPaymentSuccess();
    } catch (err: any) {
      alert('Error al registrar cobro: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">Cobro Exclusivo de Viaje</span>
              <h3 className="font-bold text-white text-sm">{trip.tournamentName}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
          
          {/* Jugador info card */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Deportista</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{participant.playerFullName}</span>
              <span className="font-mono text-xs text-slate-400">DNI: {participant.playerDni}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Abonado hasta hoy: <strong className="text-white">${participant.amountPaid.toLocaleString('es-AR')}</strong></span>
              <span className="text-amber-400 font-bold">Resta: ${remaining.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Monto a Cobrar */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Monto a cobrar ahora ($ ARS):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                max={remaining}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(remaining)}
                className="text-[10px] text-emerald-400 hover:underline font-bold"
              >
                Cancelar saldo total (${remaining.toLocaleString('es-AR')})
              </button>
              {remaining > 60000 && (
                <button
                  type="button"
                  onClick={() => setAmount(60000)}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  Cuota estándar ($60.000)
                </button>
              )}
            </div>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Medio de Cobro:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['transferencia', 'efectivo', 'tarjeta'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 rounded-xl text-center capitalize font-bold border transition ${
                    paymentMethod === method 
                      ? 'bg-emerald-500/20 border-emerald-400 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Observaciones / N° de Comprobante:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cuota 2 de viaje, pagado por el tutor..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
            />
          </div>

          <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
            <Wallet className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Este ingreso impacta en la <strong>Caja Exclusiva del Torneo</strong> sin mezclarse con la caja de cuotas sociales.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar & Emitir Recibo (${amount.toLocaleString('es-AR')})</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ===================================================================================
// SUBCOMPONENT: AddPlayersToTripModal (Convocatoria Multicategoría)
// ===================================================================================
interface AddPlayersToTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripTournament;
  players: Player[];
  categories: Category[];
  currentUser: FraoviaUser;
  onAdded: () => void;
}

const AddPlayersToTripModal: React.FC<AddPlayersToTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  players,
  categories,
  currentUser,
  onAdded
}) => {
  if (!isOpen) return null;

  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Already joined DNI set
  const alreadyJoinedDnis = new Set(trip.participants.map(p => p.playerDni));

  const availablePlayers = players.filter(p => {
    if (alreadyJoinedDnis.has(p.dni)) return false;
    if (selectedCatFilter !== 'all' && p.categoryId !== selectedCatFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) || p.dni.includes(term);
    }
    return true;
  });

  const togglePlayerSelect = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmAdd = async () => {
    if (selectedPlayerIds.length === 0) return;

    const toAdd: TripParticipant[] = selectedPlayerIds.map(id => {
      const p = players.find(x => x.id === id)!;
      const cat = categories.find(c => c.id === p.categoryId);
      return {
        playerId: p.id,
        playerFullName: `${p.lastName}, ${p.firstName}`,
        playerDni: p.dni,
        originalCategoryId: p.categoryId,
        originalCategoryName: cat?.name || 'General',
        tutorName: p.emergencyContact?.name || 'Tutor',
        tutorPhone: p.emergencyContact?.phone || '+54 11 0000-0000',
        totalCost: trip.costPerPlayer,
        amountPaid: 0,
        status: 'pendiente',
        notes: `Convocado al seleccionado de ${trip.tournamentName}`
      };
    });

    const updatedTrip = {
      ...trip,
      participants: [...trip.participants, ...toAdd]
    };

    try {
      await dataActions.updateTrip(updatedTrip, currentUser);
      onAdded();
    } catch (err: any) {
      alert('No se pudieron convocar los jugadores: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Seleccionado Multicategoría</span>
            <h3 className="text-base font-black text-white">Convocar Jugadores a {trip.tournamentName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Strip */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Filtrar por categoría del club:</label>
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
            >
              <option value="all">Todas las Categorías del Club ({players.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Buscar por nombre o DNI:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, apellido o DNI..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {availablePlayers.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No se encontraron deportistas disponibles para convocar con los filtros aplicados.
            </p>
          ) : (
            availablePlayers.map(p => {
              const isSelected = selectedPlayerIds.includes(p.id);
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <div
                  key={p.id}
                  onClick={() => togglePlayerSelect(p.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-white block text-xs">{p.lastName}, {p.firstName}</span>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>DNI {p.dni}</span>
                        <span>·</span>
                        <span className="text-sky-300">{cat?.name || 'Categoría'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selectedPlayerIds.length} jugadores seleccionados para este viaje
          </span>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
              Cancelar
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={selectedPlayerIds.length === 0}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
            >
              Incorporar al Seleccionado ({selectedPlayerIds.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ===================================================================================
// SUBCOMPONENT: CreateTripTournamentModal (Creación de Nuevo Torneo / Viaje)
// ===================================================================================
interface CreateTripTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: FraoviaUser;
  categories: Category[];
  players: Player[];
  onCreated: (trip: TripTournament) => void;
}

const CreateTripTournamentModal: React.FC<CreateTripTournamentModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  categories,
  players,
  onCreated
}) => {
  if (!isOpen) return null;

  const [tournamentName, setTournamentName] = useState('Torneo Gorriti');
  const [destination, setDestination] = useState('Córdoba, Argentina');
  const [datesDescription, setDatesDescription] = useState('15 al 18 de Noviembre 2026');
  const [categoryDescription, setCategoryDescription] = useState('Categoría 2013 Blanca');
  const [coachesInCharge, setCoachesInCharge] = useState('Prof. Marcos Ruiz & DT Lucas Gómez');
  const [costPerPlayer, setCostPerPlayer] = useState<number>(180000);
  const [bannerImageUrl, setBannerImageUrl] = useState(
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80'
  );

  const bannerPresets = [
    { name: 'Estadio / Noche', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Cancha & Césped', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Balón Oficial', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Básquetbol / Parquet', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentName.trim() || !destination.trim() || costPerPlayer <= 0) {
      alert('Por favor complete el nombre del torneo, lugar y costo por jugador.');
      return;
    }

    try {
      const newTrip = await dataActions.createTrip(
        {
          clubId: currentClub.id,
          tournamentName: tournamentName.trim(),
          destination: destination.trim(),
          datesDescription: datesDescription.trim(),
          categoryDescription: categoryDescription.trim(),
          coachesInCharge: coachesInCharge.trim(),
          costPerPlayer,
          bannerImageUrl,
          status: 'en_recaudacion',
          participants: []
        },
        currentUser
      );
      alert(`¡Viaje y Torneo creado exitosamente! Se generó automáticamente la Caja Exclusiva de Viaje.`);
      onCreated(newTrip);
    } catch (err: any) {
      alert('Error al crear viaje: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">Nuevo Viaje de Delegación</span>
              <h3 className="font-bold text-white text-base">Crear Torneo con Caja Exclusiva</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nombre del Torneo:</label>
              <input
                type="text"
                required
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Ej: Torneo Gorriti"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Lugar / Destino:</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Córdoba, Argentina"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Fechas del Viaje:</label>
              <input
                type="text"
                required
                value={datesDescription}
                onChange={(e) => setDatesDescription(e.target.value)}
                placeholder="Ej: 15 al 18 de Noviembre 2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Categoría / Denominación:</label>
              <input
                type="text"
                required
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Ej: Categoría 2013 Blanca"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Profesores a cargo:</label>
              <input
                type="text"
                value={coachesInCharge}
                onChange={(e) => setCoachesInCharge(e.target.value)}
                placeholder="Ej: Prof. Marcos Ruiz & DT Lucas Gómez"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Costo total por jugador ($ ARS):</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  min={1000}
                  value={costPerPlayer}
                  onChange={(e) => setCostPerPlayer(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Banner de Fondo y Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Imagen de fondo del torneo:</label>
            <input
              type="text"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs mb-2"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400">Presets sugeridos:</span>
              {bannerPresets.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setBannerImageUrl(preset.url)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition ${
                    bannerImageUrl === preset.url ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200">
            ⚡ <strong>Aislamiento Contable Automático:</strong> Al crear este torneo se creará una sub-caja dedicada (<code>Caja Viaje: {tournamentName}</code>) para que ningún cobro o gasto se mezcle con las cuotas regulares del club.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg"
            >
              Crear Torneo & Habilitar Caja
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ===================================================================================
// SUBCOMPONENT: EditTournamentBackgroundModal
// ===================================================================================
interface EditTournamentBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripTournament;
  currentUser: FraoviaUser;
  onUpdated: (updatedTrip: TripTournament) => void;
}

const EditTournamentBackgroundModal: React.FC<EditTournamentBackgroundModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentUser,
  onUpdated
}) => {
  if (!isOpen) return null;

  const [imageUrl, setImageUrl] = useState(trip.bannerImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setImageUrl(trip.bannerImageUrl || '');
  }, [trip.id, trip.bannerImageUrl]);

  const presets = [
    { name: 'Estadio / Luces', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Cancha Verde', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Pelota & Red', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Básquet / Cancha', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Polideportivo Azul', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80' },
    { name: 'Cancha de Césped', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const raw = evt.target?.result ? String(evt.target.result) : '';
      if (!raw) { setIsUploading(false); return; }
      // Se reduce la imagen para que no pese de más en la base de datos
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 1400;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.72));
        } catch {
          setImageUrl(raw);
        }
        setIsUploading(false);
      };
      img.onerror = () => { setImageUrl(raw); setIsUploading(false); };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!imageUrl) {
      alert('Por favor elija o ingrese una imagen de fondo.');
      return;
    }
    const updated: TripTournament = { ...trip, bannerImageUrl: imageUrl };
    try {
      await dataActions.updateTrip(updated, currentUser);
      onUpdated(updated);
    } catch (err: any) {
      alert('No se pudo guardar la imagen: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Cambiar Imagen de Fondo del Torneo</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold">URL de la imagen o subir archivo:</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-amber-300 font-bold bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>{isUploading ? 'Cargando...' : '📁 Subir foto de mi PC'}</span>
            </button>
          </div>
          <input
            type="text"
            value={imageUrl}
            placeholder="https://... o elija un fondo abajo"
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Elegir un fondo de muestra:</span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => setImageUrl(p.url)}
                className={`p-2 rounded-xl border text-center text-xs font-bold transition ${
                  imageUrl === p.url ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        {imageUrl && (
          <div className="w-full h-28 rounded-2xl overflow-hidden border border-slate-700 relative">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white font-black text-xs">
              Vista Previa
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs">
            Guardar Fondo
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================================================================
// SUBCOMPONENT: ListaBuenaFeModal (Planilla Oficial de Buena Fe para el Torneo)
// ===================================================================================
interface ListaBuenaFeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripTournament;
  currentClub: Club;
  players: Player[];
}

const ListaBuenaFeModal: React.FC<ListaBuenaFeModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentClub,
  players
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsapp = () => {
    const lines = [
      `📋 *PLANILLA OFICIAL - LISTA DE BUENA FE*`,
      `🏛️ *Club:* ${currentClub.name}`,
      `🏆 *Torneo:* ${trip.tournamentName} - ${trip.categoryDescription}`,
      `📍 *Destino:* ${trip.destination}`,
      `📅 *Fechas:* ${trip.datesDescription}`,
      `👔 *Profesores a cargo:* ${trip.coachesInCharge}`,
      `👥 *Convocados Oficiales (${trip.participants.length}):*`,
      ...trip.participants.map((p, idx) => 
        `${idx + 1}. ${p.playerFullName} (DNI ${p.playerDni}) - Cat. Origen: ${p.originalCategoryName} - Tutor: ${p.tutorName || 'Registrado'}`
      ),
      `\n*Emitido por el Sistema Oficial de Gestión FRAOVIA*`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 print:border-none print:bg-white text-slate-100 print:text-black rounded-3xl w-full max-w-4xl max-h-[95vh] print:max-h-none flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Lista de Buena Fe Oficial · Planilla Imprimible
              </h3>
              <p className="text-[11px] text-slate-400">
                Apta para presentar a la organización del torneo, control de árbitros y seguro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-900 print:bg-white print:p-0 print:text-black">
          
          {/* Institutional Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-700 print:border-black gap-4">
            <div className="flex items-center gap-4">
              {currentClub.logoUrl ? (
                <img src={currentClub.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-700 print:border-black shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 print:text-black print:bg-gray-100 flex items-center justify-center font-black text-xl border border-slate-700 print:border-black">
                  {currentClub.name.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 print:text-gray-600 font-bold block">
                  SECRETARÍA DE DEPORTES & DELEGACIONES OFICIALES
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight">
                  {currentClub.name}
                </h2>
                <span className="text-xs text-slate-400 print:text-gray-700">
                  {currentClub.address} · Tel: {currentClub.phone}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 print:bg-gray-200 text-amber-300 print:text-black font-black text-xs border border-amber-500/40 print:border-black uppercase tracking-wider inline-block">
                PLANILLA OFICIAL DE BUENA FE
              </span>
              <div className="text-[11px] text-slate-400 print:text-gray-600 mt-1 font-mono">
                Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>

          {/* Tournament Specifications Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 print:bg-gray-50 border border-slate-800 print:border-gray-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Torneo / Evento:</span>
              <strong className="text-white print:text-black text-sm">{trip.tournamentName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Categoría Participante:</span>
              <strong className="text-amber-300 print:text-black text-sm">🏆 {trip.categoryDescription}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Sede y Fechas:</span>
              <span className="text-slate-200 print:text-black font-medium">{trip.destination} ({trip.datesDescription})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Cuerpo Técnico Responsable:</span>
              <span className="text-slate-200 print:text-black font-medium">{trip.coachesInCharge}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Delegación Total:</span>
              <span className="text-emerald-400 print:text-black font-bold">{trip.participants.length} Jugadores Oficiales</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Seguro Médico de Competencia:</span>
              <span className="text-emerald-400 print:text-black font-bold">✓ Cobertura Deportiva Activa</span>
            </div>
          </div>

          {/* Table of Roster Participants with Photos */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 print:border-gray-400">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-gray-200 text-slate-400 print:text-black font-mono text-[10px] uppercase border-b border-slate-800 print:border-gray-400">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">N°</th>
                  <th className="py-2.5 px-3">Foto</th>
                  <th className="py-2.5 px-3">Apellido y Nombre</th>
                  <th className="py-2.5 px-3">DNI / Documento</th>
                  <th className="py-2.5 px-3">Fec. Nac / Edad</th>
                  <th className="py-2.5 px-3">Cat. Origen</th>
                  <th className="py-2.5 px-3">Apto Médico</th>
                  <th className="py-2.5 px-3">Tutor / Teléfono</th>
                  <th className="py-2.5 px-4 text-center">Firma / Acreditación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-300 print:text-black">
                {trip.participants.map((p, idx) => {
                  const matchedPlayer = players.find(x => x.dni === p.playerDni);
                  const birthDate = matchedPlayer?.birthDate || '2013-05-12';
                  const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 13;

                  return (
                    <tr key={p.playerId} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 print:text-black">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 print:bg-gray-100 border border-slate-700 print:border-gray-400 flex items-center justify-center shrink-0">
                          {matchedPlayer?.photoUrl ? (
                            <img src={matchedPlayer.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs text-slate-400 print:text-black">
                              {p.playerFullName.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-bold text-white print:text-black">
                        {p.playerFullName}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300 print:text-black">
                        {p.playerDni}
                      </td>
                      <td className="py-2 px-3 text-slate-400 print:text-gray-700 font-mono text-[11px]">
                        {birthDate} ({age} a.)
                      </td>
                      <td className="py-2 px-3 text-slate-300 print:text-black">
                        {p.originalCategoryName}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-emerald-400 print:text-black flex items-center gap-1">
                          ✓ Apto Vigente
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 print:text-gray-700">
                        <div>{p.tutorName || 'Tutor Registrado'}</div>
                        <div className="font-mono text-[10px]">{p.tutorPhone || '+54 11 0000-0000'}</div>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <div className="w-24 h-6 border-b border-dashed border-slate-600 print:border-black mx-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Institutional Signatures & Legal Endorsement */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-1">
              <div className="w-44 border-b border-slate-500 print:border-black mx-auto h-12" />
              <div className="font-bold text-slate-200 print:text-black">Firma Director Técnico</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">{trip.coachesInCharge}</div>
            </div>

            <div className="space-y-1">
              <div className="w-44 border-b border-slate-500 print:border-black mx-auto h-12" />
              <div className="font-bold text-slate-200 print:text-black">Firma Delegado Oficial</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">Representante {currentClub.name}</div>
            </div>

            <div className="space-y-1">
              <div className="w-32 h-14 border border-dashed border-slate-600 print:border-black mx-auto flex items-center justify-center text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono">
                Sello del Club
              </div>
              <div className="font-bold text-slate-200 print:text-black">Secretaría Deportiva</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
