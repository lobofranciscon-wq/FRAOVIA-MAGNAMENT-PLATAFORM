import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  Filter, 
  DollarSign, 
  Building2, 
  ShoppingBag, 
  Lock, 
  Unlock, 
  Receipt as ReceiptIcon, 
  ChevronRight, 
  TrendingDown, 
  Coins, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Plane, 
  Trophy,
  ShieldAlert
} from 'lucide-react';
import { CashBox, CashMovement, Club, User } from '../../types/fraovia';
import { supabaseDataService, formatSupabaseError } from '../../services/supabaseDataService';
import { supabaseAuditService } from '../../services/supabaseAuditService';
import { OpenCashBoxModal } from './OpenCashBoxModal';
import { CloseCashBoxModal } from './CloseCashBoxModal';

interface CashModuleProps {
  currentClub: Club;
  currentUser: User;
  cashBoxes: CashBox[];
  movements: CashMovement[];
  onMovementAdded: () => void;
  onOpenNewReceipt: () => void;
}

export const CashModule: React.FC<CashModuleProps> = ({
  currentClub,
  currentUser,
  cashBoxes,
  movements,
  onMovementAdded,
  onOpenNewReceipt
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string>(cashBoxes[0]?.id || '');
  const [movementSectorFilter, setMovementSectorFilter] = useState<'all' | 'administracion' | 'viajes' | 'tienda'>('all');
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [showOpenBoxModal, setShowOpenBoxModal] = useState(false);
  const [showCloseBoxModal, setShowCloseBoxModal] = useState(false);
  const [showCreateBoxModal, setShowCreateBoxModal] = useState(false);

  // New Movement form state
  const [movType, setMovType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movAmount, setMovAmount] = useState<number>(0);
  const [movConcept, setMovConcept] = useState('');
  const [movCategory, setMovCategory] = useState<'cuota' | 'inscripcion' | 'tienda' | 'proveedor' | 'sueldo' | 'mantenimiento' | 'otro'>('cuota');
  const [movMethod, setMovMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'otro'>('efectivo');
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Create Cash Box form state
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxType, setNewBoxType] = useState<'general' | 'disciplina' | 'subpunto'>('general');
  const [isCreatingBox, setIsCreatingBox] = useState(false);

  const selectedBox = cashBoxes.find(b => b.id === selectedBoxId) || cashBoxes[0];
  
  // Reglas de permisos (Fase 2):
  // 1. Cajas: Solo DUEÑO y ADMINISTRACIÓN las administran (crear, abrir, cerrar).
  // 2. SUPERADMIN en modo fantasma: solo lectura (no administra ni opera).
  // 3. TIENDA: puede emitir recibos y registrar movimientos, pero NO administrar cajas.
  const isSuperAdminGhost = currentUser.role === 'SUPERADMIN';
  const canManageBoxes = !isSuperAdminGhost && ['DUEÑO', 'ADMINISTRACIÓN'].includes(currentUser.role);
  const canOperate = !isSuperAdminGhost && ['DUEÑO', 'ADMINISTRACIÓN', 'TIENDA'].includes(currentUser.role);

  // Helper to categorize movement sector
  const getMovementSector = (m: CashMovement): 'administracion' | 'viajes' | 'tienda' => {
    if (m.sector === 'tienda' || m.category === 'tienda') return 'tienda';
    if (m.category === 'viaje') return 'viajes';
    const c = (m.concept || '').toLowerCase();
    if (c.includes('viaje') || c.includes('torneo') || c.includes('gorriti') || c.includes('delegacion') || c.includes('gira')) {
      return 'viajes';
    }
    const box = cashBoxes.find(b => b.id === m.cashBoxId);
    if (box) {
      if (box.type === 'subpunto' && box.name.toLowerCase().includes('tienda')) return 'tienda';
    }
    if (c.includes('tienda') || c.includes('mostrador') || c.includes('indumentaria') || c.includes('remera') || c.includes('camiseta') || c.includes('short')) {
      return 'tienda';
    }
    return 'administracion';
  };

  // Enriched movements
  const enrichedMovements = movements.map(m => ({
    ...m,
    computedSector: getMovementSector(m)
  }));

  // Filtered by selected cash box AND sector
  const filteredMovements = enrichedMovements.filter(m => {
    const matchesBox = !selectedBoxId || m.cashBoxId === selectedBoxId;
    const matchesSector = movementSectorFilter === 'all' || m.computedSector === movementSectorFilter;
    return matchesBox && matchesSector;
  });

  const totalClubCashBalance = cashBoxes.reduce((acc, b) => acc + (b.currentBalance || 0), 0);

  // Sector calculations for summary
  const adminMovements = enrichedMovements.filter(m => m.computedSector === 'administracion');
  const tripMovements = enrichedMovements.filter(m => m.computedSector === 'viajes');
  const storeMovements = enrichedMovements.filter(m => m.computedSector === 'tienda');

  const adminIngresos = adminMovements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const adminEgresos = adminMovements.filter(m => m.type === 'egreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const tripIngresos = tripMovements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const tripEgresos = tripMovements.filter(m => m.type === 'egreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const storeIngresos = storeMovements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const storeEgresos = storeMovements.filter(m => m.type === 'egreso').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const totalIngresos = adminIngresos + tripIngresos + storeIngresos;
  const totalEgresos = adminEgresos + tripEgresos + storeEgresos;

  // Registrar movimiento contable (egreso / ingreso) directo a Supabase
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBox || movAmount <= 0 || !movConcept.trim()) return;

    if (!canOperate) {
      alert('Su rol no tiene autorización para registrar movimientos contables.');
      return;
    }

    if (selectedBox.status !== 'abierta') {
      alert(`La caja "${selectedBox.name}" está CERRADA. Debés realizar la apertura de caja antes de registrar este ${movType === 'egreso' ? 'egreso' : 'ingreso'}.`);
      return;
    }

    if (movType === 'egreso' && selectedBox.currentBalance < movAmount) {
      if (!confirm(`Atención: El importe ($${movAmount.toLocaleString('es-AR')}) supera el saldo actual de la caja ($${selectedBox.currentBalance.toLocaleString('es-AR')}). ¿Registrar egreso igualmente?`)) {
        return;
      }
    }

    setIsSubmittingMovement(true);
    try {
      await supabaseDataService.createCashMovement({
        clubId: currentClub.id,
        cashBoxId: selectedBox.id,
        type: movType,
        amount: movAmount,
        concept: movConcept.trim(),
        category: movCategory,
        paymentMethod: movMethod,
        registeredByUserId: currentUser.id
      });

      await supabaseAuditService.logAudit({
        clubId: currentClub.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        action: movType === 'ingreso' ? 'INGRESO_CAJA' : 'EGRESO_CAJA',
        detail: `${movType.toUpperCase()} de $${movAmount.toLocaleString('es-AR')} en "${selectedBox.name}". Concepto: ${movConcept}. Categoría: ${movCategory}`,
        category: 'caja'
      });

      setShowNewMovementModal(false);
      setMovAmount(0);
      setMovConcept('');
      onMovementAdded();
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      alert(msg);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  // Crear una nueva caja en la base de datos (NUNCA enviar current_balance)
  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoxName.trim()) return;

    if (!canManageBoxes) {
      alert('Solo los roles DUEÑO y ADMINISTRACIÓN pueden crear cajas.');
      return;
    }

    setIsCreatingBox(true);
    try {
      const created = await supabaseDataService.createCashBox({
        clubId: currentClub.id,
        name: newBoxName.trim(),
        type: newBoxType,
        responsibleUserId: currentUser.id
      });

      await supabaseAuditService.logAudit({
        clubId: currentClub.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        action: 'CREAR_CAJA',
        detail: `Creación de nueva caja contable "${created.name}" (Tipo: ${created.type})`,
        category: 'caja'
      });

      setShowCreateBoxModal(false);
      setNewBoxName('');
      setSelectedBoxId(created.id);
      onMovementAdded();
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      alert(msg);
    } finally {
      setIsCreatingBox(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border text-white shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0C162D 0%, #1E1B4B 50%, #312E81 100%)',
          borderColor: '#6366F1'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Sector Tesorería & Arqueo
                </span>
                <span className="text-xs text-indigo-200">
                  {currentClub.name}
                </span>
                {isSuperAdminGhost && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Modo Fantasma (Solo Lectura)
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                CAJA - Arqueo y Control de Movimientos Financieros
              </h2>
              <p className="text-xs text-indigo-100">
                Seguimiento de ingresos y egresos contables conectado en tiempo real con Supabase.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageBoxes && (
              <>
                <button
                  onClick={() => setShowCreateBoxModal(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-indigo-500/30"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Nueva Caja</span>
                </button>
                <button
                  onClick={() => setShowOpenBoxModal(true)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300/60"
                >
                  <Coins className="w-4 h-4 stroke-[2.5]" />
                  <span>Apertura de Turno</span>
                </button>
              </>
            )}

            {canOperate && (
              <>
                <button
                  onClick={onOpenNewReceipt}
                  className="px-3.5 py-2 bg-white text-slate-900 hover:bg-sky-50 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <ReceiptIcon className="w-4 h-4 text-sky-600" />
                  <span>Cobrar y Emitir Recibo</span>
                </button>
                <button
                  onClick={() => setShowNewMovementModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo Asiento</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTOR SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Consolidado */}
        <div 
          onClick={() => setMovementSectorFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            movementSectorFilter === 'all'
              ? 'bg-gradient-to-b from-slate-900 to-[#0C162D] border-indigo-500 shadow-lg ring-1 ring-indigo-500/40'
              : 'bg-[#0C162D] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              Saldo Total en Cajas
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
              {cashBoxes.length} cajas activas
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5">
            ${totalClubCashBalance.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
            <span className="text-emerald-400 font-mono">+${totalIngresos.toLocaleString('es-AR')}</span>
            <span className="text-rose-400 font-mono">-${totalEgresos.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Movimientos Administración */}
        <div 
          onClick={() => setMovementSectorFilter('administracion')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            movementSectorFilter === 'administracion'
              ? 'bg-gradient-to-b from-sky-950/60 to-[#0C162D] border-sky-500 shadow-lg ring-1 ring-sky-400/50'
              : 'bg-[#0C162D] border-slate-800 hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-sky-300">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              🏛️ Movimientos Administración
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
              {adminMovements.length} asientos
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-300 mt-1.5">
            +${adminIngresos.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
            <span>Cuotas & Socios</span>
            <span className="text-rose-400 font-mono">Egresos: -${adminEgresos.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Movimientos Tienda */}
        <div 
          onClick={() => setMovementSectorFilter('tienda')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            movementSectorFilter === 'tienda'
              ? 'bg-gradient-to-b from-orange-950/60 to-[#0C162D] border-orange-500 shadow-lg ring-1 ring-orange-400/50'
              : 'bg-[#0C162D] border-slate-800 hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-orange-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-300">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              🛍️ Movimientos Tienda Oficial
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold">
              {storeMovements.length} asientos
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-orange-300 mt-1.5">
            +${storeIngresos.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
            <span>Mostrador & Ropa</span>
            <span className="text-rose-400 font-mono">Egresos: -${storeEgresos.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* Two Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN (5 cols): Caja actual & Cajas disponibles */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card: Caja Seleccionada */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-[#0C162D] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Caja Seleccionada:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Tipo: {selectedBox?.type || 'general'}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                selectedBox?.status === 'abierta'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedBox?.status === 'abierta' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {selectedBox?.status === 'abierta' ? 'Abierta' : 'Cerrada'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-300 font-semibold block">{selectedBox?.name || 'Caja Central'}</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                ${(selectedBox?.currentBalance ?? 0).toLocaleString('es-AR')}
              </div>
            </div>

            {canManageBoxes && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowOpenBoxModal(true)}
                  className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Apertura</span>
                </button>
                <button
                  onClick={() => setShowCloseBoxModal(true)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cerrar Caja</span>
                </button>
              </div>
            )}
          </div>

          {/* Card: Cajas del Club */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Puntos de Cobro y Cajas ({cashBoxes.length})
              </h4>
              {canManageBoxes && (
                <button
                  onClick={() => setShowCreateBoxModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {cashBoxes.map((box) => {
                const isSelected = box.id === selectedBox?.id;
                return (
                  <div
                    key={box.id}
                    onClick={() => setSelectedBoxId(box.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        box.status === 'abierta' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block text-xs">{box.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {box.type} • {box.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white text-xs block">
                        ${(box.currentBalance || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Movimientos Contables */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C162D] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-black text-white">
                  Movimientos Contables ({filteredMovements.length})
                </h4>
              </div>

              {/* Segmented Sector Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setMovementSectorFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    movementSectorFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({enrichedMovements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMovementSectorFilter('administracion')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    movementSectorFilter === 'administracion'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-sky-300'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>🏛️ Administración ({adminMovements.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementSectorFilter('tienda')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    movementSectorFilter === 'tienda'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-orange-300'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>🛍️ Tienda ({storeMovements.length})</span>
                </button>
              </div>
            </div>

            {/* Movements List */}
            <div className="space-y-2">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No hay movimientos contables registrados en esta vista.</p>
                </div>
              ) : (
                filteredMovements.map((mov) => {
                  const isIngreso = mov.type === 'ingreso';
                  const formattedDate = new Date(mov.timestamp).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={mov.id}
                      className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIngreso ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isIngreso ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{mov.concept}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-mono">{formattedDate}</span>
                            <span>•</span>
                            <span className="uppercase font-semibold">{mov.category}</span>
                            <span>•</span>
                            <span className="capitalize">{mov.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-bold block ${
                          isIngreso ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isIngreso ? '+' : '-'}${mov.amount.toLocaleString('es-AR')}
                        </span>
                        {mov.receiptId && (
                          <span className="text-[10px] text-sky-400 font-mono">Con Recibo</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL CREAR NUEVA CAJA */}
      {showCreateBoxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span>Nueva Caja Contable</span>
              </h3>
              <button onClick={() => setShowCreateBoxModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBox} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre de la Caja *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Caja Mostrador, Caja Quincho, Caja Secretaría..."
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tipo de Caja *</label>
                <select
                  value={newBoxType}
                  onChange={(e) => setNewBoxType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">General (Administración Central)</option>
                  <option value="disciplina">Disciplina</option>
                  <option value="subpunto">Subpunto / Mostrador</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span className="block text-white font-bold mb-0.5">Control de Saldo</span>
                <span>El saldo inicial se crea en $0 en la base de datos y se actualiza exclusivamente a través de movimientos contables y aperturas auditadas.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBoxModal(false)}
                  disabled={isCreatingBox}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBox}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isCreatingBox ? 'Creando...' : 'Crear Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ASIENTO / MOVIMIENTO */}
      {showNewMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Registrar Asiento de Caja</h3>
              <button onClick={() => setShowNewMovementModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Caja Destino</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {cashBoxes.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} - Saldo: ${b.currentBalance.toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovType('ingreso')}
                    className={`py-2 rounded-xl font-bold cursor-pointer transition ${
                      movType === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Ingreso (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovType('egreso')}
                    className={`py-2 rounded-xl font-bold cursor-pointer transition ${
                      movType === 'egreso' ? 'bg-rose-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Egreso (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Importe ($ ARS) * (Mayor a 0)</label>
                <input
                  type="number"
                  min="1"
                  value={movAmount || ''}
                  onChange={(e) => setMovAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Categoría Contable *</label>
                <select
                  value={movCategory}
                  onChange={(e) => setMovCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="cuota">Cuota Social / Deportiva</option>
                  <option value="inscripcion">Inscripción / Matrícula</option>
                  <option value="tienda">Tienda Oficial</option>
                  <option value="proveedor">Pago a Proveedor</option>
                  <option value="sueldo">Sueldo / Honorarios</option>
                  <option value="mantenimiento">Mantenimiento de Instalaciones</option>
                  <option value="otro">Otro Movimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Medio de Pago *</label>
                <select
                  value={movMethod}
                  onChange={(e) => setMovMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Concepto / Descripción *</label>
                <input
                  type="text"
                  value={movConcept}
                  onChange={(e) => setMovConcept(e.target.value)}
                  placeholder="Ej: Pago de arbitraje, venta de rifas, gastos de sede..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                >
                  {isSubmittingMovement ? 'Registrando...' : 'Confirmar Asiento Contable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APERTURA DE CAJA */}
      {showOpenBoxModal && (
        <OpenCashBoxModal
          isOpen={showOpenBoxModal}
          onClose={() => setShowOpenBoxModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          cashBoxes={cashBoxes}
          selectedBoxId={selectedBox?.id}
          onBoxOpened={() => {
            onMovementAdded();
          }}
        />
      )}

      {/* MODAL CIERRE DE CAJA */}
      {showCloseBoxModal && selectedBox && (
        <CloseCashBoxModal
          isOpen={showCloseBoxModal}
          onClose={() => setShowCloseBoxModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          cashBox={selectedBox}
          onBoxClosed={() => {
            onMovementAdded();
          }}
        />
      )}
    </div>
  );
};
