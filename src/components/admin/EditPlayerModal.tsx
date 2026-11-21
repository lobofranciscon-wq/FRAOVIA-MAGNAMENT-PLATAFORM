import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Save, 
  User as UserIcon, 
  Calendar, 
  Phone, 
  Mail, 
  Activity, 
  Award, 
  HeartPulse, 
  Users, 
  Check, 
  Building2, 
  ShieldCheck, 
  DollarSign,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { Category, Club, Discipline, Player, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { supabaseDataService } from '../../services/supabaseDataService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { playerPhotoService } from '../../services/playerPhotoService';
import { PlayerImage } from '../common/PlayerImage';
import { FamilyDiscountPanel } from './FamilyDiscountPanel';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  onPlayerUpdated: () => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  currentClub,
  currentUser,
  disciplines,
  categories,
  onPlayerUpdated
}) => {
  if (!isOpen || !player) return null;

  const [activeTab, setActiveTab] = useState<'perfil' | 'deportivo' | 'medico' | 'tutor' | 'beca' | 'hermanos'>('perfil');
  const [familyChanged, setFamilyChanged] = useState<boolean>(false);
  const showFamilyTab = isSupabaseConfigured() && ['DUEÑO', 'ADMINISTRACIÓN', 'GENERAL'].includes(currentUser.role);
  // Si se tocó el descuento por hermanos, al cerrar se refrescan los datos de la app
  const handleClose = () => {
    if (familyChanged) onPlayerUpdated();
    onClose();
  };

  // Identidad
  const [firstName, setFirstName] = useState(player.firstName);
  const [lastName, setLastName] = useState(player.lastName);
  const [dni, setDni] = useState(player.dni);
  const [birthDate, setBirthDate] = useState(player.birthDate || '2012-05-10');
  const [joinedDate, setJoinedDate] = useState(player.joinedDate || '');
  const [photoUrl, setPhotoUrl] = useState(player.photoUrl || '');
  const [phone, setPhone] = useState(player.phone || '');
  const [email, setEmail] = useState(player.email || '');

  // Deportivo
  const [disciplineId, setDisciplineId] = useState(player.disciplineId || disciplines[0]?.id || '');
  const [categoryId, setCategoryId] = useState(player.categoryId || categories[0]?.id || '');
  const [position, setPosition] = useState(player.position || 'Deportista');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>(player.jerseyNumber ?? '');

  // Médico
  const [medicalCertificateValid, setMedicalCertificateValid] = useState(player.medicalCertificateValid ?? true);
  const [medicalExpiryDate, setMedicalExpiryDate] = useState(player.medicalExpiryDate || '2026-12-31');

  // Tutor
  const [emergencyName, setEmergencyName] = useState(player.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(player.emergencyContact?.phone || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(player.emergencyContact?.relationship || 'Familiar');

  // Beca / Exención de Cuota
  const [scholarshipPercent, setScholarshipPercent] = useState<number>(player.scholarshipPercent ?? 0);
  const [scholarshipReason, setScholarshipReason] = useState<string>(player.scholarshipReason || '');

  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync state if player prop changes
  useEffect(() => {
    if (player) {
      setFirstName(player.firstName);
      setLastName(player.lastName);
      setDni(player.dni);
      setBirthDate(player.birthDate || '2012-05-10');
      setJoinedDate(player.joinedDate || '');
      setPhotoUrl(player.photoUrl || '');
      setPhone(player.phone || '');
      setEmail(player.email || '');
      setDisciplineId(player.disciplineId || disciplines[0]?.id || '');
      setCategoryId(player.categoryId || categories[0]?.id || '');
      setPosition(player.position || 'Deportista');
      setJerseyNumber(player.jerseyNumber ?? '');
      setMedicalCertificateValid(player.medicalCertificateValid ?? true);
      setMedicalExpiryDate(player.medicalExpiryDate || '2026-12-31');
      setEmergencyName(player.emergencyContact?.name || '');
      setEmergencyPhone(player.emergencyContact?.phone || '');
      setEmergencyRelationship(player.emergencyContact?.relationship || 'Familiar');
      setScholarshipPercent(player.scholarshipPercent ?? 0);
      setScholarshipReason(player.scholarshipReason || '');
    }
  }, [player, disciplines, categories]);

  // Handle Photo File Upload to Supabase Storage Bucket 'players'
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await playerPhotoService.uploadPlayerPhoto(currentClub.id, file);
      // Guardar la RUTA (club_id/uuid.ext) para almacenar en la base
      setPhotoUrl(res.filePath);
      setFeedback('Foto de perfil subida al almacenamiento. Haz clic en Guardar para confirmar.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      const baseMonthlyFee = selectedCat?.monthlyFee || 22000;
      const safePercent = Math.max(0, Math.min(100, Math.round(scholarshipPercent)));
      const finalMonthlyFee = Math.max(0, Math.round(baseMonthlyFee * (1 - safePercent / 100)));

      const updated: Player = {
        ...player,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        birthDate,
        joinedDate: joinedDate || player.joinedDate,
        photoUrl: photoUrl.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        disciplineId,
        categoryId,
        position: position.trim(),
        jerseyNumber: jerseyNumber !== '' ? Number(jerseyNumber) : undefined,
        medicalCertificateValid,
        medicalExpiryDate,
        emergencyContact: {
          name: emergencyName.trim() || 'Tutor Responsable',
          phone: emergencyPhone.trim() || phone.trim(),
          relationship: emergencyRelationship || 'Familiar'
        },
        scholarshipPercent: safePercent,
        scholarshipType: safePercent === 100 ? 'completa' : safePercent === 50 ? 'media' : safePercent === 0 ? 'ninguna' : 'personalizada',
        scholarshipReason: scholarshipReason.trim(),
        monthlyFeeDue: finalMonthlyFee
      };

      if (isSupabaseConfigured()) {
        // El SUPERADMIN solo supervisa los clubes (modo fantasma): no modifica jugadores
        if (currentUser.role === 'SUPERADMIN') {
          throw new Error('FRAOVIA: El SUPERADMIN está en modo fantasma (solo lectura) y no puede modificar jugadores.');
        }
        // Guarda en Supabase. La cuota con beca la recalcula la base.
        await supabaseDataService.updatePlayer(player.id, updated);
      } else {
        fraoviaDB.updatePlayer(updated, currentUser);
      }
      onPlayerUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar perfil del jugador');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0B1528] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* HEADER */}
        <div 
          className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4"
          style={{
            background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow flex items-center justify-center shrink-0">
              {currentClub.logoUrl && currentClub.logoUrl.trim() ? (
                <img src={currentClub.logoUrl} alt={currentClub.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-slate-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  FICHA OFICIAL DE DEPORTISTA
                </span>
                <span className="text-xs text-white/90 font-medium">
                  {currentClub.name}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Editar Perfil de {player.firstName} {player.lastName}
              </h3>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className="p-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* TABS */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/60 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'perfil'
                ? 'border-sky-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>1. Foto & Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deportivo')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'deportivo'
                ? 'border-sky-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>2. Ficha Deportiva</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medico')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'medico'
                ? 'border-emerald-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Ficha Médica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutor')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'tutor'
                ? 'border-indigo-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>4. Tutor / Familia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('beca')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'beca'
                ? 'border-amber-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>5. Beca & Arancel {scholarshipPercent > 0 ? `(${scholarshipPercent}%)` : ''}</span>
          </button>

          {showFamilyTab && (
            <button
              type="button"
              onClick={() => setActiveTab('hermanos')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'hermanos'
                  ? 'border-sky-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>6. Hermanos</span>
            </button>
          )}
        </div>

        {/* BODY */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-300">
          
          {/* TAB 1: FOTO & IDENTIDAD */}
          {activeTab === 'perfil' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
              {/* Photo Upload Box (5 cols) */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Foto Oficial del Jugador
                </span>

                <div className="relative group my-2">
                  <div className="w-32 h-32 rounded-2xl bg-slate-950 border-2 border-sky-500/40 overflow-hidden shadow-xl flex items-center justify-center">
                    {photoUrl && photoUrl.trim() ? (
                      <PlayerImage
                        photoPathOrUrl={photoUrl.trim()}
                        alt="Foto Jugador"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-16 h-16 text-slate-600" />
                    )}
                  </div>

                  <label className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg cursor-pointer transition flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {photoUrl && photoUrl.trim() ? (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Quitar foto
                  </button>
                ) : null}

                <div className="w-full space-y-2 pt-2">
                  <label className="w-full py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto desde tu PC</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">O pegar enlace URL directo:</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-semibold">O seleccionar foto de muestra:</span>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {[
                        'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'
                      ].map((sampleUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoUrl(sampleUrl)}
                          className={`w-8 h-8 rounded-lg overflow-hidden border transition cursor-pointer ${
                            photoUrl === sampleUrl ? 'ring-2 ring-sky-400 border-white' : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {sampleUrl ? (
                            <img src={sampleUrl} alt="Preset" className="w-full h-full object-cover" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Form (7 cols) */}
              <div className="md:col-span-7 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Nombre(s)</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Apellido(s)</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">DNI / Documento</label>
                    <input
                      type="text"
                      required
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1 font-medium">Fecha de Ingreso al Club</label>
                    <input
                      type="date"
                      value={joinedDate}
                      onChange={(e) => setJoinedDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Desde este mes corren las cuotas a pagar. Si se cargó mal, corregila acá.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+54 11 ..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="socio@..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FICHA DEPORTIVA */}
          {activeTab === 'deportivo' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Disciplina Deportiva</label>
                  <select
                    value={disciplineId}
                    onChange={(e) => setDisciplineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Categoría / División</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Posición habitual</label>
                  <input
                    type="text"
                    placeholder="Ej: Delantero, Armador, Base, Defensor..."
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Número de Camiseta / Dorsal</label>
                  <input
                    type="number"
                    placeholder="Ej: 10"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FICHA MÉDICA */}
          {activeTab === 'medico' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                    <div>
                      <strong className="text-white text-xs block">Certificado Médico Obligatorio</strong>
                      <span className="text-[10px] text-slate-400 block">Habilita al deportista para competir en partidos oficiales</span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={medicalCertificateValid} 
                      disabled
                      readOnly
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Fecha de Vencimiento del Apto</label>
                  <input
                    type="date"
                    value={medicalExpiryDate}
                    disabled
                    readOnly
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-amber-300 mt-1">
                    El apto médico solo se renueva cobrando la ficha médica (Centro Médico → Cobrar y renovar apto).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TUTOR / FAMILIA */}
          {activeTab === 'tutor' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre del Tutor / Contacto de Urgencia</label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Gómez"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Vínculo / Relación</label>
                  <input
                    type="text"
                    placeholder="Ej: Madre, Padre, Tutor legal..."
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Teléfono de Urgencia</label>
                <input
                  type="text"
                  placeholder="+54 11 ..."
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 5: BECA & EXENCIÓN DE CUOTA */}
          {activeTab === 'beca' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>Régimen de Beca Deportiva / Social</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Define la bonificación o exención de cuota mensual para este deportista.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Arancel Base de Categoría:</span>
                  <strong className="text-amber-400 font-mono text-sm font-bold">
                    ${(categories.find(c => c.id === categoryId)?.monthlyFee || 22000).toLocaleString('es-AR')}/mes
                  </strong>
                </div>
              </div>

              {/* Selector de Nivel de Beca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 0%: Sin Beca */}
                <div
                  onClick={() => setScholarshipPercent(0)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                    scholarshipPercent === 0
                      ? 'bg-slate-900 border-slate-500 ring-1 ring-slate-400'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Sin Beca (0%)</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${scholarshipPercent === 0 ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'}`}>
                      {scholarshipPercent === 0 && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Abona arancel regular completo</span>
                </div>

                {/* 50%: Media Beca */}
                <div
                  onClick={() => setScholarshipPercent(50)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                    scholarshipPercent === 50
                      ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-400 text-amber-200'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-300 text-xs">Media Beca (50%)</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${scholarshipPercent === 50 ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'}`}>
                      {scholarshipPercent === 50 && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-300 block">50% de bonificación institucional</span>
                </div>

                {/* 100%: Beca Completa */}
                <div
                  onClick={() => setScholarshipPercent(100)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                    scholarshipPercent === 100
                      ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-400 text-emerald-200'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-300 text-xs">Beca Completa (100%)</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${scholarshipPercent === 100 ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-700'}`}>
                      {scholarshipPercent === 100 && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-300/90 font-medium block">NO abona cuota ($0/mes)</span>
                </div>
              </div>

              {/* Slider Porcentaje Personalizado */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">O ajustar porcentaje exacto:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{scholarshipPercent}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={scholarshipPercent}
                  onChange={(e) => setScholarshipPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0% (Sin Beca)</span>
                  <span>25%</span>
                  <span>50% (Media)</span>
                  <span>75%</span>
                  <span>100% (Completa)</span>
                </div>
              </div>

              {/* Cuadro de certeza de números exactos */}
              {(() => {
                const base = categories.find(c => c.id === categoryId)?.monthlyFee || 22000;
                const disc = Math.round(base * (scholarshipPercent / 100));
                const net = Math.max(0, base - disc);
                return (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Arancel Regular:</span>
                      <strong className="text-slate-200 font-mono">${base.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Bonificación por Beca ({scholarshipPercent}%):</span>
                      <strong className="text-amber-400 font-mono">-${disc.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Cuota Mensual Neta a Abonar:</span>
                      <strong className="font-mono text-base font-black text-emerald-400">
                        {net === 0 ? '$0 (Exento por Beca)' : `$${net.toLocaleString('es-AR')}`}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Motivo o resolución */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Motivo o Resolución de la Beca</label>
                <input
                  type="text"
                  placeholder="ej: Mérito deportivo en Primera / Convenio escolar / Ayuda social"
                  value={scholarshipReason}
                  onChange={(e) => setScholarshipReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'hermanos' && showFamilyTab && (
            <FamilyDiscountPanel
              player={player}
              currentUser={currentUser}
              categories={categories}
              onChanged={() => setFamilyChanged(true)}
            />
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Perfil & Foto del Jugador</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
