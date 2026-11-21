import React, { useState, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  Upload, 
  Image as ImageIcon, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Building2, 
  Sparkles,
  Camera,
  Trash2,
  Sliders
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';
import { FraoviaAppIcon } from '../BrandLogo';
import { dataActions } from '../../services/dataActions';
import { fileToCompressedDataUrl } from '../../utils/imageOptimizer';
import { useAppTheme } from '../../context/ThemeContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allClubs: Club[];
  currentClub: Club | null;
  onUserUpdated: (updatedUser: User) => void;
  onClubUpdated: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allClubs,
  currentClub,
  onUserUpdated,
  onClubUpdated
}) => {
  const { customAppIcon, setCustomAppIcon } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'appIcon' | 'clubLogo'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

  // Club Logo State
  const [selectedClubId, setSelectedClubId] = useState<string>(currentClub?.id || allClubs[0]?.id || '');
  const [clubLogoUrl, setClubLogoUrl] = useState<string>(
    allClubs.find(c => c.id === selectedClubId)?.logoUrl || ''
  );

  // App Icon Preview
  const [appIconPreview, setAppIconPreview] = useState<string | null>(customAppIcon);
  const [notification, setNotification] = useState<string | null>(null);

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);
  const clubLogoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file load into Data URL (Base64)
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    target: 'avatar' | 'appIcon' | 'clubLogo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    fileToCompressedDataUrl(file, target === 'avatar' ? 300 : 600)
      .then(dataUrl => {
        if (target === 'avatar') {
          setAvatarUrl(dataUrl);
        } else if (target === 'appIcon') {
          setAppIconPreview(dataUrl);
        } else if (target === 'clubLogo') {
          setClubLogoUrl(dataUrl);
        }
      })
      .catch(err => alert(err.message));
  };

  // Save User Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Solo se permite actualizar fullName, phone y avatarUrl (nombre, teléfono y avatar).
    // El rol, estado, alcance, email y club son inmutables por política RLS.
    const updatedUser: User = {
      ...currentUser,
      fullName: fullName.trim(),
      phone: phone.trim(),
      avatarUrl
    };

    onUserUpdated(updatedUser);
    setNotification('¡Perfil actualizado con éxito!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Save Start/App Icon
  const handleSaveAppIcon = () => {
    setCustomAppIcon(appIconPreview);
    setNotification('¡Ícono de inicio de FRAOVIA actualizado!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetAppIcon = () => {
    setAppIconPreview(null);
    setCustomAppIcon(null);
    setNotification('Ícono restaurado al diseño oficial de FRAOVIA.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Save Club Logo
  const handleSaveClubLogo = async () => {
    const club = allClubs.find(c => c.id === selectedClubId);
    if (!club) return;

    try {
      await dataActions.saveClubLogo(club, clubLogoUrl, currentUser);
    } catch (err: any) {
      alert(err.message || 'No se pudo guardar el escudo.');
      return;
    }

    setNotification(`¡Escudo de ${club.name} actualizado con éxito!`);
    setTimeout(() => setNotification(null), 3000);
    onClubUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {currentUser.role === 'SUPERADMIN' ? 'Perfil de Usuario & Gestor de Íconos' : 'Mi Perfil de Usuario'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser.role === 'SUPERADMIN' 
                  ? 'Personaliza tus datos, el ícono de inicio de FRAOVIA y los escudos de tus clubes.'
                  : 'Personaliza tu foto de perfil, nombre, teléfono y correo electrónico.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar - Only multi-tab if SUPERADMIN */}
        {currentUser.role === 'SUPERADMIN' && (
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('appIcon')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'appIcon'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ícono de Inicio FRAOVIA</span>
            </button>

            <button
              onClick={() => setActiveTab('clubLogo')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'clubLogo'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Íconos de Clubes</span>
            </button>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-2.5 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-slate-300">
          
          {/* TAB 1: MI PERFIL */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-blue-500/40 flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-blue-400">
                        {fullName.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => userFileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition shadow cursor-pointer"
                    title="Cargar foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">{fullName}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentClub?.name || 'FRAOVIA SaaS'}
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={userFileInputRef}
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => userFileInputRef.current?.click()}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline block pt-0.5 cursor-pointer"
                  >
                    Cargar foto desde mi equipo
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre Completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-400 font-medium">Correo Electrónico (Identificador)</label>
                    <span className="text-[10px] text-slate-500 font-mono">Inmutable (Gestionado por Auth)</span>
                  </div>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    readOnly
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 text-xs cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Por seguridad del sistema, el correo de inicio de sesión no puede ser modificado desde el perfil.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Teléfono / WhatsApp de Contacto</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Guardar Cambios de Perfil
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ÍCONO DE INICIO FRAOVIA */}
          {activeTab === 'appIcon' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Ícono Oficial de Inicio & Aplicación
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Carga cualquier imagen desde tu ordenador para usar como ícono de inicio de FRAOVIA.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <FraoviaAppIcon size={64} customIconUrl={appIconPreview} />
                </div>
              </div>

              {/* Upload controls */}
              <div className="p-5 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl text-center space-y-3 bg-slate-950/30 transition">
                <input
                  type="file"
                  ref={appIconInputRef}
                  onChange={(e) => handleFileChange(e, 'appIcon')}
                  accept="image/*"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => appIconInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    Seleccionar Imagen de Mi Equipo
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Soporta PNG, JPG, SVG, WebP (Se convertirá automáticamente al squircle oficial).
                  </p>
                </div>
              </div>

              {/* Preview sizes */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block text-xs">Vista previa en diferentes tamaños:</span>
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex flex-col items-center gap-1">
                    <FraoviaAppIcon size={32} customIconUrl={appIconPreview} />
                    <span className="text-[9px] text-slate-400">32px (Header)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FraoviaAppIcon size={48} customIconUrl={appIconPreview} />
                    <span className="text-[9px] text-slate-400">48px (Sidebar)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FraoviaAppIcon size={72} customIconUrl={appIconPreview} />
                    <span className="text-[9px] text-slate-400">72px (Login)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAppIcon}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  Aplicar Nuevo Ícono de Inicio
                </button>
                <button
                  type="button"
                  onClick={handleResetAppIcon}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  title="Restaurar ícono original"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restaurar Original</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ÍCONO / ESCUDO DE CADA CLUB */}
          {activeTab === 'clubLogo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Seleccionar Club para Asignar Ícono / Escudo:
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedClubId(cId);
                    const found = allClubs.find(c => c.id === cId);
                    if (found) setClubLogoUrl(found.logoUrl);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {allClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} ({club.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Club Preview & File Upload */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 flex items-center justify-center p-1.5 shadow-md">
                    {clubLogoUrl ? (
                      <img src={clubLogoUrl} alt="Club Escudo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {allClubs.find(c => c.id === selectedClubId)?.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Escudo oficial para reportes, carnets y membrete institucional.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => clubLogoInputRef.current?.click()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Cargar Imagen</span>
                </button>
                <input
                  type="file"
                  ref={clubLogoInputRef}
                  onChange={(e) => handleFileChange(e, 'clubLogo')}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">O pegar URL de imagen externa:</label>
                <input
                  type="url"
                  value={clubLogoUrl}
                  onChange={(e) => setClubLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveClubLogo}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Guardar Escudo del Club
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Cambios guardados localmente y vinculados al motor de persistencia de FRAOVIA.</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
