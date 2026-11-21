import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  ShoppingBag, 
  Wallet, 
  BarChart3, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Sliders,
  Cloud,
  Palette
} from 'lucide-react';
import { ActiveTab } from '../MobileNavBar';
import { Club, Player, User } from '../../types/fraovia';

interface FraoviaWelcomeGridProps {
  onNavigate: (tab: ActiveTab) => void;
  currentUser: User;
  currentClub: Club | null;
  players?: Player[];
  onOpenMedicalCenter?: () => void;
  onOpenScholarshipsModal?: () => void;
}

export const FraoviaWelcomeGrid: React.FC<FraoviaWelcomeGridProps> = ({
  onNavigate,
  currentUser,
  currentClub,
  players = []
}) => {
  const isSuperAdmin = currentUser.role === 'SUPERADMIN';

  const cards = isSuperAdmin ? [
    {
      id: 'clubes',
      title: 'Instituciones & Clubes',
      subtitle: 'Administra tus instituciones clientes',
      icon: Building2,
      tab: 'superadmin_clubes' as ActiveTab,
      highlight: true
    },
    {
      id: 'planes',
      title: 'Planes SaaS & Precios',
      subtitle: 'Precios, cupos de alumnos y módulos',
      icon: Sliders,
      tab: 'superadmin_planes' as ActiveTab
    },
    {
      id: 'backups',
      title: 'Copias de Seguridad',
      subtitle: 'Respaldo y restauración con 1 clic',
      icon: Cloud,
      tab: 'superadmin_backups' as ActiveTab
    },
    {
      id: 'branding',
      title: 'Personalización Visual',
      subtitle: 'Escudos, logos y temas de cada club',
      icon: Palette,
      tab: 'superadmin_clubes' as ActiveTab
    },
    {
      id: 'betas',
      title: 'Funciones Beta & Novedades',
      subtitle: 'Habilita funciones piloto por club',
      icon: Sparkles,
      tab: 'superadmin_betas' as ActiveTab
    },
    {
      id: 'reportes',
      title: 'Auditoría & Seguridad',
      subtitle: 'Registro de accesos globales',
      icon: BarChart3,
      tab: 'auditoria' as ActiveTab
    }
  ] : [
    {
      id: 'clubes',
      title: 'Clubes',
      subtitle: 'Gestiona tus clubes',
      icon: Building2,
      tab: 'superadmin_clubes' as ActiveTab,
      highlight: false
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      subtitle: 'Administra accesos',
      icon: Users,
      tab: 'jugadores' as ActiveTab
    },
    {
      id: 'administracion',
      title: 'Administración',
      subtitle: 'Finanzas y pagos',
      icon: FileText,
      tab: 'comprobantes' as ActiveTab
    },
    {
      id: 'tienda',
      title: 'Tienda',
      subtitle: 'Ventas y stock',
      icon: ShoppingBag,
      tab: 'tienda' as ActiveTab
    },
    {
      id: 'caja',
      title: 'Caja',
      subtitle: 'Comprobantes y movimientos',
      icon: Wallet,
      tab: 'caja' as ActiveTab
    },
    {
      id: 'reportes',
      title: 'Reportes',
      subtitle: 'Estadísticas y análisis',
      icon: BarChart3,
      tab: 'auditoria' as ActiveTab
    }
  ];

  return (
    <div className="space-y-6">
      {/* Exact Welcome Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Bienvenido a <span className="text-amber-400 font-black">FRAOVIA</span>
        </h1>
        <p className="text-sm text-slate-400">
          {isSuperAdmin 
            ? 'Consola central de administración de la plataforma SaaS y gestión multiclub.' 
            : 'Tu plataforma de gestión deportiva e institucional, todo en un solo lugar.'}
        </p>
      </div>

      {/* 6 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onNavigate(card.tab)}
              className="group p-5 rounded-2xl transition cursor-pointer flex items-center justify-between shadow-lg"
              style={{
                backgroundColor: '#0C162D',
                border: '1px solid #1B2B4C'
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition group-hover:scale-105"
                  style={{
                    backgroundColor: '#12254C',
                    border: '1px solid #203B75'
                  }}
                >
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-blue-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
