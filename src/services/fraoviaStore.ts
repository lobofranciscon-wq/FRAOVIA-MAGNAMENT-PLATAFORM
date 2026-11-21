import {
  Club,
  Season,
  User,
  Discipline,
  Category,
  Player,
  CommercialPlan,
  CashBox,
  CashMovement,
  Receipt,
  StoreProduct,
  StoreSale,
  StorePromotion,
  BetaFeature,
  AuditLog,
  AttendanceRecord,
  UserRole,
  PaymentMethod,
  ClubBackupPolicy,
  ClubBackupSnapshot,
  ProvisionalPlayer,
  CoachApprovalRequest,
  ClubWhatsAppConfig,
  ReceiptTemplateConfig,
  FeeReminderAutomationConfig,
  SubscriptionAlertConfig,
  ClubStagingDraft,
  TripTournament,
  TripParticipant
} from '../types/fraovia';
import { supabaseAuditService } from './supabaseAuditService';
import { supabaseReceiptService } from './supabaseReceiptService';
import { supabaseStoreService } from './supabaseStoreService';
import { supabaseUserService } from './supabaseUserService';

const STORAGE_KEY = 'fraovia_master_db_v1';

export interface FraoviaDatabaseState {
  clubs: Club[];
  seasons: Season[];
  users: User[];
  disciplines: Discipline[];
  categories: Category[];
  players: Player[];
  plans: CommercialPlan[];
  cashBoxes: CashBox[];
  cashMovements: CashMovement[];
  receipts: Receipt[];
  storeProducts: StoreProduct[];
  storeSales: StoreSale[];
  storePromotions: StorePromotion[];
  betaFeatures: BetaFeature[];
  auditLogs: AuditLog[];
  attendanceRecords: AttendanceRecord[];
  backupPolicies: ClubBackupPolicy[];
  backupSnapshots: ClubBackupSnapshot[];
  provisionalPlayers: ProvisionalPlayer[];
  coachApprovalRequests: CoachApprovalRequest[];
  tripTournaments: TripTournament[];
}

// Initial robust seed data reflecting FRAOVIA domain rules
const INITIAL_PLANS: CommercialPlan[] = [
  {
    id: 'plan-basico',
    name: 'BÁSICO',
    description: 'Para clubes emergentes o academias formativas en crecimiento.',
    status: 'activo',
    monthlyPrice: 45000,
    annualPrice: 450000,
    maxPlayers: 300,
    maxLoginUsers: 5,
    storageGb: 15,
    modules: { base: true, deportivo: true, caja: true, tienda: false },
    features: {
      excelImport: true,
      exportSystem: true,
      attendanceTracker: true,
      advancedStats: false,
      receipts: true,
      customBranding: false,
      subCashBoxes: false
    },
    addons: {
      playerBlockSize: 100,
      playerBlockPrice: 8500,
      extraUserPrice: 5000,
      extraStorageGbPrice: 1200
    },
    maxDisciplines: 3
  },
  {
    id: 'plan-pro',
    name: 'PRO',
    description: 'La solución estándar para clubes medianos con múltiples disciplinas.',
    status: 'activo',
    monthlyPrice: 89000,
    annualPrice: 890000,
    maxPlayers: 800,
    maxLoginUsers: 10,
    storageGb: 50,
    modules: { base: true, deportivo: true, caja: true, tienda: true },
    features: {
      excelImport: true,
      exportSystem: true,
      attendanceTracker: true,
      advancedStats: true,
      receipts: true,
      customBranding: true,
      subCashBoxes: true
    },
    addons: {
      playerBlockSize: 100,
      playerBlockPrice: 7500,
      extraUserPrice: 4200,
      extraStorageGbPrice: 1000
    },
    maxDisciplines: 8
  },
  {
    id: 'plan-business',
    name: 'BUSINESS',
    description: 'Para instituciones consolidadas de alta afluencia y competencia federada.',
    status: 'activo',
    monthlyPrice: 160000,
    annualPrice: 1600000,
    maxPlayers: 1500,
    maxLoginUsers: 20,
    storageGb: 150,
    modules: { base: true, deportivo: true, caja: true, tienda: true },
    features: {
      excelImport: true,
      exportSystem: true,
      attendanceTracker: true,
      advancedStats: true,
      receipts: true,
      customBranding: true,
      subCashBoxes: true
    },
    addons: {
      playerBlockSize: 200,
      playerBlockPrice: 12000,
      extraUserPrice: 3800,
      extraStorageGbPrice: 800
    },
    maxDisciplines: 'unlimited'
  },
  {
    id: 'plan-enterprise',
    name: 'ENTERPRISE',
    description: 'Solución a medida para clubes de primera división o federaciones.',
    status: 'activo',
    monthlyPrice: 320000,
    annualPrice: 3200000,
    maxPlayers: 5000,
    maxLoginUsers: 60,
    storageGb: 500,
    modules: { base: true, deportivo: true, caja: true, tienda: true },
    features: {
      excelImport: true,
      exportSystem: true,
      attendanceTracker: true,
      advancedStats: true,
      receipts: true,
      customBranding: true,
      subCashBoxes: true
    },
    addons: {
      playerBlockSize: 500,
      playerBlockPrice: 20000,
      extraUserPrice: 3000,
      extraStorageGbPrice: 600
    },
    maxDisciplines: 'unlimited'
  }
];

const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-san-martin',
    name: 'Club Atlético San Martín',
    slug: 'san-martin',
    cuit: '30-71448291-8',
    phone: '+54 11 4782-9011',
    email: 'contacto@sanmartin.org.ar',
    address: 'Av. Libertador 4520, Buenos Aires',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=160&auto=format&fit=crop&q=80',
    status: 'activo',
    currentSeasonId: 'season-2026-sm',
    subscriptionPlanId: 'plan-pro',
    contractedPlayersQuota: 800,
    contractedUsersQuota: 10,
    branding: {
      primaryColor: '#10b981', // Emerald green
      secondaryColor: '#0ea5e9',
      darkSidebar: true,
      coverUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'
    },
    whatsappConfig: {
      adminPhone: '+54 9 11 4782-9011',
      storePhone: '+54 9 11 5566-7788',
      adminMessageTemplate: '¡Hola {nombre}! Te compartimos el comprobante oficial #{recibo} de {club} por {concepto} por un valor de {monto}. ¡Muchas gracias por tu compromiso!',
      storeMessageTemplate: '¡Hola {nombre}! Gracias por tu compra en la Tienda Oficial de {club}. Tu comprobante #{recibo} por {monto} ha sido registrado exitosamente.'
    },
    receiptTemplate: {
      showBadge: true,
      showWatermark: true,
      badgeUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=160&auto=format&fit=crop&q=80',
      watermarkUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&auto=format&fit=crop&q=80',
      watermarkOpacity: 0.14,
      headerTitle: 'COMPROBANTE OFICIAL DE COBRO',
      footerLegend: 'Documento no válido como factura fiscal. Válido como constancia interna de cobro y registro contable institucional.',
      primaryColor: '#10b981'
    },
    feeReminderAutomation: {
      enabled: true,
      startDayOfMonth: 1, // Avisa desde el día 1 de cada mes
      dueDayOfMonth: 10,  // Fecha aproximada de vencimiento de saldo: día 10
      graceDays: 5,       // Días de gracia hasta el día 15
      messageTemplate: '¡Hola {socio}! Te recordamos desde la Administración de {club} que la cuota social de {mes} por un valor de ${monto} está próxima a vencer el día {fecha_vencimiento}. Podes regularizar por transferencia al Alias: {cbu_alias}. ¡Muchas gracias!',
      cbuAlias: 'SAN.MARTIN.CUOTAS',
      channel: 'whatsapp',
      autoSendOnMonthStart: true,
      lastRunDate: '2026-10-01'
    },
    subscriptionAlert: {
      mode: 'cuenta_regresiva',
      expirationDate: '2026-10-15T23:59:59Z',
      customMessage: 'El plan mensual PRO de tu institución vencerá próximamente. Regularice el canon mensual para evitar interrupciones en el servicio.',
      supportContact: '+54 9 11 4782-9011',
      showToRoles: ['DUEÑO', 'ADMINISTRACIÓN', 'SUPERADMIN']
    },
    versionNumber: 1.0,
    activeModules: {
      base: true,
      deportivo: true,
      caja: true,
      tienda: true,
      multiSportIsolation: true
    },
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'club-belgrano',
    name: 'Club Social y Deportivo Belgrano',
    slug: 'belgrano',
    cuit: '30-68994321-4',
    phone: '+54 351 422-8900',
    email: 'secretaria@belgranoclub.com',
    address: 'Bv. San Juan 840, Córdoba',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=160&auto=format&fit=crop&q=80',
    status: 'activo',
    currentSeasonId: 'season-2026-belgrano',
    subscriptionPlanId: 'plan-basico',
    contractedPlayersQuota: 300,
    contractedUsersQuota: 5,
    versionNumber: 1.0,
    branding: {
      primaryColor: '#3b82f6', // Azure
      secondaryColor: '#6366f1',
      darkSidebar: true
    },
    activeModules: {
      base: true,
      deportivo: true,
      caja: true,
      tienda: false, // Restringido por plan basico
      multiSportIsolation: false
    },
    createdAt: '2025-02-15T14:30:00Z'
  },
  {
    id: 'club-los-andes',
    name: 'Club Náutico & Social Los Andes',
    slug: 'los-andes',
    cuit: '33-70891234-9',
    phone: '+54 261 498-3344',
    email: 'info@losandesclub.com.ar',
    address: 'Costanera Norte 120, Mendoza',
    logoUrl: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=160&auto=format&fit=crop&q=80',
    status: 'activo',
    currentSeasonId: 'season-2026-andes',
    subscriptionPlanId: 'plan-business',
    contractedPlayersQuota: 1500,
    contractedUsersQuota: 20,
    branding: {
      primaryColor: '#f59e0b', // Amber
      secondaryColor: '#ef4444',
      darkSidebar: true
    },
    activeModules: {
      base: true,
      deportivo: true,
      caja: true,
      tienda: true
    },
    createdAt: '2025-03-01T09:00:00Z'
  }
];

const INITIAL_SEASONS: Season[] = [
  {
    id: 'season-2025-sm',
    clubId: 'club-san-martin',
    name: 'Temporada Oficial 2025',
    year: 2025,
    status: 'cerrada',
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  },
  {
    id: 'season-2026-sm',
    clubId: 'club-san-martin',
    name: 'Temporada Oficial 2026',
    year: 2026,
    status: 'activa',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'season-2026-belgrano',
    clubId: 'club-belgrano',
    name: 'Temporada Belgrano 2026',
    year: 2026,
    status: 'activa',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'season-2026-andes',
    clubId: 'club-los-andes',
    name: 'Temporada Andina 2026',
    year: 2026,
    status: 'activa',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  }
];

const INITIAL_DISCIPLINES: Discipline[] = [
  // San Martín
  { id: 'disc-sm-futbol', clubId: 'club-san-martin', name: 'Fútbol 11', code: 'FUT', iconName: 'Activity', active: true, coordinatorName: 'Martín Palermo' },
  { id: 'disc-sm-basquet', clubId: 'club-san-martin', name: 'Básquetbol', code: 'BSQ', iconName: 'CircleDot', active: true, coordinatorName: 'Rubén Magnano' },
  { id: 'disc-sm-futsal', clubId: 'club-san-martin', name: 'Futsal', code: 'FSL', iconName: 'Flame', active: true, coordinatorName: 'Diego Giustozzi' },
  
  // Belgrano
  { id: 'disc-bel-voley', clubId: 'club-belgrano', name: 'Vóleibol', code: 'VOL', iconName: 'Compass', active: true, coordinatorName: 'Julio Velasco' },
  { id: 'disc-bel-hockey', clubId: 'club-belgrano', name: 'Hockey sobre Césped', code: 'HCK', iconName: 'Shield', active: true, coordinatorName: 'Carlos Retegui' },
  { id: 'disc-bel-tenis', clubId: 'club-belgrano', name: 'Tenis', code: 'TNS', iconName: 'Zap', active: true, coordinatorName: 'Gastón Gaudio' }
];

const INITIAL_CATEGORIES: Category[] = [
  // San Martín Fútbol
  { id: 'cat-sm-fut-primera', clubId: 'club-san-martin', disciplineId: 'disc-sm-futbol', name: 'Primera División', ageGroup: 'Libre / Senior', gender: 'Masculino', monthlyFee: 24000, trainingSchedule: 'Lun, Mié y Vie 20:00', coachId: 'user-sm-profe-2', coachName: 'Prof. Gabriel Heinze', colorBlockName: 'Rojo' },
  { id: 'cat-sm-fut-sub17', clubId: 'club-san-martin', disciplineId: 'disc-sm-futbol', name: 'Sub 17 Juveniles', ageGroup: '16 - 17 años', gender: 'Masculino', monthlyFee: 22000, trainingSchedule: 'Mar y Jue 18:30, Sáb 10:00', coachId: 'user-sm-profe', coachName: 'Prof. Lucas Benítez', colorBlockName: 'Azul' },
  { id: 'cat-sm-fut-sub15', clubId: 'club-san-martin', disciplineId: 'disc-sm-futbol', name: 'Sub 15 Cadetes', ageGroup: '14 - 15 años', gender: 'Masculino', monthlyFee: 20000, trainingSchedule: 'Mar y Jue 17:00, Sáb 09:00', coachId: 'user-sm-profe', coachName: 'Prof. Lucas Benítez', colorBlockName: 'Blanco' },
  // San Martín Básquet
  { id: 'cat-sm-bsq-u17', clubId: 'club-san-martin', disciplineId: 'disc-sm-basquet', name: 'U17 Formativas', ageGroup: '16 - 17 años', gender: 'Mixto', monthlyFee: 21000, trainingSchedule: 'Lun y Mié 18:00', coachId: 'user-sm-profe-bsq', coachName: 'Prof. Sergio Hernández', colorBlockName: 'Oro' },
  { id: 'cat-sm-bsq-u15', clubId: 'club-san-martin', disciplineId: 'disc-sm-basquet', name: 'U15 Infantiles', ageGroup: '14 - 15 años', gender: 'Mixto', monthlyFee: 19000, trainingSchedule: 'Mar y Jue 16:30', coachId: 'user-sm-profe-bsq', coachName: 'Prof. Sergio Hernández', colorBlockName: 'Oro' }
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-superadmin',
    email: 'superadmin@fraovia.com',
    fullName: 'Alejandro Fraovia',
    role: 'SUPERADMIN',
    clubId: null, // Multi-club access
    status: 'activo',
    phone: '+54 9 11 5555-0101',
    password: 'SuperAdmin#2026',
    createdAt: '2024-12-01T00:00:00Z',
    lastLogin: '2026-09-28T16:45:00Z'
  },
  {
    id: 'user-sm-dueno',
    email: 'presidente@sanmartin.org.ar',
    fullName: 'Dr. Roberto San Martín',
    role: 'DUEÑO',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1200',
    password: 'SanMartin#Presi2026',
    createdAt: '2025-01-10T10:00:00Z',
    lastLogin: '2026-09-28T14:10:00Z'
  },
  {
    id: 'user-sm-admin',
    email: 'administracion@sanmartin.org.ar',
    fullName: 'Clara Domínguez',
    role: 'ADMINISTRACIÓN',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1201',
    password: 'Admin#SM2026',
    createdAt: '2025-01-12T11:00:00Z',
    lastLogin: '2026-09-28T16:50:00Z'
  },
  {
    id: 'user-sm-general',
    email: 'gerencia@sanmartin.org.ar',
    fullName: 'Lic. Mariano Rossi',
    role: 'GENERAL',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1202',
    password: 'Gerencia#SM2026',
    createdAt: '2025-01-12T11:00:00Z',
    lastLogin: '2026-09-27T19:00:00Z'
  },
  {
    id: 'user-sm-profe',
    email: 'profesor.futbol@sanmartin.org.ar',
    fullName: 'Prof. Lucas Benítez',
    role: 'PROFESOR',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1203',
    password: 'Futbol#Profe2026',
    scope: {
      disciplineIds: ['disc-sm-futbol'],
      categoryIds: ['cat-sm-fut-sub15', 'cat-sm-fut-sub17'] // Scoped explicitly
    },
    createdAt: '2025-01-15T09:00:00Z',
    lastLogin: '2026-09-28T15:20:00Z'
  },
  {
    id: 'user-sm-profe-2',
    email: 'heinze.formativas@sanmartin.org.ar',
    fullName: 'Prof. Gabriel Heinze',
    role: 'PROFESOR',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1215',
    password: 'Heinze#Profe2026',
    scope: {
      disciplineIds: ['disc-sm-futbol'],
      categoryIds: ['cat-sm-fut-primera']
    },
    createdAt: '2025-02-01T10:00:00Z',
    lastLogin: '2026-09-28T11:00:00Z'
  },
  {
    id: 'user-sm-profe-bsq',
    email: 'sergio.basquet@sanmartin.org.ar',
    fullName: 'Prof. Sergio Hernández',
    role: 'PROFESOR',
    clubId: 'club-san-martin',
    status: 'deshabilitado', // Paused to demo enable/disable toggle
    phone: '+54 9 11 4444-1218',
    password: 'Oveja#Profe2026',
    scope: {
      disciplineIds: ['disc-sm-basquet'],
      categoryIds: ['cat-sm-bsq-u17', 'cat-sm-bsq-u15']
    },
    createdAt: '2025-02-10T14:00:00Z',
    lastLogin: '2026-09-20T17:30:00Z'
  },
  {
    id: 'user-sm-tienda',
    email: 'tienda@sanmartin.org.ar',
    fullName: 'Estefanía Soler',
    role: 'TIENDA',
    clubId: 'club-san-martin',
    status: 'activo',
    phone: '+54 9 11 4444-1204',
    password: 'Tienda#SM2026',
    createdAt: '2025-01-20T12:00:00Z',
    lastLogin: '2026-09-28T13:40:00Z'
  },
  // Belgrano user (Independent account for different club)
  {
    id: 'user-belgrano-admin',
    email: 'secretaria@belgranoclub.com',
    fullName: 'Nicolás Ferrero',
    role: 'ADMINISTRACIÓN',
    clubId: 'club-belgrano',
    status: 'activo',
    phone: '+54 9 351 555-8811',
    password: 'Belgrano#2026',
    createdAt: '2025-02-15T14:30:00Z',
    lastLogin: '2026-09-28T10:00:00Z'
  }
];

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'ply-sm-01',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub17',
    colorBlockName: 'Azul',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    dni: '48901234',
    firstName: 'Mateo',
    lastName: 'González',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    birthDate: '2009-04-12',
    phone: '+54 11 9876-5432',
    email: 'padre.gonzalez@gmail.com',
    emergencyContact: { name: 'Gustavo González (Padre)', relationship: 'Padre', phone: '+54 11 9876-5430' },
    medicalCertificateValid: true,
    medicalExpiryDate: '2027-02-15',
    status: 'activo',
    isRestricted: false,
    monthlyFeeDue: 22000,
    balance: 0,
    joinedDate: '2024-03-01',
    monthlyPayments: { FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: '-', AGOS: '-', SEPT: '-', OCT: '-', NOV: '-', DIC: '-' }
  },
  {
    id: 'ply-sm-02',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub17',
    colorBlockName: 'Azul',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    dni: '48872110',
    firstName: 'Thiago',
    lastName: 'Vázquez',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    birthDate: '2009-08-25',
    phone: '+54 11 8765-4321',
    email: 'familia.vazquez@hotmail.com',
    emergencyContact: { name: 'Marta Vázquez (Madre)', relationship: 'Madre', phone: '+54 11 8765-4320' },
    medicalCertificateValid: true,
    medicalExpiryDate: '2026-11-30',
    status: 'moroso',
    isRestricted: false,
    monthlyFeeDue: 22000,
    balance: 22000, // Debtor
    joinedDate: '2024-03-01',
    monthlyPayments: { FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'A', JUL: '-', AGOS: '-', SEPT: '-', OCT: '-', NOV: '-', DIC: '-' }
  },
  {
    id: 'ply-sm-03',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub15',
    colorBlockName: 'Blanco',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    dni: '50123987',
    firstName: 'Joaquín',
    lastName: 'Pérez',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    birthDate: '2011-02-10',
    phone: '+54 11 7654-3210',
    email: 'contacto.perez@yahoo.com',
    emergencyContact: { name: 'Carlos Pérez', relationship: 'Tutor', phone: '+54 11 7654-3200' },
    medicalCertificateValid: false,
    medicalExpiryDate: '2026-01-10',
    status: 'activo',
    isRestricted: false,
    monthlyFeeDue: 20000,
    balance: 0,
    joinedDate: '2025-02-10',
    monthlyPayments: { FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: '-', AGOS: '-', SEPT: '-', OCT: '-', NOV: '-', DIC: '-' }
  },
  {
    id: 'ply-sm-04',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub15',
    colorBlockName: 'Blanco',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    dni: '50345678',
    firstName: 'Bautista',
    lastName: 'Morales',
    birthDate: '2011-06-18',
    phone: '+54 11 6543-2109',
    email: 'morales.bauti@gmail.com',
    emergencyContact: { name: 'Silvia Morales', relationship: 'Madre', phone: '+54 11 6543-2100' },
    medicalCertificateValid: true,
    medicalExpiryDate: '2026-12-01',
    status: 'activo',
    isRestricted: false,
    monthlyFeeDue: 20000,
    balance: 40000, // 2 cuotas adeudadas
    joinedDate: '2024-02-15',
    monthlyPayments: { FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'A', JUN: 'A', JUL: '-', AGOS: '-', SEPT: '-', OCT: '-', NOV: '-', DIC: '-' }
  },
  {
    id: 'ply-sm-05',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-primera',
    dni: '41234900',
    firstName: 'Facundo',
    lastName: 'Navarro',
    birthDate: '1998-11-05',
    phone: '+54 11 5432-1098',
    email: 'fnavarro@gmail.com',
    emergencyContact: { name: 'Romina Navarro', relationship: 'Esposa', phone: '+54 11 5432-1000' },
    medicalCertificateValid: true,
    medicalExpiryDate: '2027-01-01',
    status: 'activo',
    isRestricted: false,
    monthlyFeeDue: 24000,
    balance: 0,
    joinedDate: '2023-01-15',
    monthlyPayments: { FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: '-', AGOS: '-', SEPT: '-', OCT: '-', NOV: '-', DIC: '-' }
  },
  // Belgrano player (Strict data isolation verification)
  {
    id: 'ply-bel-01',
    clubId: 'club-belgrano',
    disciplineId: 'disc-bel-voley',
    categoryId: 'cat-bel-voley-u17',
    dni: '49001122',
    firstName: 'Camila',
    lastName: 'Alonso',
    birthDate: '2009-09-09',
    phone: '+54 351 400-2211',
    email: 'alonso.camila@cordoba.com',
    emergencyContact: { name: 'Jorge Alonso', relationship: 'Padre', phone: '+54 351 400-2200' },
    medicalCertificateValid: true,
    medicalExpiryDate: '2026-10-10',
    status: 'activo',
    isRestricted: false,
    monthlyFeeDue: 18000,
    balance: 0,
    joinedDate: '2024-04-01'
  }
];

