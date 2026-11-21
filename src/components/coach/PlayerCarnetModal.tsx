import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Palette, 
  RotateCw, 
  Sparkles, 
  Sliders, 
  Upload, 
  Shield, 
  QrCode, 
  Check, 
  Download, 
  Award, 
  HeartPulse, 
  Phone, 
  User as UserIcon, 
  Camera,
  Layers,
  FileText
} from 'lucide-react';
import { Player, Category, Discipline, Club, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { playerPhotoService } from '../../services/playerPhotoService';
import { compressAndConvertToWebP, formatBytes } from '../../utils/imageOptimizer';

export interface CarnetCustomization {
  templateStyle: 'elite' | 'gold' | 'clasico' | 'neon' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  clubHeaderTitle: string;
  clubHeaderSubtitle: string;
  seasonYear: string;
  photoShape: 'circle' | 'squircle' | 'rect';
  photoScale: number; // 0.8 to 1.3
  watermarkOpacity: number; // 0.05 to 0.5
  showAptoBadge: boolean;
  showPaidBadge: boolean;
  showQrCode: boolean;
  showBloodType: boolean;
  showSignature: boolean;
  disclaimerText: string;
  customShieldUrl?: string;
  customPhotoUrl?: string;
}

const DEFAULT_CARNET_CONFIG: CarnetCustomization = {
  templateStyle: 'elite',
  primaryColor: '#0072FF',
  secondaryColor: '#00E5FF',
  backgroundColor: '#0B1528',
  textColor: '#FFFFFF',
  clubHeaderTitle: '',
  clubHeaderSubtitle: 'ASOCIACIÓN CIVIL DEPORTIVA · SOCIO OFICIAL',
  seasonYear: '2026',
  photoShape: 'squircle',
  photoScale: 1.0,
  watermarkOpacity: 0.15,
  showAptoBadge: true,
  showPaidBadge: true,
  showQrCode: true,
  showBloodType: true,
  showSignature: true,
  disclaimerText: 'Este carnet es personal e intransferible. Válido para ingreso a predios deportivos, canchas y torneos federados oficiales.'
};

const TEMPLATE_PRESETS: { id: CarnetCustomization['templateStyle']; name: string; desc: string; primary: string; secondary: string; bg: string }[] = [
  { id: 'elite', name: 'Élite Deportivo Pro', desc: 'Gradientes modernos y estética aerodinámica oficial', primary: '#0072FF', secondary: '#00E5FF', bg: '#071126' },
  { id: 'gold', name: 'Campeón Gold VIP', desc: 'Negro titanio y detalles dorados para torneos de prestigio', primary: '#F59E0B', secondary: '#D97706', bg: '#0F172A' },
  { id: 'clasico', name: 'Clásico AFA Tradicional', desc: 'Estilo credencial tradicional con franja institucional', primary: '#1E3A8A', secondary: '#DC2626', bg: '#FFFFFF' },
  { id: 'neon', name: 'Neón Cyber Sport', desc: 'Contrastes oscuros de alto impacto y bordes brillantes', primary: '#8B5CF6', secondary: '#06B6D4', bg: '#090D16' },
  { id: 'minimal', name: 'Minimalista Blanco Apple', desc: 'Limpio, sobrio y elegante para imprimir en cualquier impresora', primary: '#0F172A', secondary: '#3B82F6', bg: '#F8FAFC' }
];

interface PlayerCarnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  category?: Category;
  discipline?: Discipline;
  currentClub: Club;
  currentUser: User;
  onPlayerUpdated?: (updatedPlayer: Player) => void;
}

