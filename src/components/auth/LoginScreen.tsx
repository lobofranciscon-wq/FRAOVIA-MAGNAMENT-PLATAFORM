import React, { useState } from 'react';
import { BrandLogo, FraoviaSymbol } from '../BrandLogo';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Check, Sparkles, Loader2 } from 'lucide-react';
import { User } from '../../types/fraovia';
import { supabaseAuthService } from '../../services/supabaseAuthService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
  onOpenParentPortal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  availableUsers,
  onOpenParentPortal
}) => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [identifier, setIdentifier] = useState(isDemoMode ? 'superadmin@fraovia.com' : '');
  const [password, setPassword] = useState(isDemoMode ? '••••••••••••' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<User>(availableUsers[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor ingrese su usuario o correo electrónico.');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    // En producción o con Supabase configurado: autenticación estricta con Supabase Auth
    if (supabaseAuthService.isConfigured() && (!isDemoMode || password !== '••••••••••••')) {
      setIsLoading(true);
      setError('');
      try {
        const result = await supabaseAuthService.signIn(identifier.trim(), password);
        if (result.success && result.user) {
          onLogin(result.user);
          return;
        } else if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        setError(err.message || 'Error al conectar con Supabase Auth.');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Modo demo local permitido únicamente si VITE_DEMO_MODE === 'true'
    if (isDemoMode) {
      const matched = availableUsers.find(
        u => u.email.toLowerCase() === identifier.trim().toLowerCase() ||
             u.fullName.toLowerCase().includes(identifier.trim().toLowerCase())
      );

      if (matched) {
        onLogin(matched);
      } else {
        onLogin(selectedDemoUser);
      }
      return;
    }

    setError('Supabase no está configurado o las credenciales no son válidas.');
  };

  const selectPersona = (u: User) => {
    setSelectedDemoUser(u);
    setIdentifier(u.email);
    setPassword('••••••••••••');
    setError('');
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      style={{
        backgroundColor: '#070D1E',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(0, 114, 255, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(0, 198, 255, 0.12) 0%, transparent 45%)
        `
      }}
    >
      {/* Exact Diagonal Futuristic Facets & Light Rays from Official Artwork */}
      {/* Top Left diagonal cyan/blue ray */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 pointer-events-none transform -rotate-45 opacity-60"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 198, 255, 0.4) 0%, rgba(0, 114, 255, 0.1) 50%, transparent 70%)',
          filter: 'blur(30px)'
        }}
      />
      {/* Bottom Right diagonal blue ray */}
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 pointer-events-none transform -rotate-45 opacity-50"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(0, 114, 255, 0.25) 60%, rgba(0, 229, 255, 0.4) 100%)',
          filter: 'blur(30px)'
        }}
      />

      {/* Main Content Container */}
      <div className="w-full max-w-md flex flex-col items-center relative z-10 space-y-8 animate-in fade-in duration-300">
        
        {/* Official Brand Header */}
        <div className="flex flex-col items-center text-center space-y-1">
          <BrandLogo size="lg" showTagline={true} />
        </div>

        {/* Exact Login Card from Mockup */}
        <div 
          className="w-full rounded-2xl p-7 sm:p-8 space-y-6 shadow-2xl relative"
          style={{
            backgroundColor: '#0C162D',
            border: '1px solid #1B2B4C',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px -5px rgba(0, 114, 255, 0.15)'
          }}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-wide">
              Iniciar sesión
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: Usuario o correo */}
            <div className="space-y-1.5">
              <div 
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition focus-within:border-blue-500"
                style={{
                  backgroundColor: '#070E20',
                  border: '1px solid #1C2B49'
                }}
              >
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Usuario o correo"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Input 2: Contraseña */}
            <div className="space-y-1.5">
              <div 
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition focus-within:border-blue-500"
                style={{
                  backgroundColor: '#070E20',
                  border: '1px solid #1C2B49'
                }}
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">
                {error}
              </p>
            )}

            {/* Submit Button: Electric Blue Gradient */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(90deg, #0072FF 0%, #0056E0 100%)',
                boxShadow: '0 8px 24px -4px rgba(0, 114, 255, 0.45)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>

            {/* Forgot password link */}
            <div className="text-center pt-1">
              <a
                href="#olvide"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para restablecer sus credenciales institucionales, contacte al Administrador de su club o al soporte técnico de FRAOVIA.');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </div>

        {/* Quick Demo Access Bar (The 4 Club Roles + SuperAdmin) - Visible ÚNICAMENTE si VITE_DEMO_MODE === 'true' */}
        {isDemoMode && (
          <div className="w-full space-y-2 pt-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
              Acceso Rápido Demo: Los 4 Roles del Club
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Dueño o Gerente */}
              {availableUsers.find(u => u.role === 'DUEÑO') && (() => {
                const u = availableUsers.find(u => u.role === 'DUEÑO')!;
                const isSelected = selectedDemoUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPersona(u)}
                    className={`p-2.5 rounded-xl text-left transition text-xs border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white text-[11px] truncate">1. Dueño o Gerente</span>
                    <span className="text-[10px] text-blue-400 truncate mt-0.5">{u.fullName}</span>
                  </button>
                );
              })()}

              {/* 2. Administración */}
              {availableUsers.find(u => u.role === 'ADMINISTRACIÓN') && (() => {
                const u = availableUsers.find(u => u.role === 'ADMINISTRACIÓN')!;
                const isSelected = selectedDemoUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPersona(u)}
                    className={`p-2.5 rounded-xl text-left transition text-xs border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white text-[11px] truncate">2. Administración</span>
                    <span className="text-[10px] text-emerald-400 truncate mt-0.5">{u.fullName}</span>
                  </button>
                );
              })()}

              {/* 3. Tienda */}
              {availableUsers.find(u => u.role === 'TIENDA') && (() => {
                const u = availableUsers.find(u => u.role === 'TIENDA')!;
                const isSelected = selectedDemoUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPersona(u)}
                    className={`p-2.5 rounded-xl text-left transition text-xs border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-600/25 border-rose-500 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white text-[11px] truncate">3. Tienda</span>
                    <span className="text-[10px] text-rose-400 truncate mt-0.5">{u.fullName}</span>
                  </button>
                );
              })()}

              {/* 4. Profesor */}
              {availableUsers.find(u => u.role === 'PROFESOR') && (() => {
                const u = availableUsers.find(u => u.role === 'PROFESOR')!;
                const isSelected = selectedDemoUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPersona(u)}
                    className={`p-2.5 rounded-xl text-left transition text-xs border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-600/25 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white text-[11px] truncate">4. Profesor</span>
                    <span className="text-[10px] text-cyan-400 truncate mt-0.5">{u.fullName}</span>
                  </button>
                );
              })()}
            </div>

            {/* Superadmin global selector button */}
            {availableUsers.find(u => u.role === 'SUPERADMIN') && (() => {
              const u = availableUsers.find(u => u.role === 'SUPERADMIN')!;
              const isSelected = selectedDemoUser.id === u.id;
              return (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => selectPersona(u)}
                    className={`w-full py-1.5 px-3 rounded-xl transition text-[11px] border font-bold flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <span>SuperAdmin FRAOVIA (Gobernanza de Plataforma SaaS)</span>
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Portal de Padres Link (Opción 6) */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onOpenParentPortal}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition font-medium px-3 py-1.5 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>¿Eres padre o tutor? <strong>Ingresar al Portal de Familias</strong></span>
          </button>
        </div>
      </div>

      {/* Footer Tagline */}
      <footer className="absolute bottom-4 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em]">
        Gestión · Conexión · Evolución · Confianza · Todo en una sola plataforma
      </footer>
    </div>
  );
};
