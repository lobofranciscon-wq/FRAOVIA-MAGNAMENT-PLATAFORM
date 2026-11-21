import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Calendar, 
  Phone, 
  Mail, 
  HeartPulse, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Camera, 
  Upload, 
  MessageCircle, 
  ShieldAlert, 
  Save, 
  Sparkles,
  Award,
  Table,
  Printer,
  CreditCard,
  QrCode,
  GraduationCap
} from 'lucide-react';
import { Player, Category, Discipline, Club, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { playerPhotoService } from '../../services/playerPhotoService';
import { useAppTheme } from '../../context/ThemeContext';
import { PlayerCarnetModal } from './PlayerCarnetModal';
import { compressAndConvertToWebP, formatBytes } from '../../utils/imageOptimizer';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  category?: Category;
  discipline?: Discipline;
  currentClub: Club;
  currentUser: User;
  onPlayerUpdated: (updatedPlayer: Player) => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'
];

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  player,
  category,
  discipline,
  currentClub,
  currentUser,
  onPlayerUpdated
}) => {
  const { theme } = useAppTheme();
  if (!isOpen || !player) return null;

  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [showPhotoEditor, setShowPhotoEditor] = useState<boolean>(false);
  const [customPhotoInput, setCustomPhotoInput] = useState<string>('');
  const [notes, setNotes] = useState<string>(player.medicalNotes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCarnetModalOpen, setIsCarnetModalOpen] = useState<boolean>(false);

  // Al mostrar la foto, generar URL firmada si es una ruta del bucket
  useEffect(() => {
    let isMounted = true;
    if (player.photoUrl) {
      playerPhotoService.getSignedUrl(player.photoUrl).then((url) => {
        if (isMounted) setPhotoUrl(url);
      });
    } else {
      setPhotoUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [player.photoUrl]);

  // Calculate age
  const calculateAge = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    const diff = Date.now() - new Date(birthDateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = calculateAge(player.birthDate);
  const isPaid = player.balance <= 0;

  const handleSavePhoto = async (filePathOrUrl: string) => {
    try {
      // Guardar la RUTA del archivo (club_id/uuid.ext) en la base de datos
      const updated = await dataActions.updatePlayerPhoto(player, filePathOrUrl, currentUser);
      setShowPhotoEditor(false);
      onPlayerUpdated(updated);
    } catch (e: any) {
      alert(e.message || 'Error al guardar foto');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Subida a Supabase Storage: bucket 'players', ruta {club_id}/{uuid}.{ext}
        const uploadResult = await playerPhotoService.uploadPlayerPhoto(currentClub.id, file);
        // Guardar estrictamente la RUTA en la base de datos (players.photo_url)
        handleSavePhoto(uploadResult.filePath);
        // Mostrar la URL firmada recién generada en la interfaz
        setPhotoUrl(uploadResult.signedUrl);
      } catch (err: any) {
        console.error('Error subiendo foto de jugador:', err);
        // Fallback local con compresión WebP
        try {
          const res = await compressAndConvertToWebP(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
          handleSavePhoto(res.dataUrl);
          setPhotoUrl(res.dataUrl);
        } catch {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            handleSavePhoto(result);
            setPhotoUrl(result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // WhatsApp link generator
  const tutorPhoneRaw = player.emergencyContact?.phone || player.phone;
  const cleanPhone = tutorPhoneRaw.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hola ${player.emergencyContact?.name || 'familia'}, le escribo desde el Club ${currentClub.name} respecto a ${player.firstName}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>

        {/* Modal Header with Player Highlight */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCarnetModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer backdrop-blur-sm border border-white/30 shadow-md"
              title="Abrir, editar e imprimir el carnet oficial del deportista"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>🪪 Carnet & Credencial</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            
            {/* Player Avatar / Photo with edit badge */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-slate-950 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt={`${player.firstName} ${player.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoEditor(!showPhotoEditor)}
                className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg border border-white cursor-pointer transition flex items-center justify-center"
                title="Cambiar foto del niño"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Basic Info & Category */}
            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  {category?.name || 'Categoría'}
                </span>
                <span className="text-xs text-emerald-200">
                  {discipline?.name || 'Deporte'}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  DNI: {player.dni}
                </span>
                {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-200 flex items-center gap-1">
                    🎓 BECADO ({player.scholarshipPercent}%)
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {player.firstName} {player.lastName}
              </h2>

              <p className="text-xs text-emerald-100 flex items-center justify-center sm:justify-start gap-2">
                <span>{age} años ({player.birthDate})</span>
                <span>·</span>
                <span>Ingreso: {player.joinedDate || '2024'}</span>
              </p>
            </div>

          </div>
        </div>

        {/* Photo Editor Popup Drawer */}
        {showPhotoEditor && (
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>Actualizar Foto de Perfil del Deportista</span>
              </span>
              <button 
                onClick={() => setShowPhotoEditor(false)} 
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Subir desde dispositivo:</label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 cursor-pointer font-bold">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar imagen...</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">O pegar URL de foto:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={() => customPhotoInput && handleSavePhoto(customPhotoInput)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">Fotos de muestra:</span>
              <div className="flex items-center gap-2">
                {SAMPLE_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    onClick={() => handleSavePhoto(url)}
                    alt="avatar"
                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">

          {/* CARTEL OFICIAL DEPORTISTA BECADO */}
          {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                    Cartel oficial · Deportista becado
                  </span>
                  <strong className="text-sm text-white block">
                    {player.scholarshipPercent === 100
                      ? 'Beca Completa (100% · Exento)'
                      : player.scholarshipPercent === 50
                        ? 'Media Beca (50%)'
                        : `Porcentaje especial (${player.scholarshipPercent}%)`}
                  </strong>
                  {player.scholarshipReason && (
                    <span className="text-[11px] text-amber-100/80 block">Motivo / resolución: {player.scholarshipReason}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-amber-200/80 block uppercase font-bold">Cuota mensual bonificada</span>
                <span className="text-lg font-black font-mono text-amber-300">
                  ${(player.monthlyFeeDue ?? 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}

          {/* ESTADO DE CUOTA / MENSUALIDAD (Requerimiento central del usuario) */}
          <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isPaid 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/40 border">
                  Estado Administrativo de Mensualidad
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isPaid ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white animate-pulse'
                }`}>
                  {isPaid ? '✓ Cuota al Día (Pagado)' : '⚠ Cuota Pendiente / Moroso'}
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {isPaid ? (
                  <span>El socio tiene sus cuotas sociales y aranceles deportivos al día.</span>
                ) : (
                  <span>Saldo adeudado: <strong className="text-rose-400 font-mono text-base">${player.balance.toLocaleString('es-AR')}</strong></span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Valor mensual de la categoría: ${player.monthlyFeeDue?.toLocaleString('es-AR') || '22.000'}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xs font-mono font-bold block ${isPaid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPaid ? 'Sin deuda pendiente' : `Mora: $${player.balance.toLocaleString('es-AR')}`}
              </span>
            </div>
          </div>

          {/* Historial Mes a Mes del Año (Como en la planilla Excel) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>Control de Cuotas Mensuales del Ciclo Lectivo</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span className="text-emerald-400 font-bold">P = Pagado</span> · 
                <span className="text-red-400 font-bold">A = Adeuda (Rojo)</span> · 
                <span className="text-slate-500">- = Falta (Transparente)</span>
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 text-center font-mono">
              {['FEB', 'MAR', 'ABRIL', 'MAYO', 'JUN', 'JUL', 'AGOS', 'SEPT', 'OCT', 'NOV', 'DIC'].map((m, idx) => {
                // Determine status
                let st: 'P' | 'A' | '-' = '-';
                if (player.monthlyPayments?.[m]) {
                  st = player.monthlyPayments[m];
                } else if (player.monthlyPayments) {
                  const prefix = m.substring(0, 3).toUpperCase();
                  const found = Object.keys(player.monthlyPayments).find(k => k.substring(0, 3).toUpperCase() === prefix);
                  if (found) st = player.monthlyPayments[found];
                } else {
                  // Dynamic fallback
                  const fee = player.monthlyFeeDue || 22000;
                  const debt = Math.max(0, player.balance || 0);
                  const unpaidCount = debt > 0 ? Math.max(1, Math.round(debt / fee)) : 0;
                  const elapsedMonths = Math.max(5, unpaidCount + 3);
                  if (idx >= elapsedMonths) {
                    st = '-';
                  } else if (idx >= elapsedMonths - unpaidCount && idx < elapsedMonths) {
                    st = 'A';
                  } else {
                    st = 'P';
                  }
                }

                const isP = st === 'P';
                const isA = st === 'A';

                return (
                  <div key={m} className={`p-1.5 rounded-xl border flex flex-col items-center justify-center ${
                    isP ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                    isA ? 'bg-red-950/40 border-red-500/70 text-red-200 shadow-sm shadow-red-950/40' :
                    'bg-transparent border-slate-800/80 text-slate-500'
                  }`}>
                    <span className={`text-[9px] uppercase font-bold ${isA ? 'text-red-300' : isP ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {m.substring(0, 3)}
                    </span>
                    {isP && (
                      <span className="w-4 h-4 rounded bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center mt-1 shadow-xs">
                        P
                      </span>
                    )}
                    {isA && (
                      <span className="w-4 h-4 rounded bg-red-600 text-white font-black text-[10px] flex items-center justify-center mt-1 shadow-xs animate-pulse">
                        A
                      </span>
                    )}
                    {!isP && !isA && (
                      <span className="text-slate-600 text-[10px] mt-1 font-mono">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Contact & Family Info */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  Contacto & Familia
                </h4>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Teléfono deportista:</span>
                  <span className="font-mono font-bold text-white">{player.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300 truncate max-w-[160px]">{player.email || 'No registrado'}</span>
                </div>

                {player.emergencyContact && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Contacto de Emergencia / Tutor:</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{player.emergencyContact.name} ({player.emergencyContact.relationship})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-mono">{player.emergencyContact.phone}</span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp Tutor</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Info & Sports Details */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  Salud & Ficha Médica
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  player.medicalCertificateValid
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {player.medicalCertificateValid ? 'Apto Vigente' : 'Apto Vencido'}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vencimiento Apto:</span>
                  <span className="font-mono font-bold text-white">{player.medicalExpiryDate || 'No informado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Grupo Sanguíneo:</span>
                  <span className="font-mono font-bold text-rose-300">{player.bloodType || '0+'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Obra Social / Cobertura:</span>
                  <span className="font-bold text-slate-300">{player.healthInsurance || 'OSDE / En regla'}</span>
                </div>
                {player.position && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Posición en cancha:</span>
                    <span className="font-bold text-sky-400">{player.position}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SECCIÓN CARNET / CREDENCIAL OFICIAL (Requerimiento: editar e imprimir carnet) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Carnet Digital & Credencial Oficial
                  </h4>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    PVC 85.6×54mm
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Credencial oficial con foto, DNI, escudo de agua, código QR de acceso y dorso con ficha médica.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCarnetModalOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Diseñar & Editar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCarnetModalOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Observations / Coach Notes */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 block">
              Observaciones del Cuerpo Técnico:
            </label>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
              {player.medicalNotes || 'Deportista con asistencia regular a entrenamientos. Sin lesiones recientes.'}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="text-[11px] text-slate-400">
            Ficha oficial FRAOVIA · ID: <span className="font-mono text-slate-300">{player.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>

      {/* Modal Editor e Impresor de Carnet */}
      {isCarnetModalOpen && (
        <PlayerCarnetModal
          isOpen={isCarnetModalOpen}
          onClose={() => setIsCarnetModalOpen(false)}
          player={player}
          category={category}
          discipline={discipline}
          currentClub={currentClub}
          currentUser={currentUser}
          onPlayerUpdated={onPlayerUpdated}
        />
      )}
    </div>
  );
};
