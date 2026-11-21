import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Rocket, 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  ShoppingBag,
  Bell,
  ChevronRight,
  Shield,
  Eye
} from 'lucide-react';
import { Club } from '../../../types/fraovia';
import { SavedDesign, VisualElement } from './visualEditorTypes';

interface VisualEditorPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: SavedDesign;
  club: Club;
  onOpenPublishModal: () => void;
}

export const VisualEditorPreviewModal: React.FC<VisualEditorPreviewModalProps> = ({
  isOpen,
  onClose,
  design,
  club,
  onOpenPublishModal
}) => {
  const [device, setDevice] = useState<'pc' | 'laptop' | 'tablet' | 'mobile'>('pc');

  if (!isOpen) return null;

  const bgConfig = design.backgroundConfig;

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile': return 'max-w-[420px]';
      case 'tablet': return 'max-w-[768px]';
      case 'laptop': return 'max-w-[1040px]';
      default: return 'max-w-[1360px]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      {/* Top Banner: VISTA PREVIA */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Volver a editar</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black tracking-wide text-amber-300">
              VISTA PREVIA — ESTE DISEÑO TODAVÍA NO ESTÁ PUBLICADO
            </span>
            <span className="hidden sm:inline-block text-[11px] text-amber-400/80 font-mono">
              ({design.name} · {design.currentVersion})
            </span>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('pc')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              device === 'pc' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista PC de escritorio (1360px)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PC</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('laptop')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              device === 'laptop' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Notebook (1040px)"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Laptop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              device === 'tablet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              device === 'mobile' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Celular Móvil (420px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Móvil</span>
          </button>
        </div>

        {/* Publicar button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPublishModal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25"
          >
            <Rocket className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>🚀 Publicar diseño</span>
          </button>
        </div>
      </div>

      {/* Main Preview Frame */}
      <div className="flex-1 overflow-y-auto bg-slate-950 flex items-start justify-center p-3 sm:p-6">
        <div 
          className={`w-full ${getContainerWidth()} min-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 relative transition-all duration-300 flex`}
          style={{
            backgroundColor: bgConfig.color || '#070D1E'
          }}
        >
          {/* General background image if enabled */}
          {bgConfig.type === 'image' && bgConfig.imageUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all"
              style={{
                backgroundImage: `url(${bgConfig.imageUrl})`,
                opacity: (bgConfig.opacity ?? 70) / 100,
                filter: `blur(${bgConfig.blur ?? 0}px)`
              }}
            />
          )}

          {/* General background gradient if enabled */}
          {bgConfig.type === 'gradient' && bgConfig.gradient && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: bgConfig.gradient,
                opacity: (bgConfig.opacity ?? 70) / 100
              }}
            />
          )}

          {/* Dark Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${(bgConfig.overlayDarkness ?? 30) / 100})`
            }}
          />

          {/* CONTENT LAYER */}
          <div className="relative z-10 w-full flex flex-col md:flex-row min-h-full">
            {/* Club Sidebar (Simulated Protected Sidebar) */}
            {device !== 'mobile' && (
              <aside className="w-56 bg-slate-950/70 backdrop-blur-md border-r border-white/10 p-4 flex flex-col justify-between shrink-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    {club.logoUrl && club.logoUrl.trim() ? (
                      <img 
                        src={club.logoUrl} 
                        alt={club.name} 
                        className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-white/10 p-1"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center font-bold text-xs text-slate-400">
                        {club.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="font-extrabold text-xs text-white truncate">{club.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">FRAOVIA PRO</div>
                    </div>
                  </div>

                  <nav className="space-y-1 text-xs">
                    {[
                      { label: 'Dashboard', icon: Activity, active: true },
                      { label: 'Socios & Cuotas', icon: Users, active: false },
                      { label: 'Deportivo & Turnos', icon: Layers, active: false },
                      { label: 'Caja & Cobros', icon: CreditCard, active: false },
                      { label: 'Tienda Oficial', icon: ShoppingBag, active: false }
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition cursor-pointer ${
                            item.active 
                              ? 'bg-white/10 text-white font-bold border border-white/15' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-white/10 text-[10px] text-slate-500">
                  Sistema FRAOVIA v2026.4
                </div>
              </aside>
            )}

            {/* Main Club Body */}
            <main className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
              {/* Elements Grid */}
              <div className="grid grid-cols-12 gap-4">
                {design.elements.filter(el => el.isVisible).map(element => (
                  <div
                    key={element.id}
                    className={`${
                      device === 'mobile' 
                        ? 'col-span-12' 
                        : device === 'tablet' 
                          ? element.colSpan > 6 ? 'col-span-12' : 'col-span-6'
                          : `col-span-${element.colSpan}`
                    } transition-all`}
                    style={{
                      gridColumn: device === 'mobile' ? 'span 12' : device === 'tablet' ? (element.colSpan > 6 ? 'span 12' : 'span 6') : `span ${element.colSpan}`
                    }}
                  >
                    <RenderPreviewElement element={element} club={club} />
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component to render each visual element realistically
const RenderPreviewElement: React.FC<{ element: VisualElement; club: Club }> = ({ element, club }) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: element.bgType === 'color' ? element.bgColor : undefined,
    backgroundImage: element.bgType === 'gradient' ? element.bgGradient : undefined,
    borderRadius: element.borderRadius === 'rounded-3xl' ? '1.5rem' : element.borderRadius === 'rounded-2xl' ? '1rem' : element.borderRadius === 'rounded-xl' ? '0.75rem' : '0.5rem',
    borderWidth: `${element.borderWidth}px`,
    borderColor: element.borderColor,
    backdropFilter: `blur(${element.blur}px)`,
    opacity: (element.opacity ?? 100) / 100,
    boxShadow: element.shadow === 'glow' ? `0 0 20px ${element.accentColor || 'rgba(56,189,248,0.3)'}` : undefined
  };

  switch (element.type) {
    case 'header':
      return (
        <div 
          className="p-5 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={containerStyle}
        >
          <div className="space-y-1 relative z-10">
            {element.badgeText && (
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1" style={{ backgroundColor: `${element.accentColor}20`, color: element.accentColor, border: `1px solid ${element.accentColor}40` }}>
                {element.badgeText}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: element.fontFamily }}>
              {element.title}
            </h1>
            {element.subtitle && (
              <p className="text-xs text-slate-300 font-medium">
                {element.subtitle}
              </p>
            )}
          </div>
          {element.buttonText && (
            <button 
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-black shadow-lg transition cursor-pointer self-start sm:self-auto"
              style={{ backgroundColor: element.accentColor || '#38BDF8', color: '#070D1E' }}
            >
              {element.buttonText}
            </button>
          )}
        </div>
      );

    case 'stat_card':
      return (
        <div className="p-4 sm:p-5 relative overflow-hidden" style={containerStyle}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">{element.title}</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${element.accentColor}20`, color: element.accentColor }}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: element.fontFamily }}>
            {element.value || '$0'}
          </div>
          {element.subValue && (
            <div className="text-[11px] text-slate-400 mt-1">
              {element.subValue}
            </div>
          )}
        </div>
      );

    case 'banner':
      return (
        <div 
          className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-cover bg-center"
          style={{
            ...containerStyle,
            backgroundImage: element.bgImageUrl ? `url(${element.bgImageUrl})` : undefined
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-1 max-w-md">
            {element.badgeText && (
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                {element.badgeText}
              </span>
            )}
            <h3 className="text-lg font-black text-white">{element.title}</h3>
            <p className="text-xs text-slate-300">{element.subtitle}</p>
          </div>
          {element.buttonText && (
            <button 
              type="button"
              className="relative z-10 mt-3 px-4 py-2 rounded-xl text-xs font-bold self-start bg-white text-slate-950 hover:bg-slate-200 transition"
            >
              {element.buttonText}
            </button>
          )}
        </div>
      );

    case 'quick_action':
      return (
        <div className="p-4 relative" style={containerStyle}>
          <h4 className="text-xs font-bold text-white mb-3">{element.title}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['+ Nuevo Socio', 'Cobrar Cuota', 'Torneos', 'Reporte'].map(action => (
              <button 
                key={action}
                type="button"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-left font-semibold border border-white/10 transition"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      );

    case 'widget_recent_payments':
      return (
        <div className="p-4 relative" style={containerStyle}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white">{element.title}</h4>
            <span className="text-[10px] text-emerald-400 font-mono">En vivo</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { socio: 'Gonzalo Pérez', cat: 'Sub-16 Fútbol', amount: '$12.000', time: 'Hace 12 min' },
              { socio: 'Camila Rossi', cat: 'Básquet Femenino', amount: '$14.500', time: 'Hace 35 min' },
              { socio: 'Martín Benítez', cat: 'Tenis Adultos', amount: '$18.000', time: 'Hace 1 hora' }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="font-bold text-white">{p.socio}</div>
                  <div className="text-[10px] text-slate-400">{p.cat} · {p.time}</div>
                </div>
                <div className="font-mono font-bold text-emerald-400">{p.amount}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'widget_categories':
      return (
        <div className="p-4 relative" style={containerStyle}>
          <h4 className="text-xs font-bold text-white mb-3">{element.title}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { name: 'Fútbol Menores', count: '124 socios' },
              { name: 'Básquet Primera', count: '48 socios' },
              { name: 'Vóley Femenino', count: '62 socios' },
              { name: 'Natación Libre', count: '85 socios' }
            ].map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block truncate">{c.name}</span>
                <span className="text-[10px] text-slate-400 block">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-2">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      );

    case 'spacer':
      return <div className="h-8" />;

    case 'text_block':
      return (
        <div className="p-4" style={containerStyle}>
          <h3 className="text-base font-bold text-white" style={{ fontFamily: element.fontFamily }}>
            {element.title}
          </h3>
          {element.subtitle && (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {element.subtitle}
            </p>
          )}
        </div>
      );

    case 'image_block':
      return (
        <div className="overflow-hidden" style={containerStyle}>
          <img 
            src={element.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'} 
            alt={element.title} 
            className="w-full h-48 object-cover"
          />
          {element.title && (
            <div className="p-3 text-xs font-bold text-white">
              {element.title}
            </div>
          )}
        </div>
      );

    case 'button_custom':
      return (
        <div className="p-2 flex items-center justify-center">
          <button 
            type="button" 
            className="w-full py-3 px-6 rounded-2xl text-xs font-black shadow-lg transition"
            style={{ backgroundColor: element.accentColor || '#38BDF8', color: '#070D1E' }}
          >
            {element.buttonText || element.title}
          </button>
        </div>
      );

    default:
      return null;
  }
};
