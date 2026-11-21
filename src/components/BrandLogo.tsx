import React from 'react';

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'icon-only';
}

/**
 * Exact Vector recreation of the FRAOVIA 'F' Symbol
 * Based on {8DD7154A-37BB-4AA9-8A77-CAFD8A3417BF}.png
 */
export const FraoviaSymbol: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Top Wing Gradient */}
        <linearGradient id="sym-wing-top" x1="25" y1="42" x2="85" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="40%" stopColor="#0099FF" />
          <stop offset="75%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>

        {/* Lower Wing & Stem Gradient */}
        <linearGradient id="sym-wing-bottom" x1="32" y1="48" x2="75" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0084FF" />
          <stop offset="50%" stopColor="#00B4FF" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>

        {/* Stem Diagonal Foot Gradient */}
        <linearGradient id="sym-stem" x1="24" y1="84" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0055FF" />
          <stop offset="50%" stopColor="#0077FF" />
          <stop offset="100%" stopColor="#00B4FF" />
        </linearGradient>
      </defs>

      {/* Top curved wing */}
      <path
        d="M 24 50
           C 28 36 42 28 78 28
           C 84 28 86 30 84 33
           C 81 38 72 44 58 45
           C 44 46 33 47 24 50 Z"
        fill="url(#sym-wing-top)"
      />

      {/* Lower wing & middle bar */}
      <path
        d="M 28 53
           C 38 50 48 49 66 49
           C 72 49 75 51 73 54
           C 70 59 62 64 50 65
           C 45 65.5 42 68 40 72
           L 27 88
           C 25 90 23 89 23 87
           L 30 63
           C 31 58 29 55 28 53 Z"
        fill="url(#sym-wing-bottom)"
      />

      {/* 3D Dimensional Facet */}
      <path
        d="M 30 63
           L 44 53
           L 50 65
           L 40 72
           L 27 88
           C 25 90 23 89 23 87
           Z"
        fill="url(#sym-stem)"
        fillOpacity="0.95"
      />
    </svg>
  );
};

/**
 * Exact App Icon Squircle matching uploaded file {8DD7154A-37BB-4AA9-8A77-CAFD8A3417BF}.png
 * Supports custom uploaded image override if user provides their own start icon.
 */
export const FraoviaAppIcon: React.FC<{ size?: number; className?: string; customIconUrl?: string | null }> = ({ 
  size = 56, 
  className = '',
  customIconUrl
}) => {
  const iconToUse = customIconUrl !== undefined ? customIconUrl : (typeof window !== 'undefined' ? localStorage.getItem('fraovia_custom_app_icon') : null);

  if (iconToUse && iconToUse.trim()) {
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
        style={{ 
          width: size, 
          height: size,
          borderRadius: `${Math.round(size * 0.28)}px`,
          boxShadow: '0 12px 32px -6px rgba(0, 114, 255, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        <img 
          src={iconToUse} 
          alt="FRAOVIA App Icon" 
          className="w-full h-full object-cover rounded-[28%]"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderRadius: `${Math.round(size * 0.28)}px`,
        background: 'radial-gradient(circle at 70% 30%, #0E1E42 0%, #081228 50%, #040814 100%)',
        boxShadow: '0 12px 32px -6px rgba(0, 114, 255, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
      }}
    >
      {/* Top Left Diagonal Glowing Laser Band */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: '45%',
          height: '45%',
          background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.4) 0%, rgba(0, 229, 255, 0.8) 75%, transparent 100%)',
          clipPath: 'polygon(0% 85%, 85% 0%, 100% 0%, 0% 100%)'
        }}
      />
      <div 
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: '50%',
          height: '50%',
          borderBottom: '2px solid #00E5FF',
          filter: 'drop-shadow(0 0 6px #00E5FF)',
          transform: 'rotate(-45deg) translate(-25%, -25%)'
        }}
      />

      {/* Bottom Right Diagonal Glowing Laser Band */}
      <div 
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          right: 0,
          width: '50%',
          height: '50%',
          background: 'linear-gradient(135deg, transparent 0%, rgba(0, 114, 255, 0.4) 40%, rgba(0, 229, 255, 0.9) 100%)',
          clipPath: 'polygon(15% 100%, 100% 15%, 100% 30%, 30% 100%)'
        }}
      />
      <div 
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          right: 0,
          width: '60%',
          height: '60%',
          borderTop: '2.5px solid #00E5FF',
          filter: 'drop-shadow(0 0 8px #00E5FF)',
          transform: 'rotate(-45deg) translate(25%, 25%)'
        }}
      />

      {/* Central FRAOVIA Emblem */}
      <div className="relative z-10">
        <FraoviaSymbol size={Math.round(size * 0.72)} />
      </div>
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  variant = 'dark'
}) => {
  const iconPixelSize = size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'xl' ? 68 : 40;
  const wordmarkSize = size === 'sm' ? 'text-lg tracking-wider' : size === 'lg' ? 'text-2xl tracking-widest' : size === 'xl' ? 'text-4xl tracking-widest' : 'text-xl tracking-wider';
  const taglineSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[11px]' : size === 'xl' ? 'text-[13px]' : 'text-[9px]';

  const textColor = variant === 'light' ? 'text-slate-900' : 'text-white';
  const tagColor = variant === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Exact App Icon Squircle */}
      <FraoviaAppIcon size={iconPixelSize} />

      {/* Official Typography: FRΛOVIA MANAGEMENT PLATFORM */}
      <div className="flex flex-col leading-none">
        <div className={`font-black ${textColor} ${wordmarkSize} flex items-center font-sans tracking-[0.14em]`}>
          <span>FR</span>
          {/* Custom Stylized Lambda / Inverted-V for the first A */}
          <span className="inline-block mx-[0.5px] scale-y-95">Λ</span>
          <span>OVI</span>
          {/* Custom Stylized Lambda / Inverted-V for the second A */}
          <span className="inline-block mx-[0.5px] scale-y-95">Λ</span>
        </div>
        {showTagline && (
          <span className={`uppercase font-semibold tracking-[0.24em] ${tagColor} ${taglineSize} mt-1`}>
            Management Platform
          </span>
        )}
      </div>
    </div>
  );
};
