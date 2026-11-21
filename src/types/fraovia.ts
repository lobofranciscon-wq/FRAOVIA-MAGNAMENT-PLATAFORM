export type UserRole = 
  | 'SUPERADMIN' 
  | 'DUEÑO' 
  | 'ADMINISTRACIÓN' 
  | 'GENERAL' 
  | 'PROFESOR' 
  | 'TIENDA';

export type PlanStatus = 'activo' | 'inactivo' | 'archivado';
export type SeasonStatus = 'activa' | 'cerrada' | 'futura';
export type PlayerStatus = 'activo' | 'inactivo' | 'restringido' | 'moroso' | 'suspendido';
export type ReceiptStatus = 'emitido' | 'anulado';
export type CashBoxType = 'general' | 'disciplina' | 'subpunto' | 'tienda' | 'viajes';
export type CashMovementType = 'ingreso' | 'egreso';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface PredefinedColorPalette {
  id: string;
  name: string;
  category: 'Clásicos Tradicionales' | 'Modernos & Tácticos' | 'Institucionales';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bannerGradient: string;
  description: string;
}

export const PREDEFINED_COLOR_PALETTES: PredefinedColorPalette[] = [
  {
    id: 'azul_oro',
    name: 'Azul & Oro Glorioso',
    category: 'Clásicos Tradicionales',
    primaryColor: '#003366',
    secondaryColor: '#FFB81C',
    accentColor: '#F59E0B',
    bannerGradient: 'linear-gradient(135deg, #002244 0%, #003366 50%, #FFB81C 100%)',
    description: 'Estilo clásico inspirado en Boca Juniors y Rosario Central.'
  },
  {
    id: 'rojo_carbon',
    name: 'Rojo Pasión & Carbón',
    category: 'Clásicos Tradicionales',
    primaryColor: '#C8102E',
    secondaryColor: '#18181B',
    accentColor: '#EF4444',
    bannerGradient: 'linear-gradient(135deg, #7F1D1D 0%, #C8102E 60%, #18181B 100%)',
    description: 'Fuerza e intensidad inspirado en River Plate, Independiente y Estudiantes.'
  },
  {
    id: 'albiceleste_marino',
    name: 'Celeste Cielo & Marino',
    category: 'Clásicos Tradicionales',
    primaryColor: '#0284C7',
    secondaryColor: '#0B192C',
    accentColor: '#38BDF8',
    bannerGradient: 'linear-gradient(135deg, #0B192C 0%, #0284C7 60%, #38BDF8 100%)',
    description: 'Elegancia celeste inspirado en Racing Club, Belgrano y selecciones.'
  },
  {
    id: 'verde_esmeralda',
    name: 'Verde Esmeralda Institucional',
    category: 'Clásicos Tradicionales',
    primaryColor: '#006837',
    secondaryColor: '#0F172A',
    accentColor: '#10B981',
    bannerGradient: 'linear-gradient(135deg, #064E3B 0%, #006837 50%, #10B981 100%)',
    description: 'Verde tradicional inspirado en Ferro Carril Oeste, Banfield y Sarmiento.'
  },
  {
    id: 'granate_clasico',
    name: 'Granate & Borgoña Imperial',
    category: 'Clásicos Tradicionales',
    primaryColor: '#6B1D2F',
    secondaryColor: '#1C1917',
    accentColor: '#9F1239',
    bannerGradient: 'linear-gradient(135deg, #3B0D16 0%, #6B1D2F 60%, #9F1239 100%)',
    description: 'Distinción histórica inspirada en Lanús y Defensores.'
  },
  {
    id: 'azulgrana_intenso',
    name: 'Azulgrana Metropolitano',
    category: 'Clásicos Tradicionales',
    primaryColor: '#002D62',
    secondaryColor: '#A51C30',
    accentColor: '#2563EB',
    bannerGradient: 'linear-gradient(135deg, #001B3A 0%, #002D62 40%, #A51C30 100%)',
    description: 'Equilibrio en azul y rojo inspirado en San Lorenzo de Almagro.'
  },
  {
    id: 'cyber_dark_neon',
    name: 'Cyber Dark & Oro Neón',
    category: 'Modernos & Tácticos',
    primaryColor: '#0F172A',
    secondaryColor: '#F59E0B',
    accentColor: '#FBBF24',
    bannerGradient: 'linear-gradient(135deg, #020617 0%, #0F172A 70%, #F59E0B 100%)',
    description: 'Acabado oscuro ultra-táctico con acentos dorados para academias modernas.'
  },
  {
    id: 'indigo_violet',
    name: 'Violeta Eléctrico & Cian',
    category: 'Modernos & Tácticos',
    primaryColor: '#4F46E5',
    secondaryColor: '#06B6D4',
    accentColor: '#818CF8',
    bannerGradient: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #06B6D4 100%)',
    description: 'Diseño vanguardista de alto contraste para centros deportivos de alta performance.'
  },
  {
    id: 'blanco_negro_minimal',
    name: 'Monocromo Minimalista Pro',
    category: 'Institucionales',
    primaryColor: '#1E293B',
    secondaryColor: '#475569',
    accentColor: '#94A3B8',
    bannerGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #64748B 100%)',
    description: 'Estilo sobrio, limpio e institucional para clubes náuticos y federaciones.'
  }
];

