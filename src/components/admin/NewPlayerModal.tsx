import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Upload, 
  Award, 
  HeartPulse, 
  Users, 
  DollarSign, 
  Activity, 
  Calendar, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  FileText,
  BadgeCheck,
  Building2,
  QrCode
} from 'lucide-react';
import { Category, Club, Discipline, Player, User, ChargeType, CHARGE_TYPE_LABELS } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { supabaseDataService, formatSupabaseError } from '../../services/supabaseDataService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { playerPhotoService } from '../../services/playerPhotoService';
import { PlayerImage } from '../common/PlayerImage';
import { useAppTheme } from '../../context/ThemeContext';

interface NewPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  onPlayerAdded: (player: Player) => void;
  /**
   * Si se pasa, al crear el perfil se ofrece cobrar inscripción, seguro, cuota o ficha médica.
   * Crear el perfil NO registra ningún pago: el cobro (y su comprobante) se hace aparte.
   */
  onChargeNewPlayer?: (player: Player, type: ChargeType) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
];

export const NewPlayerModal: React.FC<NewPlayerModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  disciplines,
  categories,
  onPlayerAdded,
  onChargeNewPlayer
}) => {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'identidad' | 'deportivo' | 'medico' | 'tutor' | 'arancel'>('identidad');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Jugador recién creado: se muestra el panel "¿Querés cobrar algo ahora?"
  const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);

  // Identidad
  const [dni, setDni] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('2011-06-15');
  const [joinedDate, setJoinedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | 'Mixto'>('Masculino');
  const [photoStoragePath, setPhotoStoragePath] = useState<string>('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  // photoUrl representa la RUTA del storage (club_id/uuid.ext) o preset para players.photo_url
  const photoUrl = photoStoragePath;
  const setPhotoUrl = (url: string) => {
    setPhotoStoragePath(url);
    setPhotoPreviewUrl(url);
  };
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Perfil Deportivo
  const [selectedDisciplineId, setSelectedDisciplineId] = useState(disciplines[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [colorBlockName, setColorBlockName] = useState('Bloque Blanco');
  const [position, setPosition] = useState('Delantero Centro');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>(10);
  const [dominantSide, setDominantSide] = useState<'diestro' | 'zurdo' | 'ambidiestro'>('diestro');

  // Ficha Médica
  // El apto médico NO se puede dar por vigente al crear: se habilita solo al cobrar la ficha médica
  const medicalCertificateValid = false;
  const medicalExpiryDate = '';
  const [bloodType, setBloodType] = useState('0+');
  const [healthInsurance, setHealthInsurance] = useState('OSDE / Plan Social');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Tutor / Familia
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Madre');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Arancel & Membresía
  const [monthlyFee, setMonthlyFee] = useState<number>(22000);
  const [scholarshipPercent, setScholarshipPercent] = useState<number>(0);

  // Calculate age automatically (Hook must precede conditional return)
  const calculatedAge = useMemo(() => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }, [birthDate]);

  if (!isOpen) return null;

  const currentCount = fraoviaDB.getPlayers(currentClub.id, currentUser).length;
  const isNearLimit = currentCount >= currentClub.contractedPlayersQuota;

  // Selected Category & Discipline objects
  const selectedDiscipline = disciplines.find(d => d.id === selectedDisciplineId) || disciplines[0];
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

  // Handle Photo File Upload: Sube al bucket 'players' y obtiene la ruta {club_id}/{uuid}.ext
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La foto debe ser menor a 3MB.');
      return;
    }

    try {
      const res = await playerPhotoService.uploadPlayerPhoto(currentClub.id, file);
      // Guardar la RUTA (club_id/uuid.ext) para persistir en la base de datos
      setPhotoStoragePath(res.filePath);
      // URL firmada para la previsualización inmediata en el carnet en vivo
      setPhotoPreviewUrl(res.signedUrl);
    } catch (err: any) {
      alert('Error al subir foto de jugador: ' + err.message);
    }
  };

  const finalFee = Math.max(0, Math.round(monthlyFee * (1 - scholarshipPercent / 100)));

  // Limpia los datos del jugador anterior para poder cargar otro
  const resetForm = () => {
    setActiveTab('identidad');
    setDni('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPhotoStoragePath('');
    setPhotoPreviewUrl('');
    setMedicalNotes('');
    setEmergencyName('');
    setEmergencyPhone('');
    setScholarshipPercent(0);
  };

  const finishAfterCreation = (type?: ChargeType) => {
    const player = createdPlayer;
    setCreatedPlayer(null);
    resetForm();
    onClose();
    if (player && type && onChargeNewPlayer) onChargeNewPlayer(player, type);
  };

  if (createdPlayer) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3">
        <div className="bg-[#0B1528] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Perfil creado</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {createdPlayer.firstName} {createdPlayer.lastName} · DNI {createdPlayer.dni}
              </p>
              <p className="text-[11px] text-sky-300 mt-1.5">
                Todavía no tiene ningún pago registrado. Podés cobrar ahora o más tarde desde su tarjeta.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">¿Querés cobrar algo ahora?</p>
            <div className="grid grid-cols-2 gap-2">
              {(['inscripcion', 'seguro', 'cuota', 'ficha_medica'] as ChargeType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => finishAfterCreation(type)}
                  className="py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition cursor-pointer"
                >
                  Cobrar {CHARGE_TYPE_LABELS[type].toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => finishAfterCreation()}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Cobrar más tarde
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!dni.trim() || !firstName.trim() || !lastName.trim()) {
      setActiveTab('identidad');
      alert('Por favor complete los campos obligatorios de identidad: Nombre, Apellido y DNI.');
      return;
    }

    setIsSaving(true);
    try {
      const scholarshipType: 'completa' | 'media' | 'ninguna' | 'personalizada' =
        scholarshipPercent >= 100 ? 'completa'
        : scholarshipPercent === 50 ? 'media'
        : scholarshipPercent === 0 ? 'ninguna'
        : 'personalizada';

      // Se usa la disciplina/categoría realmente elegida (o la primera disponible), nunca un id viejo del formulario
      if (!selectedDiscipline?.id || !selectedCategory?.id) {
        throw new Error('Primero tiene que existir al menos una disciplina y una categoría en el club.');
      }

      const playerData = {
        disciplineId: selectedDiscipline.id,
        categoryId: selectedCategory.id,
        colorBlockName: colorBlockName || selectedCategory?.colorBlockName || 'Bloque Principal',
        dni: dni.trim().replace(/\D/g, ''),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        // Guardar RUTA (club_id/uuid.ext), nunca URL firmada
        photoUrl: photoStoragePath || undefined,
        position,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
        dominantSide,
        bloodType,
        healthInsurance,
        medicalNotes,
        phone: phone.trim(),
        email: email.trim(),
        emergencyContact: {
          name: emergencyName.trim() || 'Tutor Responsable',
          relationship: emergencyRelationship || 'Familiar',
          phone: emergencyPhone.trim() || phone.trim()
        },
        medicalCertificateValid,
        medicalExpiryDate,
        scholarshipPercent,
        scholarshipType,
        status: 'activo' as const,
        monthlyFeeDue: finalFee,
        balance: 0,
        joinedDate: joinedDate || new Date().toISOString().split('T')[0]
      };

      let newPlayer: Player;
      if (isSupabaseConfigured()) {
        // El SUPERADMIN solo supervisa los clubes (modo fantasma): no inscribe jugadores
        if (currentUser.role === 'SUPERADMIN') {
          throw new Error('FRAOVIA: El SUPERADMIN está en modo fantasma (solo lectura) y no puede inscribir jugadores.');
        }
        // Guarda en Supabase. La base genera el ID, calcula la cuota con la beca
        // y controla el cupo del plan y el DNI repetido.
        newPlayer = await supabaseDataService.createPlayer(currentClub.id, playerData);
      } else {
        newPlayer = fraoviaDB.addPlayer({ clubId: currentClub.id, ...playerData }, currentUser);
      }

      onPlayerAdded(newPlayer);
      if (onChargeNewPlayer) {
        // El perfil quedó creado SIN pagos. Se ofrece cobrar inscripción, seguro o cuota.
        setCreatedPlayer(newPlayer);
        setIsSaving(false);
        return;
      }
      resetForm();
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert(err.message || 'Error al guardar perfil de deportista');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Top Header with Club Identity Banner */}
        <div 
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-4 relative overflow-hidden"
          style={{
            background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #071739 100%)',
            borderColor: currentClub.branding?.primaryColor || '#0284C7'
          }}
        >
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner overflow-hidden shrink-0">
              {currentClub.logoUrl && currentClub.logoUrl.trim() ? (
                <img src={currentClub.logoUrl} alt="Escudo" className="w-8 h-8 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Perfil del Jugador · Registro Oficial
                </span>
                <span className="text-xs text-sky-200 hidden sm:inline">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white mt-0.5">
                Alta de Perfil Deportivo & Credencial
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer relative z-10"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capacity Warning if club limit reached */}
        {isNearLimit && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 px-5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Límite de Cupo:</strong> El club ha alcanzado las {currentClub.contractedPlayersQuota} fichas de su plan. Este nuevo registro se guardará en modo <strong>Solo Lectura</strong>.
            </span>
          </div>
        )}

        {/* Split Body Layout: Left = Live Credential Preview, Right = Profile Form by Tabs */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT COLUMN: LIVE DIGITAL PLAYER CARD / CARNET (4 Cols) */}
          <div className={`p-4 sm:p-5 border-b lg:border-b-0 lg:border-r flex flex-col items-center justify-start space-y-4 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#070E1E] border-slate-800/80'
          } lg:col-span-4`}>
            
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 self-start">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              Carnet Digital en Vivo
            </span>

            {/* Realistic Digital Player Passport / Credential */}
            <div className="w-full max-w-[280px] rounded-3xl p-4.5 border-2 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between"
              style={{
                background: currentClub.branding?.bannerGradient || 'linear-gradient(135deg, #0284C7 0%, #0c214d 100%)',
                borderColor: currentClub.branding?.primaryColor || '#0284C7'
              }}
            >
              {/* Watermark Crest */}
              {(currentClub.branding?.watermarkUrl?.trim() || currentClub.logoUrl?.trim()) ? (
                <div className="absolute -right-6 -bottom-6 w-36 h-36 pointer-events-none select-none z-0 opacity-15 mix-blend-overlay">
                  <img src={currentClub.branding?.watermarkUrl?.trim() || currentClub.logoUrl?.trim()} alt="Watermark" className="w-full h-full object-contain" />
                </div>
              ) : null}

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center p-1">
                    {currentClub.logoUrl && currentClub.logoUrl.trim() ? (
                      <img src={currentClub.logoUrl} alt="Escudo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[150px]">
                    {currentClub.name}
                  </span>
                </div>
                {jerseyNumber ? (
                  <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-white/25 text-white shadow">
                    #{jerseyNumber}
                  </span>
                ) : null}
              </div>

              {/* Player Photo & Identity */}
              <div className="relative z-10 flex flex-col items-center text-center my-3 space-y-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/40 overflow-hidden shadow-xl flex items-center justify-center">
                    {photoPreviewUrl && photoPreviewUrl.trim() ? (
                      <img src={photoPreviewUrl} alt="Perfil" className="w-full h-full object-cover" />
                    ) : photoStoragePath && photoStoragePath.trim() ? (
                      <PlayerImage
                        photoPathOrUrl={photoStoragePath}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-white/50" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer transition">
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                <div>
                  <h4 className="text-base font-black text-white leading-tight">
                    {firstName || lastName ? `${firstName} ${lastName}` : 'Nombre del Jugador'}
                  </h4>
                  <span className="text-xs text-sky-200 font-semibold block mt-0.5">
                    {position || 'Posición en campo'}
                  </span>
                </div>
              </div>

              {/* Specs Pills */}
              <div className="relative z-10 grid grid-cols-2 gap-1.5 pt-2 border-t border-white/20 text-[10px]">
                <div className="bg-black/30 rounded-xl p-1.5 text-center">
                  <span className="text-white/60 block text-[9px] uppercase">DNI</span>
                  <span className="font-mono font-bold text-white">{dni || '••••••••'}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-1.5 text-center">
                  <span className="text-white/60 block text-[9px] uppercase">Edad</span>
                  <span className="font-bold text-emerald-300 font-mono">{calculatedAge > 0 ? `${calculatedAge} años` : '—'}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-1.5 text-center">
                  <span className="text-white/60 block text-[9px] uppercase">Categoría</span>
                  <span className="font-bold text-white truncate block">{selectedCategory?.name || 'Categoría'}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-1.5 text-center">
                  <span className="text-white/60 block text-[9px] uppercase">Color</span>
                  <span className="font-bold text-sky-300 truncate block">{colorBlockName}</span>
                </div>
              </div>

              {/* Barcode & Status Footer */}
              <div className="relative z-10 flex items-center justify-between pt-3 mt-2 border-t border-white/20 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Apto Médico OK</span>
                </div>
                <div className="font-mono tracking-widest text-[9px] opacity-75">
                  FRAOVIA-FED
                </div>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="w-full max-w-[280px] space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Fotos de Ejemplo:</span>
              <div className="flex items-center gap-2">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(url)}
                    className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-400 transition hover:scale-105"
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {photoUrl && photoUrl.trim() ? (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold ml-auto"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE PROFILE STUDIO (8 Cols) */}
          <div className="p-4 sm:p-6 lg:col-span-8 flex flex-col justify-between space-y-5">
            
            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('identidad')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'identidad'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. Identidad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deportivo')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'deportivo'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>2. Perfil Deportivo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('medico')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'medico'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>3. Ficha Médica</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tutor')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tutor'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>4. Tutor / Familia</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('arancel')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'arancel'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>5. Cuota & Arancel</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* TAB 1: IDENTIDAD */}
              {activeTab === 'identidad' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Nombre del Jugador *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Lucas"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Fernández"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        DNI (Identificador Único) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="48123456"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Fecha de Ingreso al Club *
                      </label>
                      <input
                        type="date"
                        required
                        value={joinedDate}
                        onChange={(e) => setJoinedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Desde este mes corren las cuotas a pagar.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Género Federativo
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Teléfono del Jugador
                      </label>
                      <input
                        type="text"
                        placeholder="+54 11 4567-8901"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Email de Contacto
                      </label>
                      <input
                        type="email"
                        placeholder="jugador@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PERFIL DEPORTIVO */}
              {activeTab === 'deportivo' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Disciplina Deportiva
                      </label>
                      <select
                        value={selectedDisciplineId}
                        onChange={(e) => setSelectedDisciplineId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {disciplines.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Categoría / División
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          const cat = categories.find(c => c.id === e.target.value);
                          if (cat?.colorBlockName) setColorBlockName(cat.colorBlockName);
                          if (cat?.monthlyFee) setMonthlyFee(cat.monthlyFee);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.gender})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Bloque de Color
                      </label>
                      <select
                        value={colorBlockName}
                        onChange={(e) => setColorBlockName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Bloque Blanco">Bloque Blanco</option>
                        <option value="Bloque Azul">Bloque Azul</option>
                        <option value="Bloque Rojo">Bloque Rojo</option>
                        <option value="Bloque Verde">Bloque Verde</option>
                        <option value="Bloque Negro">Bloque Negro</option>
                        <option value="Bloque Oro / Amarillo">Bloque Oro / Amarillo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Posición en Campo
                      </label>
                      <input
                        type="text"
                        placeholder="ej: Delantero Centro / Base"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Dorsal / Camiseta #
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        placeholder="10"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Pierna / Mano Hábil
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['diestro', 'zurdo', 'ambidiestro'] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => setDominantSide(side)}
                          className={`p-2 rounded-xl border text-xs font-semibold capitalize transition ${
                            dominantSide === side
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FICHA MÉDICA */}
              {activeTab === 'medico' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white block">Certificado Médico & Apto Físico</span>
                        <span className="text-[11px] text-emerald-300">Habilitación obligatoria para partidos y competencia federada</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Pendiente de pago
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Vencimiento del Apto
                      </label>
                      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 text-xs">
                        Se carga al cobrar la ficha médica
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Grupo Sanguíneo
                      </label>
                      <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="0+">0 Positivo (0+)</option>
                        <option value="0-">0 Negativo (0-)</option>
                        <option value="A+">A Positivo (A+)</option>
                        <option value="A-">A Negativo (A-)</option>
                        <option value="B+">B Positivo (B+)</option>
                        <option value="B-">B Negativo (B-)</option>
                        <option value="AB+">AB Positivo (AB+)</option>
                        <option value="AB-">AB Negativo (AB-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Obra Social / Cobertura
                      </label>
                      <input
                        type="text"
                        placeholder="OSDE, Swiss Medical, etc."
                        value={healthInsurance}
                        onChange={(e) => setHealthInsurance(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Alergias o Condiciones Médicas Especiales
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Indique si el deportista es asmático, alérgico a medicamentos o requiere atención especial..."
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: TUTOR / FAMILIA */}
              {activeTab === 'tutor' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-300 text-xs flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>Datos de contacto del tutor legal o familiar a cargo para avisos de cobranzas y emergencias.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Nombre y Apellido del Tutor
                      </label>
                      <input
                        type="text"
                        placeholder="ej: Carlos Pérez"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Vínculo / Parentesco
                      </label>
                      <select
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Madre">Madre</option>
                        <option value="Padre">Padre</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                        <option value="Abuelo/a">Abuelo / Abuela</option>
                        <option value="Otro">Otro Familiar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Teléfono de Urgencias / WhatsApp Directo
                    </label>
                    <input
                      type="text"
                      placeholder="+54 11 9876-5432"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: CUOTA & ARANCEL */}
              {activeTab === 'arancel' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Cuota Base Mensual ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Descuento / Beca Deportiva (%)
                      </label>
                      <select
                        value={scholarshipPercent}
                        onChange={(e) => setScholarshipPercent(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value={0}>Sin Beca (0% - Arancel Completo)</option>
                        <option value={25}>Hermano / Familiar (25% off)</option>
                        <option value={50}>Media Beca Deportiva (50% off)</option>
                        <option value={100}>Beca Completa / Federado (100% off)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold uppercase block">
                        Importe Mensual a Facturar al Jugador
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ${finalFee.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-300 font-bold px-3 py-1 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                      {scholarshipPercent > 0 ? `Beca ${scholarshipPercent}% Aplicada` : 'Arancel Regular'}
                    </span>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span>Paso activo:</span>
                  <span className="font-bold text-white capitalize">{activeTab}</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancelar
                  </button>

                  {activeTab !== 'arancel' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'identidad') setActiveTab('deportivo');
                        else if (activeTab === 'deportivo') setActiveTab('medico');
                        else if (activeTab === 'medico') setActiveTab('tutor');
                        else if (activeTab === 'tutor') setActiveTab('arancel');
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Siguiente Paso</span>
                      <span>→</span>
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSaving ? 'Guardando…' : 'Guardar Perfil de Deportista'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
};
