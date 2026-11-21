import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  AlertOctagon, 
  CheckCircle, 
  FileText, 
  CornerDownRight, 
  Calendar, 
  User, 
  CreditCard,
  Ban,
  MessageCircle,
  Sliders,
  Shield,
  Eye,
  Send,
  Building2,
  Store,
  Share2,
  Copy
} from 'lucide-react';
import { Club, Receipt, User as FraoviaUser } from '../types/fraovia';
import { supabaseReceiptService } from '../services/supabaseReceiptService';
import { ReceiptTemplateModal } from './receipts/ReceiptTemplateModal';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: FraoviaUser;
  onReceiptUpdated: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose,
  currentClub,
  currentUser,
  onReceiptUpdated
}) => {
  const [showVoidPrompt, setShowVoidPrompt] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Template & WhatsApp state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');

  // Toggles for Escudo & Marca de Agua
  const [showBadge, setShowBadge] = useState<boolean>(
    currentClub.receiptTemplate?.showBadge ?? true
  );
  const [showWatermark, setShowWatermark] = useState<boolean>(
    currentClub.receiptTemplate?.showWatermark ?? true
  );
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyReceiptText = () => {
    if (!receipt) return;
    const itemsList = receipt.items
      .map(it => `• ${it.quantity}x ${it.description} ($${it.total.toLocaleString('es-AR')})`)
      .join('\n');
    const formattedDate = new Date(receipt.date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const text = `📜 COMPROBANTE OFICIAL - ${currentClub.name.toUpperCase()}\nNº Recibo: ${receipt.receiptNumber}\nFecha: ${formattedDate}\nTitular: ${receipt.customerName}${receipt.customerDni ? ` (DNI: ${receipt.customerDni})` : ''}\nConcepto: ${receipt.concept}\nMedio de Pago: ${receipt.paymentMethod.toUpperCase()}\n\nDETALLE:\n${itemsList}\n\nTOTAL: $${receipt.amount.toLocaleString('es-AR')}\n\nDocumento emitido por FRAOVIA Club Management.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen || !receipt) return null;

  const isAnulado = receipt.status === 'anulado';
  const isStoreReceipt = receipt.concept.toLowerCase().includes('tienda') || 
                         receipt.concept.toLowerCase().includes('mostrador') ||
                         receipt.items.some(i => i.description.toLowerCase().includes('camiseta') || i.description.toLowerCase().includes('short'));

  // Active WhatsApp number depending on receipt origin
  const whatsappConfig = currentClub.whatsappConfig;
  const channelPhone = isStoreReceipt
    ? (whatsappConfig?.storePhone || '+54 9 11 5566-7788')
    : (whatsappConfig?.adminPhone || currentClub.phone || '+54 9 11 4782-9011');
  const channelName = isStoreReceipt ? 'WhatsApp Tienda Oficial' : 'WhatsApp Administración';

  // Badge & Watermark assets from template config or club
  const badgeUrl = (currentClub.receiptTemplate?.badgeUrl?.trim() || currentClub.logoUrl?.trim() || '');
  const watermarkUrl = (currentClub.receiptTemplate?.watermarkUrl?.trim() || currentClub.logoUrl?.trim() || '');
  const watermarkOpacity = currentClub.receiptTemplate?.watermarkOpacity ?? 0.14;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      alert('Por favor ingrese el motivo formal de la anulación para la auditoría.');
      return;
    }
    setIsVoiding(true);
    try {
      // Invocación oficial de la función PostgreSQL void_receipt mediante Supabase RPC (sin espejo en fraoviaDB)
      await supabaseReceiptService.voidReceipt(receipt.id, voidReason.trim());
      onReceiptUpdated();
      setShowVoidPrompt(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al anular comprobante');
    } finally {
      setIsVoiding(false);
    }
  };

  // Generate WhatsApp text and launch
  const handleSendWhatsApp = () => {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const senderHeader = isStoreReceipt 
      ? `🛍️ *TIENDA OFICIAL - ${currentClub.name.toUpperCase()}*` 
      : `🏛️ *ADMINISTRACIÓN & TESORERÍA - ${currentClub.name.toUpperCase()}*`;
    
    const itemsList = receipt.items
      .map(it => `• ${it.quantity}x ${it.description} ($${it.total.toLocaleString('es-AR')})`)
      .join('\n');

    const formattedDate = new Date(receipt.date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formattedTime = new Date(receipt.date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = 
`${senderHeader}

📜 *COMPROBANTE OFICIAL DE COBRO*
━━━━━━━━━━━━━━━━━━━━
*Nº Recibo:* ${receipt.receiptNumber}
*Fecha:* ${formattedDate} ${formattedTime}
*Titular:* ${receipt.customerName}
${receipt.customerDni ? `*DNI:* ${receipt.customerDni}\n` : ''}*Concepto:* ${receipt.concept}
*Medio de Pago:* ${receipt.paymentMethod.toUpperCase()}

*DETALLE:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL ABONADO:* $${receipt.amount.toLocaleString('es-AR')}
━━━━━━━━━━━━━━━━━━━━

${isStoreReceipt 
  ? `¡Gracias por tu compra en nuestra Tienda Oficial! Canal WhatsApp: ${channelPhone}` 
  : `Comprobante emitido por Tesorería. Canal WhatsApp Administración: ${channelPhone}`}

_Documento oficial registrado en FRAOVIA Club Management._`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    setShowWhatsAppPrompt(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Modal Top Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-100 text-xs sm:text-sm block">
                  Comprobante Oficial {receipt.receiptNumber}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isStoreReceipt ? 'Origen: Tienda Oficial' : 'Origen: Administración & Cuotas'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* WhatsApp Button */}
              <button
                onClick={() => {
                  setTargetPhone(currentClub.phone || '');
                  setShowWhatsAppPrompt(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-black transition cursor-pointer shadow-md shadow-emerald-500/10"
                title={`Enviar por WhatsApp (${channelName})`}
              >
                <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {/* Quick Share / Copy Receipt Button */}
              <button
                type="button"
                onClick={handleCopyReceiptText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/30'
                }`}
                title="Copiar texto oficial del comprobante para compartir"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Compartir'}</span>
              </button>

              {/* Template generator button */}
              <button
                onClick={() => setShowTemplateModal(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition cursor-pointer"
                title="Configurar Escudo, Marca de Agua y WhatsApp"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Visibility Controls Bar (Escudo & Marca de Agua toggles) */}
          <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-400 font-medium">Elementos visuales de la plantilla:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => setShowBadge(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[10px] text-slate-300 font-bold">Escudo</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[10px] text-slate-300 font-bold">Marca de Agua</span>
              </label>
            </div>
          </div>

          {/* Receipt Document Area (Designed to print beautifully) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900 relative">
            
            {/* TRANSLUCENT WATERMARK BACKGROUND (Escudo del club centrado) */}
            {showWatermark && watermarkUrl && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                style={{ opacity: watermarkOpacity }}
              >
                <img 
                  src={watermarkUrl} 
                  alt="Marca de agua del Club" 
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain rotate-[-12deg]"
                />
              </div>
            )}

            {/* ANULADO Watermark Stamp */}
            {isAnulado && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="border-8 border-rose-500/40 text-rose-500/40 font-black text-6xl tracking-widest uppercase rotate-[-25deg] px-8 py-4 rounded-3xl select-none">
                  ANULADO
                </div>
              </div>
            )}

            {/* Club Header & Receipt Metadata */}
            <div className="relative z-10 flex items-start justify-between pb-6 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {/* ESCUDO OFICIAL DEL CLUB */}
                  {showBadge && badgeUrl && (
                    <img 
                      src={badgeUrl} 
                      alt="Escudo Oficial" 
                      className="w-12 h-12 rounded-xl object-contain drop-shadow" 
                    />
                  )}
                  <div>
                    <h2 className="text-base font-black text-slate-100 uppercase">{currentClub.name}</h2>
                    <p className="text-[11px] text-slate-400 font-mono">CUIT: {currentClub.cuit}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">{currentClub.address}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-[#25D366]" />
                    <span>WhatsApp: {channelPhone}</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-black">
                  {currentClub.receiptTemplate?.headerTitle || 'RECIBO DE COBRO'}
                </div>
                <div className="text-base font-mono font-black text-white">{receipt.receiptNumber}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(receipt.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="mt-1">
                  {isAnulado ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      ANULADO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      VÁLIDO / EMITIDO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Concept Info */}
            <div className="relative z-10 grid grid-cols-2 gap-4 p-4 bg-slate-950/70 backdrop-blur-sm rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente / Socio</span>
                <span className="font-bold text-slate-100 text-sm">{receipt.customerName}</span>
                {receipt.customerDni && (
                  <span className="text-slate-400 block font-mono text-[11px] mt-0.5">DNI: {receipt.customerDni}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Medio de Pago & Concepto</span>
                <span className="capitalize font-black text-emerald-400 text-xs block">{receipt.paymentMethod}</span>
                <span className="text-slate-300 block text-[11px] mt-0.5">
                  {receipt.concept}
                </span>
              </div>
            </div>

            {/* Items breakdown table */}
            <div className="relative z-10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5">Descripción</th>
                    <th className="py-2.5 text-center">Cant.</th>
                    <th className="py-2.5 text-right">Precio Unit.</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {receipt.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium">{it.description}</td>
                      <td className="py-2.5 text-center text-slate-400">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono">${it.unitPrice.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-100">
                        ${it.total.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-800 text-slate-100 font-bold">
                  <tr>
                    <td colSpan={3} className="py-3 text-right text-xs">TOTAL ABONADO:</td>
                    <td className="py-3 text-right text-lg text-emerald-400 font-mono font-black">
                      ${receipt.amount.toLocaleString('es-AR')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Institutional Legend */}
            <div className="relative z-10 pt-4 border-t border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 italic block leading-relaxed">
                {currentClub.receiptTemplate?.footerLegend || 
                 'Documento oficial inmutable. Válido como constancia interna de cobro institucional y registro contable.'}
              </span>
            </div>

            {/* Anulación Audit Note if Anulado */}
            {isAnulado && receipt.voidReason && (
              <div className="relative z-10 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <Ban className="w-4 h-4" />
                  <span>MOTIVO DE ANULACIÓN REGISTRADO EN AUDITORÍA:</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">{receipt.voidReason}</p>
                <div className="text-[10px] text-slate-500">
                  Anulado el {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleString('es-AR') : 'S/D'} por usuario autorizado.
                </div>
              </div>
            )}

            {/* Anular Receipt Trigger Section (Solo DUEÑO y ADMINISTRACIÓN, SUPERADMIN es solo lectura) */}
            {!isAnulado && ['DUEÑO', 'ADMINISTRACIÓN'].includes(currentUser.role) && (
              <div className="relative z-10 pt-4 border-t border-slate-800 print:hidden">
                {!showVoidPrompt ? (
                  <button
                    onClick={() => setShowVoidPrompt(true)}
                    className="text-xs text-rose-400/80 hover:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Anular comprobante formalmente (genera contraasiento contable)</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Anulación irreversible de Comprobante</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Esta acción registrará un contraasiento en la caja correspondiente y dejará asentado el evento en la auditoría inmutable del club.
                    </p>
                    <input
                      type="text"
                      placeholder="Ingrese motivo de anulación (obligatorio)..."
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowVoidPrompt(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmVoid}
                        disabled={isVoiding}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        {isVoiding ? 'Anulando...' : 'Confirmar Anulación'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Modal Bottom Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-500 font-mono">
              Canal: {channelName}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Editar Plantilla & Escudo</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* WHATSAPP PROMPT MODAL */}
      {showWhatsAppPrompt && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                <MessageCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                  {channelName}
                </span>
                <h4 className="font-black text-white text-sm">Enviar Comprobante</h4>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              El comprobante <strong>{receipt.receiptNumber}</strong> por <strong>${receipt.amount.toLocaleString('es-AR')}</strong> se enviará con el formato oficial del club.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">
                Número de WhatsApp Destinatario (Cliente/Socio)
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="+54 9 11 2345-6789"
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500 block">
                Si lo dejas en blanco, abrirá WhatsApp para que elijas el contacto.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowWhatsAppPrompt(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp & Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE CONFIGURATION MODAL */}
      {showTemplateModal && (
        <ReceiptTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          currentClub={currentClub}
          currentUser={currentUser}
          initialSector={isStoreReceipt ? 'tienda' : 'administracion'}
          onSaved={() => {
            onReceiptUpdated();
          }}
        />
      )}
    </>
  );
};