export interface ClubBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string; // Software background color (e.g. #070D1E)
  bgImageUrl?: string; // Background photo for software
  bgImageOpacity?: number; // 0 to 1 (translucency)
  bgImageBlur?: number; // 0 to 20px
  darkSidebar: boolean;
  coverUrl?: string;
  badgeUrl?: string;
  watermarkUrl?: string;
  bannerGradient?: string;
  watermarkOpacity?: number; // e.g. 0.18
  bannerStyle?: 'watermark' | 'cover_blur' | 'clean_gradient';
  headerSize?: 'compact' | 'normal' | 'large';
  templateName?: string;
  
  // Professional Software Typography & Style:
  fontFamily?: 'system' | 'inter' | 'montserrat' | 'teko' | 'roboto' | 'oswald';
  fontSize?: 'compact' | 'normal' | 'large';
  headerWeight?: 'normal' | 'bold' | 'black';
  slogan?: string;
  
  // Specific CSS & Predefined Palette Extensions:
  palettePresetId?: string; // Predefined palette ID
  customCss?: string; // Custom CSS stylesheet text
  customCssUrl?: string; // External stylesheet URL
  cssEnabled?: boolean; // Whether custom CSS is active
  customCssUpdatedAt?: string;
  boxCustomStyles?: Record<string, any>; // Click-to-edit box customizations
}

export interface ClubFrontendTemplate {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  bannerGradient: string;
  watermarkOpacity: number;
  bannerStyle: 'watermark' | 'cover_blur' | 'clean_gradient';
  headerSize: 'compact' | 'normal' | 'large';
  previewImageUrl?: string;
}

export interface ReceiptTemplateConfig {
  showBadge: boolean;
  showWatermark: boolean;
  badgeUrl?: string; // Escudo oficial
  watermarkUrl?: string; // Marca de agua
  watermarkOpacity: number; // 0.05 a 0.35 (default: 0.15)
  headerTitle?: string;
  footerLegend?: string;
  primaryColor?: string;
}

export interface ClubWhatsAppConfig {
  adminPhone: string; // WhatsApp oficial de Administración / Tesorería (ej: +54 9 11 4455-8899)
  storePhone: string; // WhatsApp oficial de Tienda / Mostrador (ej: +54 9 11 5566-7788)
  adminMessageTemplate?: string;
  storeMessageTemplate?: string;
}

export interface FeeReminderAutomationConfig {
  enabled: boolean;
  startDayOfMonth: number; // e.g. 1 to 5 (Día en que inicia el envío de avisos)
  dueDayOfMonth: number; // e.g. 10 or 15 (Fecha aproximada de vencimiento de saldo)
  graceDays: number; // Días de gracia antes de recargo o bloqueo
  messageTemplate: string;
  cbuAlias?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  lastRunDate?: string;
  autoSendOnMonthStart: boolean;
}

