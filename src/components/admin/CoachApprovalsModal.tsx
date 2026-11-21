import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Clock, 
  Edit3, 
  ShieldCheck, 
  Users, 
  Save, 
  Ban, 
  Sparkles,
  ChevronRight,
  Send
} from 'lucide-react';
import { CoachApprovalRequest, Club, User, Player } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAppTheme } from '../../context/ThemeContext';
import { PlayerImage } from '../common/PlayerImage';

interface CoachApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  requests?: CoachApprovalRequest[];
  onApprovalsUpdated: () => void;
}

export const CoachApprovalsModal: React.FC<CoachApprovalsModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  requests: requestsProp,
  onApprovalsUpdated
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const requests = isSupabaseConfigured()
    ? (requestsProp || [])
    : fraoviaDB.getCoachApprovalRequests(currentClub.id, currentUser);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(requests[0]?.id || '');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);

  const selectedRequest = requests.find(r => r.id === selectedRequestId) || requests[0];

  const handleStartEdit = (player: any) => {
    setEditingPlayerId(player.id);
    setEditFormData({
      firstName: player.firstName,
      lastName: player.lastName,
      dni: player.dni,
      birthDate: player.birthDate,
      phone: player.phone,
      email: player.email || '',
      photoUrl: player.photoUrl || ''
    });
  };

  const handleApproveSingle = async (provisionalPlayerId: string) => {
    if (!selectedRequest) return;
    try {
      const updatedData = editingPlayerId === provisionalPlayerId ? editFormData : {};
      await dataActions.approveProvisionalPlayer(selectedRequest.id, provisionalPlayerId, updatedData, currentUser);
      setEditingPlayerId(null);
      alert('¡Deportista dado de alta formalmente en el padrón del club!');
      onApprovalsUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar deportista');
    }
  };

  const handleApproveAll = async () => {
    if (!selectedRequest) return;
    const pendingCount = selectedRequest.players.filter(p => p.status !== 'aprobado').length;
    if (pendingCount === 0) {
      alert('Todos los alumnos de esta solicitud ya han sido dados de alta.');
      return;
    }

    if (!confirm(`¿Dar de alta formal a todos los ${pendingCount} deportistas en "${selectedRequest.categoryName}"? Se incorporarán automáticamente al padrón oficial del club.`)) {
      return;
    }

    try {
      const res = await dataActions.approveAllProvisionalPlayers(selectedRequest.id, currentUser);
      const fails = res.failed && res.failed.length > 0
        ? `\n\nNo se pudieron dar de alta ${res.failed.length}: ` + res.failed.map(f => `${f.name} (${f.reason})`).join('; ')
        : '';
      alert(`¡Se dieron de alta exitosamente ${res.approvedCount} deportistas!${fails}`);
      onApprovalsUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar todos');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      alert('Por favor ingrese el motivo de denegación.');
      return;
    }

    try {
      await dataActions.rejectApprovalRequest(selectedRequest.id, rejectReason.trim(), currentUser);
      alert('La solicitud ha sido denegada y notificada al cuerpo técnico.');
      setShowRejectBox(false);
      setRejectReason('');
      onApprovalsUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al denegar solicitud');
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pendiente' || r.status === 'aprobado_parcial').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <UserCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Secretaría & Administración
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Solicitudes de Aprobación de Profesores
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Sidebar with Requests / Right: Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 text-xs">
          
          {/* Requests List (4 cols) */}
          <div className="md:col-span-4 p-4 border-r border-slate-800/80 bg-slate-950/40 space-y-3 overflow-y-auto max-h-[75vh]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold uppercase text-[10px] text-slate-400">Solicitudes ({requests.length})</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold text-[10px]">
                {pendingRequestsCount} pendientes
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No hay solicitudes de profesores en este momento.
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      setEditingPlayerId(null);
                      setShowRejectBox(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      selectedRequest?.id === req.id
                        ? 'bg-sky-500/15 border-sky-500/50 text-white ring-1 ring-sky-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{req.categoryName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        req.status === 'pendiente' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        req.status === 'aprobado_total' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        req.status === 'aprobado_parcial' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {req.status === 'pendiente' ? 'Pendiente' :
                         req.status === 'aprobado_total' ? 'Aprobado 100%' :
                         req.status === 'aprobado_parcial' ? 'Parcial' : 'Rechazado'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Profe: <strong className="text-slate-300">{req.coachName}</strong></span>
                      <span className="font-mono">{req.players.length} alumnos</span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(req.requestDate).toLocaleDateString('es-AR')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Request Details & Actions (8 cols) */}
          <div className="md:col-span-8 p-5 space-y-4 overflow-y-auto max-h-[75vh]">
            {selectedRequest ? (
              <>
                {/* Request Header Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{selectedRequest.categoryName}</span>
                        <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 font-bold">
                          {selectedRequest.players.length} postulantes
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enviado por <strong>{selectedRequest.coachName}</strong> el {new Date(selectedRequest.requestDate).toLocaleString('es-AR')}.
                      </p>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={handleApproveAll}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Aprobar Todos y Dar de Alta</span>
                      </button>
                      <button
                        onClick={() => setShowRejectBox(!showRejectBox)}
                        className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Denegar
                      </button>
                    </div>
                  </div>

                  {selectedRequest.coachNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-amber-400 mr-1.5">Nota del Profesor:</strong>
                      {selectedRequest.coachNotes}
                    </div>
                  )}

                  {/* Reject Box */}
                  {showRejectBox && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-in fade-in">
                      <label className="text-[11px] font-bold text-rose-400 uppercase block">Motivo de la denegación:</label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="ej: Falta presentar certificado médico original o cupo cubierto"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowRejectBox(false)} className="text-xs text-slate-400 px-2 py-1">Cancelar</button>
                        <button onClick={handleReject} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs">
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Players List with Individual Review & Edit */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold uppercase text-[11px] text-slate-400">
                      Revisión de Alumnos (Podés editar datos 1 a 1 antes de dar de alta):
                    </span>
                  </div>

                  {selectedRequest.players.map((p) => {
                    const isEditing = editingPlayerId === p.id;
                    const isApproved = p.status === 'aprobado';

                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-2xl border transition ${
                          isApproved
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {!isEditing ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                <PlayerImage
                                  photoPathOrUrl={p.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  fallbackInitials={`${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{p.firstName} {p.lastName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">DNI: {p.dni}</span>
                                  {isApproved && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                                      ✓ Dado de Alta
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span>Nac: {p.birthDate}</span>
                                  <span>·</span>
                                  <span>Tel: {p.phone}</span>
                                  {p.emergencyContact && (
                                    <>
                                      <span>·</span>
                                      <span className="text-amber-400">Tutor: {p.emergencyContact.name} ({p.emergencyContact.phone})</span>
                                    </>
                                  )}
                                </div>
                                {p.notes && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 italic">Obs: {p.notes}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {!isApproved && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(p)}
                                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Editar datos</span>
                                  </button>
                                  <button
                                    onClick={() => handleApproveSingle(p.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Dar de alta</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Edit Form */
                          <div className="space-y-3 p-1 animate-in fade-in">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                              <span className="font-bold text-sky-400 text-xs">Actualizar datos de {p.firstName} {p.lastName}</span>
                              <button onClick={() => setEditingPlayerId(null)} className="text-slate-400 hover:text-white text-xs">Cancelar edición</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">Nombre</label>
                                <input
                                  type="text"
                                  value={editFormData.firstName}
                                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">Apellido</label>
                                <input
                                  type="text"
                                  value={editFormData.lastName}
                                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">DNI</label>
                                <input
                                  type="text"
                                  value={editFormData.dni}
                                  onChange={(e) => setEditFormData({ ...editFormData, dni: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">Nacimiento</label>
                                <input
                                  type="date"
                                  value={editFormData.birthDate}
                                  onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">Teléfono</label>
                                <input
                                  type="text"
                                  value={editFormData.phone}
                                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">Email</label>
                                <input
                                  type="email"
                                  value={editFormData.email}
                                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingPlayerId(null)}
                                className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleApproveSingle(p.id)}
                                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Guardar y Dar de Alta</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Selecciona una solicitud para ver los aspirantes postulados.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-xs text-slate-400">
            Control de altas formal FRAOVIA · Aislamiento por club activo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
