import { Club, User } from '../types/fraovia';
import { 
  SavedDesign, 
  VisualElement, 
  BackgroundConfig, 
  DesignVersion, 
  VisualTemplate 
} from '../components/superadmin/visualEditor/visualEditorTypes';
import { fraoviaDB } from './fraoviaStore';

const STORAGE_KEY = 'fraovia_visual_designs_v1';

export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  type: 'image',
  color: '#070D1E',
  gradient: 'linear-gradient(135deg, #070D1E 0%, #0F172A 50%, #032746 100%)',
  imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80',
  opacity: 75,
  blur: 2,
  overlayDarkness: 35
};

export const INITIAL_PRESET_TEMPLATES: VisualTemplate[] = [
  {
    id: 'tpl-atletico-pro',
    name: 'Atlético Pro 2026',
    category: 'Deportivo Profesional',
    description: 'Diseño de alto rendimiento con tarjetas translúcidas, métricas destacadas y banner hero.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    accentColor: '#38BDF8',
    backgroundConfig: {
      type: 'image',
      color: '#070D1E',
      gradient: 'linear-gradient(135deg, #070D1E 0%, #0F172A 100%)',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80',
      opacity: 70,
      blur: 2,
      overlayDarkness: 30
    },
    elements: [
      {
        id: 'el-header-1',
        type: 'header',
        title: 'PANEL PRINCIPAL DE GESTIÓN',
        subtitle: 'Temporada Oficial 2026 · Estadísticas y Operaciones en Tiempo Real',
        badgeText: 'CLUB OFICIAL',
        buttonText: 'Ver Agenda',
        x: 0,
        y: 0,
        width: 100,
        colSpan: 12,
        bgType: 'gradient',
        bgColor: '#0F172A',
        bgGradient: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(3,105,161,0.4) 100%)',
        opacity: 85,
        blur: 10,
        overlayDarkness: 20,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.3)',
        borderRadius: 'rounded-2xl',
        shadow: 'lg',
        textColor: '#FFFFFF',
        accentColor: '#38BDF8',
        fontFamily: 'Montserrat',
        fontSize: '2xl',
        fontWeight: 'extrabold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-stat-1',
        type: 'stat_card',
        title: 'Cuotas Cobradas (Mes)',
        value: '$485.200',
        subValue: '↑ 14.8% vs mes previo · 92% cobrado',
        iconName: 'CreditCard',
        x: 0,
        y: 1,
        width: 100,
        colSpan: 4,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 80,
        blur: 8,
        overlayDarkness: 25,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.25)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#38BDF8',
        fontFamily: 'Inter',
        fontSize: 'xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-stat-2',
        type: 'stat_card',
        title: 'Deportistas Activos',
        value: '342 Socios',
        subValue: '12 categorías operativas · 96% asistencia',
        iconName: 'Users',
        x: 0,
        y: 1,
        width: 100,
        colSpan: 4,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 80,
        blur: 8,
        overlayDarkness: 25,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.25)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        fontSize: 'xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-stat-3',
        type: 'stat_card',
        title: 'Ingresos Tienda & Bar',
        value: '$198.400',
        subValue: '48 tickets emitidos hoy · POS Activo',
        iconName: 'DollarSign',
        x: 0,
        y: 1,
        width: 100,
        colSpan: 4,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 80,
        blur: 8,
        overlayDarkness: 25,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#F59E0B',
        fontFamily: 'Inter',
        fontSize: 'xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-banner-1',
        type: 'banner',
        title: 'GRAN TORNEO NACIONAL DE MENORES',
        subtitle: 'Inscripciones abiertas hasta el 18 de octubre. Toda la delegación confirmada.',
        buttonText: 'Ver Detalles y Listas',
        badgeText: 'PRÓXIMO EVENTO',
        imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&auto=format&fit=crop&q=80',
        x: 0,
        y: 2,
        width: 100,
        colSpan: 8,
        bgType: 'image',
        bgColor: '#0F172A',
        bgImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&auto=format&fit=crop&q=80',
        opacity: 85,
        blur: 4,
        overlayDarkness: 45,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 'rounded-2xl',
        shadow: 'lg',
        textColor: '#FFFFFF',
        accentColor: '#F59E0B',
        fontFamily: 'Montserrat',
        fontSize: 'xl',
        fontWeight: 'extrabold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-quick-1',
        type: 'quick_action',
        title: 'Accesos Directos',
        subtitle: 'Operaciones más frecuentes',
        x: 0,
        y: 2,
        width: 100,
        colSpan: 4,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 85,
        blur: 10,
        overlayDarkness: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#38BDF8',
        fontFamily: 'Inter',
        fontSize: 'base',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-widget-payments',
        type: 'widget_recent_payments',
        title: 'Últimos Pagos Registrados',
        subtitle: 'Transacciones automáticas en tiempo real',
        x: 0,
        y: 3,
        width: 100,
        colSpan: 7,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 80,
        blur: 8,
        overlayDarkness: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        fontSize: 'base',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-widget-cats',
        type: 'widget_categories',
        title: 'Estado de Disciplinas',
        subtitle: 'Ocupación de canchas y categorías',
        x: 0,
        y: 3,
        width: 100,
        colSpan: 5,
        bgType: 'color',
        bgColor: '#0B132B',
        opacity: 80,
        blur: 8,
        overlayDarkness: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#38BDF8',
        fontFamily: 'Inter',
        fontSize: 'base',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      }
    ]
  },
  {
    id: 'tpl-glass-dark',
    name: 'Glassmorphism Nocturno',
    category: 'Moderno / Translúcido',
    description: 'Estética translúcida ultra refinada con bordes de luz suave y desenfoque de fondo profundo.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80',
    accentColor: '#A855F7',
    backgroundConfig: {
      type: 'image',
      color: '#050814',
      gradient: 'linear-gradient(135deg, #050814 0%, #171026 100%)',
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=80',
      opacity: 85,
      blur: 4,
      overlayDarkness: 40
    },
    elements: [
      {
        id: 'el-g-header',
        type: 'header',
        title: 'PORTAL INSTITUCIONAL DEL SOCIO',
        subtitle: 'FRAOVIA Cloud Platform · Visual Layer',
        badgeText: 'PREMIUM',
        buttonText: 'Explorar',
        x: 0,
        y: 0,
        width: 100,
        colSpan: 12,
        bgType: 'gradient',
        bgColor: 'rgba(23,16,38,0.7)',
        bgGradient: 'linear-gradient(135deg, rgba(23,16,38,0.85) 0%, rgba(168,85,247,0.3) 100%)',
        opacity: 70,
        blur: 14,
        overlayDarkness: 10,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.4)',
        borderRadius: 'rounded-3xl',
        shadow: 'glow',
        textColor: '#FFFFFF',
        accentColor: '#C084FC',
        fontFamily: 'Space Grotesk',
        fontSize: '2xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-g-stat-1',
        type: 'stat_card',
        title: 'Recaudación Mensual',
        value: '$612.900',
        subValue: 'Superávit registrado este ciclo',
        iconName: 'CreditCard',
        x: 0,
        y: 1,
        width: 100,
        colSpan: 6,
        bgType: 'color',
        bgColor: '#120F24',
        opacity: 65,
        blur: 12,
        overlayDarkness: 15,
        borderWidth: 1,
        borderColor: 'rgba(192,132,252,0.3)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#C084FC',
        fontFamily: 'Inter',
        fontSize: 'xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      },
      {
        id: 'el-g-stat-2',
        type: 'stat_card',
        title: 'Total Deportistas',
        value: '410 Socios',
        subValue: '100% de categorías con plantel completo',
        iconName: 'Users',
        x: 0,
        y: 1,
        width: 100,
        colSpan: 6,
        bgType: 'color',
        bgColor: '#120F24',
        opacity: 65,
        blur: 12,
        overlayDarkness: 15,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.3)',
        borderRadius: 'rounded-2xl',
        shadow: 'md',
        textColor: '#FFFFFF',
        accentColor: '#38BDF8',
        fontFamily: 'Inter',
        fontSize: 'xl',
        fontWeight: 'bold',
        textAlign: 'left',
        isVisible: true,
        isLocked: false,
        zIndex: 1
      }
    ]
  }
];