const INITIAL_CASH_BOXES: CashBox[] = [
  // San Martín: Model 3 - Caja Principal with Subpuntos
  {
    id: 'box-sm-general',
    clubId: 'club-san-martin',
    name: 'Caja Central de Tesorería',
    type: 'general',
    responsibleUserId: 'user-sm-admin',
    currentBalance: 845200,
    status: 'abierta'
  },
  {
    id: 'box-sm-sub-futbol',
    clubId: 'club-san-martin',
    name: 'Subpunto Fútbol 11 & Formativas',
    type: 'subpunto',
    parentBoxId: 'box-sm-general',
    disciplineId: 'disc-sm-futbol',
    responsibleUserId: 'user-sm-admin',
    currentBalance: 192000,
    status: 'abierta'
  },
  {
    id: 'box-sm-sub-basquet',
    clubId: 'club-san-martin',
    name: 'Subpunto Básquetbol Formativo',
    type: 'subpunto',
    parentBoxId: 'box-sm-general',
    disciplineId: 'disc-sm-basquet',
    responsibleUserId: 'user-sm-admin',
    currentBalance: 145000,
    status: 'abierta'
  },
  {
    id: 'box-sm-sub-tienda',
    clubId: 'club-san-martin',
    name: 'Caja Oficial Tienda San Martín',
    type: 'subpunto',
    parentBoxId: 'box-sm-general',
    responsibleUserId: 'user-sm-tienda',
    currentBalance: 78400,
    status: 'abierta'
  },
  {
    id: 'box-viaje-gorriti',
    clubId: 'club-san-martin',
    name: 'Caja Viaje: Torneo Gorriti (Córdoba)',
    type: 'viajes',
    responsibleUserId: 'user-sm-admin',
    currentBalance: 720000,
    status: 'abierta',
    openedAt: '2026-09-01T08:00:00Z',
    openedByUserId: 'user-sm-admin'
  },
  // Belgrano: Model 1 - Caja General
  {
    id: 'box-bel-general',
    clubId: 'club-belgrano',
    name: 'Caja General Belgrano',
    type: 'general',
    responsibleUserId: 'user-belgrano-admin',
    currentBalance: 320000,
    status: 'abierta'
  }
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rec-000101',
    clubId: 'club-san-martin',
    receiptNumber: 'FRA-2026-000101',
    date: '2026-09-28T11:20:00Z',
    customerName: 'Gustavo González (Mateo González)',
    customerDni: '48901234',
    concept: 'Pago Cuota Septiembre 2026 - Sub 17',
    amount: 22000,
    paymentMethod: 'transferencia',
    status: 'emitido',
    sector: 'administracion',
    items: [
      { description: 'Cuota Social & Deportiva Septiembre 2026', quantity: 1, unitPrice: 22000, total: 22000 }
    ],
    cashMovementId: 'mov-000101',
    issuedByUserId: 'user-sm-admin'
  },
  {
    id: 'rec-000102',
    clubId: 'club-san-martin',
    receiptNumber: 'FRA-2026-000102',
    date: '2026-09-28T12:05:00Z',
    customerName: 'Carlos Pérez (Joaquín Pérez)',
    customerDni: '50123987',
    concept: 'Pago Cuota Septiembre + Carnet',
    amount: 25000,
    paymentMethod: 'efectivo',
    status: 'emitido',
    sector: 'administracion',
    items: [
      { description: 'Cuota Deportiva Sub 15', quantity: 1, unitPrice: 20000, total: 20000 },
      { description: 'Emisión Carnet Digital Plastificado', quantity: 1, unitPrice: 5000, total: 5000 }
    ],
    cashMovementId: 'mov-000102',
    issuedByUserId: 'user-sm-admin'
  },
  {
    id: 'rec-000103',
    clubId: 'club-san-martin',
    receiptNumber: 'FRA-2026-000103',
    date: '2026-09-27T15:30:00Z',
    customerName: 'Marcos Benítez',
    customerDni: '38190223',
    concept: 'Indumentaria de Entrenamiento Oficial',
    amount: 34000,
    paymentMethod: 'tarjeta',
    status: 'emitido',
    sector: 'tienda',
    items: [
      { description: 'Camiseta Oficial San Martín 2026', quantity: 1, unitPrice: 24000, total: 24000 },
      { description: 'Short Deportivo Microfibra', quantity: 1, unitPrice: 10000, total: 10000 }
    ],
    cashMovementId: 'mov-000103',
    issuedByUserId: 'user-sm-tienda'
  }
];

const INITIAL_CASH_MOVEMENTS: CashMovement[] = [
  {
    id: 'mov-000101',
    clubId: 'club-san-martin',
    cashBoxId: 'box-sm-sub-futbol',
    type: 'ingreso',
    amount: 22000,
    concept: 'Cobro Cuota Mateo González - Recibo FRA-2026-000101',
    category: 'cuota',
    sector: 'administracion',
    receiptId: 'rec-000101',
    paymentMethod: 'transferencia',
    registeredByUserId: 'user-sm-admin',
    timestamp: '2026-09-28T11:20:00Z'
  },
  {
    id: 'mov-000102',
    clubId: 'club-san-martin',
    cashBoxId: 'box-sm-sub-futbol',
    type: 'ingreso',
    amount: 25000,
    concept: 'Cobro Cuota Joaquín Pérez - Recibo FRA-2026-000102',
    category: 'cuota',
    sector: 'administracion',
    receiptId: 'rec-000102',
    paymentMethod: 'efectivo',
    registeredByUserId: 'user-sm-admin',
    timestamp: '2026-09-28T12:05:00Z'
  },
  {
    id: 'mov-000103',
    clubId: 'club-san-martin',
    cashBoxId: 'box-sm-sub-tienda',
    type: 'ingreso',
    amount: 34000,
    concept: 'Venta Mostrador Tienda - Recibo FRA-2026-000103',
    category: 'tienda',
    sector: 'tienda',
    receiptId: 'rec-000103',
    paymentMethod: 'tarjeta',
    registeredByUserId: 'user-sm-tienda',
    timestamp: '2026-09-27T15:30:00Z'
  }
];

const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-01',
    clubId: 'club-san-martin',
    name: 'Camiseta Titular Oficial San Martín 2026',
    sku: 'SM-IND-001',
    category: 'Indumentaria',
    costPrice: 12000,
    salePrice: 24000,
    stock: 45,
    minStockAlert: 10,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
    status: 'disponible',
    sizes: ['S', 'M', 'L', 'XL'],
    sizesStock: { 'S': 10, 'M': 20, 'L': 12, 'XL': 3 }
  },
  {
    id: 'prod-02',
    clubId: 'club-san-martin',
    name: 'Short Deportivo Microfibra San Martín',
    sku: 'SM-IND-002',
    category: 'Indumentaria',
    costPrice: 5000,
    salePrice: 10000,
    stock: 30,
    minStockAlert: 8,
    status: 'disponible',
    sizes: ['S', 'M', 'L', 'XL'],
    sizesStock: { 'S': 8, 'M': 12, 'L': 8, 'XL': 2 }
  },
  {
    id: 'prod-03',
    clubId: 'club-san-martin',
    name: 'Campera Rompevientos Térmica',
    sku: 'SM-IND-003',
    category: 'Indumentaria',
    costPrice: 18000,
    salePrice: 38000,
    stock: 12,
    minStockAlert: 5,
    status: 'disponible',
    sizes: ['M', 'L', 'XL'],
    sizesStock: { 'M': 4, 'L': 6, 'XL': 2 }
  },
  {
    id: 'prod-04',
    clubId: 'club-san-martin',
    name: 'Botella Térmica de Acero Inoxidable 750ml',
    sku: 'SM-ACC-001',
    category: 'Accesorios',
    costPrice: 4000,
    salePrice: 8500,
    stock: 6,
    minStockAlert: 10,
    status: 'disponible',
    sizes: ['Único'],
    sizesStock: { 'Único': 6 }
  }
];

const INITIAL_STORE_SALES: StoreSale[] = [
  {
    id: 'sale-001',
    clubId: 'club-san-martin',
    receiptId: 'rec-000103',
    cashierUserId: 'user-sm-tienda',
    subtotal: 34000,
    total: 34000,
    paymentMethod: 'tarjeta',
    customerName: 'Marcos Benítez',
    items: [
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'M', quantity: 1, unitPrice: 24000, total: 24000 },
      { productId: 'prod-02', productName: 'Short Deportivo Microfibra San Martín', size: 'M', quantity: 1, unitPrice: 10000, total: 10000 }
    ],
    timestamp: '2026-09-25T15:30:00Z'
  },
  {
    id: 'sale-002',
    clubId: 'club-san-martin',
    receiptId: 'rec-000104',
    cashierUserId: 'user-sm-tienda',
    subtotal: 48000,
    total: 48000,
    paymentMethod: 'efectivo',
    customerName: 'Santiago Rossi',
    items: [
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'L', quantity: 2, unitPrice: 24000, total: 48000 }
    ],
    timestamp: '2026-09-26T11:15:00Z'
  },
  {
    id: 'sale-003',
    clubId: 'club-san-martin',
    receiptId: 'rec-000105',
    cashierUserId: 'user-sm-tienda',
    subtotal: 58000,
    discountAmount: 10000,
    appliedPromotionName: 'Promo Temporada Indumentaria (20% OFF)',
    total: 48000,
    paymentMethod: 'transferencia',
    customerName: 'Valentina Morales',
    items: [
      { productId: 'prod-03', productName: 'Campera Rompevientos Térmica', size: 'M', quantity: 1, unitPrice: 38000, total: 38000 },
      { productId: 'prod-02', productName: 'Short Deportivo Microfibra San Martín', size: 'S', quantity: 1, unitPrice: 10000, total: 10000 },
      { productId: 'prod-02', productName: 'Short Deportivo Microfibra San Martín', size: 'M', quantity: 1, unitPrice: 10000, total: 10000 }
    ],
    timestamp: '2026-09-27T17:40:00Z'
  },
  {
    id: 'sale-004',
    clubId: 'club-san-martin',
    receiptId: 'rec-000106',
    cashierUserId: 'user-sm-tienda',
    subtotal: 89000,
    total: 89000,
    paymentMethod: 'tarjeta',
    customerName: 'Luciano Castro',
    items: [
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'S', quantity: 2, unitPrice: 24000, total: 48000 },
      { productId: 'prod-03', productName: 'Campera Rompevientos Térmica', size: 'L', quantity: 1, unitPrice: 38000, total: 38000 },
      { productId: 'prod-04', productName: 'Botella Térmica 750ml', size: 'Único', quantity: 1, unitPrice: 8500, total: 8500 }
    ],
    timestamp: '2026-09-28T14:20:00Z'
  },
  {
    id: 'sale-005',
    clubId: 'club-san-martin',
    receiptId: 'rec-000107',
    cashierUserId: 'user-sm-tienda',
    subtotal: 72000,
    discountAmount: 10800,
    appliedPromotionName: 'Descuento Socios al Día (15%)',
    total: 61200,
    paymentMethod: 'efectivo',
    customerName: 'Matías Silva',
    items: [
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'XL', quantity: 3, unitPrice: 24000, total: 72000 }
    ],
    timestamp: '2026-09-29T18:10:00Z'
  },
  {
    id: 'sale-006',
    clubId: 'club-san-martin',
    receiptId: 'rec-000108',
    cashierUserId: 'user-sm-tienda',
    subtotal: 106000,
    total: 106000,
    paymentMethod: 'tarjeta',
    customerName: 'Esteban Domínguez',
    items: [
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'M', quantity: 3, unitPrice: 24000, total: 72000 },
      { productId: 'prod-02', productName: 'Short Deportivo Microfibra San Martín', size: 'M', quantity: 2, unitPrice: 10000, total: 20000 },
      { productId: 'prod-04', productName: 'Botella Térmica 750ml', size: 'Único', quantity: 1, unitPrice: 8500, total: 8500 }
    ],
    timestamp: '2026-09-30T16:05:00Z'
  },
  {
    id: 'sale-007',
    clubId: 'club-san-martin',
    receiptId: 'rec-000109',
    cashierUserId: 'user-sm-tienda',
    subtotal: 114000,
    discountAmount: 17100,
    appliedPromotionName: 'Descuento Socios al Día (15%)',
    total: 96900,
    paymentMethod: 'transferencia',
    customerName: 'Gonzalo Navarro',
    items: [
      { productId: 'prod-03', productName: 'Campera Rompevientos Térmica', size: 'XL', quantity: 2, unitPrice: 38000, total: 76000 },
      { productId: 'prod-01', productName: 'Camiseta Titular Oficial San Martín 2026', size: 'L', quantity: 1, unitPrice: 24000, total: 24000 },
      { productId: 'prod-04', productName: 'Botella Térmica 750ml', size: 'Único', quantity: 1, unitPrice: 8500, total: 8500 }
    ],
    timestamp: '2026-10-01T10:30:00Z'
  }
];

