import React, { useState } from 'react';
import { 
  X, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Calendar, 
  Search,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { Club, Player, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { formatSupabaseError } from '../../services/supabaseDataService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface MedicalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  players: Player[];
  onPlayerUpdated: () => void;
  /** Si se pasa, renovar el apto abre el cobro con comprobante (ficha médica) en vez de editar la fecha directo. */
  onRequestMedicalCharge?: (player: Player) => void;
}

export const MedicalCenterModal: React.FC<MedicalCenterModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  players,
  onPlayerUpdated,
  onRequestMedicalCharge
}) => {
  const [filterState, setFilterState] = useState<'all' | 'valid' | 'warning' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerToRenew, setSelectedPlayerToRenew] = useState<Player | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('2027-03-31');

  if (!isOpen) return null;

  const today = new Date();

  const getMedicalStatus = (p: Player) => {
    if (!p.medicalCertificateValid || !p.medicalExpiryDate) {
      return { status: 'expired', label: 'Vencido / Sin Apto', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
    const expiry = new Date(p.medicalExpiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { status: 'expired', label: 'Vencido', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: `Por vencer (${diffDays} días)`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    } else {
      return { status: 'valid', label: 'Vigente / Habilitado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
  };

  const filteredPlayers = players.filter(p => {
    const med = getMedicalStatus(p);
    const matchesFilter = filterState === 'all' || med.status === filterState;
    const matchesSearch = 
      p.dni.includes(searchTerm) || 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRenewCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerToRenew) return;

    // Con la base real el apto solo se renueva cobrando la ficha médica (con comprobante)
    if (isSupabaseConfigured()) {
      alert('El apto médico solo se renueva cobrando la ficha médica. Usá el botón "Cobrar y renovar apto".');
      return;
    }

    try {
      await dataActions.renewMedicalCertificate(selectedPlayerToRenew, newExpiryDate, currentUser);
      if (!isSupabaseConfigured()) {
        fraoviaDB.logAudit(
          currentUser,
          'APTO_MEDICO_RENOVADO',
          `Certificado médico renovado para ${selectedPlayerToRenew.firstName} ${selectedPlayerToRenew.lastName} (DNI ${selectedPlayerToRenew.dni}) hasta ${newExpiryDate}.`,
          'jugadores',
          currentClub.id
        );
      }
      setSelectedPlayerToRenew(null);
      onPlayerUpdated();
    } catch (err: any) {
      alert(formatSupabaseError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Semáforo de Aptos Médicos & Salud Deportiva
              </h2>
              <p className="text-xs text-slate-400">
                {currentClub.name} · Control de aptitudes físicas, certificados y vencimientos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por deportista o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterState === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({players.length})
            </button>
            <button
              onClick={() => setFilterState('expired')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterState === 'expired' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Vencidos
            </button>
            <button
              onClick={() => setFilterState('warning')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterState === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🟡 Por Vencer
            </button>
            <button
              onClick={() => setFilterState('valid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterState === 'valid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🟢 Vigentes
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No se encontraron registros con el filtro seleccionado.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const med = getMedicalStatus(player);
              return (
                <div
                  key={player.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">
                        {player.lastName}, {player.firstName}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">DNI: {player.dni}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Vence: {player.medicalExpiryDate || 'Sin fecha'} · Contacto: {player.emergencyContact?.name || player.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${med.color}`}>
                      {med.label}
                    </span>
                    <button
                      onClick={() => {
                        if (onRequestMedicalCharge) {
                          // La renovación del apto se cobra y genera comprobante
                          onClose();
                          onRequestMedicalCharge(player);
                        } else {
                          setSelectedPlayerToRenew(player);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      {onRequestMedicalCharge ? 'Cobrar y renovar apto' : 'Renovar Apto'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Renew Form Modal overlay if opened */}
        {selectedPlayerToRenew && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80">
            <form onSubmit={handleRenewCertificate} className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-200">
                Renovar certificado de {selectedPlayerToRenew.firstName} {selectedPlayerToRenew.lastName}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPlayerToRenew(null)}
                  className="px-3 py-1 text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
                >
                  Guardar y Habilitar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>El semáforo protege al club ante responsabilidades civiles en entrenamientos.</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