function generateInitialDesigns(): SavedDesign[] {
  const baseTpl = INITIAL_PRESET_TEMPLATES[0];
  const glassTpl = INITIAL_PRESET_TEMPLATES[1];

  const designSanMartin: SavedDesign = {
    id: 'design-san-martin-2026',
    name: 'Dashboard San Martín 2026',
    clubId: 'club-san-martin',
    clubName: 'Club Atlético San Martín',
    status: 'publicado',
    currentVersion: 'v3.1',
    publishedTo: 'this_club',
    publishedClubNames: ['Club Atlético San Martín'],
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-05T14:30:00Z',
    backgroundConfig: {
      type: 'image',
      color: '#070D1E',
      gradient: 'linear-gradient(135deg, #070D1E 0%, #0F172A 100%)',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80',
      opacity: 70,
      blur: 2,
      overlayDarkness: 30
    },
    elements: JSON.parse(JSON.stringify(baseTpl.elements)),
    versions: [
      {
        version: 'v1.0',
        timestamp: '2026-09-15T10:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Estructura inicial del club con tarjetas de recaudación y cuotas.',
        elements: JSON.parse(JSON.stringify(baseTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(baseTpl.backgroundConfig))
      },
      {
        version: 'v2.0',
        timestamp: '2026-09-28T16:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Incorporación de banner oficial y widgets interactivos.',
        elements: JSON.parse(JSON.stringify(baseTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(baseTpl.backgroundConfig))
      },
      {
        version: 'v3.0',
        timestamp: '2026-10-02T12:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Ajuste de transparencia en tarjetas de pago y tipografía Montserrat.',
        elements: JSON.parse(JSON.stringify(baseTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(baseTpl.backgroundConfig))
      },
      {
        version: 'v3.1',
        timestamp: '2026-10-05T14:30:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Versión actual activa con optimización responsive en notebook y móvil.',
        elements: JSON.parse(JSON.stringify(baseTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(baseTpl.backgroundConfig))
      }
    ]
  };

  const designDeportivoBorrador: SavedDesign = {
    id: 'design-deportivo-alto-rendimiento',
    name: 'Dashboard Deportivo Alto Rendimiento',
    clubId: 'club-san-martin',
    clubName: 'Club Atlético San Martín',
    status: 'borrador',
    currentVersion: 'v1.0',
    publishedTo: 'none',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-07T18:20:00Z',
    backgroundConfig: {
      type: 'gradient',
      color: '#070D1E',
      gradient: 'linear-gradient(135deg, #021B32 0%, #0F172A 70%, #070D1E 100%)',
      opacity: 85,
      blur: 0,
      overlayDarkness: 20
    },
    elements: JSON.parse(JSON.stringify(baseTpl.elements)),
    versions: [
      {
        version: 'v1.0',
        timestamp: '2026-10-06T09:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Borrador en desarrollo enfocado en torneos y fixture.',
        elements: JSON.parse(JSON.stringify(baseTpl.elements)),
        backgroundConfig: {
          type: 'gradient',
          color: '#070D1E',
          gradient: 'linear-gradient(135deg, #021B32 0%, #0F172A 70%, #070D1E 100%)',
          opacity: 85,
          blur: 0,
          overlayDarkness: 20
        }
      }
    ]
  };

  const designFutbol2027: SavedDesign = {
    id: 'design-futbol-2027',
    name: 'Diseño Fútbol 2027',
    clubId: 'club-norte',
    clubName: 'Club Atlético Norte',
    status: 'borrador',
    currentVersion: 'v1.0',
    publishedTo: 'none',
    createdAt: '2026-10-04T11:00:00Z',
    updatedAt: '2026-10-04T11:00:00Z',
    backgroundConfig: JSON.parse(JSON.stringify(glassTpl.backgroundConfig)),
    elements: JSON.parse(JSON.stringify(glassTpl.elements)),
    versions: [
      {
        version: 'v1.0',
        timestamp: '2026-10-04T11:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Borrador para temporada siguiente.',
        elements: JSON.parse(JSON.stringify(glassTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(glassTpl.backgroundConfig))
      }
    ]
  };

  const designMinimalista: SavedDesign = {
    id: 'design-minimalista-glass',
    name: 'Diseño Minimalista',
    clubId: 'club-belgrano',
    clubName: 'Club Social y Deportivo Belgrano',
    status: 'archivado',
    currentVersion: 'v2.0',
    publishedTo: 'none',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-01T15:00:00Z',
    backgroundConfig: JSON.parse(JSON.stringify(glassTpl.backgroundConfig)),
    elements: JSON.parse(JSON.stringify(glassTpl.elements)),
    versions: [
      {
        version: 'v1.0',
        timestamp: '2026-08-20T10:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Creación inicial minimalista.',
        elements: JSON.parse(JSON.stringify(glassTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(glassTpl.backgroundConfig))
      },
      {
        version: 'v2.0',
        timestamp: '2026-09-01T15:00:00Z',
        author: 'Superadmin FRAOVIA',
        changeNote: 'Versión archivada antes del rediseño corporativo.',
        elements: JSON.parse(JSON.stringify(glassTpl.elements)),
        backgroundConfig: JSON.parse(JSON.stringify(glassTpl.backgroundConfig))
      }
    ]
  };

  return [designSanMartin, designDeportivoBorrador, designFutbol2027, designMinimalista];
}

class VisualDesignService {
  private designs: SavedDesign[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.designs = JSON.parse(stored);
      } else {
        this.designs = generateInitialDesigns();
        this.persist();
      }
    } catch {
      this.designs = generateInitialDesigns();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.designs));
    } catch (e) {
      console.warn('Error saving visual designs to localStorage:', e);
    }
  }

  getAllDesigns(): SavedDesign[] {
    this.load();
    return [...this.designs];
  }

  getDesignsForClub(clubId: string): SavedDesign[] {
    this.load();
    return this.designs.filter(d => d.clubId === clubId);
  }

  getDesign(id: string): SavedDesign | null {
    this.load();
    return this.designs.find(d => d.id === id) || null;
  }

  saveDraft(design: SavedDesign): SavedDesign {
    this.load();
    const now = new Date().toISOString();
    const updated: SavedDesign = {
      ...design,
      updatedAt: now
    };

    const idx = this.designs.findIndex(d => d.id === design.id);
    if (idx >= 0) {
      this.designs[idx] = updated;
    } else {
      this.designs.unshift(updated);
    }

    this.persist();
    return updated;
  }

  duplicateDesign(designId: string, customName?: string): SavedDesign {
    this.load();
    const original = this.designs.find(d => d.id === designId);
    if (!original) throw new Error('Diseño no encontrado');

    const newId = `design-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const copyName = customName || `${original.name} (Copia)`;
    const now = new Date().toISOString();

    const duplicated: SavedDesign = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: copyName,
      status: 'borrador', // Duplicates start as draft!
      currentVersion: 'v1.0',
      publishedTo: 'none',
      publishedClubNames: [],
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          version: 'v1.0',
          timestamp: now,
          author: 'Superadmin FRAOVIA',
          changeNote: `Copia duplicada de "${original.name}"`,
          elements: JSON.parse(JSON.stringify(original.elements)),
          backgroundConfig: JSON.parse(JSON.stringify(original.backgroundConfig))
        }
      ]
    };

    this.designs.unshift(duplicated);
    this.persist();
    return duplicated;
  }

  renameDesign(designId: string, newName: string): SavedDesign {
    this.load();
    const idx = this.designs.findIndex(d => d.id === designId);
    if (idx === -1) throw new Error('Diseño no encontrado');

    this.designs[idx] = {
      ...this.designs[idx],
      name: newName.trim(),
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.designs[idx];
  }

  archiveDesign(designId: string): SavedDesign {
    this.load();
    const idx = this.designs.findIndex(d => d.id === designId);
    if (idx === -1) throw new Error('Diseño no encontrado');

    const nextStatus = this.designs[idx].status === 'archivado' ? 'borrador' : 'archivado';
    this.designs[idx] = {
      ...this.designs[idx],
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.designs[idx];
  }

  deleteDesign(designId: string): boolean {
    this.load();
    const initialLen = this.designs.length;
    this.designs = this.designs.filter(d => d.id !== designId);
    if (this.designs.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  restoreVersion(designId: string, versionNumber: string): SavedDesign {
    this.load();
    const idx = this.designs.findIndex(d => d.id === designId);
    if (idx === -1) throw new Error('Diseño no encontrado');

    const targetDesign = this.designs[idx];
    const targetVersion = targetDesign.versions.find(v => v.version === versionNumber);
    if (!targetVersion) throw new Error('Versión no encontrada');

    // Create a new version entry indicating restoration
    const nextVer = this.calculateNextVersion(targetDesign.currentVersion, 'minor');
    const now = new Date().toISOString();

    const restoredEntry: DesignVersion = {
      version: nextVer,
      timestamp: now,
      author: 'Superadmin FRAOVIA',
      changeNote: `Restaurado a partir de la versión anterior ${versionNumber}`,
      elements: JSON.parse(JSON.stringify(targetVersion.elements)),
      backgroundConfig: JSON.parse(JSON.stringify(targetVersion.backgroundConfig))
    };

    targetDesign.elements = JSON.parse(JSON.stringify(targetVersion.elements));
    targetDesign.backgroundConfig = JSON.parse(JSON.stringify(targetVersion.backgroundConfig));
    targetDesign.currentVersion = nextVer;
    targetDesign.updatedAt = now;
    targetDesign.versions.push(restoredEntry);

    this.designs[idx] = targetDesign;
    this.persist();
    return targetDesign;
  }

  publishDesign(
    designId: string,
    target: 'this_club' | 'selected_clubs' | 'all_clubs',
    selectedClubIds: string[],
    allClubs: Club[],
    currentUser: User
  ): { updatedDesign: SavedDesign; affectedClubsCount: number } {
    this.load();
    const idx = this.designs.findIndex(d => d.id === designId);
    if (idx === -1) throw new Error('Diseño no encontrado');

    const design = this.designs[idx];
    const nextVer = this.calculateNextVersion(design.currentVersion, 'minor');
    const now = new Date().toISOString();

    // Determine target clubs
    let targetClubs: Club[] = [];
    if (target === 'this_club') {
      const match = allClubs.find(c => c.id === design.clubId);
      if (match) targetClubs = [match];
    } else if (target === 'selected_clubs') {
      targetClubs = allClubs.filter(c => selectedClubIds.includes(c.id));
    } else if (target === 'all_clubs') {
      targetClubs = [...allClubs];
    }

    // Apply design visual configuration to target clubs safely without altering code/db logic
    for (const club of targetClubs) {
      const updatedBranding = {
        ...club.branding,
        backgroundColor: design.backgroundConfig.color || club.branding?.backgroundColor || '#070D1E',
        bgImageUrl: design.backgroundConfig.imageUrl || club.branding?.bgImageUrl,
        bgImageOpacity: (design.backgroundConfig.opacity ?? 70) / 100,
        bgImageBlur: design.backgroundConfig.blur ?? 0,
        // Match accent if found in first element
        accentColor: design.elements[0]?.accentColor || club.branding?.accentColor || '#38BDF8'
      };

      fraoviaDB.updateClubBranding(club.id, updatedBranding, club.logoUrl, currentUser);
    }

    // Record new version
    const newVersionEntry: DesignVersion = {
      version: nextVer,
      timestamp: now,
      author: currentUser.fullName || 'Superadmin FRAOVIA',
      changeNote: `Publicado e implementado en ${targetClubs.length} club(es) (${target})`,
      elements: JSON.parse(JSON.stringify(design.elements)),
      backgroundConfig: JSON.parse(JSON.stringify(design.backgroundConfig))
    };

    design.status = 'publicado';
    design.currentVersion = nextVer;
    design.publishedTo = target;
    design.publishedClubNames = targetClubs.map(c => c.name);
    design.updatedAt = now;
    design.versions.push(newVersionEntry);

    this.designs[idx] = design;
    this.persist();

    return {
      updatedDesign: design,
      affectedClubsCount: targetClubs.length
    };
  }

  createNewDesign(club: Club, name?: string, templateId?: string): SavedDesign {
    this.load();
    const tpl = INITIAL_PRESET_TEMPLATES.find(t => t.id === templateId) || INITIAL_PRESET_TEMPLATES[0];
    const designId = `design-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newDesign: SavedDesign = {
      id: designId,
      name: name?.trim() || `Diseño ${club.name} ${new Date().getFullYear()}`,
      clubId: club.id,
      clubName: club.name,
      status: 'borrador',
      currentVersion: 'v1.0',
      publishedTo: 'none',
      publishedClubNames: [],
      createdAt: now,
      updatedAt: now,
      backgroundConfig: JSON.parse(JSON.stringify(tpl.backgroundConfig)),
      elements: JSON.parse(JSON.stringify(tpl.elements)),
      versions: [
        {
          version: 'v1.0',
          timestamp: now,
          author: 'Superadmin FRAOVIA',
          changeNote: `Creación inicial a partir de plantilla "${tpl.name}"`,
          elements: JSON.parse(JSON.stringify(tpl.elements)),
          backgroundConfig: JSON.parse(JSON.stringify(tpl.backgroundConfig))
        }
      ]
    };

    this.designs.unshift(newDesign);
    this.persist();
    return newDesign;
  }

  createNewGlobalDesign(name?: string, templateId?: string): SavedDesign {
    this.load();
    const tpl = INITIAL_PRESET_TEMPLATES.find(t => t.id === templateId) || INITIAL_PRESET_TEMPLATES[0];
    const designId = `design-global-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newDesign: SavedDesign = {
      id: designId,
      name: name?.trim() || `Plantilla Universal FRAOVIA ${new Date().getFullYear()}`,
      clubId: 'global',
      clubName: 'Sin club asignado (Plantilla Universal)',
      status: 'borrador',
      currentVersion: 'v1.0',
      publishedTo: 'none',
      publishedClubNames: [],
      createdAt: now,
      updatedAt: now,
      backgroundConfig: JSON.parse(JSON.stringify(tpl.backgroundConfig)),
      elements: JSON.parse(JSON.stringify(tpl.elements)),
      versions: [
        {
          version: 'v1.0',
          timestamp: now,
          author: 'Superadmin FRAOVIA',
          changeNote: `Plantilla universal independiente creada a partir de "${tpl.name}"`,
          elements: JSON.parse(JSON.stringify(tpl.elements)),
          backgroundConfig: JSON.parse(JSON.stringify(tpl.backgroundConfig))
        }
      ]
    };

    this.designs.unshift(newDesign);
    this.persist();
    return newDesign;
  }

  private calculateNextVersion(current: string, type: 'major' | 'minor'): string {
    const clean = current.replace(/^v/, '');
    const parts = clean.split('.').map(n => parseInt(n, 10) || 0);
    const major = parts[0] || 1;
    const minor = parts[1] || 0;

    if (type === 'major') {
      return `v${major + 1}.0`;
    }
    return `v${major}.${minor + 1}`;
  }
}

export const visualDesignService = new VisualDesignService();
