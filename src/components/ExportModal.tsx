import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  FileText, 
  Check, 
  Users, 
  Wallet, 
  FileCheck
} from 'lucide-react';
import { Club, Player, Receipt, CashMovement, User } from '../types/fraovia';
import { exportToCsv } from '../services/importExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  players: Player[];
  receipts: Receipt[];
  movements: CashMovement[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  players,
  receipts,
  movements
}) => {
  const [targetEntity, setTargetEntity] = useState<'jugadores' | 'comprobantes' | 'caja'>('jugadores');
  const [format, setFormat] = useState<'excel' | 'pdf' | 'word'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'excel') {
      if (targetEntity === 'jugadores') {
        const data = players.map(p => ({
          DNI: p.dni,
          Apellido: p.lastName,
          Nombre: p.firstName,
          Fecha_Nacimiento: p.birthDate,
          Telefono: p.phone,
          Email: p.email,
          Estado: p.status,
          Restringido_Por_Cupo: p.isRestricted ? 'SI (Solo Lectura)' : 'NO',
          Cuota_Mensual: p.monthlyFeeDue,
          Saldo_Deuda: p.balance,
          Apto_Medico: p.medicalCertificateValid ? 'SI' : 'VENCIDO'
        }));
        exportToCsv(data, `FRAOVIA_${currentClub.slug}_jugadores_${dateStr}`);
      } else if (targetEntity === 'comprobantes') {
        const data = receipts.map(r => ({
          Numero_Recibo: r.receiptNumber,
          Fecha: r.date,
          Cliente: r.customerName,
          DNI: r.customerDni || '',
          Concepto: r.concept,
          Importe: r.amount,
          Medio_Pago: r.paymentMethod,
          Estado: r.status,
          Motivo_Anulacion: r.voidReason || ''
        }));
        exportToCsv(data, `FRAOVIA_${currentClub.slug}_comprobantes_${dateStr}`);
      } else {
        const data = movements.map(m => ({
          ID: m.id,
          Fecha: m.timestamp,
          Tipo: m.type,
          Concepto: m.concept,
          Categoria: m.category,
          Importe: m.amount,
          Medio_Pago: m.paymentMethod
        }));
        exportToCsv(data, `FRAOVIA_${currentClub.slug}_movimientos_caja_${dateStr}`);
      }
    } else if (format === 'pdf') {
      window.print();
    } else {
      // Word report generator (formatted text document)
      let content = `INFORME OFICIAL FRAOVIA - ${currentClub.name.toUpperCase()}\n`;
      content += `Fecha de Generación: ${new Date().toLocaleDateString('es-AR')}\n`;
      content += `Modulo: ${targetEntity.toUpperCase()}\n\n`;

      if (targetEntity === 'jugadores') {
        content += `Padrón de Jugadores (${players.length} registros):\n`;
        players.forEach(p => {
          content += `- ${p.lastName}, ${p.firstName} | DNI: ${p.dni} | Saldo: $${p.balance} | Estado: ${p.status} ${p.isRestricted ? '[RESTRINGIDO]' : ''}\n`;
        });
      } else if (targetEntity === 'comprobantes') {
        content += `Historial de Recibos Emitidos (${receipts.length} registros):\n`;
        receipts.forEach(r => {
          content += `- Recibo ${r.receiptNumber} | ${r.date.split('T')[0]} | ${r.customerName} | $${r.amount} (${r.status.toUpperCase()})\n`;
        });
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FRAOVIA_${currentClub.slug}_informe_${targetEntity}.txt`;
      a.click();
    }

    setIsExporting(false);
    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Exportación de Datos Institucionales</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Selecciona qué exportar</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetEntity('jugadores')}
                className={`p-3 rounded-xl border text-center transition ${
                  targetEntity === 'jugadores'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Jugadores</span>
                <span className="text-[10px] block opacity-70">({players.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetEntity('comprobantes')}
                className={`p-3 rounded-xl border text-center transition ${
                  targetEntity === 'comprobantes'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Recibos</span>
                <span className="text-[10px] block opacity-70">({receipts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetEntity('caja')}
                className={`p-3 rounded-xl border text-center transition ${
                  targetEntity === 'caja'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Caja</span>
                <span className="text-[10px] block opacity-70">({movements.length})</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Formato de Salida</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Planilla Excel (.csv con UTF-8 BOM)</span>
                </div>
                <input
                  type="radio"
                  name="exportFormat"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-200">PDF / Formato para Impresión</span>
                </div>
                <input
                  type="radio"
                  name="exportFormat"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">Informe de Resumen Institucional</span>
                </div>
                <input
                  type="radio"
                  name="exportFormat"
                  checked={format === 'word'}
                  onChange={() => setFormat('word')}
                />
              </label>
            </div>
          </div>

          {exportedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              ¡Archivo generado y descargado con éxito!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Cerrar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            <Download className="w-4 h-4" />
            Descargar Archivo
          </button>
        </div>
      </div>
    </div>
  );
};
