import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  MessageCircle, 
  Sliders, 
  Eye, 
  Shield, 
  Store, 
  Building2, 
  Sparkles,
  FileText
} from 'lucide-react';
import { Club, ClubWhatsAppConfig, ReceiptTemplateConfig, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { fileToCompressedDataUrl } from '../../utils/imageOptimizer';
import { useAppTheme } from '../../context/ThemeContext';

interface ReceiptTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  initialSector?: 'administracion' | 'tienda';
  onSaved: (club: Club) => void;
}

export const ReceiptTemplateModal: React.FC<ReceiptTemplateModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  initialSector = 'administracion',
  onSaved
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  // Active section tab inside modal
  const [activeTab, setActiveTab] = useState<'plantilla' | 'whatsapp'>(
    initialSector === 'tienda' ? 'whatsapp' : 'plantilla'
  );

  // WhatsApp form state
  const [adminPhone, setAdminPhone] = useState(
    currentClub.whatsappConfig?.adminPhone || currentClub.phone || '+54 9 11 4782-9011'
  );
  const [storePhone, setStorePhone] = useState(
    currentClub.whatsappConfig?.storePhone || '+54 9 11 5566-7788'
  );
  const [adminMessageTemplate, setAdminMessageTemplate] = useState(
    currentClub.whatsappConfig?.adminMessageTemplate || 
    '¡Hola {nombre}! Te compartimos tu comprobante oficial #{recibo} de {club} por {concepto} por un valor de {monto}. ¡Muchas gracias por tu compromiso!'
  );
  const [storeMessageTemplate, setStoreMessageTemplate] = useState(
    currentClub.whatsappConfig?.storeMessageTemplate || 
    '¡Hola {nombre}! Gracias por tu compra en la Tienda Oficial de {club}. Tu ticket #{recibo} por {monto} ha sido registrado exitosamente.'
  );

  // Receipt Template form state
  const [showBadge, setShowBadge] = useState<boolean>(
    currentClub.receiptTemplate?.showBadge ?? true
  );
  const [showWatermark, setShowWatermark] = useState<boolean>(
    currentClub.receiptTemplate?.showWatermark ?? true
  );
  const [badgeUrl, setBadgeUrl] = useState<string>(
    currentClub.receiptTemplate?.badgeUrl || currentClub.logoUrl || ''
  );
  const [watermarkUrl, setWatermarkUrl] = useState<string>(
    currentClub.receiptTemplate?.watermarkUrl || currentClub.logoUrl || ''
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(
    currentClub.receiptTemplate?.watermarkOpacity ?? 0.14
  );
  const [headerTitle, setHeaderTitle] = useState<string>(
    currentClub.receiptTemplate?.headerTitle || 'COMPROBANTE OFICIAL DE COBRO'
  );
  const [footerLegend, setFooterLegend] = useState<string>(
    currentClub.receiptTemplate?.footerLegend || 
    'Documento válido como constancia interna de cobro institucional y registro contable inmutable.'
  );

  const badgeInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // Handle image file upload simulation (generates data URL)
  const handleBadgeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileToCompressedDataUrl(file, 500).then(setBadgeUrl).catch(err => alert(err.message));
    }
  };

  const handleWatermarkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileToCompressedDataUrl(file, 700).then(setWatermarkUrl).catch(err => alert(err.message));
    }
  };

  const handleSave = async () => {
    try {
      // Plantilla del comprobante + canales de WhatsApp, guardados juntos
      const updatedClub = await dataActions.saveReceiptTemplate(
        currentClub,
        {
          showBadge,
          showWatermark,
          badgeUrl: badgeUrl.trim(),
          watermarkUrl: watermarkUrl.trim(),
          watermarkOpacity,
          headerTitle: headerTitle.trim(),
          footerLegend: footerLegend.trim()
        },
        {
          adminPhone: adminPhone.trim(),
          storePhone: storePhone.trim(),
          adminMessageTemplate: adminMessageTemplate.trim(),
          storeMessageTemplate: storeMessageTemplate.trim()
        },
        currentUser
      );

      onSaved(updatedClub);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la plantilla');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                Configuración Oficial de Comprobantes
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Plantilla con Escudo, Marca de Agua & Enlaces WhatsApp
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-bold bg-slate-950/50">
          <button
            onClick={() => setActiveTab('plantilla')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'plantilla'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Escudo, Marca de Agua & Diseño</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Administración & Tienda</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* TAB 1: PLANTILLA DE COMPROBANTE CON ESCUDO Y MARCA DE AGUA */}
          {activeTab === 'plantilla' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Escudo Oficial (Badge) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-white text-xs uppercase tracking-wider">
                        1. Escudo Oficial en Comprobantes
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBadge}
                        onChange={(e) => setShowBadge(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-300 font-bold">Mostrar Escudo</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      {badgeUrl ? (
                        <img src={badgeUrl} alt="Escudo" className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => badgeInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Escudo</span>
                        </button>
                        <input
                          type="file"
                          ref={badgeInputRef}
                          onChange={handleBadgeFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setBadgeUrl(currentClub.logoUrl)}
                          className="text-[10px] text-emerald-400 hover:underline font-bold"
                        >
                          Usar Logo del Club
                        </button>
                      </div>
                      <input
                        type="url"
                        placeholder="O pegar URL pública de la imagen del escudo..."
                        value={badgeUrl}
                        onChange={(e) => setBadgeUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Marca de Agua (Watermark) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-teal-400" />
                      <span className="font-black text-white text-xs uppercase tracking-wider">
                        2. Marca de Agua de Fondo (Watermark)
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showWatermark}
                        onChange={(e) => setShowWatermark(e.target.checked)}
                        className="rounded border-slate-700 text-teal-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-300 font-bold">Activar Marca de Agua</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {watermarkUrl ? (
                        <img 
                          src={watermarkUrl} 
                          alt="Marca de agua" 
                          style={{ opacity: watermarkOpacity }}
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => watermarkInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Marca de Agua</span>
                        </button>
                        <input
                          type="file"
                          ref={watermarkInputRef}
                          onChange={handleWatermarkFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setWatermarkUrl(currentClub.logoUrl)}
                          className="text-[10px] text-teal-400 hover:underline font-bold"
                        >
                          Usar Escudo del Club
                        </button>
                      </div>
                      <input
                        type="url"
                        placeholder="O pegar URL de imagen de marca de agua..."
                        value={watermarkUrl}
                        onChange={(e) => setWatermarkUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div className="pt-2 border-t border-slate-900 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Opacidad de la Marca de Agua:</span>
                      <span className="font-mono font-bold text-teal-400">
                        {Math.round(watermarkOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.35"
                      step="0.01"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Recomendado: 12% a 18% para permitir una lectura nítida del texto impreso.
                    </span>
                  </div>
                </div>

                {/* 3. Textos y Leyendas */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="font-black text-white text-xs uppercase tracking-wider block">
                    3. Textos Institucionales de Comprobante
                  </span>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Título Superior del Comprobante
                    </label>
                    <input
                      type="text"
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Leyenda de Validez Legal / Pie de Página
                    </label>
                    <input
                      type="text"
                      value={footerLegend}
                      onChange={(e) => setFooterLegend(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-[11px]"
                    />
                  </div>
                </div>

              </div>

              {/* Live Preview Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vista Previa en Vivo de la Plantilla</span>
                </span>

                {/* Simulated Paper Receipt with Badge & Watermark */}
                <div className="p-5 rounded-3xl bg-white text-slate-900 border-2 border-slate-300 shadow-2xl relative overflow-hidden select-none min-h-[380px] flex flex-col justify-between">
                  
                  {/* TRANSLUCENT WATERMARK BACKGROUND */}
                  {showWatermark && watermarkUrl && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                      style={{ opacity: watermarkOpacity }}
                    >
                      <img 
                        src={watermarkUrl} 
                        alt="Watermark Preview" 
                        className="w-56 h-56 object-contain transform rotate-[-8deg]"
                      />
                    </div>
                  )}

                  {/* Receipt Content */}
                  <div className="relative z-10 space-y-4">
                    {/* Header with Badge */}
                    <div className="flex items-start justify-between pb-3 border-b-2 border-slate-800">
                      <div className="flex items-center gap-2.5">
                        {showBadge && badgeUrl && (
                          <img src={badgeUrl} alt="Badge" className="w-10 h-10 object-contain drop-shadow" />
                        )}
                        <div>
                          <h4 className="font-black text-slate-950 text-xs uppercase leading-tight">
                            {currentClub.name}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            CUIT: {currentClub.cuit}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-emerald-700 block tracking-wider">
                          {headerTitle}
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">FRA-2026-000103</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Socio / Cliente:</span>
                        <span className="font-bold text-slate-900">Marcos Benítez (DNI 38.190.223)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Concepto:</span>
                        <span className="font-medium text-slate-800">Cuota Social / Tienda Oficial</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forma de Pago:</span>
                        <span className="font-bold text-slate-900 uppercase">Transferencia</span>
                      </div>
                    </div>

                    {/* Items table simulation */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-200 uppercase font-bold">
                        <span>Detalle</span>
                        <span>Importe</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Camiseta Titular San Martín 2026 (Talle L)</span>
                        <span className="font-mono font-bold">$24.000</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Short Deportivo Microfibra (Talle M)</span>
                        <span className="font-mono font-bold">$10.000</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-black text-sm">
                        <span>TOTAL ABONADO:</span>
                        <span className="font-mono text-emerald-700">$34.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Legend */}
                  <div className="relative z-10 pt-3 border-t border-slate-200 text-center">
                    <span className="text-[8px] text-slate-500 leading-tight block italic">
                      {footerLegend}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: WHATSAPP ADMINISTRACIÓN & TIENDA */}
          {activeTab === 'whatsapp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* WhatsApp Administración */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">WhatsApp de Administración</h4>
                    <span className="text-[10px] text-slate-400">Para comprobantes de cuotas, matrículas y tesorería</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Número de WhatsApp Oficial (con código de país) *
                  </label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+54 9 11 4455-8899"
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Utilizado como remitente institucional para recibos societarios.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Plantilla de Mensaje (Variables: &#123;nombre&#125;, &#123;recibo&#125;, &#123;monto&#125;, &#123;concepto&#125;, &#123;club&#125;)
                  </label>
                  <textarea
                    rows={4}
                    value={adminMessageTemplate}
                    onChange={(e) => setAdminMessageTemplate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* WhatsApp Tienda */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">WhatsApp de la Tienda (Independiente)</h4>
                    <span className="text-[10px] text-slate-400">Para tickets de mostrador, prendas y pedidos</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Número de WhatsApp del Mostrador / Tienda *
                  </label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+54 9 11 5566-7788"
                    className="w-full bg-slate-900 border border-orange-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Canal independiente de atención comercial de la tienda del club.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Plantilla de Mensaje (Variables: &#123;nombre&#125;, &#123;recibo&#125;, &#123;monto&#125;, &#123;club&#125;)
                  </label>
                  <textarea
                    rows={4}
                    value={storeMessageTemplate}
                    onChange={(e) => setStoreMessageTemplate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Los cambios en la plantilla y WhatsApp aplican de inmediato en recibos de administración y tienda.
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Plantilla & WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