const INITIAL_STORE_PROMOTIONS: StorePromotion[] = [
  {
    id: 'promo-01',
    clubId: 'club-san-martin',
    name: 'Descuento Socios al Día (15%)',
    code: 'SOCIO15',
    type: 'porcentaje',
    value: 15,
    appliesTo: 'todo_el_catalogo',
    status: 'activa',
    createdByUserId: 'user-sm-admin',
    createdAt: '2026-09-25T10:00:00Z'
  },
  {
    id: 'promo-02',
    clubId: 'club-san-martin',
    name: 'Promo Temporada Indumentaria (20% OFF)',
    code: 'INDUMENTARIA20',
    type: 'porcentaje',
    value: 20,
    appliesTo: 'categoria',
    targetCategory: 'Indumentaria',
    status: 'activa',
    createdByUserId: 'user-sm-admin',
    createdAt: '2026-09-26T12:00:00Z'
  },
  {
    id: 'promo-03',
    clubId: 'club-san-martin',
    name: 'Bono Lanzamiento Camisetas ($5.000)',
    code: 'CAMISETA5K',
    type: 'monto_fijo',
    value: 5000,
    appliesTo: 'producto',
    targetProductId: 'prod-01',
    status: 'activa',
    createdByUserId: 'user-sm-admin',
    createdAt: '2026-09-27T15:00:00Z'
  }
];

const INITIAL_BETA_FEATURES: BetaFeature[] = [
  {
    id: 'beta-asistencia-ai',
    code: 'BETA_ASISTENCIA_NUEVA',
    name: 'Registro Rápido de Asistencia QR & Reconocimiento',
    description: 'Permite tomar asistencia deportiva escaneando credencial digital desde el móvil en menos de 1 segundo.',
    status: 'experimental',
    enabledClubIds: ['club-san-martin'] // Activada exclusivamente para San Martín
  },
  {
    id: 'beta-gps-tracking',
    code: 'BETA_TELEMETRIA_DEPORTIVA',
    name: 'Métricas de Carga Física y GPS',
    description: 'Sincronización con chalecos GPS de rendimiento atlético para categorías formativas y primera.',
    status: 'preview',
    enabledClubIds: []
  },
  {
    id: 'beta-portal-tutor',
    code: 'BETA_PORTAL_AUTOGESTION_PADRES',
    name: 'Portal de Autogestión para Familias & Carnet Digital',
    description: 'Acceso seguro para que padres descarguen comprobantes y autorizaciones médicas.',
    status: 'preview',
    enabledClubIds: ['club-san-martin', 'club-los-andes']
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    clubId: null,
    userId: 'user-superadmin',
    userName: 'Alejandro Fraovia',
    role: 'SUPERADMIN',
    timestamp: '2026-09-28T09:15:00Z',
    action: 'PLATAFORMA_INICIALIZADA',
    detail: 'Plataforma FRAOVIA inicializada con soporte multi-club y aislamiento RLS.',
    category: 'superadmin'
  },
  {
    id: 'aud-002',
    clubId: 'club-san-martin',
    userId: 'user-sm-admin',
    userName: 'Clara Domínguez',
    role: 'ADMINISTRACIÓN',
    timestamp: '2026-09-28T11:20:00Z',
    action: 'COMPROBANTE_EMITIDO',
    detail: 'Recibo FRA-2026-000101 emitido a Gustavo González por $22,000.',
    category: 'caja'
  },
  {
    id: 'aud-003',
    clubId: 'club-san-martin',
    userId: 'user-superadmin',
    userName: 'Alejandro Fraovia',
    role: 'SUPERADMIN',
    timestamp: '2026-09-28T12:00:00Z',
    action: 'BETA_HABILITADA',
    detail: 'Función Beta "Registro Rápido de Asistencia QR" habilitada para Club Atlético San Martín.',
    category: 'planes'
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-003',
    clubId: 'club-san-martin',
    categoryId: 'cat-sm-fut-sub15',
    date: '2026-09-29',
    sessionTitle: 'Entrenamiento Táctico y Fútbol Reducido',
    recordedByUserId: 'user-sm-profe',
    isSuspended: true,
    suspensionReason: 'lluvia',
    suspensionNotes: 'Alerta meteorológica naranja por tormenta eléctrica y lluvias torrenciales continuas. Canchas anegadas.',
    entries: []
  },
  {
    id: 'att-002',
    clubId: 'club-san-martin',
    categoryId: 'cat-sm-fut-sub15',
    date: '2026-09-27',
    sessionTitle: 'Físico, Circuitos de Fuerza y Velocidad',
    recordedByUserId: 'user-sm-profe',
    entries: [
      { playerId: 'ply-sm-01', status: 'presente', notes: 'Excelente ritmo' },
      { playerId: 'ply-sm-02', status: 'presente' },
      { playerId: 'ply-sm-04', status: 'ausente', notes: 'Falta sin aviso' }
    ]
  },
  {
    id: 'att-001',
    clubId: 'club-san-martin',
    categoryId: 'cat-sm-fut-sub17',
    date: '2026-09-26',
    sessionTitle: 'Táctico y Pelota Parada Pre-partido',
    recordedByUserId: 'user-sm-profe',
    entries: [
      { playerId: 'ply-sm-01', status: 'presente', notes: 'Buen rendimiento físico' },
      { playerId: 'ply-sm-02', status: 'ausente', notes: 'Aviso por examen escolar' },
      { playerId: 'ply-sm-03', status: 'presente' }
    ]
  },
  {
    id: 'att-000',
    clubId: 'club-san-martin',
    categoryId: 'cat-sm-fut-sub15',
    date: '2026-09-22',
    sessionTitle: 'Fundamentos Técnicos y Definición',
    recordedByUserId: 'user-sm-profe',
    entries: [
      { playerId: 'ply-sm-01', status: 'presente' },
      { playerId: 'ply-sm-02', status: 'justificado', notes: 'Certificado odontológico' },
      { playerId: 'ply-sm-04', status: 'lesionado', notes: 'Esguince leve' }
    ]
  }
];

const INITIAL_BACKUP_POLICIES: ClubBackupPolicy[] = [
  {
    id: 'policy-sm-daily',
    clubId: 'club-san-martin',
    frequency: 'diaria',
    timeOfDay: '03:00',
    provider: 'gcs',
    bucketName: 'gs://fraovia-vault-prod-us/san-martin/backups/',
    region: 'us-east1 (N. Virginia)',
    retentionDays: 90,
    encryption: 'AES-256-GCM',
    includeAuditLogs: true,
    includeMedicalDocs: true,
    enabled: true,
    lastRunAt: '2026-09-28T03:00:14Z',
    nextRunAt: '2026-09-29T03:00:00Z'
  },
  {
    id: 'policy-bel-weekly',
    clubId: 'club-belgrano',
    frequency: 'semanal',
    timeOfDay: '02:00',
    provider: 'supabase_storage',
    bucketName: 's3://fraovia-db-snapshots/belgrano/',
    region: 'southamerica-east1 (São Paulo)',
    retentionDays: 30,
    encryption: 'AES-256-GCM',
    includeAuditLogs: true,
    includeMedicalDocs: false,
    enabled: true,
    lastRunAt: '2026-09-27T02:00:19Z',
    nextRunAt: '2026-10-04T02:00:00Z'
  },
  {
    id: 'policy-andes-daily',
    clubId: 'club-los-andes',
    frequency: 'diaria',
    timeOfDay: '04:00',
    provider: 's3_cold_storage',
    bucketName: 'arn:aws:s3:::fraovia-glacier-vault/los-andes/',
    region: 'us-east-1 (Glacier Deep Archive)',
    retentionDays: 365,
    encryption: 'KMS-Hardware',
    includeAuditLogs: true,
    includeMedicalDocs: true,
    enabled: true,
    lastRunAt: '2026-09-28T04:00:22Z',
    nextRunAt: '2026-09-29T04:00:00Z'
  }
];

const INITIAL_BACKUP_SNAPSHOTS: ClubBackupSnapshot[] = [
  {
    id: 'snp-sm-20260928',
    clubId: 'club-san-martin',
    clubName: 'Club Atlético San Martín',
    filename: 'san-martin-snapshot-2026-09-28-0300.fraovia.backup.gz',
    fileSizeBytes: 14889240, // ~14.2 MB
    recordCount: {
      players: 800,
      receipts: 142,
      cashMovements: 48,
      attendance: 64,
      auditLogs: 120
    },
    storageProvider: 'gcs',
    cloudBucket: 'gs://fraovia-vault-prod-us/san-martin/backups/',
    cloudPath: '2026/09/san-martin-snapshot-2026-09-28-0300.fraovia.backup.gz',
    checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    status: 'completado',
    createdAt: '2026-09-28T03:00:00Z',
    completedAt: '2026-09-28T03:00:14Z',
    initiatedBy: 'Cron Scheduler (Cloud Function)'
  },
  {
    id: 'snp-bel-20260927',
    clubId: 'club-belgrano',
    clubName: 'Club Social y Deportivo Belgrano',
    filename: 'belgrano-snapshot-2026-09-27-0200.fraovia.backup.gz',
    fileSizeBytes: 8912400, // ~8.5 MB
    recordCount: {
      players: 300,
      receipts: 86,
      cashMovements: 22,
      attendance: 30,
      auditLogs: 45
    },
    storageProvider: 'supabase_storage',
    cloudBucket: 's3://fraovia-db-snapshots/belgrano/',
    cloudPath: '2026/09/belgrano-snapshot-2026-09-27-0200.fraovia.backup.gz',
    checksumSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    status: 'completado',
    createdAt: '2026-09-27T02:00:00Z',
    completedAt: '2026-09-27T02:00:19Z',
    initiatedBy: 'Cron Scheduler (Cloud Function)'
  },
  {
    id: 'snp-andes-20260928',
    clubId: 'club-los-andes',
    clubName: 'Club Náutico & Social Los Andes',
    filename: 'los-andes-snapshot-2026-09-28-0400.fraovia.backup.gz',
    fileSizeBytes: 24789000, // ~23.6 MB
    recordCount: {
      players: 1500,
      receipts: 310,
      cashMovements: 94,
      attendance: 140,
      auditLogs: 210
    },
    storageProvider: 's3_cold_storage',
    cloudBucket: 'arn:aws:s3:::fraovia-glacier-vault/los-andes/',
    cloudPath: '2026/09/los-andes-snapshot-2026-09-28-0400.fraovia.backup.gz',
    checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    status: 'completado',
    createdAt: '2026-09-28T04:00:00Z',
    completedAt: '2026-09-28T04:00:22Z',
    initiatedBy: 'Cron Scheduler (Cloud Function)'
  }
];

const INITIAL_PROVISIONAL_PLAYERS: ProvisionalPlayer[] = [
  {
    id: 'prov-01',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub15',
    firstName: 'Bautista',
    lastName: 'Romero',
    dni: '51203948',
    birthDate: '2011-05-14',
    phone: '+54 11 4455-8822',
    email: 'familia.romero@gmail.com',
    emergencyContact: {
      name: 'Esteban Romero (Padre)',
      relationship: 'Padre',
      phone: '+54 11 4455-8820'
    },
    notes: 'Delantero centro. Buen estado físico en pruebas iniciales.',
    photoUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    createdAt: '2026-09-29T10:30:00Z',
    status: 'pendiente_aprobacion'
  },
  {
    id: 'prov-02',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub15',
    firstName: 'Santiago',
    lastName: 'Benítez',
    dni: '51384910',
    birthDate: '2011-09-22',
    phone: '+54 11 3322-1199',
    email: 'benitez.santiago@hotmail.com',
    emergencyContact: {
      name: 'Laura Méndez (Madre)',
      relationship: 'Madre',
      phone: '+54 11 3322-1100'
    },
    notes: 'Volante zurdo. Documentación presentada en cancha.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    createdAt: '2026-09-29T11:00:00Z',
    status: 'pendiente_aprobacion'
  },
  {
    id: 'prov-03',
    clubId: 'club-san-martin',
    disciplineId: 'disc-sm-futbol',
    categoryId: 'cat-sm-fut-sub17',
    firstName: 'Valentín',
    lastName: 'Gómez',
    dni: '49120349',
    birthDate: '2009-12-03',
    phone: '+54 11 7788-9900',
    emergencyContact: {
      name: 'Sergio Gómez',
      relationship: 'Padre',
      phone: '+54 11 7788-9901'
    },
    notes: 'Arquero. Asiste a pruebas desde la semana pasada.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    createdAt: '2026-09-30T09:15:00Z',
    status: 'borrador'
  }
];

const INITIAL_COACH_APPROVAL_REQUESTS: CoachApprovalRequest[] = [
  {
    id: 'req-sm-001',
    clubId: 'club-san-martin',
    coachId: 'user-sm-profe',
    coachName: 'Prof. Lucas Benítez',
    categoryId: 'cat-sm-fut-sub15',
    categoryName: 'Sub 15 - Fútbol Formativo',
    disciplineId: 'disc-sm-futbol',
    requestDate: '2026-09-29T11:30:00Z',
    status: 'pendiente',
    players: [INITIAL_PROVISIONAL_PLAYERS[0], INITIAL_PROVISIONAL_PLAYERS[1]],
    coachNotes: 'Solicito el alta definitiva de Bautista y Santiago para la Sub 15. Cumplieron las pruebas físicas y presentaron certificados médicos.'
  }
];

const INITIAL_TRIP_TOURNAMENTS: TripTournament[] = [
  {
    id: 'trip-gorriti-2026',
    clubId: 'club-san-martin',
    tournamentName: 'Torneo Gorriti',
    destination: 'Córdoba Capital, Complejo Deportivo Gorriti',
    datesDescription: '15 al 18 de Noviembre 2026',
    categoryDescription: 'Categoría 2013 Blanca (Seleccionado)',
    coachesInCharge: 'Prof. Marcos Ruiz & DT Lucas Gómez',
    costPerPlayer: 180000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
    cashBoxId: 'box-viaje-gorriti',
    status: 'en_recaudacion',
    participants: [
      {
        playerId: 'p-sm-001',
        playerFullName: 'Mateo González',
        playerDni: '48901234',
        originalCategoryName: 'Sub 17 - 2009 / 2010',
        tutorName: 'Gustavo González',
        tutorPhone: '+54 11 9876-5432',
        totalCost: 180000,
        amountPaid: 180000,
        status: 'al_dia',
        notes: 'Viaje 100% abonado y carnet de torneo presentado.'
      },
      {
        playerId: 'p-sm-002',
        playerFullName: 'Ignacio Sosa',
        playerDni: '51098112',
        originalCategoryName: '2012 / 2013 Formativa',
        tutorName: 'Mariela Sosa',
        tutorPhone: '+54 11 4433-2211',
        totalCost: 180000,
        amountPaid: 120000,
        status: 'en_pagos',
        notes: 'Abonadas 2 cuotas de viaje. Restan $60.000 antes del 10/11.'
      },
      {
        playerId: 'p-sm-003',
        playerFullName: 'Valentín Romero',
        playerDni: '52334901',
        originalCategoryName: '2012 / 2013 Formativa',
        tutorName: 'Carlos Romero',
        tutorPhone: '+54 11 5566-7788',
        totalCost: 180000,
        amountPaid: 120000,
        status: 'en_pagos',
        notes: '2 entregas de $60.000 registradas.'
      },
      {
        playerId: 'p-sm-004',
        playerFullName: 'Felipe Alvarez',
        playerDni: '52889012',
        originalCategoryName: '2012 / 2013 Formativa',
        tutorName: 'Romina Alvarez',
        tutorPhone: '+54 11 9988-1122',
        totalCost: 180000,
        amountPaid: 180000,
        status: 'al_dia',
        notes: 'Abonado en su totalidad con autorización firmada.'
      },
      {
        playerId: 'p-sm-005',
        playerFullName: 'Santino Carrizo',
        playerDni: '53112098',
        originalCategoryName: '2011 / 2012 AFA',
        tutorName: 'Pablo Carrizo',
        tutorPhone: '+54 11 3322-9988',
        totalCost: 180000,
        amountPaid: 60000,
        status: 'en_pagos',
        notes: 'Primera cuota de viaje abonada.'
      },
      {
        playerId: 'p-sm-006',
        playerFullName: 'Joaquín Benítez',
        playerDni: '53445123',
        originalCategoryName: '2011 / 2012 AFA',
        tutorName: 'Silvia Benítez',
        tutorPhone: '+54 11 7766-5544',
        totalCost: 180000,
        amountPaid: 60000,
        status: 'en_pagos',
        notes: 'Convocado como refuerzo del seleccionado.'
      }
    ],
    createdAt: '2026-09-01T10:00:00Z'
  }
];

