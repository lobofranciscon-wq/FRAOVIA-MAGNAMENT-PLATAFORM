import React, { useState } from 'react';
import { BrandLogo, FraoviaSymbol } from './BrandLogo';
import { Club, Season, User, UserRole } from '../types/fraovia';
import { 
  ShieldCheck, 
  ChevronDown, 
  Calendar, 
  Eye, 
  ArrowLeft,
  Sliders, 
  Menu, 
  X, 
  Search, 
  Bell, 
  LogOut, 
  Sparkles,
  Sun,
  Moon,
  Palette,
  User as UserIcon,
  Image as ImageIcon,
  Clock,
  CreditCard,
  Wallet,
  EyeOff
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentUser: User;
  currentClub: Club | null;
  currentSeason: Season | null;
  allUsers: User[];
  allClubs: Club[];
  onSwitchUser: (user: User) => void;
  onExitSupervision: () => void;
  isSupervising: boolean;
  onOpenMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onLogout: () => void;
  onOpenParentPortal: () => void;
  onOpenProfileModal: () => void;
  onOpenCanvaDesigner?: () => void;
  onOpenClubEditor?: () => void;
  onOpenFeeReminderModal?: () => void;
  onOpenNewReceiptModal?: () => void;
  onOpenModuleVisibility?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentClub,
  currentSeason,
  allUsers,
  allClubs,
  onSwitchUser,
  onExitSupervision,
  isSupervising,
  onOpenMobileMenu,
  isMobileMenuOpen,
  onLogout,
  onOpenParentPortal,
  onOpenProfileModal,
  onOpenClubEditor,
  onOpenFeeReminderModal,
  onOpenNewReceiptModal,
  onOpenModuleVisibility
}) => {
  const { theme, toggleTheme } = useAppTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header 
      className="sticky top-0 z-30 w-full border-b select-none backdrop-blur-md"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(7, 13, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#16233E' : '#E2E8F0'
      }}
    >
      {/* Superadmin GHOST MODE Banner - ONLY visible to Superadmin */}
      {isSupervising && currentClub && currentUser.role === 'SUPERADMIN' && (
        <div 
          className="px-4 py-1.5 flex items-center justify-between text-xs font-medium text-white shadow-inner bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-500/40"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
              🕶️ MODO SIGILOSO ACTIVO
            </span>
            <span className="text-slate-200 text-xs">
              Explorando <strong>{currentClub.name}</strong>. Acceso 100% invisible: los administradores del club no ven tu presencia ni se generan registros en su bitácora.
            </span>
          </div>
          <button
            onClick={onExitSupervision}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-xl text-xs transition cursor-pointer font-bold shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a SaaS Superadmin</span>
          </button>
        </div>
      )}

      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile trigger & Search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button 
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#0C162D] transition"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo size="md" showTagline={true} className="flex shrink-0" />
            {currentClub && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700/60 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-bold text-slate-300 truncate max-w-[150px]">{currentClub.name}</span>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border w-full max-w-xs transition focus-within:border-blue-500"
            style={{
              backgroundColor: theme === 'dark' ? '#0A1224' : '#F1F5F9',
              borderColor: theme === 'dark' ? '#1A294A' : '#CBD5E1'
            }}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar socios, comprobantes..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Actions, Theme Toggle, Editar Club, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
            }`}
            title={theme === 'dark' ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
            aria-label="Alternar tema claro/oscuro"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* QUICK COBRAR CUOTA / REGISTRAR PAGO BUTTON (Fácil de encontrar) */}
          {currentClub && onOpenNewReceiptModal && (currentUser.role === 'ADMINISTRACIÓN' || currentUser.role === 'DUEÑO' || currentUser.role === 'GENERAL') && (
            <button
              onClick={onOpenNewReceiptModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer shadow-md shadow-emerald-600/25 font-bold"
              title="Registrar cobranza, emitir recibo oficial o cobrar cuota"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>💵 Cobrar Cuota</span>
            </button>
          )}

          {/* EDITAR CLUB BUTTON (PROFESIONAL) - EXCLUSIVO SUPERADMIN DENTRO DE CLUB */}
          {currentClub && currentUser.role === 'SUPERADMIN' && onOpenClubEditor && (
            <button
              onClick={onOpenClubEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 transition cursor-pointer shadow-md shadow-sky-600/20 font-bold"
              title="Editar colores, fuentes, fondos y diseño del club actual"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar Club</span>
            </button>
          )}

          {/* Automated Fee Reminder Button (Administración, Dueño dentro de club) */}
          {currentClub && (currentUser.role === 'ADMINISTRACIÓN' || currentUser.role === 'DUEÑO') && onOpenFeeReminderModal && currentClub.activeModules?.feeReminders !== false && (
            <button
              onClick={onOpenFeeReminderModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-amber-300 bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 transition cursor-pointer"
              title="Avisos automatizados de cuotas y vencimiento de saldos al inicio de mes"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span className="hidden sm:inline font-bold">Avisos de Cuotas</span>
            </button>
          )}

          {/* Parent portal shortcut (condicional a módulo activo: oculto por defecto per request) */}
          {currentClub?.activeModules?.portalFamilias === true && (
            <button
              onClick={onOpenParentPortal}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Familias</span>
            </button>
          )}

          {/* Notification Bell */}
          <button 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#0C162D] transition relative"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5 ring-2 ring-[#070D1E]" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer shadow-sm text-left"
              style={{
                backgroundColor: theme === 'dark' ? '#0C162D' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#1E2C4F' : '#E2E8F0'
              }}
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0072FF 0%, #0056E0 100%)'
                }}
              >
                {currentUser.avatarUrl && currentUser.avatarUrl.trim() ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-blue-400 font-medium">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 border"
                style={{
                  backgroundColor: theme === 'dark' ? '#0C162D' : '#FFFFFF',
                  borderColor: theme === 'dark' ? '#1E2C4F' : '#E2E8F0'
                }}
              >
                {/* Profile & Designer shortcuts inside dropdown */}
                <div className="px-3 pb-2 border-b border-[#16233E]/60 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfileModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-blue-600/20 transition cursor-pointer text-left"
                  >
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    <span>Editar Mi Perfil & Cargar Íconos</span>
                  </button>

                  {currentClub && onOpenClubEditor && currentUser.role === 'SUPERADMIN' && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenClubEditor();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white hover:bg-sky-600/20 transition cursor-pointer text-left"
                    >
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>Editar Club (Perfil & Software)</span>
                    </button>
                  )}
                </div>

                {/* Selector de perfiles de acceso (visible exclusivamente en VITE_DEMO_MODE === 'true') */}
                {import.meta.env.VITE_DEMO_MODE === 'true' && (
                  <>
                    <div className="px-4 py-2 border-b border-[#16233E]/60">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        Cambiar Perfil de Acceso (Modo Demo)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Los 4 roles del club + Superadmin.
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1 divide-y divide-[#16233E]/40">
                      {allUsers.map((u) => {
                        const userClub = allClubs.find(c => c.id === u.clubId);
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setShowUserDropdown(false);
                              onSwitchUser(u);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition hover:bg-[#122247] ${
                              isSelected ? 'bg-blue-600/15 text-blue-300' : 'text-slate-300'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#070D1E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-[#1E2C4F]">
                              {u.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold truncate text-white">{u.fullName}</span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  {u.role}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {userClub ? userClub.name : 'FRAOVIA Multi-Club (Superadmin)'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="px-3 pt-2 pb-1 border-t border-[#16233E]">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