export const PlayerCarnetModal: React.FC<PlayerCarnetModalProps> = ({
  isOpen,
  onClose,
  player,
  category,
  discipline,
  currentClub,
  currentUser,
  onPlayerUpdated
}) => {
  if (!isOpen) return null;

  // Local state for carnet config
  const initialHeader = currentClub.name.toUpperCase();
  const [config, setConfig] = useState<CarnetCustomization>(() => {
    // Try to load saved config from club or default
    const saved = (currentClub.branding as any)?.carnetConfig;
    return saved ? { ...DEFAULT_CARNET_CONFIG, ...saved, clubHeaderTitle: saved.clubHeaderTitle || initialHeader } : {
      ...DEFAULT_CARNET_CONFIG,
      clubHeaderTitle: initialHeader,
      primaryColor: currentClub.branding.primaryColor || '#0072FF',
      secondaryColor: currentClub.branding.secondaryColor || '#00E5FF'
    };
  });

  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [activeTab, setActiveTab] = useState<'preview' | 'design' | 'texts' | 'print'>('design');
  const [webpNotice, setWebpNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [resolvedPlayerPhoto, setResolvedPlayerPhoto] = useState<string>('');

  // Generar URL firmada al mostrar la foto si es una ruta del bucket
  useEffect(() => {
    let isMounted = true;
    if (player.photoUrl) {
      playerPhotoService.getSignedUrl(player.photoUrl).then((url) => {
        if (isMounted) setResolvedPlayerPhoto(url);
      });
    } else {
      setResolvedPlayerPhoto('');
    }
    return () => {
      isMounted = false;
    };
  }, [player.photoUrl]);

  // Player details
  const photo = config.customPhotoUrl || resolvedPlayerPhoto || currentClub.logoUrl || '';
  const shield = config.customShieldUrl || currentClub.branding?.badgeUrl || currentClub.logoUrl || '';
  const isPaid = player.balance <= 0;
  const carnetNumber = `SOC-${player.dni.slice(-5) || '10293'}`;

  // Age calculation
  const calculateAge = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    const diff = Date.now() - new Date(birthDateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };
  const age = calculateAge(player.birthDate);

  // Handle image upload with auto-WebP compression
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'photo' | 'shield') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (target === 'photo') {
        // Subida oficial a Supabase Storage en bucket 'players' ruta {club_id}/{uuid}.{ext}
        try {
          const uploadRes = await playerPhotoService.uploadPlayerPhoto(currentClub.id, file);
          // Guardar estrictamente la RUTA en el jugador
          await dataActions.updatePlayerPhoto(player, uploadRes.filePath, currentUser);
          // Mostrar de inmediato la URL firmada
          setConfig(prev => ({ ...prev, customPhotoUrl: uploadRes.signedUrl }));
        } catch (uploadErr: any) {
          if (isSupabaseConfigured()) {
            // Con base de datos real no se guardan fotos en base64: se informa el error real.
            throw uploadErr;
          }
          const res = await compressAndConvertToWebP(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
          await dataActions.updatePlayerPhoto(player, res.dataUrl, currentUser);
          setConfig(prev => ({ ...prev, customPhotoUrl: res.dataUrl }));
        }
      } else {
        const res = await compressAndConvertToWebP(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        setConfig(prev => ({ ...prev, customShieldUrl: res.dataUrl }));
      }
      setWebpNotice(`⚡ Imagen procesada y cargada exitosamente`);
      setTimeout(() => setWebpNotice(null), 4000);
    } catch (err: any) {
      alert('Error al procesar imagen: ' + err.message);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (p: typeof TEMPLATE_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      templateStyle: p.id,
      primaryColor: p.primary,
      secondaryColor: p.secondary,
      backgroundColor: p.bg,
      textColor: p.bg === '#FFFFFF' || p.bg === '#F8FAFC' ? '#0F172A' : '#FFFFFF'
    }));
  };

  // Save config for the entire club
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await dataActions.saveCarnetConfig(currentClub, config, currentUser);
      setWebpNotice('¡Diseño del carnet guardado exitosamente como plantilla del club!');
      setTimeout(() => setWebpNotice(null), 3000);
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Render the Front of the Carnet
  const renderFrontCard = () => {
    const isLightTemplate = config.backgroundColor === '#FFFFFF' || config.backgroundColor === '#F8FAFC';
    const textColor = isLightTemplate ? '#0F172A' : '#FFFFFF';
    const subtextColor = isLightTemplate ? '#475569' : '#94A3B8';
    const cardBorder = config.templateStyle === 'gold' 
      ? 'border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]' 
      : config.templateStyle === 'neon' 
      ? 'border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]' 
      : 'border border-white/20 shadow-2xl';

    return (
      <div 
        className={`relative w-[340px] h-[214px] sm:w-[380px] sm:h-[240px] rounded-2xl overflow-hidden ${cardBorder} select-none transition-all print:shadow-none print:border-slate-800`}
        style={{
          backgroundColor: config.backgroundColor,
          color: textColor,
          background: config.templateStyle === 'elite'
            ? `linear-gradient(135deg, ${config.backgroundColor} 0%, #030712 100%)`
            : config.templateStyle === 'gold'
            ? `linear-gradient(135deg, #1E1B18 0%, #0B0907 100%)`
            : config.backgroundColor
        }}
      >
        {/* Background Watermark Shield */}
        {shield && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
            style={{ opacity: config.watermarkOpacity }}
          >
            <img 
              src={shield} 
              alt="Marca de agua" 
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain filter grayscale contrast-125" 
            />
          </div>
        )}

        {/* Top Header Bar */}
        <div 
          className="relative px-3.5 py-2 flex items-center justify-between border-b border-white/10"
          style={{
            background: `linear-gradient(90deg, ${config.primaryColor}E6 0%, ${config.secondaryColor}CC 100%)`
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {shield ? (
              <img src={shield} alt="Escudo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-md shrink-0 rounded-full bg-white/10 p-0.5" />
            ) : (
              <Shield className="w-7 h-7 text-white drop-shadow-md shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase truncate drop-shadow-sm">
                {config.clubHeaderTitle || currentClub.name}
              </h3>
              <p className="text-[8px] sm:text-[9px] text-white/80 uppercase tracking-widest truncate font-medium">
                {config.clubHeaderSubtitle}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 pl-1">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-black/30 text-white border border-white/20">
              {config.seasonYear}
            </span>
          </div>
        </div>

        {/* Body Layout: Photo + Info */}
        <div className="relative p-3 sm:p-3.5 flex items-center gap-3 sm:gap-4 h-[calc(100%-48px)]">
          {/* Photo Column */}
          <div className="flex flex-col items-center shrink-0">
            <div 
              className={`relative overflow-hidden border-2 shadow-lg bg-black/40 flex items-center justify-center ${
                config.photoShape === 'circle' ? 'rounded-full w-20 h-20 sm:w-24 sm:h-24' :
                config.photoShape === 'squircle' ? 'rounded-2xl w-20 h-20 sm:w-24 sm:h-24' :
                'rounded-lg w-20 h-24 sm:w-24 sm:h-28'
              }`}
              style={{
                borderColor: config.secondaryColor,
                transform: `scale(${config.photoScale})`
              }}
            >
              {photo ? (
                <img src={photo} alt={player.firstName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-white/50" />
              )}
            </div>

            <span className="mt-1 text-[8px] sm:text-[9px] font-mono font-bold text-white/70 tracking-wider">
              {carnetNumber}
            </span>
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div>
              {/* Full Name */}
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight uppercase truncate" style={{ color: textColor }}>
                {player.lastName}, {player.firstName}
              </h2>
              
              {/* Category & Discipline */}
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span 
                  className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-md uppercase"
                  style={{ backgroundColor: `${config.primaryColor}30`, color: config.secondaryColor, border: `1px solid ${config.secondaryColor}40` }}
                >
                  {category?.name || 'Categoría Juvenil'}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: subtextColor }}>
                  {discipline?.name || 'Fútbol'}
                </span>
              </div>

              {/* DNI & Age */}
              <div className="mt-1.5 space-y-0.5 text-[9px] sm:text-[10px]">
                <div className="flex items-center justify-between">
                  <span style={{ color: subtextColor }}>DNI:</span>
                  <span className="font-mono font-extrabold" style={{ color: textColor }}>{player.dni}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: subtextColor }}>Edad:</span>
                  <span className="font-semibold" style={{ color: textColor }}>{age} años ({player.birthDate || '2010'})</span>
                </div>
                {config.showBloodType && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: subtextColor }}>Grupo Sanguíneo:</span>
                    <span className="font-mono font-bold text-rose-400">{player.bloodType || '0+'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges Bar (Apto Médico, Al día) */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1">
                {config.showAptoBadge && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                    player.medicalCertificateValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    <HeartPulse className="w-2.5 h-2.5" />
                    <span>{player.medicalCertificateValid ? 'APTO VIGENTE' : 'APTO VENCIDO'}</span>
                  </span>
                )}
                {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-700/60 shadow-sm">
                    🎓 BECADO {player.scholarshipPercent === 100 ? '100%' : `${player.scholarshipPercent}%`}
                  </span>
                )}
                {config.showPaidBadge && isPaid && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    AL DÍA
                  </span>
                )}
              </div>

              {/* Mini QR preview */}
              {config.showQrCode && (
                <div className="w-7 h-7 bg-white p-0.5 rounded shadow-sm shrink-0 flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Hologram Strip at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{
            background: `repeating-linear-gradient(45deg, ${config.primaryColor}, ${config.primaryColor} 10px, ${config.secondaryColor} 10px, ${config.secondaryColor} 20px)`
          }}
        />
      </div>
    );
  };

  // Render the Back of the Carnet
  const renderBackCard = () => {
    const isLightTemplate = config.backgroundColor === '#FFFFFF' || config.backgroundColor === '#F8FAFC';
    const textColor = isLightTemplate ? '#0F172A' : '#FFFFFF';
    const subtextColor = isLightTemplate ? '#475569' : '#94A3B8';
    const cardBorder = config.templateStyle === 'gold' 
      ? 'border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]' 
      : config.templateStyle === 'neon' 
      ? 'border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]' 
      : 'border border-white/20 shadow-2xl';

    return (
      <div 
        className={`relative w-[340px] h-[214px] sm:w-[380px] sm:h-[240px] rounded-2xl overflow-hidden ${cardBorder} select-none transition-all p-3 sm:p-4 flex flex-col justify-between print:shadow-none print:border-slate-800`}
        style={{
          backgroundColor: config.backgroundColor,
          color: textColor,
          background: config.templateStyle === 'elite'
            ? `linear-gradient(135deg, ${config.backgroundColor} 0%, #030712 100%)`
            : config.templateStyle === 'gold'
            ? `linear-gradient(135deg, #1E1B18 0%, #0B0907 100%)`
            : config.backgroundColor
        }}
      >
        {/* Top Magnetic Strip Simulation */}
        <div className="w-full h-7 bg-slate-950/90 rounded-md border border-slate-800 flex items-center justify-between px-3 mb-2">
          <span className="text-[8px] font-mono text-slate-400 tracking-widest uppercase">BANDA MAGNÉTICA / ACCESO DIGITAL</span>
          <span className="text-[8px] font-mono text-emerald-400 font-bold">{carnetNumber}-2026</span>
        </div>

        {/* Emergency & Medical Info */}
        <div className="space-y-1.5 text-[9px] sm:text-[10px]">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-400 block">
              En Caso de Emergencia / Accidente:
            </span>
            <div className="flex items-center justify-between">
              <span style={{ color: subtextColor }}>Tutor / Contacto:</span>
              <span className="font-bold" style={{ color: textColor }}>
                {player.emergencyContact?.name || 'Tutor Responsable'} ({player.emergencyContact?.relationship || 'Familiar'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: subtextColor }}>Teléfono Urgencias:</span>
              <span className="font-mono font-extrabold text-emerald-400">
                {player.emergencyContact?.phone || player.phone || 'No registrado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: subtextColor }}>Cobertura Médica:</span>
              <span className="font-medium" style={{ color: textColor }}>
                {player.healthInsurance || 'OSDE / Obra Social'}
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer Text */}
        <p className="text-[7.5px] sm:text-[8px] text-justify leading-tight" style={{ color: subtextColor }}>
          {config.disclaimerText}
        </p>

        {/* Signature & Barcode Area */}
        <div className="flex items-end justify-between pt-1 border-t border-white/10">
          {/* Barcode representation */}
          <div className="space-y-0.5">
            <div className="h-5 flex items-center gap-0.5">
              {[4, 2, 5, 2, 6, 3, 2, 5, 3, 4, 2, 5, 2, 6, 3, 4].map((w, idx) => (
                <span 
                  key={idx} 
                  className="h-full bg-current opacity-80 inline-block" 
                  style={{ width: `${w}px` }} 
                />
              ))}
            </div>
            <span className="text-[7px] font-mono block text-center opacity-60">
              *{player.dni}*
            </span>
          </div>

          {/* Secretary Signature */}
          {config.showSignature && (
            <div className="text-center">
              <div className="w-24 border-b border-white/40 pb-0.5">
                <span className="text-[10px] font-serif italic opacity-75 font-bold">Fraovia Club</span>
              </div>
              <span className="text-[7.5px] uppercase font-bold tracking-wider block mt-0.5" style={{ color: subtextColor }}>
                Secretaría de Actas
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      
      {/* Modal Container */}
      <div className="bg-[#0B1528] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Editor & Impresión de Carnet de Socio / Jugador
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  {player.firstName} {player.lastName}
                </span>
                {player.scholarshipPercent !== undefined && player.scholarshipPercent > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    🎓 BECADO {player.scholarshipPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Personaliza diseño, escudo, colores y genera credenciales en formato estándar PVC con impresión en 1 clic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-600/20"
              title="Imprimir carnet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Carnet</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {webpNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 p-2 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{webpNotice}</span>
          </div>
        )}

        {/* Main Content: Left Live Preview, Right Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* LEFT: Live Preview Canvas (5 cols on large) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-950/60 flex flex-col items-center justify-center space-y-4">
            
            {/* View Switcher: Frente / Dorso / Ambos */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSide('front')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeSide === 'front' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Frente (Anverso)
              </button>
              <button
                onClick={() => setActiveSide('back')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeSide === 'back' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dorso (Reverso)
              </button>
              <button
                onClick={() => setActiveSide('both')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeSide === 'both' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lado a Lado (Impresión)
              </button>
            </div>

            {/* Printable Preview Container */}
            <div ref={printAreaRef} id="carnet-print-area" className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              {(activeSide === 'front' || activeSide === 'both') && (
                <div className="flex flex-col items-center gap-1">
                  {renderFrontCard()}
                  <span className="text-[10px] text-slate-500 font-mono">Frente · Tamaño PVC (85.6 × 54 mm)</span>
                </div>
              )}

              {(activeSide === 'back' || activeSide === 'both') && (
                <div className="flex flex-col items-center gap-1">
                  {renderBackCard()}
                  <span className="text-[10px] text-slate-500 font-mono">Dorso · Tamaño PVC (85.6 × 54 mm)</span>
                </div>
              )}
            </div>

            {/* Quick action buttons under preview */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Girar Carnet</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Credencial</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Customization Controls (7 cols on large) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-900/50">
            {/* Nav tabs for editor */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTab('design')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'design' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>1. Estilo & Colores</span>
              </button>
              <button
                onClick={() => setActiveTab('texts')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'texts' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Textos & Escudo</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'print' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>3. Config. Impresión</span>
              </button>
            </div>

            {/* Tab 1: Design & Colors */}
            {activeTab === 'design' && (
              <div className="p-5 space-y-5 text-xs text-slate-300 overflow-y-auto max-h-[60vh]">
                {/* Presets */}
                <div>
                  <label className="block text-slate-400 mb-2 font-bold uppercase tracking-wider text-[10px]">
                    Elige una Plantilla Visual Pre-diseñada:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TEMPLATE_PRESETS.map((p) => {
                      const isSelected = config.templateStyle === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPreset(p)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-white text-xs">{p.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.primary }} />
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.secondary }} />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Colors customizer */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Colores a Medida del Carnet:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Color Principal:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                        />
                        <span className="font-mono text-[11px] uppercase text-white">{config.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Color Secundario:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.secondaryColor}
                          onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                        />
                        <span className="font-mono text-[11px] uppercase text-white">{config.secondaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Fondo de Tarjeta:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                        />
                        <span className="font-mono text-[11px] uppercase text-white">{config.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo settings */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Formato y Escala de la Foto:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5">Forma de la foto:</label>
                      <div className="flex items-center gap-1.5">
                        {[
                          { id: 'squircle', label: 'Squircle' },
                          { id: 'circle', label: 'Circular' },
                          { id: 'rect', label: 'Rectangular' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setConfig({ ...config, photoShape: s.id as any })}
                            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer ${
                              config.photoShape === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">Escala / Tamaño de foto:</label>
                        <span className="font-mono text-[10px] text-blue-400 font-bold">{Math.round(config.photoScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.2"
                        step="0.05"
                        value={config.photoScale}
                        onChange={(e) => setConfig({ ...config, photoScale: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Watermark opacity */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Transparencia del Escudo de Fondo:
                    </span>
                    <span className="font-mono text-[10px] text-blue-400 font-bold">
                      {Math.round(config.watermarkOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.02"
                    value={config.watermarkOpacity}
                    onChange={(e) => setConfig({ ...config, watermarkOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Texts & Uploads */}
            {activeTab === 'texts' && (
              <div className="p-5 space-y-4 text-xs text-slate-300 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre del Club en el Carnet:</label>
                  <input
                    type="text"
                    value={config.clubHeaderTitle}
                    onChange={(e) => setConfig({ ...config, clubHeaderTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    placeholder={currentClub.name}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subtítulo / Lema Institucional:</label>
                  <input
                    type="text"
                    value={config.clubHeaderSubtitle}
                    onChange={(e) => setConfig({ ...config, clubHeaderSubtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Temporada / Año:</label>
                  <input
                    type="text"
                    value={config.seasonYear}
                    onChange={(e) => setConfig({ ...config, seasonYear: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Texto de Términos al Dorso:</label>
                  <textarea
                    rows={3}
                    value={config.disclaimerText}
                    onChange={(e) => setConfig({ ...config, disclaimerText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-[11px]"
                  />
                </div>

                {/* WebP Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cambiar Foto del Socio:</span>
                    </label>
                    <label className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-500/40 hover:bg-blue-500/10 text-blue-400 font-bold text-center block cursor-pointer text-xs">
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      <span>Subir foto (Auto-WebP)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'photo')} className="hidden" />
                    </label>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cambiar Escudo / Logo:</span>
                    </label>
                    <label className="w-full py-2 px-3 rounded-xl border border-dashed border-amber-500/40 hover:bg-amber-500/10 text-amber-400 font-bold text-center block cursor-pointer text-xs">
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      <span>Subir escudo (Auto-WebP)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'shield')} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Elementos Visibles:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showAptoBadge}
                        onChange={(e) => setConfig({ ...config, showAptoBadge: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span>Insignia Apto Médico</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showPaidBadge}
                        onChange={(e) => setConfig({ ...config, showPaidBadge: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span>Insignia Cuota al Día</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showQrCode}
                        onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span>Código QR Escaneable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showSignature}
                        onChange={(e) => setConfig({ ...config, showSignature: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span>Firma de Secretaría</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Print Guide */}
            {activeTab === 'print' && (
              <div className="p-5 space-y-4 text-xs text-slate-300 overflow-y-auto max-h-[60vh]">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                    <Printer className="w-4 h-4" />
                    <span>Instrucciones de Impresión en Tamaño Real (PVC 85.6 × 54 mm)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Al presionar <strong>"Imprimir Carnet"</strong>, se abrirá la ventana de impresión de tu navegador configurada para que no aparezca ningún elemento extra de la pantalla.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                    <li>Selecciona en tu impresora <strong>Escala: 100% (o Tamaño Real)</strong>.</li>
                    <li>Activa la casilla <strong>"Gráficos en segundo plano" (Background graphics)</strong> para que salgan todos los colores y fondos intactos.</li>
                    <li>Puedes imprimir en papel fotográfico, hoja A4 para plastificar en pouches estándar de carnet o directamente en impresora térmica de tarjetas PVC (ej. Fargo, Zebra, Evolis).</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setActiveSide('both');
                      setTimeout(handlePrint, 300);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Frente y Dorso (A4)</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSide('front');
                      setTimeout(handlePrint, 300);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Imprimir Solo Frente</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Actions of Editor */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs mt-auto">
              <span className="text-[11px] text-slate-400">
                Plantilla lista para asociar a todos los socios del club.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Plantilla en Club'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #carnet-print-area, #carnet-print-area * {
            visibility: visible !important;
          }
          #carnet-print-area {
            position: fixed !important;
            left: 50% !important;
            top: 20% !important;
            transform: translate(-50%, -20%) !important;
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
            background: white !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
