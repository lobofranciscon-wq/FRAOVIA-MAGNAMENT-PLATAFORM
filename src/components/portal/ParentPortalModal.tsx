import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FileCheck, 
  HeartPulse, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { Category, Club, Player, Receipt } from '../../types/fraovia';

interface ParentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  allClubs: Club[];
  allPlayers: Player[];
  allReceipts: Receipt[];
  categories: Category[];
  onSelectReceipt: (receipt: Receipt) => void;
}

export const ParentPortalModal: React.FC<ParentPortalModalProps> = ({
  isOpen,
  onClose,
  allClubs,
  allPlayers,
  allReceipts,
  categories,
  onSelectReceipt
}) => {
  const [dniSearch, setDniSearch] = useState('48901234'); // Pre-fill with Mateo González for fast demo
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = dniSearch.replace(/\D/g, '');
    const ply = allPlayers.find(p => p.dni === clean);
    setFoundPlayer(ply || null);
    setHasSearched(true);
  };

  const club = foundPlayer ? allClubs.find(c => c.id === foundPlayer.clubId) : null;
  const category = foundPlayer ? categories.find(c => c.id === foundPlayer.categoryId) : null;
  const receipts = foundPlayer 
    ? allReceipts.filter(r => r.customerDni === foundPlayer.dni || r.customerName.includes(foundPlayer.lastName))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Portal de Familias & Autogestión Deportiva
              </h2>
              <p className="text-xs text-slate-400">
                Acceso público seguro para padres: consulta de cuotas, apto médico y comprobantes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* DNI Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Ingresa el DNI del deportista..."
              value={dniSearch}
              onChange={(e) => setDniSearch(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Search className="w-4 h-4" />
              Consultar
            </button>
          </form>

          {/* Result Card */}
          {foundPlayer && club ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {club.logoUrl && club.logoUrl.trim() ? (
                      <img src={club.logoUrl} alt={club.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : null}
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        {foundPlayer.firstName} {foundPlayer.lastName}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">DNI: {foundPlayer.dni}</span>
                      <div className="text-cyan-400 text-xs mt-0.5">{club.name}</div>
                    </div>
                  </div>

                  <div>
                    {foundPlayer.balance > 0 ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Saldo Pendiente: ${foundPlayer.balance.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Cuota al Día
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Categoría</span>
                    <span className="font-semibold text-slate-200">{category?.name || 'Sub 17'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Horario de Práctica</span>
                    <span className="font-semibold text-slate-200">{category?.trainingSchedule || 'Mar y Jue 18:30'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Certificado Médico</span>
                    <span className={`font-semibold ${foundPlayer.medicalCertificateValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {foundPlayer.medicalCertificateValid ? '🟢 Habilitado' : '🔴 Vencido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipts List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-200 text-xs block">
                  Comprobantes Oficiales Emitidos a la Familia ({receipts.length})
                </span>

                <div className="space-y-2">
                  {receipts.length === 0 ? (
                    <div className="p-3 bg-slate-950/60 rounded-xl text-center text-slate-500 text-xs">
                      No hay comprobantes emitidos recientemente para este DNI.
                    </div>
                  ) : (
                    receipts.map(r => (
                      <div 
                        key={r.id}
                        className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">{r.receiptNumber}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(r.date).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                          <div className="text-slate-300 mt-0.5">{r.concept}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-100">
                            ${r.amount.toLocaleString('es-AR')}
                          </span>
                          <button
                            onClick={() => onSelectReceipt(r)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg"
                            title="Ver e Imprimir Recibo"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No se encontró ningún deportista con el DNI ingresado en ninguna de las instituciones activas.
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Ingresa el DNI del alumno para consultar la ficha, cuotas y recibos emitidos por el club.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs">
            Cerrar Portal
          </button>
        </div>
      </div>
    </div>
  );
};
