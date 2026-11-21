import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Cpu, 
  Activity, 
  Settings, 
  ShieldCheck, 
  Cloud, 
  ChevronDown, 
  ChevronRight, 
  LayoutDashboard,
  Boxes,
  Sliders,
  ListTree,
  AlertTriangle,
  BarChart3,
  Wifi,
  Users,
  CreditCard,
  Lock,
  UserCheck,
  FileText,
  Key,
  Globe,
  HardDrive
} from 'lucide-react';
import { SuperadminSection } from './superadminNavigation';

interface SuperadminSidebarNavProps {
  currentSection: SuperadminSection;
  onSelectSection: (section: SuperadminSection) => void;
  isCollapsed: boolean;
  totalClubsCount?: number;
  openIssuesCount?: number;
}

export const SuperadminSidebarNav: React.FC<SuperadminSidebarNavProps> = ({
  currentSection,
  onSelectSection,
  isCollapsed,
  totalClubsCount = 0,
  openIssuesCount = 2
}) => {
  // Expanded state for parent submenus
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    plataforma: false,
    monitoreo: false,
    sistema: false,
    seguridad: false
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isGroupActive = (sections: SuperadminSection[]) => {
    return sections.includes(currentSection);
  };

  // Helper for rendering leaf buttons
  const renderItem = (
    section: SuperadminSection,
    label: string,
    Icon: any,
    badge?: string | number,
    badgeColor: string = 'bg-slate-800 text-slate-300'
  ) => {
    const isActive = currentSection === section;

    if (isCollapsed) {
      return (
        <div key={section} className="relative group flex items-center justify-center">
          <button
            type="button"
            onClick={() => onSelectSection(section)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition cursor-pointer relative ${
              isActive
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
            }`}
            title={label}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {badge !== undefined && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#070D1E]" />
            )}
          </button>

          {/* Tooltip on collapsed hover */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
            <span className="font-bold text-white block">{label}</span>
          </div>
        </div>
      );
    }

    return (
      <button
        key={section}
        type="button"
        onClick={() => onSelectSection(section)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer text-xs font-semibold ${
          isActive
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && (
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  // Helper for rendering collapsible group with subitems
  const renderGroup = (
    groupKey: string,
    title: string,
    Icon: any,
    subItems: { section: SuperadminSection; label: string; icon: any; badge?: string | number }[],
    alertBadge?: number
  ) => {
    const isGroupSelected = isGroupActive(subItems.map(s => s.section));
    const isExpanded = expandedGroups[groupKey] || isGroupSelected;

    if (isCollapsed) {
      // In collapsed mode, clicking icon opens first subitem or toggles
      return (
        <div key={groupKey} className="relative group flex items-center justify-center">
          <button
            type="button"
            onClick={() => onSelectSection(subItems[0].section)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition cursor-pointer relative ${
              isGroupSelected
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
            }`}
            title={title}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {alertBadge ? (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#070D1E]" />
            ) : null}
          </button>

          {/* Submenu flyout for collapsed sidebar */}
          <div className="absolute left-full top-0 ml-3 p-2 bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 min-w-[170px] space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              {title}
            </div>
            {subItems.map(sub => (
              <button
                key={sub.section}
                type="button"
                onClick={() => onSelectSection(sub.section)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer text-xs ${
                  currentSection === sub.section
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                <sub.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={groupKey} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(groupKey)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer text-xs font-bold ${
            isGroupSelected
              ? 'text-slate-100 bg-slate-900/80'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 shrink-0 ${isGroupSelected ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {alertBadge ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {alertBadge}
              </span>
            ) : null}
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-3.5">
            {subItems.map(sub => {
              const isSubActive = currentSection === sub.section;
              return (
                <button
                  key={sub.section}
                  type="button"
                  onClick={() => onSelectSection(sub.section)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer text-xs ${
                    isSubActive
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <sub.icon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="truncate">{sub.label}</span>
                  </div>
                  {sub.badge !== undefined && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 1. SECCIONES DIRECTAS */}
      <div className="space-y-1">
        {renderItem('inicio', 'Inicio', LayoutDashboard)}
        {renderItem('clubes', 'Clubes', Building2, totalClubsCount || undefined, 'bg-sky-500/20 text-sky-300 border border-sky-500/30')}
        {renderItem('editor_visual', 'Editor Visual 🖌️', Sliders, 'CANVA', 'bg-amber-500/20 text-amber-300 border border-amber-500/40')}
      </div>

      {/* DIVISOR LIMPIO */}
      <div className="border-t border-slate-800/80 my-2" />

      {/* 2. PLATAFORMA */}
      {renderGroup(
        'plataforma',
        'Plataforma',
        Cpu,
        [
          { section: 'plataforma_versiones', label: 'Versiones', icon: Boxes },
          { section: 'plataforma_funciones', label: 'Funciones', icon: Sliders },
          { section: 'plataforma_config', label: 'Configuración global', icon: Globe }
        ]
      )}

      {/* 3. MONITOREO */}
      {renderGroup(
        'monitoreo',
        'Monitoreo',
        Activity,
        [
          { section: 'monitoreo_actividad', label: 'Actividad', icon: ListTree },
          { section: 'monitoreo_errores', label: 'Errores', icon: AlertTriangle, badge: openIssuesCount || undefined },
          { section: 'monitoreo_uso', label: 'Uso', icon: BarChart3 },
          { section: 'monitoreo_conexiones', label: 'Conexiones', icon: Wifi }
        ],
        openIssuesCount
      )}

      {/* 4. SISTEMA */}
      {renderGroup(
        'sistema',
        'Sistema',
        Settings,
        [
          { section: 'sistema_planes', label: 'Planes', icon: CreditCard },
          { section: 'sistema_usuarios', label: 'Usuarios', icon: Users },
          { section: 'sistema_config', label: 'Configuración general', icon: Sliders }
        ]
      )}

      {/* 5. SEGURIDAD */}
      {renderGroup(
        'seguridad',
        'Seguridad',
        ShieldCheck,
        [
          { section: 'seguridad_auditoria', label: 'Auditoría', icon: FileText },
          { section: 'seguridad_permisos', label: 'Permisos', icon: Key },
          { section: 'seguridad_accesos', label: 'Accesos', icon: UserCheck }
        ]
      )}

      {/* 6. BACKUPS */}
      <div className="pt-1">
        {renderItem('backups', 'Backups', Cloud, 'Auto', 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30')}
      </div>
    </div>
  );
};