export type SubscriptionAlertMode = 'disabled' | 'cartel' | 'cuenta_regresiva';

export interface SubscriptionAlertConfig {
  mode: SubscriptionAlertMode;
  expirationDate: string; // ISO string e.g. "2026-10-15T23:59:59Z"
  customMessage?: string;
  supportContact?: string;
  showToRoles?: UserRole[];
}

export interface ClubStagingDraft {
  id: string;
  clubId: string;
  versionName: string;
  createdAt: string;
  updatedAt: string;
  status: 'borrador' | 'en_prueba' | 'aplicada' | 'descartada';
  authorSuperadminEmail: string;
  notes?: string;
  modifiedModules: {
    base: boolean;
    deportivo: boolean;
    caja: boolean;
    tienda: boolean;
    multiSportIsolation: boolean;
  };
  contractedPlayersQuota: number;
  contractedUsersQuota: number;
  statusMode: 'activo' | 'suspendido' | 'en_mantenimiento';
  disciplinesDraft: {
    id: string;
    name: string;
    code: string;
    iconName: string;
    active: boolean;
    coordinatorName?: string;
  }[];
  cashBoxesDraft: {
    id: string;
    name: string;
    type: CashBoxType;
    active: boolean;
    currentBalance: number;
  }[];
  enabledUserIds: string[];
  disabledUserIds: string[];
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  cuit: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  status: 'activo' | 'suspendido' | 'en_mantenimiento';
  currentSeasonId: string;
  subscriptionPlanId: string;
  contractedPlayersQuota: number;
  contractedUsersQuota: number;
  monthlyGoal?: number;
  versionNumber?: number;
  branding: ClubBranding;
  whatsappConfig?: ClubWhatsAppConfig;
  receiptTemplate?: ReceiptTemplateConfig;
  feeReminderAutomation?: FeeReminderAutomationConfig;
  subscriptionAlert?: SubscriptionAlertConfig;
  activeModules: {
    base: boolean;
    deportivo: boolean;
    caja: boolean;
    tienda: boolean;
    multiSportIsolation?: boolean; // Sub-entidades y finanzas aisladas por deporte
    portalFamilias?: boolean; // Permite esconder / mostrar el portal de familias
    viajesTorneos?: boolean; // Módulo de Viajes, Giras & Torneos con caja exclusiva
    asistencia?: boolean;
    feeReminders?: boolean;
  };
  stagingDraft?: ClubStagingDraft | null;
  createdAt: string;
}

export interface Season {
  id: string;
  clubId: string;
  name: string;
  year: number;
  status: SeasonStatus;
  startDate: string;
  endDate: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  clubId: string | null; // null only if SUPERADMIN
  status: 'activo' | 'restringido' | 'deshabilitado';
  phone?: string;
  password?: string; // Clave de acceso gestionable por Superadmin
  tempPasswordChangedAt?: string;
  // Role scope for PROFESOR or scoped admins
  scope?: {
    disciplineIds?: string[];
    categoryIds?: string[];
  };
  createdAt: string;
  lastLogin?: string;
}

export interface Discipline {
  id: string;
  clubId: string;
  name: string;
  code: string;
  iconName: string;
  active: boolean;
  coordinatorName?: string;
}

export type SportsDivisionTier = 
  // Fútbol Tucumano / Regional
  | 'Escuelita' 
  | 'Pre-Infantiles' 
  | 'Infantiles' 
  | 'Inferiores' 
  | 'Reserva' 
  | 'Primera'
  // Básquet (CAB / Asociaciones)
  | 'Mosquitos'
  | 'Pre-Mini'
  | 'Mini'
  | 'U13'
  | 'U15'
  | 'U17'
  | 'U19'
  | 'U21'
  | 'Primera Básquet'
  // General / Otros
  | 'Veteranos / Senior'
  | 'Recreativo';

