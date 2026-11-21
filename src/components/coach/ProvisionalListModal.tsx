import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Send, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Phone, 
  Users, 
  FileText,
  Sparkles,
  Camera
} from 'lucide-react';
import { Category, Club, Discipline, ProvisionalPlayer, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAppTheme } from '../../context/ThemeContext';

interface ProvisionalListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  categories: Category[];
  disciplines: Discipline[];
  provisionalPlayers?: ProvisionalPlayer[];
  onListUpdated: () => void;
}

export const ProvisionalListModal: React.FC<ProvisionalListModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  categories,
  disciplines,
  provisionalPlayers: provisionalPlayersProp,
  onListUpdated
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New provisional player form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('2011-06-15');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorRelation, setTutorRelation] = useState('Padre');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Get current provisional players
  const provisionalList = isSupabaseConfigured()
    ? (provisionalPlayersProp || []).filter(p => p.categoryId === selectedCatId)
    : fraoviaDB.getProvisionalPlayers(currentClub.id, currentUser, selectedCatId);
  const selectedCat = categories.find(c => c.id === selectedCatId) || categories[0];
  const selectedDisc = disciplines.find(d => d.id === selectedCat?.disciplineId);

  const draftPlayers = provisionalList.filter(p => p.status === 'borrador');
  const pendingPlayers = provisionalList.filter(p => p.status === 'pendiente_aprobacion');
  const approvedPlayers = provisionalList.filter(p => p.status === 'aprobado');

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dni.trim()) {
      alert('Por favor complete nombre, apellido y DNI.');
      return;
    }

    try {
      await dataActions.addProvisionalPlayer(
        {
          clubId: currentClub.id,
          disciplineId: selectedCat.disciplineId,
          categoryId: selectedCat.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dni: dni.trim(),
          birthDate,
          phone: phone.trim() || '+54 11 0000-0000',
          email: email.trim() || undefined,
          emergencyContact: tutorName ? {
            name: tutorName.trim(),
            relationship: tutorRelation,
            phone: tutorPhone.trim() || phone.trim()
          } : undefined,
          notes: notes.trim() || undefined,
          photoUrl: photoUrl.trim() || (isSupabaseConfigured() ? undefined : 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80'),
          coachId: currentUser.id,
          coachName: currentUser.fullName
        },
        currentUser
      );

      // Reset form
      setFirstName('');
      setLastName('');
      setDni('');
      setPhone('');
      setEmail('');
      setTutorName('');
      setTutorPhone('');
      setNotes('');
      setPhotoUrl('');
      setShowAddForm(false);
      onListUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al agregar aspirante provisorio');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (confirm('¿Eliminar este aspirante del listado provisorio?')) {
      try {
        await dataActions.deleteProvisionalPlayer(id, currentUser);
        onListUpdated();
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el aspirante');
      }
    }
  };

  const handleSubmitToAdmin = async () => {
    if (draftPlayers.length === 0) {
      alert('No hay aspirantes en borrador en esta categoría para enviar a administración.');
      return;
    }

    if (!confirm(`¿Enviar solicitud a Administración para dar de alta formal a ${draftPlayers.length} alumnos en "${selectedCat.name}"?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await dataActions.submitApprovalRequest(
        selectedCat.id,
        coachNotes || `Solicitud formal de alta para ${draftPlayers.length} alumnos en ${selectedCat.name}.`,
        currentUser
      );
      alert('¡Solicitud enviada a Administración con éxito! El personal de Secretaría revisará y dará el alta oficial a los deportistas.');
      setCoachNotes('');
      onListUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al enviar solicitud a administración');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Pre-Inscripciones & Altas
                </span>
                <span className="text-xs text-emerald-200 hidden sm:inline">
                  {currentUser.fullName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Listado Provisorio de Aspirantes
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category selector strip */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Categoría activa:</span>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Cerrar formulario' : '+ Cargar Aspirante'}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Add form drawer */}
          {showAddForm && (
            <form onSubmit={handleAddPlayer} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in">
              <h4 className="font-bold text-emerald-400 uppercase text-xs flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Alumno Provisorio para {selectedCat?.name}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Bautista"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Romero"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">DNI *</label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="51203948"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Teléfono Alumno</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 11 4455-8822"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="familia@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nombre Tutor / Padre</label>
                  <input
                    type="text"
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    placeholder="Esteban Romero"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Vínculo</label>
                  <select
                    value={tutorRelation}
                    onChange={(e) => setTutorRelation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Abuelo/a">Abuelo/a</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Teléfono Tutor</label>
                  <input
                    type="text"
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    placeholder="+54 11 4455-8820"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Observaciones / Posición / Rendimiento inicial</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej: Delantero centro, buen ritmo en las pruebas físicas de campo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Guardar en Borrador
                </button>
              </div>
            </form>
          )}

          {/* List of Aspirants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-white uppercase text-xs">
                Aspirantes en {selectedCat?.name} ({provisionalList.length})
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                  {draftPlayers.length} borradores
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
                  {pendingPlayers.length} enviados
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  {approvedPlayers.length} dados de alta
                </span>
              </div>
            </div>

            {provisionalList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-slate-400 font-medium">No hay aspirantes registrados para esta categoría todavía.</p>
                <p className="text-[11px] text-slate-500">Haz clic en <strong>+ Cargar Aspirante</strong> para ir armando el listado provisorio.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {provisionalList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-slate-500 m-2.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{p.firstName} {p.lastName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">DNI: {p.dni}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Nac: {p.birthDate}</span>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'borrador'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : p.status === 'pendiente_aprobacion'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : p.status === 'aprobado'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.status === 'borrador' ? 'En borrador'
                          : p.status === 'pendiente_aprobacion' ? 'Pendiente Admin'
                          : p.status === 'aprobado' ? 'Dado de alta'
                          : 'Rechazado'}
                      </span>

                      {p.status === 'borrador' && (
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(p.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Box: Submit to Administration */}
          {draftPlayers.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border-2 border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs uppercase">
                    Solicitar Aprobación a Administración ({draftPlayers.length} alumnos listos)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {selectedCat?.name}
                </span>
              </div>

              <input
                type="text"
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Nota para Secretaría (ej: Presentaron apto médico y completaron ficha en campo...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Al enviar, el personal de Administración recibirá una notificación para revisar los datos y darlos de alta formalmente en el sistema.
                </span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitToAdmin}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Enviar a Administración</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-xs text-slate-400">
            Categorías vinculadas al profesor: {categories.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