export class FraoviaStore {
  private state: FraoviaDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): FraoviaDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.backupPolicies) parsed.backupPolicies = INITIAL_BACKUP_POLICIES;
        if (!parsed.backupSnapshots) parsed.backupSnapshots = INITIAL_BACKUP_SNAPSHOTS;
        if (!parsed.provisionalPlayers) parsed.provisionalPlayers = INITIAL_PROVISIONAL_PLAYERS;
        if (!parsed.coachApprovalRequests) parsed.coachApprovalRequests = INITIAL_COACH_APPROVAL_REQUESTS;
        if (!parsed.storePromotions) parsed.storePromotions = INITIAL_STORE_PROMOTIONS;
        if (!parsed.tripTournaments) parsed.tripTournaments = INITIAL_TRIP_TOURNAMENTS;
        if (parsed.players && Array.isArray(parsed.players)) {
          parsed.players.forEach((p: Player) => {
            if (!p.monthlyPayments) {
              const initP = INITIAL_PLAYERS.find(ip => ip.id === p.id);
              if (initP?.monthlyPayments) {
                p.monthlyPayments = { ...initP.monthlyPayments };
              }
            }
          });
        }
        return parsed;
      }
    } catch {
      console.warn('Could not read from localStorage, using initial dataset');
    }

    const defaultState: FraoviaDatabaseState = {
      clubs: INITIAL_CLUBS,
      seasons: INITIAL_SEASONS,
      users: INITIAL_USERS,
      disciplines: INITIAL_DISCIPLINES,
      categories: INITIAL_CATEGORIES,
      players: INITIAL_PLAYERS,
      plans: INITIAL_PLANS,
      cashBoxes: INITIAL_CASH_BOXES,
      cashMovements: INITIAL_CASH_MOVEMENTS,
      receipts: INITIAL_RECEIPTS,
      storeProducts: INITIAL_STORE_PRODUCTS,
      storeSales: INITIAL_STORE_SALES,
      storePromotions: INITIAL_STORE_PROMOTIONS,
      betaFeatures: INITIAL_BETA_FEATURES,
      auditLogs: INITIAL_AUDIT_LOGS,
      attendanceRecords: INITIAL_ATTENDANCE,
      backupPolicies: INITIAL_BACKUP_POLICIES,
      backupSnapshots: INITIAL_BACKUP_SNAPSHOTS,
      provisionalPlayers: INITIAL_PROVISIONAL_PLAYERS,
      coachApprovalRequests: INITIAL_COACH_APPROVAL_REQUESTS,
      tripTournaments: INITIAL_TRIP_TOURNAMENTS
    };

    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: FraoviaDatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist FRAOVIA database state', err);
    }
  }

  // --- MULTI-TENANT QUERY ENFORCEMENT ---
  // Mirrors PostgreSQL Row Level Security (RLS)
  private assertClubAccess(user: User, targetClubId: string | null): boolean {
    if (user.role === 'SUPERADMIN') return true;
    return user.clubId === targetClubId;
  }

  // --- REGLA MODO FANTASMA: SUPERADMIN ES SOLO LECTURA EN CLUBES ---
  private assertNotGhostMode(currentUser: User): void {
    if (currentUser.role === 'SUPERADMIN') {
      throw new Error('FRAOVIA Seguridad: El modo fantasma del SUPERADMIN es estrictamente de solo lectura. Las modificaciones operativas sobre clubes están bloqueadas.');
    }
  }

  // --- GETTERS (WITH RLS SCOPING) ---
  public getClubs(currentUser: User): Club[] {
    if (currentUser.role === 'SUPERADMIN') {
      return [...this.state.clubs];
    }
    return this.state.clubs.filter(c => c.id === currentUser.clubId);
  }

  public getClubById(clubId: string, currentUser: User): Club | undefined {
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error(`Acceso denegado: Aislamiento RLS impide acceder a los datos de otro club.`);
    }
    return this.state.clubs.find(c => c.id === clubId);
  }

  public getDisciplines(clubId: string, currentUser: User): Discipline[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    const list = this.state.disciplines.filter(d => d.clubId === clubId);
    if (currentUser.role === 'PROFESOR' && currentUser.scope?.disciplineIds?.length) {
      return list.filter(d => currentUser.scope!.disciplineIds!.includes(d.id));
    }
    return list;
  }

  public getCategories(clubId: string, currentUser: User, disciplineId?: string): Category[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    if (currentUser.role === 'TIENDA') return []; // TIENDA no ve categorías deportivas
    let list = this.state.categories.filter(c => c.clubId === clubId);
    if (disciplineId) {
      list = list.filter(c => c.disciplineId === disciplineId);
    }
    if (currentUser.role === 'PROFESOR') {
      const allowedScopeCatIds = currentUser.scope?.categoryIds || [];
      if (allowedScopeCatIds.length === 0) return []; // scope vacío = no ve nada
      return list.filter(c => allowedScopeCatIds.includes(c.id));
    }
    return list;
  }

  public createCategory(categoryData: Omit<Category, 'id'>, currentUser: User): Category {
    if (!this.assertClubAccess(currentUser, categoryData.clubId)) {
      throw new Error('Aislamiento RLS: no puede crear categorías en otro club.');
    }
    // Solo DUEÑO, ADMINISTRACIÓN y GENERAL pueden escribir categorías
    if (!['SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL'].includes(currentUser.role)) {
      throw new Error('Permisos insuficientes: solo Dueño y Administración pueden crear categorías.');
    }
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`
    };
    this.state.categories.push(newCategory);
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'CATEGORIA_CREADA',
      `Categoría '${newCategory.name}' registrada en bloque '${newCategory.colorBlockName || 'General'}'`,
      'jugadores',
      categoryData.clubId
    );
    return newCategory;
  }

  public getPlayers(clubId: string, currentUser: User): Player[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    // TIENDA no ve el padrón de jugadores
    if (currentUser.role === 'TIENDA') return [];

    let list = this.state.players.filter(p => p.clubId === clubId);
    if (currentUser.role === 'PROFESOR') {
      const allowedCategories = this.getCategories(clubId, currentUser).map(c => c.id);
      if (allowedCategories.length === 0) return []; // scope vacío = no ve nada
      list = list.filter(p => allowedCategories.includes(p.categoryId));
    }
    return list;
  }

  public getUsers(clubId: string | null, currentUser: User): User[] {
    if (currentUser.role === 'SUPERADMIN') {
      if (clubId) return this.state.users.filter(u => u.clubId === clubId);
      return [...this.state.users];
    }
    return this.state.users.filter(u => u.clubId === currentUser.clubId);
  }

  public getPlans(): CommercialPlan[] {
    return [...this.state.plans];
  }

  public getCashBoxes(clubId: string, currentUser: User): CashBox[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    // Las cajas las ven DUEÑO, ADMINISTRACIÓN, GENERAL y TIENDA; PROFESOR no
    if (currentUser.role === 'PROFESOR') return [];
    return this.state.cashBoxes.filter(b => b.clubId === clubId);
  }

  public getCashMovements(clubId: string, currentUser: User, cashBoxId?: string): CashMovement[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    // Movimientos de caja: DUEÑO, ADMINISTRACIÓN, GENERAL y TIENDA
    if (currentUser.role === 'PROFESOR') return [];
    let list = this.state.cashMovements.filter(m => m.clubId === clubId);
    if (cashBoxId) list = list.filter(m => m.cashBoxId === cashBoxId);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getReceipts(clubId: string, currentUser: User): Receipt[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    // Recibos: ven DUEÑO, ADMINISTRACIÓN, GENERAL y TIENDA
    if (currentUser.role === 'PROFESOR') return [];
    return this.state.receipts
      .filter(r => r.clubId === clubId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getStoreProducts(clubId: string, currentUser: User): StoreProduct[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    return this.state.storeProducts.filter(p => p.clubId === clubId);
  }

  public getStoreSales(clubId: string, currentUser: User): StoreSale[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    // Ventas de tienda: DUEÑO, ADMINISTRACIÓN y TIENDA
    if (currentUser.role === 'PROFESOR') return [];
    return this.state.storeSales
      .filter(s => s.clubId === clubId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getBetaFeatures(): BetaFeature[] {
    return [...this.state.betaFeatures];
  }

  public getAuditLogs(currentUser: User, clubId?: string): AuditLog[] {
    if (currentUser.role === 'SUPERADMIN') {
      if (clubId) return this.state.auditLogs.filter(a => a.clubId === clubId || a.clubId === null);
      return [...this.state.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    // MODO SIGILOSO / INVISIBLE: Los usuarios y directivos del club jamás ven acciones del SUPERADMIN
    return this.state.auditLogs
      .filter(a => a.clubId === currentUser.clubId && a.category !== 'superadmin' && a.role !== 'SUPERADMIN')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getAttendanceRecords(clubId: string, currentUser: User, categoryId?: string): AttendanceRecord[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    let list = this.state.attendanceRecords.filter(a => a.clubId === clubId);
    if (categoryId) list = list.filter(a => a.categoryId === categoryId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getSeasons(clubId: string, currentUser: User): Season[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    return this.state.seasons.filter(s => s.clubId === clubId);
  }

  // --- AUDIT LOGGER ---
  public logAudit(
    currentUser: User,
    action: string,
    detail: string,
    category: AuditLog['category'],
    targetClubId?: string | null
  ) {
    const effectiveClubId = targetClubId !== undefined ? targetClubId : currentUser.clubId;
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clubId: effectiveClubId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      role: currentUser.role,
      timestamp: new Date().toISOString(),
      action,
      detail,
      category
    };
    this.state.auditLogs.unshift(entry);
    this.saveState(this.state);

    // Registro remoto oficial mediante RPC en Supabase (función log_audit con 3 parámetros)
    supabaseAuditService.logAudit({
      action,
      detail,
      category: category as any
    }).catch(err => {
      console.warn('Bitácora remota Supabase:', err);
    });
  }

  // --- PLAN MANAGEMENT & DOWNGRADE RESTRICTION LOGIC ---
  // CORE BUSINESS RULE: Changing plan NEVER deletes records.
  // Excess players or users become read-only / restricted.
  public changeClubPlan(
    clubId: string,
    newPlanId: string,
    currentUser: User,
    customPlayersQuota?: number,
    customUsersQuota?: number
  ): { restrictedPlayersCount: number; restrictedUsersCount: number; message: string } {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new Error('Solo el SUPERADMIN puede cambiar o reconfigurar planes de suscripción.');
    }

    const club = this.state.clubs.find(c => c.id === clubId);
    const plan = this.state.plans.find(p => p.id === newPlanId);
    if (!club || !plan) throw new Error('Club o Plan no encontrado');

    const effectivePlayersQuota = customPlayersQuota ?? plan.maxPlayers;
    const effectiveUsersQuota = customUsersQuota ?? plan.maxLoginUsers;

    club.subscriptionPlanId = plan.id;
    club.contractedPlayersQuota = effectivePlayersQuota;
    club.contractedUsersQuota = effectiveUsersQuota;
    // Sync modules availability
    club.activeModules = {
      base: plan.modules.base,
      deportivo: plan.modules.deportivo,
      caja: plan.modules.caja,
      tienda: plan.modules.tienda
    };

    // Evaluate players quota
    const clubPlayers = this.state.players.filter(p => p.clubId === clubId);
    let restrictedPlayersCount = 0;
    if (clubPlayers.length > effectivePlayersQuota) {
      // Exceeding players become restricted (read-only)
      clubPlayers.forEach((player, index) => {
        if (index >= effectivePlayersQuota) {
          player.isRestricted = true;
          player.restrictedReason = `Excede el cupo de ${effectivePlayersQuota} jugadores del plan ${plan.name}. En modo Solo Lectura.`;
          restrictedPlayersCount++;
        } else {
          player.isRestricted = false;
          player.restrictedReason = undefined;
        }
      });
    } else {
      // If upgraded or within limit, restore all
      clubPlayers.forEach(player => {
        player.isRestricted = false;
        player.restrictedReason = undefined;
      });
    }

    // Evaluate users quota
    const clubUsers = this.state.users.filter(u => u.clubId === clubId && u.role !== 'SUPERADMIN');
    let restrictedUsersCount = 0;
    if (clubUsers.length > effectiveUsersQuota) {
      clubUsers.forEach((u, index) => {
        if (index >= effectiveUsersQuota) {
          u.status = 'restringido';
          restrictedUsersCount++;
        } else {
          if (u.status === 'restringido') u.status = 'activo';
        }
      });
    } else {
      clubUsers.forEach(u => {
        if (u.status === 'restringido') u.status = 'activo';
      });
    }

    this.logAudit(
      currentUser,
      'CAMBIO_DE_PLAN',
      `Club ${club.name} migrado al plan ${plan.name} (Cupo: ${effectivePlayersQuota} jug, ${effectiveUsersQuota} usr). Registros restringidos: ${restrictedPlayersCount} jug, ${restrictedUsersCount} usr. Datos históricos intactos.`,
      'planes',
      clubId
    );

    this.saveState(this.state);
    return {
      restrictedPlayersCount,
      restrictedUsersCount,
      message: `Plan actualizado con éxito. Capacidad adaptada sin pérdida de registros.`
    };
  }

  // --- PLAN CONSTRUCTOR (SUPERADMIN) ---
  public saveCommercialPlan(plan: CommercialPlan, currentUser: User) {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede configurar planes.');
    const idx = this.state.plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      this.state.plans[idx] = plan;
      this.logAudit(currentUser, 'PLAN_ACTUALIZADO', `Plan ${plan.name} modificado`, 'planes');
    } else {
      this.state.plans.push(plan);
      this.logAudit(currentUser, 'PLAN_CREADO', `Nuevo plan comercial creado: ${plan.name}`, 'planes');
    }
    this.saveState(this.state);
  }

  // --- BETA FEATURES TOGGLE (SUPERADMIN) ---
  public toggleBetaForClub(betaId: string, clubId: string, currentUser: User) {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede gestionar Betas.');
    const beta = this.state.betaFeatures.find(b => b.id === betaId);
    if (!beta) throw new Error('Función Beta no encontrada');

    const index = beta.enabledClubIds.indexOf(clubId);
    const club = this.state.clubs.find(c => c.id === clubId);
    const clubName = club ? club.name : clubId;

    if (index >= 0) {
      beta.enabledClubIds.splice(index, 1);
      this.logAudit(currentUser, 'BETA_DESACTIVADA', `Beta "${beta.name}" deshabilitada para ${clubName}`, 'superadmin', clubId);
    } else {
      beta.enabledClubIds.push(clubId);
      this.logAudit(currentUser, 'BETA_ACTIVADA', `Beta "${beta.name}" activada para ${clubName}`, 'superadmin', clubId);
    }
    this.saveState(this.state);
  }

  // --- STAGING, SANDBOX & CLUB STRUCTURAL VERSIONING (SUPERADMIN) ---
  public saveClubStagingDraft(clubId: string, draft: ClubStagingDraft, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede gestionar versiones de prueba');
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    club.stagingDraft = {
      ...draft,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(
      currentUser,
      'GUARDAR_BORRADOR_VERSION',
      `Borrador de prueba guardado para ${club.name} (${draft.versionName})`,
      'superadmin',
      club.id
    );
    this.saveState(this.state);
  }

  public applyClubStagingDraft(clubId: string, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede aplicar nuevas versiones');
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club || !club.stagingDraft) throw new Error('No hay versión de prueba activa para aplicar');
    const draft = club.stagingDraft;

    // Apply modules & quotas
    club.activeModules = { ...draft.modifiedModules };
    club.contractedPlayersQuota = draft.contractedPlayersQuota;
    club.contractedUsersQuota = draft.contractedUsersQuota;
    club.status = draft.statusMode;
    club.versionNumber = Math.round(((club.versionNumber || 1.0) + 0.1) * 10) / 10;

    // Apply disciplines
    if (draft.disciplinesDraft) {
      draft.disciplinesDraft.forEach(dDraft => {
        const existing = this.state.disciplines.find(d => d.id === dDraft.id);
        if (existing) {
          existing.active = dDraft.active;
          existing.name = dDraft.name;
          existing.coordinatorName = dDraft.coordinatorName;
        } else {
          this.state.disciplines.push({
            id: dDraft.id,
            clubId: club.id,
            name: dDraft.name,
            code: dDraft.code,
            iconName: dDraft.iconName || 'Activity',
            active: dDraft.active,
            coordinatorName: dDraft.coordinatorName
          });
        }
      });
    }

    // Apply user enables/disables
    if (draft.enabledUserIds) {
      draft.enabledUserIds.forEach(uid => {
        const u = this.state.users.find(usr => usr.id === uid);
        if (u) u.status = 'activo';
      });
    }
    if (draft.disabledUserIds) {
      draft.disabledUserIds.forEach(uid => {
        const u = this.state.users.find(usr => usr.id === uid);
        if (u) u.status = 'deshabilitado';
      });
    }

    // Apply cashboxes
    if (draft.cashBoxesDraft) {
      draft.cashBoxesDraft.forEach(boxDraft => {
        const existingBox = this.state.cashBoxes.find(b => b.id === boxDraft.id);
        if (existingBox) {
          existingBox.name = boxDraft.name;
          existingBox.currentBalance = boxDraft.currentBalance;
          existingBox.status = boxDraft.active ? 'abierta' : 'cerrada';
        }
      });
    }

    // Remove draft after applying
    club.stagingDraft = null;

    this.logAudit(
      currentUser,
      'APLICAR_NUEVA_VERSION',
      `Se promovió a producción la versión ${club.versionNumber} para ${club.name}`,
      'superadmin',
      club.id
    );
    this.saveState(this.state);
  }

  public discardClubStagingDraft(clubId: string, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede descartar versiones');
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) return;
    club.stagingDraft = null;
    this.logAudit(
      currentUser,
      'DESCARTAR_BORRADOR_VERSION',
      `Se descartó el borrador de versión de prueba para ${club.name}`,
      'superadmin',
      club.id
    );
    this.saveState(this.state);
  }

  public toggleClubUserStatus(userId: string, newStatus: 'activo' | 'deshabilitado', currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'DUEÑO') {
      throw new Error('Permisos insuficientes');
    }
    const u = this.state.users.find(user => user.id === userId);
    if (!u) throw new Error('Usuario no encontrado');
    u.status = newStatus;
    this.logAudit(
      currentUser,
      'CAMBIO_ESTADO_USUARIO',
      `Usuario ${u.fullName} cambiado a ${newStatus}`,
      'superadmin',
      u.clubId
    );
    this.saveState(this.state);
  }

  public toggleClubDisciplineStatus(disciplineId: string, active: boolean, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'DUEÑO') {
      throw new Error('Permisos insuficientes');
    }
    const disc = this.state.disciplines.find(d => d.id === disciplineId);
    if (!disc) throw new Error('Disciplina no encontrada');
    disc.active = active;
    this.logAudit(
      currentUser,
      'CAMBIO_ESTADO_DEPORTE',
      `Disciplina ${disc.name} cambiada a ${active ? 'activo' : 'deshabilitado'}`,
      'superadmin',
      disc.clubId
    );
    this.saveState(this.state);
  }

  public addClubDiscipline(clubId: string, name: string, code: string, coordinatorName: string, currentUser: User): Discipline {
    if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'DUEÑO') {
      throw new Error('Permisos insuficientes');
    }
    const newDisc: Discipline = {
      id: `disc-${clubId.replace('club-', '')}-${Date.now().toString(36)}`,
      clubId,
      name,
      code: code.toUpperCase().slice(0, 4),
      iconName: 'Activity',
      active: true,
      coordinatorName: coordinatorName || undefined
    };
    this.state.disciplines.push(newDisc);
    this.logAudit(
      currentUser,
      'ALTA_DEPORTE',
      `Nuevo deporte dado de alta: ${name} (${code})`,
      'superadmin',
      clubId
    );
    this.saveState(this.state);
    return newDisc;
  }

  public toggleClubMultiSportIsolation(clubId: string, enabled: boolean, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede alternar aislamiento multideporte');
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!club.activeModules) club.activeModules = { base: true, deportivo: true, caja: true, tienda: true };
    club.activeModules.multiSportIsolation = enabled;
    this.logAudit(
      currentUser,
      'TOGGLE_AISLAMIENTO_MULTIDEPORTE',
      `Aislamiento multideporte ${enabled ? 'HABILITADO' : 'DESHABILITADO'} para ${club.name}`,
      'superadmin',
      clubId
    );
    this.saveState(this.state);
  }

  public updateUserPassword(
    userId: string,
    newPassword: string,
    currentUser: User,
    approvalNote?: string
  ): void {
    if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'DUEÑO') {
      throw new Error('Solo SUPERADMIN o DUEÑO pueden restablecer contraseñas de usuarios');
    }
    const targetUser = this.state.users.find(u => u.id === userId);
    if (!targetUser) throw new Error('Usuario no encontrado');

    targetUser.password = newPassword;
    targetUser.tempPasswordChangedAt = new Date().toISOString();

    this.logAudit(
      currentUser,
      'MODIFICACION_CREDENCIAL_USUARIO',
      `Contraseña actualizada para ${targetUser.fullName} (${targetUser.email}). Motivo: ${approvalNote || 'Solicitud de recuperación de clave aprobada por directivo'}`,
      'superadmin',
      targetUser.clubId
    );
    this.saveState(this.state);
  }

  // --- IMMUTABLE RECEIPTS & CASH MOVEMENTS ---
  public createReceipt(
    data: Omit<Receipt, 'id' | 'receiptNumber' | 'status' | 'date'>,
    cashBoxId: string,
    currentUser: User,
    movementCategory?: 'cuota' | 'inscripcion' | 'tienda' | 'viaje' | 'proveedor' | 'sueldo' | 'mantenimiento' | 'otro'
  ): Receipt {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, data.clubId)) {
      throw new Error('Aislamiento RLS: no puede emitir comprobantes para otro club.');
    }

    // Regla de permisos: Recibos los ven e insertan DUEÑO, ADMINISTRACIÓN, GENERAL y TIENDA
    const allowedRoles: UserRole[] = ['DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'TIENDA'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Permisos insuficientes: el rol PROFESOR no puede emitir comprobantes.');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('El importe del comprobante debe ser mayor a 0 (amount > 0).');
    }

    const year = new Date().getFullYear();
    const clubReceipts = this.state.receipts.filter(r => r.clubId === data.clubId);
    const seq = (clubReceipts.length + 1).toString().padStart(6, '0');
    const receiptNumber = `FRA-${year}-${seq}`;

    const receiptId = `rec-${Date.now()}`;
    const movId = `mov-${Date.now()}`;

    const effectiveSector: 'administracion' | 'tienda' = data.sector || (movementCategory === 'tienda' ? 'tienda' : 'administracion');

    // Movement
    const movement: CashMovement = {
      id: movId,
      clubId: data.clubId,
      cashBoxId: cashBoxId,
      type: 'ingreso',
      amount: data.amount,
      concept: `${data.concept} (Recibo ${receiptNumber})`,
      category: movementCategory || 'cuota',
      sector: effectiveSector,
      receiptId: receiptId,
      paymentMethod: data.paymentMethod,
      registeredByUserId: currentUser.id,
      timestamp: new Date().toISOString()
    };

    // Update cashbox balance
    const box = this.state.cashBoxes.find(b => b.id === cashBoxId && b.clubId === data.clubId);
    if (box) {
      box.currentBalance += data.amount;
    }

    const newReceipt: Receipt = {
      ...data,
      id: receiptId,
      receiptNumber,
      date: new Date().toISOString(),
      status: 'emitido',
      sector: effectiveSector,
      cashMovementId: movId,
      issuedByUserId: currentUser.id
    };

    this.state.cashMovements.unshift(movement);
    this.state.receipts.unshift(newReceipt);

    this.logAudit(
      currentUser,
      'COMPROBANTE_EMITIDO',
      `Recibo ${receiptNumber} emitido por $${data.amount.toLocaleString()} a ${data.customerName}.`,
      movementCategory === 'tienda' ? 'tienda' : 'caja',
      data.clubId
    );

    this.saveState(this.state);
    return newReceipt;
  }

  // ANULACIÓN DE COMPROBANTE (Auditado, inmutable, contraasiento)
  public voidReceipt(receiptId: string, reason: string, currentUser: User): Receipt {
    this.assertNotGhostMode(currentUser);

    const receipt = this.state.receipts.find(r => r.id === receiptId);
    if (!receipt) throw new Error('Comprobante no encontrado');

    if (!this.assertClubAccess(currentUser, receipt.clubId)) {
      throw new Error('Aislamiento RLS: no puede anular comprobantes de otro club.');
    }

    if (receipt.status === 'anulado') {
      throw new Error('El comprobante ya fue anulado previamente.');
    }

    // Invocación a Supabase RPC void_receipt
    supabaseReceiptService.voidReceipt(receiptId, reason).catch(err => {
      console.warn('RPC void_receipt en Supabase:', err);
    });

    receipt.status = 'anulado';
    receipt.voidReason = reason;
    receipt.voidedAt = new Date().toISOString();
    receipt.voidedByUserId = currentUser.id;

    // Inverse movement in cashier
    if (receipt.cashMovementId) {
      const origMov = this.state.cashMovements.find(m => m.id === receipt.cashMovementId);
      if (origMov) {
        const contraMov: CashMovement = {
          id: `mov-contra-${Date.now()}`,
          clubId: receipt.clubId,
          cashBoxId: origMov.cashBoxId,
          type: 'egreso',
          amount: receipt.amount,
          concept: `ANULACIÓN Recibo ${receipt.receiptNumber} - Motivo: ${reason}`,
          category: 'otro',
          receiptId: receipt.id,
          paymentMethod: receipt.paymentMethod,
          registeredByUserId: currentUser.id,
          timestamp: new Date().toISOString()
        };
        this.state.cashMovements.unshift(contraMov);

        const box = this.state.cashBoxes.find(b => b.id === origMov.cashBoxId);
        if (box) {
          box.currentBalance = Math.max(0, box.currentBalance - receipt.amount);
        }
      }
    }

    this.logAudit(
      currentUser,
      'COMPROBANTE_ANULADO',
      `Comprobante ${receipt.receiptNumber} ANULADO. Motivo: ${reason}. Se generó contraasiento contable.`,
      'caja',
      receipt.clubId
    );

    this.saveState(this.state);
    return receipt;
  }

  // APERTURA DE CAJA (Saldo inicial en efectivo, auditoría inmutable)
  public openCashBox(
    cashBoxId: string,
    initialCashAmount: number,
    shiftName: string,
    notes: string,
    currentUser: User
  ): CashBox {
    this.assertNotGhostMode(currentUser);

    const box = this.state.cashBoxes.find(b => b.id === cashBoxId);
    if (!box) throw new Error('Caja no encontrada');

    if (!this.assertClubAccess(currentUser, box.clubId)) {
      throw new Error('Aislamiento RLS: no puede abrir cajas de otro club.');
    }

    box.status = 'abierta';
    box.initialCashAmount = initialCashAmount;
    box.currentBalance = initialCashAmount;
    box.openedAt = new Date().toISOString();
    box.openedByUserId = currentUser.id;
    box.shiftName = shiftName || 'Turno Principal';
    box.closedAt = undefined;
    box.closedByUserId = undefined;
    box.closedCountedAmount = undefined;
    box.closingDifference = undefined;

    // Movement for initial cash balance
    const movId = `mov-apertura-${Date.now()}`;
    const initialMovement: CashMovement = {
      id: movId,
      clubId: box.clubId,
      cashBoxId: box.id,
      type: 'ingreso',
      amount: initialCashAmount,
      concept: `APERTURA DE CAJA: Saldo Inicial en Efectivo (${box.shiftName})`,
      category: 'otro',
      paymentMethod: 'efectivo',
      registeredByUserId: currentUser.id,
      timestamp: new Date().toISOString(),
      notes: notes || 'Saldo inicial en efectivo para cambio y operaciones del turno'
    };

    this.state.cashMovements.unshift(initialMovement);

    this.logAudit(
      currentUser,
      'APERTURA_CAJA',
      `Apertura de "${box.name}" (${box.shiftName}) con saldo inicial en efectivo de $${initialCashAmount.toLocaleString('es-AR')}.`,
      'caja',
      box.clubId
    );

    this.saveState(this.state);
    return box;
  }

  // CIERRE DE CAJA (Arqueo y recuento físico)
  public closeCashBox(
    cashBoxId: string,
    countedAmount: number,
    notes: string,
    currentUser: User
  ): CashBox {
    this.assertNotGhostMode(currentUser);

    const box = this.state.cashBoxes.find(b => b.id === cashBoxId);
    if (!box) throw new Error('Caja no encontrada');

    if (!this.assertClubAccess(currentUser, box.clubId)) {
      throw new Error('Aislamiento RLS: no puede cerrar cajas de otro club.');
    }

    const difference = countedAmount - box.currentBalance;
    box.status = 'cerrada';
    box.closedAt = new Date().toISOString();
    box.closedByUserId = currentUser.id;
    box.closedCountedAmount = countedAmount;
    box.closingDifference = difference;

    this.logAudit(
      currentUser,
      'CIERRE_CAJA',
      `Cierre de "${box.name}". Saldo sistema: $${box.currentBalance.toLocaleString('es-AR')}. Recuento: $${countedAmount.toLocaleString('es-AR')}. Diferencia: $${difference.toLocaleString('es-AR')}. ${notes ? `Obs: ${notes}` : ''}`,
      'caja',
      box.clubId
    );

    this.saveState(this.state);
    return box;
  }

  // --- PLAYERS (WITH PLAN CAPACITY CHECK) ---
  public addPlayer(playerData: Omit<Player, 'id' | 'isRestricted'>, currentUser: User): Player {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, playerData.clubId)) {
      throw new Error('Aislamiento RLS: no puede inscribir jugadores en otro club.');
    }

    const club = this.state.clubs.find(c => c.id === playerData.clubId);
    if (!club) throw new Error('Club no encontrado');

    // Check duplicate DNI in club
    const existing = this.state.players.find(p => p.clubId === playerData.clubId && p.dni === playerData.dni);
    if (existing) {
      throw new Error(`El DNI ${playerData.dni} ya se encuentra registrado para ${existing.firstName} ${existing.lastName}.`);
    }

    const currentActivePlayersCount = this.state.players.filter(p => p.clubId === playerData.clubId).length;
    let isRestricted = false;
    let restrictedReason: string | undefined;

    if (currentActivePlayersCount >= club.contractedPlayersQuota) {
      isRestricted = true;
      restrictedReason = `El club ha alcanzado el límite de ${club.contractedPlayersQuota} jugadores de su plan. El registro se guarda en modo Solo Lectura hasta ampliar el plan.`;
    }

    const newPlayer: Player = {
      ...playerData,
      id: `ply-${Date.now()}`,
      isRestricted,
      restrictedReason
    };

    this.state.players.unshift(newPlayer);

    this.logAudit(
      currentUser,
      'JUGADOR_INSCRIPTO',
      `Inscripción de ${newPlayer.firstName} ${newPlayer.lastName} (DNI ${newPlayer.dni})${isRestricted ? ' [RESTRINGIDO POR CUPO]' : ''}.`,
      'jugadores',
      playerData.clubId
    );

    this.saveState(this.state);
    return newPlayer;
  }

  public importPlayersBatch(
    playersData: Array<Omit<Player, 'id' | 'isRestricted'>>,
    currentUser: User
  ): { successCount: number; errors: string[] } {
    let successCount = 0;
    const errors: string[] = [];

    for (const pData of playersData) {
      try {
        const existing = this.state.players.find(p => p.clubId === pData.clubId && p.dni === pData.dni);
        if (existing) {
          if (pData.monthlyPayments) existing.monthlyPayments = { ...existing.monthlyPayments, ...pData.monthlyPayments };
          if (pData.insuranceStatus) existing.insuranceStatus = pData.insuranceStatus;
          existing.balance = pData.balance;
          successCount++;
          continue;
        }

        this.addPlayer(pData, currentUser);
        successCount++;
      } catch (err: any) {
        errors.push(`${pData.firstName} ${pData.lastName} (${pData.dni}): ${err.message}`);
      }
    }

    if (playersData.length > 0) {
      this.logAudit(
        currentUser,
        'IMPORTACION_EXCEL_JUGADORES',
        `Importación por planilla Excel: ${successCount} deportistas procesados con éxito.`,
        'jugadores',
        playersData[0]?.clubId || currentUser.clubId
      );
    }

    this.saveState(this.state);
    return { successCount, errors };
  }

  public updatePlayer(player: Player, currentUser: User) {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS: no puede modificar jugadores de otro club.');
    }

    if (player.isRestricted) {
      throw new Error('Este registro está restringido por límite de plan comercial. Amplíe el plan para editarlo.');
    }

    const index = this.state.players.findIndex(p => p.id === player.id);
    if (index >= 0) {
      this.state.players[index] = player;
      this.logAudit(
        currentUser,
        'JUGADOR_MODIFICADO',
        `Datos de ${player.firstName} ${player.lastName} actualizados.`,
        'jugadores',
        player.clubId
      );
      this.saveState(this.state);
    }
  }

  // --- PLAYER SCHOLARSHIP MANAGEMENT (BECAS DEPORTIVAS / SOCIALES) ---
  public setPlayerScholarship(playerId: string, percent: number, reason?: string, currentUser?: User): Player {
    const user = currentUser || ({ id: 'admin', role: 'ADMIN_CLUB', clubId: '' } as unknown as User);
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');

    if (!this.assertClubAccess(user, player.clubId)) {
      throw new Error('Aislamiento RLS: no puede modificar becas de otro club.');
    }

    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    const category = this.state.categories.find(c => c.id === player.categoryId);
    const baseFee = category?.monthlyFee || 22000;
    const finalFee = Math.max(0, Math.round(baseFee * (1 - safePercent / 100)));

    player.scholarshipPercent = safePercent;
    player.scholarshipType = safePercent === 100 ? 'completa' : safePercent === 50 ? 'media' : safePercent === 0 ? 'ninguna' : 'personalizada';
    player.scholarshipReason = reason || (safePercent === 100 ? 'Beca Completa (100% Bonificado)' : safePercent === 50 ? 'Media Beca (50% Descuento)' : `Beca ${safePercent}%`);
    player.monthlyFeeDue = finalFee;

    this.logAudit(
      user,
      'BECA_MODIFICADA',
      `Asignación de beca para ${player.firstName} ${player.lastName}: ${safePercent}% (Cuota final: $${finalFee}). Motivo: ${reason || 'Resolución directiva'}`,
      'jugadores',
      player.clubId
    );

    this.saveState(this.state);
    return player;
  }

  // --- PLAYER PHOTO & PROFILE UPDATE ---
  public updatePlayerPhoto(playerId: string, photoUrl: string, currentUser: User): Player {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');

    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS: no puede actualizar fotos de otro club.');
    }

    player.photoUrl = photoUrl;
    this.logAudit(
      currentUser,
      'FOTO_JUGADOR_ACTUALIZADA',
      `Foto de perfil actualizada para ${player.firstName} ${player.lastName}`,
      'jugadores',
      player.clubId
    );
    this.saveState(this.state);
    return player;
  }

  // --- PROVISIONAL PLAYERS & COACH APPROVAL WORKFLOW ---
  public getProvisionalPlayers(clubId: string, currentUser: User, categoryId?: string): ProvisionalPlayer[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    let list = (this.state.provisionalPlayers || []).filter(p => p.clubId === clubId);
    if (currentUser.role === 'PROFESOR') {
      list = list.filter(p => p.coachId === currentUser.id);
    }
    if (categoryId) {
      list = list.filter(p => p.categoryId === categoryId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addProvisionalPlayer(
    data: Omit<ProvisionalPlayer, 'id' | 'createdAt' | 'status'>,
    currentUser: User
  ): ProvisionalPlayer {
    if (!this.assertClubAccess(currentUser, data.clubId)) {
      throw new Error('Aislamiento RLS: no puede agregar registros a otro club.');
    }

    const newProv: ProvisionalPlayer = {
      ...data,
      id: `prov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      status: 'borrador'
    };

    if (!this.state.provisionalPlayers) this.state.provisionalPlayers = [];
    this.state.provisionalPlayers.unshift(newProv);

    this.logAudit(
      currentUser,
      'PRE_INSCRIPCION_CREADA',
      `Pre-inscripción creada para ${newProv.firstName} ${newProv.lastName} en categoría ${newProv.categoryId}.`,
      'jugadores',
      data.clubId
    );

    this.saveState(this.state);
    return newProv;
  }

  public updateProvisionalPlayer(
    playerId: string,
    updates: Partial<ProvisionalPlayer>,
    currentUser: User
  ): ProvisionalPlayer {
    const prov = (this.state.provisionalPlayers || []).find(p => p.id === playerId);
    if (!prov) throw new Error('Registro provisorio no encontrado');

    if (!this.assertClubAccess(currentUser, prov.clubId)) {
      throw new Error('Aislamiento RLS: no puede modificar registros de otro club.');
    }

    Object.assign(prov, updates);
    this.saveState(this.state);
    return prov;
  }

  public deleteProvisionalPlayer(playerId: string, currentUser: User): void {
    const idx = (this.state.provisionalPlayers || []).findIndex(p => p.id === playerId);
    if (idx >= 0) {
      const prov = this.state.provisionalPlayers[idx];
      if (!this.assertClubAccess(currentUser, prov.clubId)) {
        throw new Error('Aislamiento RLS: no puede eliminar registros de otro club.');
      }
      this.state.provisionalPlayers.splice(idx, 1);
      this.saveState(this.state);
    }
  }

  public submitCoachApprovalRequest(
    categoryId: string,
    coachNotes: string,
    currentUser: User
  ): CoachApprovalRequest {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (!cat) throw new Error('Categoría no encontrada');

    if (!this.assertClubAccess(currentUser, cat.clubId)) {
      throw new Error('Aislamiento RLS: no puede enviar solicitudes para otro club.');
    }

    // Find all draft provisional players in this category by this coach
    const drafts = (this.state.provisionalPlayers || []).filter(
      p => p.clubId === cat.clubId && p.categoryId === categoryId && p.status === 'borrador'
    );

    if (drafts.length === 0) {
      throw new Error('No hay aspirantes en borrador en esta categoría para enviar a aprobación.');
    }

    // Mark drafts as pendiente_aprobacion
    drafts.forEach(p => {
      p.status = 'pendiente_aprobacion';
    });

    const newRequest: CoachApprovalRequest = {
      id: `req-${Date.now()}`,
      clubId: cat.clubId,
      coachId: currentUser.id,
      coachName: currentUser.fullName,
      categoryId: cat.id,
      categoryName: cat.name,
      disciplineId: cat.disciplineId,
      requestDate: new Date().toISOString(),
      status: 'pendiente',
      players: [...drafts],
      coachNotes: coachNotes || 'Solicitud de alta formal de aspirantes para el plantel.'
    };

    if (!this.state.coachApprovalRequests) this.state.coachApprovalRequests = [];
    this.state.coachApprovalRequests.unshift(newRequest);

    this.logAudit(
      currentUser,
      'SOLICITUD_ALTA_ENVIADA',
      `El profesor ${currentUser.fullName} envió solicitud de aprobación para ${drafts.length} alumnos en "${cat.name}".`,
      'jugadores',
      cat.clubId
    );

    this.saveState(this.state);
    return newRequest;
  }

  public getCoachApprovalRequests(clubId: string, currentUser: User): CoachApprovalRequest[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    let list = (this.state.coachApprovalRequests || []).filter(r => r.clubId === clubId);
    if (currentUser.role === 'PROFESOR') {
      list = list.filter(r => r.coachId === currentUser.id);
    }
    return list.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }

  // Administración: Aprobar y dar de alta a un jugador individual de la solicitud (pudiendo editar sus datos)
  public approvePlayerFromRequest(
    requestId: string,
    provisionalPlayerId: string,
    updatedData: Partial<Player>,
    currentUser: User
  ): Player {
    const req = (this.state.coachApprovalRequests || []).find(r => r.id === requestId);
    if (!req) throw new Error('Solicitud no encontrada');

    if (!this.assertClubAccess(currentUser, req.clubId)) {
      throw new Error('Aislamiento RLS: no puede aprobar solicitudes de otro club.');
    }

    const prov = req.players.find(p => p.id === provisionalPlayerId);
    if (!prov) throw new Error('Aspirante no encontrado en la solicitud');

    // Create official player in club
    const cat = this.state.categories.find(c => c.id === prov.categoryId);
    const newOfficialPlayer: Omit<Player, 'id' | 'isRestricted'> = {
      clubId: req.clubId,
      disciplineId: prov.disciplineId,
      categoryId: prov.categoryId,
      dni: updatedData.dni || prov.dni,
      firstName: updatedData.firstName || prov.firstName,
      lastName: updatedData.lastName || prov.lastName,
      birthDate: updatedData.birthDate || prov.birthDate,
      phone: updatedData.phone || prov.phone,
      email: updatedData.email || prov.email || `${prov.firstName.toLowerCase()}.${prov.lastName.toLowerCase()}@club.com`,
      emergencyContact: updatedData.emergencyContact || prov.emergencyContact || {
        name: 'Tutor a designar',
        relationship: 'Tutor',
        phone: prov.phone
      },
      medicalCertificateValid: true,
      medicalExpiryDate: '2027-03-31',
      photoUrl: updatedData.photoUrl || prov.photoUrl,
      status: 'activo',
      monthlyFeeDue: cat?.monthlyFee || 22000,
      balance: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const created = this.addPlayer(newOfficialPlayer, currentUser);

    prov.status = 'aprobado';
    const allApproved = req.players.every(p => p.status === 'aprobado');
    req.status = allApproved ? 'aprobado_total' : 'aprobado_parcial';
    req.resolvedAt = new Date().toISOString();
    req.resolvedByUserId = currentUser.id;

    // Also update in provisionalPlayers list
    const mainProv = (this.state.provisionalPlayers || []).find(p => p.id === provisionalPlayerId);
    if (mainProv) mainProv.status = 'aprobado';

    this.saveState(this.state);
    return created;
  }

  // Administración: Aprobar y dar de alta a TODOS los jugadores de la solicitud
  public approveAllPlayersFromRequest(
    requestId: string,
    currentUser: User
  ): { approvedCount: number } {
    const req = (this.state.coachApprovalRequests || []).find(r => r.id === requestId);
    if (!req) throw new Error('Solicitud no encontrada');

    if (!this.assertClubAccess(currentUser, req.clubId)) {
      throw new Error('Aislamiento RLS: no puede aprobar solicitudes de otro club.');
    }

    const cat = this.state.categories.find(c => c.id === req.categoryId);
    let approvedCount = 0;

    for (const prov of req.players) {
      if (prov.status !== 'aprobado') {
        const newOfficialPlayer: Omit<Player, 'id' | 'isRestricted'> = {
          clubId: req.clubId,
          disciplineId: prov.disciplineId,
          categoryId: prov.categoryId,
          dni: prov.dni,
          firstName: prov.firstName,
          lastName: prov.lastName,
          birthDate: prov.birthDate,
          phone: prov.phone,
          email: prov.email || `${prov.firstName.toLowerCase()}.${prov.lastName.toLowerCase()}@club.com`,
          emergencyContact: prov.emergencyContact || {
            name: 'Tutor registrado',
            relationship: 'Tutor',
            phone: prov.phone
          },
          medicalCertificateValid: true,
          medicalExpiryDate: '2027-03-31',
          photoUrl: prov.photoUrl,
          status: 'activo',
          monthlyFeeDue: cat?.monthlyFee || 22000,
          balance: 0,
          joinedDate: new Date().toISOString().split('T')[0]
        };

        try {
          this.addPlayer(newOfficialPlayer, currentUser);
          prov.status = 'aprobado';
          approvedCount++;

          const mainProv = (this.state.provisionalPlayers || []).find(p => p.id === prov.id);
          if (mainProv) mainProv.status = 'aprobado';
        } catch (e) {
          console.warn(`No se pudo agregar a ${prov.firstName} ${prov.lastName}`, e);
        }
      }
    }

    req.status = 'aprobado_total';
    req.resolvedAt = new Date().toISOString();
    req.resolvedByUserId = currentUser.id;

    this.logAudit(
      currentUser,
      'SOLICITUD_ALTA_APROBADA_TOTAL',
      `Administración aprobó y dio de alta a ${approvedCount} alumnos solicitados por ${req.coachName} en ${req.categoryName}.`,
      'jugadores',
      req.clubId
    );

    this.saveState(this.state);
    return { approvedCount };
  }

  // Administración: Denegar la solicitud
  public rejectCoachApprovalRequest(
    requestId: string,
    reason: string,
    currentUser: User
  ): CoachApprovalRequest {
    const req = (this.state.coachApprovalRequests || []).find(r => r.id === requestId);
    if (!req) throw new Error('Solicitud no encontrada');

    if (!this.assertClubAccess(currentUser, req.clubId)) {
      throw new Error('Aislamiento RLS: no puede denegar solicitudes de otro club.');
    }

    req.status = 'rechazado';
    req.adminNotes = reason || 'Solicitud denegada por administración.';
    req.resolvedAt = new Date().toISOString();
    req.resolvedByUserId = currentUser.id;

    req.players.forEach(p => {
      p.status = 'rechazado';
      const mainProv = (this.state.provisionalPlayers || []).find(mp => mp.id === p.id);
      if (mainProv) mainProv.status = 'rechazado';
    });

    this.logAudit(
      currentUser,
      'SOLICITUD_ALTA_RECHAZADA',
      `Administración denegó solicitud de ${req.coachName} en ${req.categoryName}. Motivo: ${reason}`,
      'jugadores',
      req.clubId
    );

    this.saveState(this.state);
    return req;
  }

  // --- ATTENDANCE TRACKER ---
  public recordAttendance(record: Omit<AttendanceRecord, 'id'>, currentUser: User): AttendanceRecord {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, record.clubId)) {
      throw new Error('Aislamiento RLS: no puede registrar asistencia para otro club.');
    }

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`
    };

    this.state.attendanceRecords.unshift(newRecord);
    this.logAudit(
      currentUser,
      'ASISTENCIA_REGISTRADA',
      `Asistencia tomada para categoría ${record.categoryId} fecha ${record.date}.`,
      'jugadores',
      record.clubId
    );
    this.saveState(this.state);
    return newRecord;
  }

  // --- STORE POS SALE ---
  public processStoreSale(
    saleData: {
      clubId: string;
      items: { productId: string; quantity: number; size?: string }[];
      paymentMethod: PaymentMethod;
      customerName?: string;
      customerDni?: string;
      targetCashBoxId?: string;
      discountAmount?: number;
      appliedPromotionName?: string;
    },
    currentUser: User
  ): { sale: StoreSale; receipt: Receipt } {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, saleData.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    // Regla RLS: Ventas de tienda las ven e insertan DUEÑO, ADMINISTRACIÓN y TIENDA
    const allowedRoles: UserRole[] = ['DUEÑO', 'ADMINISTRACIÓN', 'TIENDA'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Permisos insuficientes: el rol ' + currentUser.role + ' no puede procesar ventas de tienda.');
    }

    let total = 0;
    const detailedItems: StoreSale['items'] = [];
    const receiptItems: Receipt['items'] = [];

    for (const item of saleData.items) {
      const prod = this.state.storeProducts.find(p => p.id === item.productId && p.clubId === saleData.clubId);
      if (!prod) throw new Error(`Producto no encontrado`);
      
      // Check overall stock
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}" (Stock actual: ${prod.stock})`);
      }

      // Check size-specific stock if defined
      if (item.size && prod.sizesStock && prod.sizesStock[item.size] !== undefined) {
        if (prod.sizesStock[item.size] < item.quantity) {
          throw new Error(`Stock insuficiente para "${prod.name}" en talle ${item.size} (Disponible en talle ${item.size}: ${prod.sizesStock[item.size]})`);
        }
        prod.sizesStock[item.size] -= item.quantity;
      }

      prod.stock = Math.max(0, prod.stock - item.quantity);
      if (prod.stock <= 0) {
        prod.status = 'agotado';
      }

      const itemSubtotal = prod.salePrice * item.quantity;
      total += itemSubtotal;

      detailedItems.push({
        productId: prod.id,
        productName: item.size ? `${prod.name} (Talle ${item.size})` : prod.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: prod.salePrice,
        total: itemSubtotal
      });

      receiptItems.push({
        description: item.size ? `${prod.name} (Talle ${item.size})` : prod.name,
        quantity: item.quantity,
        unitPrice: prod.salePrice,
        total: itemSubtotal
      });
    }

    const subtotal = total;
    const discount = Math.min(subtotal, Math.max(0, saleData.discountAmount || 0));
    const finalAmount = Math.max(0, subtotal - discount);

    if (discount > 0) {
      receiptItems.push({
        description: `DESCUENTO / PROMO (${saleData.appliedPromotionName || 'Bonificación Especial'})`,
        quantity: 1,
        unitPrice: -discount,
        total: -discount
      });
    }

    // Identify store cashier box
    const storeBox = (saleData.targetCashBoxId && this.state.cashBoxes.find(b => b.id === saleData.targetCashBoxId && b.clubId === saleData.clubId))
      || this.state.cashBoxes.find(b => b.clubId === saleData.clubId && (b.name.toLowerCase().includes('tienda') || b.type === 'tienda')) 
      || this.state.cashBoxes.find(b => b.clubId === saleData.clubId && b.type === 'general')
      || this.state.cashBoxes[0];

    if (!storeBox) {
      throw new Error('No se encontró una caja de tienda para imputar el cobro.');
    }

    if (storeBox.status === 'cerrada') {
      throw new Error(`La "${storeBox.name}" se encuentra cerrada. Por favor abra la caja para iniciar el turno de ventas.`);
    }

    const receipt = this.createReceipt(
      {
        clubId: saleData.clubId,
        customerName: saleData.customerName || 'Cliente Mostrador Tienda',
        customerDni: saleData.customerDni,
        concept: saleData.appliedPromotionName 
          ? `Venta Tienda Oficial (${saleData.appliedPromotionName})` 
          : 'Venta Mostrador Tienda Oficial',
        amount: finalAmount,
        paymentMethod: saleData.paymentMethod,
        items: receiptItems,
        sector: 'tienda',
        issuedByUserId: currentUser.id
      },
      storeBox.id,
      currentUser,
      'tienda'
    );

    const sale: StoreSale = {
      id: `sale-${Date.now()}`,
      clubId: saleData.clubId,
      receiptId: receipt.id,
      cashierUserId: currentUser.id,
      subtotal,
      discountAmount: discount,
      appliedPromotionName: saleData.appliedPromotionName,
      total: finalAmount,
      paymentMethod: saleData.paymentMethod,
      customerName: saleData.customerName,
      items: detailedItems,
      timestamp: new Date().toISOString()
    };

    if (!this.state.storeSales) this.state.storeSales = [];
    this.state.storeSales.unshift(sale);
    this.saveState(this.state);

    // Registro en Supabase: primero store_sales, luego store_sale_items (descuento automático por trigger)
    supabaseStoreService.processSale({
      clubId: saleData.clubId,
      receiptId: receipt.id,
      cashBoxId: storeBox.id,
      cashierUserId: currentUser.id,
      customerName: saleData.customerName || 'Cliente Mostrador Tienda',
      total: finalAmount,
      paymentMethod: saleData.paymentMethod,
      items: detailedItems.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.total
      }))
    }).catch(err => {
      console.warn('Registro remoto de venta en Supabase:', err);
    });

    return { sale, receipt };
  }

  // --- INDEPENDENT STORE CASH BOX MANAGEMENT ---
  public getOrCreateStoreCashBox(clubId: string, currentUser: User): CashBox {
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error('Aislamiento RLS');
    }

    let storeBox = this.state.cashBoxes.find(b => b.clubId === clubId && (b.name.toLowerCase().includes('tienda') || b.type === 'tienda'));
    if (!storeBox) {
      const parentGeneral = this.state.cashBoxes.find(b => b.clubId === clubId && b.type === 'general');
      const newBox: CashBox = {
        id: `box-${clubId}-tienda`,
        clubId,
        name: 'Caja Mostrador Tienda Oficial',
        type: 'tienda',
        parentBoxId: parentGeneral?.id,
        responsibleUserId: currentUser.id,
        currentBalance: 0,
        status: 'cerrada'
      };
      this.state.cashBoxes.push(newBox);
      this.saveState(this.state);
      return newBox;
    }
    return storeBox;
  }

  // --- STORE PROMOTIONS & DISCOUNTS ---
  public getStorePromotions(clubId: string, currentUser: User): StorePromotion[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    return (this.state.storePromotions || []).filter(p => p.clubId === clubId);
  }

  public addStorePromotion(
    promoData: Omit<StorePromotion, 'id' | 'createdAt'>,
    currentUser: User
  ): StorePromotion {
    if (!this.assertClubAccess(currentUser, promoData.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    const newPromo: StorePromotion = {
      ...promoData,
      id: `promo-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    if (!this.state.storePromotions) this.state.storePromotions = [];
    this.state.storePromotions.unshift(newPromo);

    this.logAudit(
      currentUser,
      'PROMOCION_CREADA',
      `Nueva promoción creada: "${newPromo.name}" (${newPromo.type === 'porcentaje' ? `${newPromo.value}%` : `$${newPromo.value}`} OFF).`,
      'tienda',
      promoData.clubId
    );

    this.saveState(this.state);
    return newPromo;
  }

  public updateStorePromotion(
    id: string,
    updates: Partial<StorePromotion>,
    currentUser: User
  ): StorePromotion {
    const promo = (this.state.storePromotions || []).find(p => p.id === id);
    if (!promo) throw new Error('Promoción no encontrada');

    if (!this.assertClubAccess(currentUser, promo.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    Object.assign(promo, updates);
    this.logAudit(
      currentUser,
      'PROMOCION_MODIFICADA',
      `Promoción "${promo.name}" actualizada (Estado: ${promo.status}).`,
      'tienda',
      promo.clubId
    );

    this.saveState(this.state);
    return promo;
  }

  public deleteStorePromotion(id: string, currentUser: User): void {
    const idx = (this.state.storePromotions || []).findIndex(p => p.id === id);
    if (idx >= 0) {
      const promo = this.state.storePromotions[idx];
      if (!this.assertClubAccess(currentUser, promo.clubId)) {
        throw new Error('Aislamiento RLS');
      }
      this.state.storePromotions.splice(idx, 1);
      this.logAudit(
        currentUser,
        'PROMOCION_ELIMINADA',
        `Promoción "${promo.name}" eliminada.`,
        'tienda',
        promo.clubId
      );
      this.saveState(this.state);
    }
  }

  // --- STORE PRODUCT MANAGEMENT ---
  public addStoreProduct(
    productData: Omit<StoreProduct, 'id' | 'status'>,
    currentUser: User
  ): StoreProduct {
    if (!this.assertClubAccess(currentUser, productData.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    const newProduct: StoreProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      status: productData.stock <= 0 ? 'agotado' : 'disponible'
    };

    if (!this.state.storeProducts) this.state.storeProducts = [];
    this.state.storeProducts.unshift(newProduct);

    this.logAudit(
      currentUser,
      'PRODUCTO_TIENDA_CREADO',
      `Nuevo artículo "${newProduct.name}" (SKU ${newProduct.sku}) creado con stock ${newProduct.stock}.`,
      'tienda',
      productData.clubId
    );

    this.saveState(this.state);
    return newProduct;
  }

  public updateStoreProduct(
    productId: string,
    updates: Partial<StoreProduct>,
    currentUser: User
  ): StoreProduct {
    const product = (this.state.storeProducts || []).find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    if (!this.assertClubAccess(currentUser, product.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    Object.assign(product, updates);
    if (product.stock <= 0) {
      product.status = 'agotado';
    } else if (product.status === 'agotado') {
      product.status = 'disponible';
    }

    this.logAudit(
      currentUser,
      'PRODUCTO_TIENDA_MODIFICADO',
      `Artículo "${product.name}" actualizado (Stock: ${product.stock}, Precio: $${product.salePrice.toLocaleString('es-AR')}).`,
      'tienda',
      product.clubId
    );

    this.saveState(this.state);
    return product;
  }

  public deleteStoreProduct(productId: string, currentUser: User): void {
    const idx = (this.state.storeProducts || []).findIndex(p => p.id === productId);
    if (idx >= 0) {
      const prod = this.state.storeProducts[idx];
      if (!this.assertClubAccess(currentUser, prod.clubId)) {
        throw new Error('Aislamiento RLS');
      }
      this.state.storeProducts.splice(idx, 1);
      this.logAudit(
        currentUser,
        'PRODUCTO_TIENDA_ELIMINADO',
        `Artículo "${prod.name}" eliminado del catálogo.`,
        'tienda',
        prod.clubId
      );
      this.saveState(this.state);
    }
  }

  public adjustStoreStock(
    productId: string,
    deltaStock: number,
    reason: string,
    currentUser: User
  ): StoreProduct {
    const product = (this.state.storeProducts || []).find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    if (!this.assertClubAccess(currentUser, product.clubId)) {
      throw new Error('Aislamiento RLS');
    }

    const previousStock = product.stock;
    product.stock = Math.max(0, product.stock + deltaStock);
    product.status = product.stock <= 0 ? 'agotado' : 'disponible';

    this.logAudit(
      currentUser,
      'AJUSTE_STOCK_TIENDA',
      `Stock de "${product.name}" modificado de ${previousStock} a ${product.stock} (${deltaStock > 0 ? `+${deltaStock}` : deltaStock} un.). Motivo: ${reason}`,
      'tienda',
      product.clubId
    );

    this.saveState(this.state);
    return product;
  }

  // --- SEED OR RESET HELPER ---
  public resetToSeed(currentUser: User) {
    if (currentUser.role !== 'SUPERADMIN') throw new Error('Solo SUPERADMIN puede reiniciar datos.');
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
  }

  // --- CLUB CREATION & CUSTOMIZATION ---
  public createClub(newClub: Omit<Club, 'id' | 'createdAt'>, currentUser: User): Club {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new Error('Solo SUPERADMIN puede dar de alta nuevos clubes.');
    }
    const clubId = `club-${newClub.slug || Date.now()}`;
    const club: Club = {
      ...newClub,
      id: clubId,
      createdAt: new Date().toISOString()
    };

    this.state.clubs.push(club);

    // Create default Cash Box
    this.state.cashBoxes.push({
      id: `box-${clubId}-general`,
      clubId: clubId,
      name: `Caja General ${club.name}`,
      type: 'general',
      responsibleUserId: currentUser.id,
      currentBalance: 0,
      status: 'abierta'
    });

    this.logAudit(
      currentUser,
      'CLUB_CREADO',
      `Nuevo club registrado en FRAOVIA: ${club.name} (Plan: ${club.subscriptionPlanId})`,
      'superadmin',
      clubId
    );

    this.saveState(this.state);
    return club;
  }

  public updateClub(updatedClub: Club, currentUser: User): Club {
    if (!this.assertClubAccess(currentUser, updatedClub.id)) {
      throw new Error('Aislamiento RLS: no puede modificar datos de otro club.');
    }
    const index = this.state.clubs.findIndex(c => c.id === updatedClub.id);
    if (index >= 0) {
      const existingClub = this.state.clubs[index];
      
      // Regla de Base de Datos:
      // DUEÑO y ADMINISTRACIÓN editan solo nombre, teléfono, email, dirección, logo y branding.
      // Plan, cupos, estado y módulos solo los puede modificar el SUPERADMIN.
      if (currentUser.role !== 'SUPERADMIN') {
        updatedClub.subscriptionPlanId = existingClub.subscriptionPlanId;
        updatedClub.contractedPlayersQuota = existingClub.contractedPlayersQuota;
        updatedClub.contractedUsersQuota = existingClub.contractedUsersQuota;
        updatedClub.status = existingClub.status;
        updatedClub.activeModules = { ...existingClub.activeModules };
      }

      this.state.clubs[index] = { ...this.state.clubs[index], ...updatedClub };
      this.saveState(this.state);
    }
    return updatedClub;
  }

  public updateUser(updatedUser: User, currentUser: User): User {
    const index = this.state.users.findIndex(u => u.id === updatedUser.id);
    if (index >= 0) {
      this.state.users[index] = { ...this.state.users[index], ...updatedUser };
      this.saveState(this.state);
      this.logAudit(currentUser, 'PERFIL_USUARIO_ACTUALIZADO', `Perfil de ${updatedUser.fullName} actualizado`, 'seguridad', updatedUser.clubId);
    }
    return updatedUser;
  }

  // --- COACHES & CATEGORIES ASSIGNMENT HELPERS ---
  public toggleUserStatus(userId: string, currentUser: User): User {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado');
    if (!this.assertClubAccess(currentUser, user.clubId)) {
      throw new Error('Aislamiento RLS: no puede modificar usuarios de otro club.');
    }

    // Jerarquía de gestión de perfiles:
    // DUEÑO gestiona a todo su club.
    // ADMINISTRACIÓN gestiona solo GENERAL, PROFESOR y TIENDA.
    if (currentUser.role === 'ADMINISTRACIÓN') {
      if (user.role === 'DUEÑO' || user.role === 'ADMINISTRACIÓN' || user.role === 'SUPERADMIN') {
        throw new Error('Permisos insuficientes: la Administración no puede deshabilitar al Dueño ni a otros administradores.');
      }
    } else if (currentUser.role !== 'DUEÑO' && currentUser.role !== 'SUPERADMIN') {
      throw new Error('Permisos insuficientes para modificar el estado de otros usuarios.');
    }

    user.status = user.status === 'activo' ? 'deshabilitado' : 'activo';
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      user.status === 'activo' ? 'USUARIO_HABILITADO' : 'USUARIO_DESHABILITADO',
      `${user.fullName} (${user.role}) fue ${user.status === 'activo' ? 'habilitado' : 'deshabilitado'} en el sistema.`,
      'seguridad',
      user.clubId
    );
    return user;
  }

  public assignCategoriesToCoach(userId: string, categoryIds: string[], currentUser: User): User {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) throw new Error('Profesor no encontrado');
    if (!this.assertClubAccess(currentUser, user.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    if (!user.scope) user.scope = {};
    user.scope.categoryIds = [...categoryIds];
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'CATEGORIAS_PROFESOR_ASIGNADAS',
      `Asignación de grupos/categorías actualizada para ${user.fullName} (${categoryIds.length} categorías asignadas).`,
      'jugadores',
      user.clubId
    );
    return user;
  }

  public createCoach(
    coachData: { fullName: string; email: string; phone?: string; categoryIds: string[]; clubId: string },
    currentUser: User
  ): User {
    this.assertNotGhostMode(currentUser);

    if (!this.assertClubAccess(currentUser, coachData.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    const newCoach: User = {
      id: `user-coach-${Date.now()}`,
      email: coachData.email.trim().toLowerCase(),
      fullName: coachData.fullName.trim(),
      phone: coachData.phone?.trim() || '+54 11 0000-0000',
      role: 'PROFESOR',
      clubId: coachData.clubId,
      status: 'activo',
      scope: {
        disciplineIds: ['disc-sm-futbol'],
        categoryIds: coachData.categoryIds
      },
      createdAt: new Date().toISOString()
    };
    this.state.users.push(newCoach);
    this.saveState(this.state);

    // Invocación a la Edge Function create-club-user en el servidor Supabase
    supabaseUserService.createClubUser({
      email: coachData.email.trim().toLowerCase(),
      password: 'TempPassword123!',
      fullName: coachData.fullName.trim(),
      role: 'PROFESOR',
      clubId: coachData.clubId,
      phone: coachData.phone?.trim(),
      scope: {
        categoryIds: coachData.categoryIds,
        disciplineIds: ['disc-sm-futbol']
      }
    }).catch(err => {
      console.warn('Invocación Edge Function create-club-user:', err);
    });

    this.logAudit(
      currentUser,
      'PROFESOR_CREADO',
      `Nuevo profesor registrado: ${newCoach.fullName} (${newCoach.email}).`,
      'seguridad',
      coachData.clubId
    );
    return newCoach;
  }

  public changePlayerCategory(playerId: string, newCategoryId: string, currentUser: User): Player {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');
    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    const targetCat = this.state.categories.find(c => c.id === newCategoryId);
    if (!targetCat) throw new Error('Categoría destino no encontrada');

    const prevCategory = this.state.categories.find(c => c.id === player.categoryId)?.name || player.categoryId;
    player.categoryId = newCategoryId;
    if (targetCat.colorBlockName) {
      player.colorBlockName = targetCat.colorBlockName;
    }
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'JUGADOR_CAMBIO_CATEGORIA',
      `${player.firstName} ${player.lastName} fue transferido de "${prevCategory}" a "${targetCat.name}".`,
      'jugadores',
      player.clubId
    );
    return player;
  }

  public changePlayerColorBlock(playerId: string, newColorBlockName: string, currentUser: User): Player {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');
    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    player.colorBlockName = newColorBlockName;
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'JUGADOR_CAMBIO_BLOQUE',
      `Bloque de color de ${player.firstName} ${player.lastName} cambiado a "${newColorBlockName}".`,
      'jugadores',
      player.clubId
    );
    return player;
  }

  public togglePlayerSuspension(playerId: string, reason: string | undefined, currentUser: User): Player {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');
    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    if (player.status === 'suspendido') {
      player.status = player.balance > 0 ? 'moroso' : 'activo';
    } else {
      player.status = 'suspendido';
    }
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      player.status === 'suspendido' ? 'JUGADOR_SUSPENDIDO' : 'JUGADOR_REANUDADO',
      `${player.firstName} ${player.lastName} fue ${player.status === 'suspendido' ? `suspendido (${reason || 'Por impago'})` : 'reincorporado a estado activo'}.`,
      'jugadores',
      player.clubId
    );
    return player;
  }

  public changePlayerCoach(playerId: string, coachId: string, coachName: string, currentUser: User): Player {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('Deportista no encontrado');
    if (!this.assertClubAccess(currentUser, player.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    player.coachId = coachId;
    player.coachName = coachName;
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'JUGADOR_CAMBIO_PROFESOR',
      `Profesor de ${player.firstName} ${player.lastName} asignado a "${coachName}".`,
      'jugadores',
      player.clubId
    );
    return player;
  }

  public assignCoachToCategory(categoryId: string, coachId: string, coachName: string, currentUser: User): Category {
    const category = this.state.categories.find(c => c.id === categoryId);
    if (!category) throw new Error('Categoría no encontrada');
    if (!this.assertClubAccess(currentUser, category.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    category.coachId = coachId;
    category.coachName = coachName;

    // Also update all players in this category to have this coach if desired
    this.state.players
      .filter(p => p.categoryId === categoryId && p.clubId === category.clubId)
      .forEach(p => {
        p.coachId = coachId;
        p.coachName = coachName;
      });

    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'PROFESOR_ASIGNADO_CATEGORIA',
      `Profesor "${coachName}" asignado como titular de categoría "${category.name}".`,
      'jugadores',
      category.clubId
    );
    return category;
  }

  public addCategory(catData: Omit<Category, 'id'>, currentUser: User): Category {
    if (!this.assertClubAccess(currentUser, catData.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    const newCategory: Category = {
      ...catData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    this.state.categories.push(newCategory);
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'CATEGORIA_CREADA',
      `Nueva categoría creada: "${newCategory.name}".`,
      'jugadores',
      catData.clubId
    );
    return newCategory;
  }

  public updateCategory(category: Category, currentUser: User): Category {
    if (!this.assertClubAccess(currentUser, category.clubId)) {
      throw new Error('Aislamiento RLS');
    }
    const idx = this.state.categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.state.categories[idx] = { ...category };
      this.saveState(this.state);
      this.logAudit(
        currentUser,
        'CATEGORIA_MODIFICADA',
        `Categoría "${category.name}" actualizada.`,
        'jugadores',
        category.clubId
      );
    }
    return category;
  }

  public updateClubBranding(clubId: string, branding: Partial<Club['branding']>, logoUrl?: string, currentUser?: User) {
    const user = currentUser || ({ id: 'superadmin', role: 'SUPERADMIN' } as User);
    if (!this.assertClubAccess(user, clubId)) {
      throw new Error('Aislamiento RLS');
    }
    const club = this.state.clubs.find(c => c.id === clubId);
    if (club) {
      club.branding = { ...club.branding, ...branding };
      if (logoUrl) {
        club.logoUrl = logoUrl;
      }
      this.logAudit(user, 'PERSONALIZACION_ACTUALIZADA', `Identidad visual y front actualizados para "${club.name}"`, 'sistema', clubId);
      this.saveState(this.state);
    }
  }

  // Bulk import players with duplicate conflict detector
  public importPlayers(
    clubId: string,
    playersToImport: {
      dni: string;
      firstName: string;
      lastName: string;
      birthDate?: string;
      phone?: string;
      email?: string;
      disciplineId: string;
      categoryId: string;
      monthlyFeeDue?: number;
    }[],
    duplicateStrategy: 'skip' | 'update' | 'flag',
    currentUser: User
  ): { imported: number; updated: number; skipped: number; restricted: number } {
    if (!this.assertClubAccess(currentUser, clubId)) throw new Error('Aislamiento RLS');
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let restricted = 0;

    for (const item of playersToImport) {
      const existing = this.state.players.find(p => p.clubId === clubId && p.dni === item.dni);
      if (existing) {
        if (duplicateStrategy === 'skip') {
          skipped++;
          continue;
        } else if (duplicateStrategy === 'update') {
          existing.firstName = item.firstName;
          existing.lastName = item.lastName;
          if (item.birthDate) existing.birthDate = item.birthDate;
          if (item.phone) existing.phone = item.phone;
          if (item.email) existing.email = item.email;
          updated++;
          continue;
        }
      }

      // Check current quota
      const currentCount = this.state.players.filter(p => p.clubId === clubId).length;
      const isRestricted = currentCount >= club.contractedPlayersQuota;
      if (isRestricted) restricted++;

      const newPly: Player = {
        id: `ply-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        clubId,
        disciplineId: item.disciplineId,
        categoryId: item.categoryId,
        dni: item.dni,
        firstName: item.firstName,
        lastName: item.lastName,
        birthDate: item.birthDate || '2008-01-01',
        phone: item.phone || '',
        email: item.email || '',
        emergencyContact: { name: 'Familiar a cargo', relationship: 'Tutor', phone: item.phone || '' },
        medicalCertificateValid: true,
        status: 'activo',
        isRestricted,
        restrictedReason: isRestricted ? `Supera cupo de ${club.contractedPlayersQuota} del plan` : undefined,
        monthlyFeeDue: item.monthlyFeeDue || 20000,
        balance: 0,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      this.state.players.push(newPly);
      imported++;
    }

    this.logAudit(
      currentUser,
      'IMPORTACION_MASIVA_EXCEL',
      `Importación finalizada: ${imported} nuevos (${restricted} restringidos por cupo), ${updated} actualizados, ${skipped} omitidos por DNI duplicado.`,
      'jugadores',
      clubId
    );

    this.saveState(this.state);
    return { imported, updated, skipped, restricted };
  }

  // --- BACKUP & CLOUD STORAGE REPOSITORY (SUPERADMIN EXCLUSIVE) ---
  public getBackupPolicies(currentUser: User): ClubBackupPolicy[] {
    if (currentUser.role !== 'SUPERADMIN') {
      return [];
    }
    return [...this.state.backupPolicies];
  }

  public saveBackupPolicy(policy: ClubBackupPolicy, currentUser: User): void {
    if (currentUser.role !== 'SUPERADMIN') {
      return;
    }
    const idx = this.state.backupPolicies.findIndex(p => p.id === policy.id);
    if (idx >= 0) {
      this.state.backupPolicies[idx] = policy;
    } else {
      this.state.backupPolicies.push(policy);
    }
    this.saveState(this.state);
    this.logAudit(
      currentUser,
      'POLITICA_BACKUP_ACTUALIZADA',
      `Política de backup en la nube actualizada para club '${policy.clubId}' (${policy.frequency} a las ${policy.timeOfDay}).`,
      'superadmin',
      policy.clubId
    );
  }

  public getBackupSnapshots(clubId: string | null, currentUser: User): ClubBackupSnapshot[] {
    if (currentUser.role !== 'SUPERADMIN') {
      return [];
    }
    if (clubId && clubId !== 'ALL') {
      return this.state.backupSnapshots.filter(s => s.clubId === clubId);
    }
    return [...this.state.backupSnapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public triggerInstantBackup(clubId: string, currentUser: User): ClubBackupSnapshot {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new Error('Solo el SUPERADMIN puede disparar respaldos en la nube.');
    }
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');

    const policy = this.state.backupPolicies.find(p => p.clubId === clubId) || {
      provider: 'gcs' as const,
      bucketName: `gs://fraovia-vault-prod-us/${club.slug}/backups/`,
      region: 'us-east1 (N. Virginia)',
      retentionDays: 90
    };

    // Filter all records isolated to this club
    const clubPlayers = this.state.players.filter(p => p.clubId === clubId);
    const clubReceipts = this.state.receipts.filter(r => r.clubId === clubId);
    const clubCashMovements = this.state.cashMovements.filter(m => m.clubId === clubId);
    const clubAttendance = this.state.attendanceRecords.filter(a => a.clubId === clubId);
    const clubAuditLogs = this.state.auditLogs.filter(l => l.clubId === clubId);

    const dumpData = {
      meta: {
        fraoviaVersion: '2.4.0-cloud',
        exportType: 'ISOLATED_TENANT_SNAPSHOT',
        clubId: club.id,
        clubName: club.name,
        clubSlug: club.slug,
        timestamp: new Date().toISOString(),
        initiatedBy: currentUser.fullName,
        storageProvider: policy.provider,
        bucket: policy.bucketName,
        region: policy.region
      },
      data: {
        club,
        players: clubPlayers,
        receipts: clubReceipts,
        cashMovements: clubCashMovements,
        attendance: clubAttendance,
        auditLogs: clubAuditLogs
      }
    };

    const dumpStr = JSON.stringify(dumpData, null, 2);
    const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${club.slug}-snapshot-${dateTag}.fraovia.backup.gz`;
    
    // Simulate SHA-256 Checksum
    const hexChars = '0123456789abcdef';
    let checksum = '';
    for (let i = 0; i < 64; i++) {
      checksum += hexChars[Math.floor(Math.random() * 16)];
    }

    const newSnapshot: ClubBackupSnapshot = {
      id: `snp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clubId: club.id,
      clubName: club.name,
      filename,
      fileSizeBytes: Math.round(dumpStr.length * 0.42 + 250000), // simulated compressed bytes
      recordCount: {
        players: clubPlayers.length,
        receipts: clubReceipts.length,
        cashMovements: clubCashMovements.length,
        attendance: clubAttendance.length,
        auditLogs: clubAuditLogs.length
      },
      storageProvider: policy.provider,
      cloudBucket: policy.bucketName,
      cloudPath: `${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${filename}`,
      checksumSha256: checksum,
      status: 'completado',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      initiatedBy: `${currentUser.fullName} (${currentUser.role})`,
      rawJsonData: dumpStr
    };

    this.state.backupSnapshots.unshift(newSnapshot);
    this.saveState(this.state);

    this.logAudit(
      currentUser,
      'BACKUP_NUBE_DISPARADO',
      `Copia de seguridad instantánea creada para '${club.name}' (${(newSnapshot.fileSizeBytes / 1024 / 1024).toFixed(1)} MB) en ${newSnapshot.cloudBucket}`,
      'superadmin',
      club.id
    );

    return newSnapshot;
  }

  // --- WHATSAPP CONFIGURATION & LINKING ---
  public updateClubWhatsAppConfig(
    clubId: string,
    config: Partial<ClubWhatsAppConfig>,
    currentUser: User
  ): Club {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error('Aislamiento RLS');
    }

    club.whatsappConfig = {
      adminPhone: config.adminPhone !== undefined ? config.adminPhone : (club.whatsappConfig?.adminPhone || club.phone || ''),
      storePhone: config.storePhone !== undefined ? config.storePhone : (club.whatsappConfig?.storePhone || club.phone || ''),
      adminMessageTemplate: config.adminMessageTemplate !== undefined ? config.adminMessageTemplate : club.whatsappConfig?.adminMessageTemplate,
      storeMessageTemplate: config.storeMessageTemplate !== undefined ? config.storeMessageTemplate : club.whatsappConfig?.storeMessageTemplate
    };

    this.logAudit(
      currentUser,
      'WHATSAPP_CONFIGURADO',
      `Canales oficiales de WhatsApp configurados (Administración: ${club.whatsappConfig.adminPhone} | Tienda: ${club.whatsappConfig.storePhone})`,
      'sistema',
      clubId
    );

    this.saveState(this.state);
    return club;
  }

  // --- RECEIPT TEMPLATE WITH BADGE & WATERMARK ---
  public updateClubReceiptTemplate(
    clubId: string,
    template: Partial<ReceiptTemplateConfig>,
    currentUser: User
  ): Club {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error('Aislamiento RLS');
    }

    club.receiptTemplate = {
      showBadge: template.showBadge !== undefined ? template.showBadge : (club.receiptTemplate?.showBadge ?? true),
      showWatermark: template.showWatermark !== undefined ? template.showWatermark : (club.receiptTemplate?.showWatermark ?? true),
      badgeUrl: template.badgeUrl !== undefined ? template.badgeUrl : (club.receiptTemplate?.badgeUrl || club.logoUrl),
      watermarkUrl: template.watermarkUrl !== undefined ? template.watermarkUrl : (club.receiptTemplate?.watermarkUrl || club.logoUrl),
      watermarkOpacity: template.watermarkOpacity !== undefined ? template.watermarkOpacity : (club.receiptTemplate?.watermarkOpacity ?? 0.14),
      headerTitle: template.headerTitle || club.receiptTemplate?.headerTitle || 'COMPROBANTE OFICIAL DE COBRO',
      footerLegend: template.footerLegend || club.receiptTemplate?.footerLegend,
      primaryColor: template.primaryColor || club.receiptTemplate?.primaryColor || club.branding.primaryColor
    };

    this.logAudit(
      currentUser,
      'PLANTILLA_COMPROBANTE_ACTUALIZADA',
      `Plantilla oficial de comprobantes personalizada con escudo y marca de agua (${club.name}).`,
      'sistema',
      clubId
    );

    this.saveState(this.state);
    return club;
  }

  // --- AUTOMATED FEE REMINDER AT MONTH START ---
  public updateClubFeeReminderAutomation(
    clubId: string,
    config: Partial<FeeReminderAutomationConfig>,
    currentUser: User
  ): Club {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error('Aislamiento RLS');
    }

    club.feeReminderAutomation = {
      enabled: config.enabled !== undefined ? config.enabled : (club.feeReminderAutomation?.enabled ?? true),
      startDayOfMonth: config.startDayOfMonth !== undefined ? config.startDayOfMonth : (club.feeReminderAutomation?.startDayOfMonth ?? 1),
      dueDayOfMonth: config.dueDayOfMonth !== undefined ? config.dueDayOfMonth : (club.feeReminderAutomation?.dueDayOfMonth ?? 10),
      graceDays: config.graceDays !== undefined ? config.graceDays : (club.feeReminderAutomation?.graceDays ?? 5),
      messageTemplate: config.messageTemplate || club.feeReminderAutomation?.messageTemplate || '¡Hola {socio}! Te recordamos desde {club} que la cuota de {mes} por ${monto} está próxima a vencer el {fecha_vencimiento}. Alias: {cbu_alias}.',
      cbuAlias: config.cbuAlias !== undefined ? config.cbuAlias : (club.feeReminderAutomation?.cbuAlias || ''),
      channel: config.channel || club.feeReminderAutomation?.channel || 'whatsapp',
      autoSendOnMonthStart: config.autoSendOnMonthStart !== undefined ? config.autoSendOnMonthStart : (club.feeReminderAutomation?.autoSendOnMonthStart ?? true),
      lastRunDate: config.lastRunDate || club.feeReminderAutomation?.lastRunDate
    };

    this.logAudit(
      currentUser,
      'AUTOMATIZACION_CUOTAS_CONFIGURADA',
      `Avisos automáticos de vencimiento configurados (Inicia día ${club.feeReminderAutomation.startDayOfMonth} | Vence día ${club.feeReminderAutomation.dueDayOfMonth}) para ${club.name}.`,
      'caja',
      clubId
    );

    this.saveState(this.state);
    return club;
  }

  public executeFeeRemindersBatch(
    clubId: string,
    playerIds: string[],
    currentUser: User
  ): { sentCount: number; message: string } {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!this.assertClubAccess(currentUser, clubId)) {
      throw new Error('Aislamiento RLS');
    }

    const count = playerIds.length;
    if (club.feeReminderAutomation) {
      club.feeReminderAutomation.lastRunDate = new Date().toISOString().split('T')[0];
    }

    this.logAudit(
      currentUser,
      'RECORDATORIOS_CUOTAS_ENVIADOS',
      `Envío automatizado de avisos de vencimiento de saldo ejecutado a ${count} socios por ${club.feeReminderAutomation?.channel || 'WhatsApp'}.`,
      'caja',
      clubId
    );

    this.saveState(this.state);
    return {
      sentCount: count,
      message: `Se despacharon exitosamente ${count} mensajes de recordatorio de vencimiento de cuota.`
    };
  }

  // --- SUPERADMIN SUBSCRIPTION EXPIRY ALERT (CARTEL / CUENTA REGRESIVA) ---
  public updateClubSubscriptionAlert(
    clubId: string,
    alertConfig: Partial<SubscriptionAlertConfig>,
    currentUser: User
  ): Club {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new Error('Permiso denegado: solo el SUPERADMIN puede configurar las alertas de vencimiento de suscripción SaaS');
    }

    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');

    club.subscriptionAlert = {
      mode: alertConfig.mode !== undefined ? alertConfig.mode : (club.subscriptionAlert?.mode ?? 'disabled'),
      expirationDate: alertConfig.expirationDate || club.subscriptionAlert?.expirationDate || new Date(Date.now() + 15 * 86400000).toISOString(),
      customMessage: alertConfig.customMessage !== undefined ? alertConfig.customMessage : club.subscriptionAlert?.customMessage,
      supportContact: alertConfig.supportContact || club.subscriptionAlert?.supportContact || '+54 9 11 4782-9011',
      showToRoles: alertConfig.showToRoles || club.subscriptionAlert?.showToRoles || ['DUEÑO', 'ADMINISTRACIÓN', 'SUPERADMIN']
    };

    this.logAudit(
      currentUser,
      'ALERTA_PLAN_CONFIGURADA',
      `Alerta de vencimiento de plan SaaS para '${club.name}' configurada: Modo '${club.subscriptionAlert.mode}' (Vencimiento: ${new Date(club.subscriptionAlert.expirationDate).toLocaleDateString('es-AR')}).`,
      'superadmin',
      clubId
    );

    this.saveState(this.state);
    return club;
  }

  // --- TRIP & TOURNAMENTS (VIAJES Y TORNEOS CON CAJA EXCLUSIVA) ---
  public getTripTournaments(clubId: string, currentUser: User): TripTournament[] {
    if (!this.assertClubAccess(currentUser, clubId)) return [];
    return (this.state.tripTournaments || []).filter(t => t.clubId === clubId);
  }

  public getTripTournamentById(tripId: string, currentUser: User): TripTournament | undefined {
    const trip = (this.state.tripTournaments || []).find(t => t.id === tripId);
    if (!trip) return undefined;
    if (!this.assertClubAccess(currentUser, trip.clubId)) return undefined;
    return trip;
  }

  public createTripTournament(
    tripData: Omit<TripTournament, 'id' | 'createdAt' | 'cashBoxId'>,
    currentUser: User
  ): TripTournament {
    if (!this.assertClubAccess(currentUser, tripData.clubId)) {
      throw new Error('RLS: Acceso denegado al club.');
    }

    const tripId = `trip-${Date.now()}`;
    const boxId = `box-viaje-${Date.now()}`;

    // 1. Create dedicated CashBox for this trip
    const dedicatedCashBox: CashBox = {
      id: boxId,
      clubId: tripData.clubId,
      name: `Caja Viaje: ${tripData.tournamentName} (${tripData.destination.split(',')[0].trim()})`,
      type: 'viajes',
      responsibleUserId: currentUser.id,
      currentBalance: 0,
      status: 'abierta',
      openedAt: new Date().toISOString(),
      openedByUserId: currentUser.id
    };

    if (!this.state.cashBoxes) this.state.cashBoxes = [];
    this.state.cashBoxes.push(dedicatedCashBox);

    // 2. Create the Trip Tournament
    const newTrip: TripTournament = {
      ...tripData,
      id: tripId,
      cashBoxId: boxId,
      createdAt: new Date().toISOString()
    };

    if (!this.state.tripTournaments) this.state.tripTournaments = [];
    this.state.tripTournaments.unshift(newTrip);

    this.logAudit(
      currentUser,
      'VIAJE_TORNEO_CREADO',
      `Nuevo viaje/torneo creado: '${newTrip.tournamentName}' en ${newTrip.destination} con ${newTrip.participants.length} jugadores convocados. Caja exclusiva creada: '${dedicatedCashBox.name}'.`,
      'administracion',
      tripData.clubId
    );

    this.saveState(this.state);
    return newTrip;
  }

  public updateTripTournament(trip: TripTournament, currentUser: User): TripTournament {
    if (!this.assertClubAccess(currentUser, trip.clubId)) {
      throw new Error('RLS: Acceso denegado.');
    }

    const idx = (this.state.tripTournaments || []).findIndex(t => t.id === trip.id);
    if (idx === -1) throw new Error('Viaje/Torneo no encontrado');

    this.state.tripTournaments[idx] = trip;

    this.logAudit(
      currentUser,
      'VIAJE_TORNEO_ACTUALIZADO',
      `Viaje '${trip.tournamentName}' actualizado: ${trip.participants.length} convocados. Estado: ${trip.status}.`,
      'administracion',
      trip.clubId
    );

    this.saveState(this.state);
    return trip;
  }

  public deleteTripTournament(tripId: string, currentUser: User): void {
    const trip = (this.state.tripTournaments || []).find(t => t.id === tripId);
    if (!trip) return;
    if (!this.assertClubAccess(currentUser, trip.clubId)) {
      throw new Error('RLS: Acceso denegado.');
    }

    this.state.tripTournaments = this.state.tripTournaments.filter(t => t.id !== tripId);
    this.saveState(this.state);
  }

  public recordTripPayment(
    tripId: string,
    playerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes: string,
    currentUser: User
  ): { receipt: Receipt; movement: CashMovement } {
    const trip = (this.state.tripTournaments || []).find(t => t.id === tripId);
    if (!trip) throw new Error('Viaje/Torneo no encontrado');
    if (!this.assertClubAccess(currentUser, trip.clubId)) throw new Error('RLS: Acceso denegado');

    const participant = trip.participants.find(p => p.playerId === playerId);
    if (!participant) throw new Error('El deportista no se encuentra convocado en este viaje.');

    if (amount <= 0) throw new Error('El monto debe ser mayor a 0');

    // 1. Update participant balance
    participant.amountPaid += amount;
    if (participant.amountPaid >= participant.totalCost) {
      participant.status = 'al_dia';
    } else {
      participant.status = 'en_pagos';
    }
    if (notes) participant.notes = notes;

    // 2. Generate Receipt & Impact into Trip's DEDICATED CashBox
    const receipt = this.createReceipt(
      {
        clubId: trip.clubId,
        customerName: `${participant.playerFullName} (Tutor: ${participant.tutorName || 'Registrado'})`,
        customerDni: participant.playerDni,
        concept: `Cuota Viaje/Torneo: ${trip.tournamentName} (${trip.destination}) - ${participant.playerFullName}`,
        amount: amount,
        paymentMethod: paymentMethod,
        items: [
          {
            description: `Abono de Viaje: ${trip.tournamentName} - ${trip.categoryDescription} (DNI ${participant.playerDni})`,
            quantity: 1,
            unitPrice: amount,
            total: amount
          }
        ],
        sector: 'administracion',
        issuedByUserId: currentUser.id
      },
      trip.cashBoxId,
      currentUser,
      'viaje'
    );

    const movement = this.state.cashMovements.find(m => m.id === receipt.cashMovementId)!;

    this.logAudit(
      currentUser,
      'COBRO_VIAJE_REGISTRADO',
      `Pago de viaje registrado para ${participant.playerFullName}: $${amount.toLocaleString('es-AR')} para '${trip.tournamentName}' (Recibo ${receipt.receiptNumber}). Imputado en Caja Exclusiva de Viaje.`,
      'caja',
      trip.clubId
    );

    this.saveState(this.state);
    return { receipt, movement };
  }

  // --- TOGGLE VISIBILIDAD DE MÓDULOS / VENTANAS / ICONOS DEL CLUB ---
  public updateClubActiveModules(
    clubId: string,
    modules: Partial<Club['activeModules']>,
    currentUser: User
  ): Club {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club no encontrado');
    if (!this.assertClubAccess(currentUser, clubId)) throw new Error('RLS: Acceso denegado');

    club.activeModules = {
      ...club.activeModules,
      ...modules
    };

    this.logAudit(
      currentUser,
      'CONFIGURACION_MODULOS_ACTUALIZADA',
      `Visibilidad de módulos actualizada para '${club.name}': Familias=${club.activeModules.portalFamilias !== false}, Viajes=${club.activeModules.viajesTorneos !== false}, Tienda=${club.activeModules.tienda}.`,
      'administracion',
      clubId
    );

    this.saveState(this.state);
    return club;
  }
}

export const fraoviaDB = new FraoviaStore();