export interface ColorBlock {
  id: string;
  clubId?: string;
  name: string; // e.g. "Blanco", "Azul", "Negro", "Rojo", "Verde", "Oro"
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface Category {
  id: string;
  clubId: string;
  disciplineId: string;
  name: string;
  ageGroup: string;
  gender: 'Masculino' | 'Femenino' | 'Mixto';
  monthlyFee: number;
  trainingSchedule?: string;
  colorBlockId?: string;
  colorBlockName?: string;
  colorHex?: string;
  divisionTier?: SportsDivisionTier;
  coachId?: string;
  coachName?: string;
}

/** Tipos de cobro que se pueden hacer a un deportista desde "Cobrar". */
export type ChargeType = 'cuota' | 'inscripcion' | 'seguro' | 'ficha_medica';

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  cuota: 'Cuota',
  inscripcion: 'Inscripción',
  seguro: 'Seguro',
  ficha_medica: 'Ficha médica'
};

export type SuspensionReason ='impago' | 'mal_comportamiento' | 'apto_medico' | 'lesion' | 'otro';

export const SUSPENSION_REASON_LABELS: Record<SuspensionReason, string> = {
  impago: 'Impago de cuotas',
  mal_comportamiento: 'Mal comportamiento',
  apto_medico: 'Apto médico vencido o faltante',
  lesion: 'Lesión',
  otro: 'Otro motivo'
};

export interface Player {
  id: string;
  clubId: string;
  disciplineId: string;
  categoryId: string;
  colorBlockName?: string;
  coachId?: string;
  coachName?: string;
  dni: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalCertificateValid: boolean;
  medicalExpiryDate?: string;
  photoUrl?: string;
  position?: string;
  jerseyNumber?: number;
  dominantSide?: 'diestro' | 'zurdo' | 'ambidiestro';
  bloodType?: string;
  medicalNotes?: string;
  healthInsurance?: string;
  scholarshipPercent?: number;
  scholarshipType?: 'ninguna' | 'media' | 'completa' | 'personalizada';
  scholarshipReason?: string;
  /** Grupo familiar (descuento por hermanos) y descuento que se le aplica por eso. */
  familyGroupId?: string;
  familyDiscountPercent?: number;
  status: PlayerStatus;
  /** Calculado en la app: deportista recién cargado que todavía no tiene ningún comprobante de pago. */
  pendingFirstPayment?: boolean;
  suspensionReason?: SuspensionReason;
  suspensionNote?: string;
  suspendedAt?: string;
  // Crucial: isRestricted is true when club downgrades plan and players exceed quota.
  // Restricted players are read-only and retain all history!
  isRestricted: boolean;
  restrictedReason?: string;
  monthlyFeeDue: number;
  balance: number; // positive = debtor, 0 = al dia, negative = a favor
  joinedDate: string;
  insuranceStatus?: string;
  monthlyPayments?: Record<string, 'P' | 'A' | '-'>;
}

export interface AttendanceRecord {
  id: string;
  clubId: string;
  categoryId: string;
  date: string;
  sessionTitle: string;
  recordedByUserId: string;
  isSuspended?: boolean;
  suspensionReason?: 'lluvia' | 'clima' | 'mantenimiento' | 'feriado' | 'fuerza_mayor' | 'otro';
  suspensionNotes?: string;
  entries: {
    playerId: string;
    status: 'presente' | 'ausente' | 'justificado' | 'lesionado';
    notes?: string;
  }[];
}

export interface ProvisionalPlayer {
  id: string;
  clubId: string;
  disciplineId: string;
  categoryId: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  photoUrl?: string;
  coachId: string;
  coachName: string;
  createdAt: string;
  status: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado';
}

export interface CoachApprovalRequest {
  id: string;
  clubId: string;
  coachId: string;
  coachName: string;
  categoryId: string;
  categoryName: string;
  disciplineId: string;
  requestDate: string;
  status: 'pendiente' | 'aprobado_parcial' | 'aprobado_total' | 'rechazado';
  players: ProvisionalPlayer[];
  coachNotes?: string;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
}

export interface TrainingSession {
  id: string;
  clubId: string;
  categoryId: string;
  date: string;
  title: string;
  objective: string;
  observations?: string;
  recordedByUserId: string;
}

