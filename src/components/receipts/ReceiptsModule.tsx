import React, { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  Plus, 
  Ban, 
  Printer, 
  Calendar, 
  CheckCircle, 
  AlertOctagon,
  FileText,
  MessageCircle,
  Sliders,
  Shield,
  Building2,
  ShoppingBag,
  Eye,
  Share2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
  Filter,
  Copy,
  Check
} from 'lucide-react';
import { Club, Receipt, User, getReceiptSector } from '../../types/fraovia';
import { ReceiptTemplateModal } from './ReceiptTemplateModal';

interface ReceiptsModuleProps {
  currentClub: Club;
  currentUser: User;
  receipts: Receipt[];
  onSelectReceipt: (receipt: Receipt) => void;
  onOpenNewReceiptModal: () => void;
  onRefreshData?: () => void;
}

export const ReceiptsModule: React.FC<ReceiptsModuleProps> = ({
  currentClub,
  currentUser,
  receipts,
  onSelectReceipt,
  onOpenNewReceiptModal,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [activeSectorTab, setActiveSectorTab] = useState<'all' | 'administracion' | 'tienda'>('all');
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Permisos: TIENDA, ADMINISTRACIÓN y DUEÑO pueden emitir; SUPERADMIN en modo fantasma es solo lectura
  const canEmit = currentUser.role !== 'SUPERADMIN' && ['DUEÑO', 'ADMINISTRACIÓN', 'TIENDA', 'GENERAL'].includes(currentUser.role);

  // Helper to categorize each receipt
  const categorizedReceipts = receipts.map(r => ({
    ...r,
    computedSector: getReceiptSector(r)
  }));

  // Calculations by Sector
  const adminReceipts = categorizedReceipts.filter(r => r.computedSector === 'administracion');
  const storeReceipts = categorizedReceipts.filter(r => r.computedSector === 'tienda');

  const totalAdminAmount = adminReceipts
    .filter(r => r.status === 'emitido')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalStoreAmount = storeReceipts
    .filter(r => r.status === 'emitido')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalConsolidatedAmount = totalAdminAmount + totalStoreAmount;

  // Filtered Receipts
  const filteredReceipts = categorizedReceipts.filter(r => {
    // 1. Sector Tab filter
    if (activeSectorTab !== 'all' && r.computedSector !== activeSectorTab) {
      return false;
    }

    // 2. Status filter
    if (filterStatus !== 'all' && r.status !== filterStatus) {
      return false;
    }

    // 3. Payment Method filter
    if (filterPaymentMethod !== 'all' && r.paymentMethod !== filterPaymentMethod) {
      return false;
    }

    // 4. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesNum = r.receiptNumber.toLowerCase().includes(q);
      const matchesName = r.customerName.toLowerCase().includes(q);
      const matchesDni = r.customerDni ? r.customerDni.includes(q) : false;
      const matchesConcept = r.concept.toLowerCase().includes(q);
      if (!matchesNum && !matchesName && !matchesDni && !matchesConcept) {
        return false;
      }
    }

    return true;
  });

  const handleShareWhatsApp = (e: React.MouseEvent, r: Receipt) => {
    e.stopPropagation();
    const isStore = getReceiptSector(r) === 'tienda';
    const itemsList = (r.items || [])
      .map(it => `• ${it.quantity}x ${it.description} ($${it.total.toLocaleString('es-AR')})`)
      .join('\n');
    const formattedDate = new Date(r.date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const msg = isStore
      ? `🛍️ *TIENDA OFICIAL - ${currentClub.name.toUpperCase()}*\n\n📜 *COMPROBANTE DE COMPRA Nº ${r.receiptNumber}*\n📅 *Fecha:* ${formattedDate}\n👤 *Cliente:* ${r.customerName}${r.customerDni ? ` (DNI: ${r.customerDni})` : ''}\n💳 *Medio de Pago:* ${r.paymentMethod.toUpperCase()}\n\n*DETALLE:*\n${itemsList || `• ${r.concept}`}\n\n💰 *TOTAL COBRADO:* $${r.amount.toLocaleString('es-AR')}\n\n_Comprobante oficial emitido por ${currentClub.name}._`
      : `🏛️ *ADMINISTRACIÓN & TESORERÍA - ${currentClub.name.toUpperCase()}*\n\n📜 *RECIBO OFICIAL DE COBRO Nº ${r.receiptNumber}*\n📅 *Fecha:* ${formattedDate}\n👤 *Titular / Socio:* ${r.customerName}${r.customerDni ? ` (DNI: ${r.customerDni})` : ''}\n📌 *Concepto:* ${r.concept}\n💳 *Medio de Pago:* ${r.paymentMethod.toUpperCase()}\n\n*DETALLE:*\n${itemsList || `• ${r.concept}`}\n\n💰 *TOTAL ABONADO:* $${r.amount.toLocaleString('es-AR')}\n\n_Comprobante emitido con valor cancelatorio oficial._`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyReceipt = (e: React.MouseEvent, r: Receipt) => {
    e.stopPropagation();
    const formattedDate = new Date(r.date).toLocaleDateString('es-AR');
    const text = `Recibo ${r.receiptNumber} | ${r.customerName} | $${r.amount.toLocaleString('es-AR')} (${r.paymentMethod}) | ${r.concept} | ${formattedDate}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0C162D] via-[#0E1E3D] to-slate-900 rounded-2xl border border-sky-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-400" />
              Gestión de Comprobantes Oficiales
            </span>
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
              Trazabilidad Separada por Sector
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1">
            Registro y Consulta de Recibos Emitidos
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentClub.name} · Visualice y comparta recibos por separado entre <strong>Administración</strong> (cuotas) y <strong>Tienda Oficial</strong> (ventas).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow"
            title="Configurar plantilla con escudo, marca de agua y números de WhatsApp oficiales"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Configurar WhatsApp & Plantilla</span>
          </button>

          {canEmit && (
            <button
              onClick={onOpenNewReceiptModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300/50"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cobrar y Emitir Recibo</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS SEPARATED BY SECTOR (ADMINISTRACIÓN VS TIENDA) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Consolidated */}
        <div 
          onClick={() => setActiveSectorTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSectorTab === 'all'
              ? 'bg-gradient-to-b from-slate-900 to-[#0C162D] border-sky-500/60 shadow-lg ring-1 ring-sky-500/40'
              : 'bg-[#0C162D]/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              Total Consolidado
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
              {receipts.length} recibos
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1.5">
            ${totalConsolidatedAmount.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Suma de ambos sectores</span>
            <span className="text-sky-400 font-semibold">{receipts.filter(r => r.status === 'emitido').length} válidos</span>
          </p>
        </div>

        {/* Administración */}
        <div 
          onClick={() => setActiveSectorTab('administracion')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSectorTab === 'administracion'
              ? 'bg-gradient-to-b from-sky-950/60 to-[#0C162D] border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-400/50'
              : 'bg-[#0C162D]/90 border-slate-800 hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-sky-300">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              🏛️ Administración
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
              {adminReceipts.length} emitidos
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-300 mt-1.5">
            ${totalAdminAmount.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Cuotas, matrículas y aranceles</span>
            <span className="text-emerald-400 font-semibold">Tesoraría Central</span>
          </p>
        </div>

        {/* Tienda Oficial */}
        <div 
          onClick={() => setActiveSectorTab('tienda')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSectorTab === 'tienda'
              ? 'bg-gradient-to-b from-orange-950/60 to-[#0C162D] border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-400/50'
              : 'bg-[#0C162D]/90 border-slate-800 hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-orange-400">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-300">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              🛍️ Tienda Oficial
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold">
              {storeReceipts.length} ventas
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-orange-300 mt-1.5">
            ${totalStoreAmount.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Mostrador, indumentaria y stock</span>
            <span className="text-orange-400 font-semibold">Caja de Tienda</span>
          </p>
        </div>
      </div>

      {/* FILTER AND NAVIGATION SECTION */}
      <div className="bg-[#0C162D] border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        
        {/* SECTOR TABS (SEPARACIÓN CLARA PARA NO MEZCLAR) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveSectorTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSectorTab === 'all'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Todos los Comprobantes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSectorTab === 'all' ? 'bg-sky-800 text-sky-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {receipts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSectorTab('administracion')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSectorTab === 'administracion'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏛️ Solo Administración</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSectorTab === 'administracion' ? 'bg-sky-800 text-sky-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {adminReceipts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSectorTab('tienda')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSectorTab === 'tienda'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-orange-300 hover:bg-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🛍️ Solo Tienda Oficial</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSectorTab === 'tienda' ? 'bg-orange-800 text-orange-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {storeReceipts.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Mostrando <strong className="text-white font-mono">{filteredReceipts.length}</strong> de {receipts.length} comprobantes
          </div>
        </div>

        {/* Search and Secondary Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Nº comprobante, socio, DNI o concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todos los estados</option>
              <option value="emitido">Válidos / Emitidos</option>
              <option value="anulado">Anulados</option>
            </select>

            {/* Filter by Medio de Pago */}
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todos los medios de pago</option>
              <option value="efectivo">Efectivo en Caja</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
              <option value="debito_automatico">Débito Automático</option>
              <option value="otro">Otro</option>
            </select>

            {(searchTerm || filterStatus !== 'all' || filterPaymentMethod !== 'all' || activeSectorTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPaymentMethod('all');
                  setActiveSectorTab('all');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition text-[11px]"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {filteredReceipts.length === 0 && (
          <div className="p-10 text-center rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No se encontraron comprobantes</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay recibos emitidos que coincidan con los filtros seleccionados ({activeSectorTab === 'all' ? 'Todos los sectores' : activeSectorTab === 'administracion' ? 'Administración' : 'Tienda'}).
            </p>
          </div>
        )}

        {/* Mobile View: Cards with Direct Actions */}
        <div className="md:hidden space-y-3">
          {filteredReceipts.map((r) => {
            const isStore = r.computedSector === 'tienda';
            return (
              <div
                key={r.id}
                onClick={() => onSelectReceipt(r)}
                className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 cursor-pointer hover:border-sky-500/50 transition shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {r.receiptNumber}
                      </span>
                      {isStore ? (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[9px] font-bold inline-flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          Tienda
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-bold inline-flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
                          Administración
                        </span>
                      )}
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        r.status === 'anulado' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{r.customerName}</h4>
                    {r.customerDni && (
                      <span className="text-[10px] text-slate-500 font-mono">DNI {r.customerDni}</span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black font-mono text-white">
                      ${r.amount.toLocaleString('es-AR')}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{r.paymentMethod}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="text-slate-400 line-clamp-1">{r.concept}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(r.date).toLocaleDateString('es-AR')}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsApp(e, r)}
                    className="px-2.5 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Compartir por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReceipt(r);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Recibo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Professional Table with Sector Tags & Quick Share */}
        <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-3.5">Sector</th>
                <th className="p-3.5">Nº Comprobante</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Cliente / Socio</th>
                <th className="p-3.5">Concepto</th>
                <th className="p-3.5">Medio de Pago</th>
                <th className="p-3.5 text-right font-mono">Importe</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredReceipts.map((r) => {
                const isStore = r.computedSector === 'tienda';
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectReceipt(r)}
                    className="hover:bg-slate-900/80 cursor-pointer transition group"
                  >
                    {/* Sector Badge Column */}
                    <td className="p-3.5">
                      {isStore ? (
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-bold inline-flex items-center gap-1.5 shadow-sm">
                          <ShoppingBag className="w-3 h-3 text-orange-400" />
                          Tienda
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-bold inline-flex items-center gap-1.5 shadow-sm">
                          <Building2 className="w-3 h-3 text-sky-400" />
                          Administración
                        </span>
                      )}
                    </td>

                    {/* Receipt Number */}
                    <td className="p-3.5 font-mono text-emerald-400 font-bold group-hover:underline">
                      {r.receiptNumber}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(r.date).toLocaleDateString('es-AR')}
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 font-semibold text-white">
                      <div>{r.customerName}</div>
                      {r.customerDni && (
                        <div className="text-[10px] text-slate-500 font-mono">DNI {r.customerDni}</div>
                      )}
                    </td>

                    {/* Concept */}
                    <td className="p-3.5 text-slate-300 max-w-xs truncate" title={r.concept}>
                      {r.concept}
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 capitalize text-slate-400">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        {r.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 text-right font-mono font-black text-white text-sm">
                      ${r.amount.toLocaleString('es-AR')}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        r.status === 'anulado'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Actions: View and Share */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleShareWhatsApp(e, r)}
                          className="p-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 rounded-xl transition cursor-pointer"
                          title="Compartir comprobante por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyReceipt(e, r)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition cursor-pointer"
                          title="Copiar texto del recibo"
                        >
                          {copiedId === r.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(r)}
                          className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Ver detalle del comprobante oficial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
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

      {/* MODAL CONFIGURACIÓN PLANTILLA Y WHATSAPP */}
      {showTemplateModal && (
        <ReceiptTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          initialSector="administracion"
          onSaved={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