export interface CommercialPlan {
  id: string;
  name: string;
  description: string;
  status: PlanStatus;
  monthlyPrice: number;
  annualPrice: number;
  maxPlayers: number;
  maxLoginUsers: number;
  storageGb: number;
  modules: {
    base: boolean;
    deportivo: boolean;
    caja: boolean;
    tienda: boolean;
    [key: string]: boolean;
  };
  features: {
    excelImport: boolean;
    exportSystem: boolean;
    attendanceTracker: boolean;
    advancedStats: boolean;
    receipts: boolean;
    customBranding: boolean;
    subCashBoxes: boolean;
  };
  addons: {
    playerBlockSize: number;
    playerBlockPrice: number;
    extraUserPrice: number;
    extraStorageGbPrice: number;
  };
  maxDisciplines: number | 'unlimited';
  isCustomForClubId?: string; // If custom crafted for a specific club
}

export interface CashBox {
  id: string;
  clubId: string;
  name: string;
  type: CashBoxType;
  parentBoxId?: string; // For subpoints
  disciplineId?: string;
  responsibleUserId: string;
  currentBalance: number;
  status: 'abierta' | 'cerrada';
  initialCashAmount?: number;
  openedAt?: string;
  openedByUserId?: string;
  shiftName?: string;
  closedAt?: string;
  closedByUserId?: string;
  closedCountedAmount?: number;
  closingDifference?: number;
}

export interface CashMovement {
  id: string;
  clubId: string;
  cashBoxId: string;
  type: CashMovementType;
  amount: number;
  concept: string;
  category: 'cuota' | 'inscripcion' | 'tienda' | 'viaje' | 'proveedor' | 'sueldo' | 'mantenimiento' | 'otro';
  sector?: 'administracion' | 'tienda';
  receiptId?: string;
  paymentMethod: PaymentMethod;
  registeredByUserId: string;
  timestamp: string;
  notes?: string;
}

export interface TripParticipant {
  playerId: string;
  playerFullName: string;
  playerDni: string;
  originalCategoryId?: string;
  originalCategoryName: string;
  tutorName?: string;
  tutorPhone?: string;
  totalCost: number;
  amountPaid: number;
  notes?: string;
  status: 'al_dia' | 'en_pagos' | 'pendiente';
}

export interface TripTournament {
  id: string;
  clubId: string;
  tournamentName: string; // e.g. "Torneo Gorriti"
  destination: string;    // e.g. "Córdoba, Argentina"
  datesDescription: string; // e.g. "15 al 18 de Noviembre 2026"
  categoryDescription: string; // e.g. "Categoría 2013 Blanca" (Seleccionado)
  coachesInCharge: string; // e.g. "Prof. Marcos Ruiz, DT Lucas Gómez"
  costPerPlayer: number;  // e.g. 180000
  bannerImageUrl?: string;
  cashBoxId: string;      // ID de la caja exclusiva creada para este viaje
  status: 'planificacion' | 'en_recaudacion' | 'confirmado' | 'viajando' | 'finalizado';
  participants: TripParticipant[];
  createdAt: string;
}

export type ReceiptItemKind = 'cuota' | 'cuota_hermano' | 'inscripcion' | 'seguro' | 'ficha_medica' | 'otro';

export interface ReceiptItem {
  description: string;
  /** Qué se está cobrando en este renglón (permite mezclar cuota, inscripción y seguro en un solo comprobante). */
  kind?: ReceiptItemKind;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  id: string;
  clubId: string;
  receiptNumber: string; // Sequential: FRA-2026-000412
  date: string;
  customerName: string;
  customerDni?: string;
  playerId?: string;
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: ReceiptStatus;
  sector?: 'administracion' | 'tienda';
  voidReason?: string;
  voidedAt?: string;
  voidedByUserId?: string;
  items: ReceiptItem[];
  cashBoxId?: string;
  cashMovementId?: string;
  issuedByUserId: string;
}

export const getReceiptSector = (receipt: { sector?: 'administracion' | 'tienda'; concept?: string; items?: { description: string }[] }): 'administracion' | 'tienda' => {
  if (receipt.sector) return receipt.sector;
  const conceptLower = (receipt.concept || '').toLowerCase();
  const isTiendaConcept = 
    conceptLower.includes('tienda') || 
    conceptLower.includes('mostrador') ||
    conceptLower.includes('indumentaria') ||
    conceptLower.includes('camiseta') ||
    conceptLower.includes('short') ||
    conceptLower.includes('merchandising') ||
    conceptLower.includes('botin') ||
    conceptLower.includes('pelota') ||
    conceptLower.includes('artículo') ||
    conceptLower.includes('articulo') ||
    conceptLower.includes('producto');
  
  const hasStoreItems = receipt.items?.some(it => {
    const desc = (it.description || '').toLowerCase();
    return desc.includes('tienda') || desc.includes('indumentaria') || desc.includes('camiseta') ||
           desc.includes('short') || desc.includes('botin') || desc.includes('pelota') ||
           desc.includes('gorra') || desc.includes('buzo') || desc.includes('medias');
  });

  return (isTiendaConcept || hasStoreItems) ? 'tienda' : 'administracion';
};

export interface StoreProduct {
  id: string;
  clubId: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  status: 'disponible' | 'agotado' | 'discontinuado';
  sizes?: string[];
  sizesStock?: Record<string, number>;
  description?: string;
}

export interface StoreSale {
  id: string;
  clubId: string;
  receiptId: string;
  cashierUserId: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  appliedPromotionName?: string;
  paymentMethod: PaymentMethod;
  customerName?: string;
  items: {
    productId: string;
    productName: string;
    size?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  timestamp: string;
}

export type PromotionType = 'porcentaje' | 'monto_fijo';

export interface StorePromotion {
  id: string;
  clubId: string;
  name: string; // ej: "Descuento Socios 15%", "Promo Lanzamiento $5.000 OFF"
  code?: string; // ej: "SOCIO15", "CAMPEON2026"
  type: PromotionType;
  value: number; // 15 (%) o 5000 ($)
  appliesTo: 'todo_el_catalogo' | 'categoria' | 'producto';
  targetCategory?: string; // ej: "Indumentaria"
  targetProductId?: string; // ej: "prod-01"
  minPurchaseAmount?: number;
  status: 'activa' | 'pausada';
  validUntil?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface BetaFeature {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'experimental' | 'preview' | 'general_availability';
  enabledClubIds: string[];
}

export interface AuditLog {
  id: string;
  clubId: string | null;
  userId: string;
  userName: string;
  role: UserRole;
  timestamp: string;
  action: string;
  detail: string;
  category: 'seguridad' | 'caja' | 'planes' | 'jugadores' | 'sistema' | 'superadmin' | 'tienda' | 'administracion';
}

// Backup & Cloud Storage Types for SUPERADMIN
export type BackupFrequency = 'manual' | 'diaria' | 'semanal' | 'mensual';
export type BackupStatus = 'completado' | 'en_progreso' | 'programado' | 'fallido';
export type CloudStorageProvider = 'gcs' | 'supabase_storage' | 's3_cold_storage';

export interface ClubBackupPolicy {
  id: string;
  clubId: string;
  frequency: BackupFrequency;
  timeOfDay: string;
  provider: CloudStorageProvider;
  bucketName: string;
  region: string;
  retentionDays: number;
  encryption: 'AES-256-GCM' | 'KMS-Hardware';
  includeAuditLogs: boolean;
  includeMedicalDocs: boolean;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

export interface ClubBackupSnapshot {
  id: string;
  clubId: string;
  clubName: string;
  filename: string;
  fileSizeBytes: number;
  recordCount: {
    players: number;
    receipts: number;
    cashMovements: number;
    attendance: number;
    auditLogs: number;
  };
  storageProvider: CloudStorageProvider;
  cloudBucket: string;
  cloudPath: string;
  checksumSha256: string;
  status: BackupStatus;
  createdAt: string;
  completedAt?: string;
  initiatedBy: string;
  rawJsonData?: string;
}
