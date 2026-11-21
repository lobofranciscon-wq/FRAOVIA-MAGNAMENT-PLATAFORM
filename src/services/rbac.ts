import { UserRole } from '../types/fraovia';

export type SystemSector = 
  | 'superadmin_console'
  | 'dueno_executive'
  | 'administracion_finanzas'
  | 'profesor_cancha'
  | 'tienda_pos'
  | 'caja_tesoreria'
  | 'comprobantes'
  | 'jugadores_padron'
  | 'asistencia_deportiva'
  | 'configuracion_club'
  | 'temporadas'
  | 'auditoria'
  | 'viajes_torneos';

export interface RolePermissions {
  role: UserRole;
  displayName: string;
  badgeColor: string;
  description: string;
  allowedSectors: SystemSector[];
  canManageClubs: boolean;
  canManagePlans: boolean;
  canManageBetas: boolean;
  canAccessGeneralCash: boolean;
  canEmitReceipts: boolean;
  canVoidReceipts: boolean;
  canTakeAttendance: boolean;
  canManageStoreStock: boolean;
  canProcessStoreSale: boolean;
  canImportExcel: boolean;
  canExportData: boolean;
  canCloseSeason: boolean;
  canViewAllDisciplines: boolean;
  isScopedToAssignedCategoriesOnly: boolean;
  breakdown: {
    sector: string;
    responsibilities: string[];
  };
  limitations: string[];
}

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, RolePermissions> = {
  SUPERADMIN: {
    role: 'SUPERADMIN',
    displayName: 'SuperAdmin FRAOVIA (Plataforma)',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Gobierno global SaaS multi-tenant. Alta de instituciones, planes y auditoría.',
    allowedSectors: [
      'superadmin_console',
      'dueno_executive',
      'administracion_finanzas',
      'profesor_cancha',
      'tienda_pos',
      'caja_tesoreria',
      'comprobantes',
      'jugadores_padron',
      'asistencia_deportiva',
      'configuracion_club',
      'temporadas',
      'auditoria',
      'viajes_torneos'
    ],
    canManageClubs: true,
    canManagePlans: true,
    canManageBetas: true,
    canAccessGeneralCash: true,
    canEmitReceipts: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canVoidReceipts: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canTakeAttendance: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canManageStoreStock: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canProcessStoreSale: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canImportExcel: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canExportData: true,
    canCloseSeason: false, // Modo fantasma del SUPERADMIN es estrictamente solo lectura
    canViewAllDisciplines: true,
    isScopedToAssignedCategoriesOnly: false,
    breakdown: {
      sector: 'Gobernanza de Infraestructura SaaS',
      responsibilities: [
        'Aprovisionamiento y administración de clubes e inquilinos.',
        'Constructor de planes comerciales y cuotas del sistema.',
        'Activación de flags experimentales y nuevas funciones Beta.',
        'Auditoría y trazabilidad de eventos en toda la plataforma.'
      ]
    },
    limitations: [
      'No pertenece a un club individual (club_id = NULL).',
      'Debe operar bajo Modo Supervisión para que sus acciones queden auditadas.'
    ]
  },

  // ROL 1 DEL CLUB: DUEÑO O GERENTE
  DUEÑO: {
    role: 'DUEÑO',
    displayName: 'Dueño o Gerente',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Máxima autoridad y conducción del club. Decisión estratégica, macro finanzas y cierre de ciclos.',
    allowedSectors: [
      'dueno_executive',
      'administracion_finanzas',
      'caja_tesoreria',
      'comprobantes',
      'jugadores_padron',
      'asistencia_deportiva',
      'temporadas',
      'auditoria',
      'viajes_torneos'
    ],
    canManageClubs: false,
    canManagePlans: false,
    canManageBetas: false,
    canAccessGeneralCash: true,
    canEmitReceipts: true,
    canVoidReceipts: true,
    canTakeAttendance: true,
    canManageStoreStock: false,
    canProcessStoreSale: false,
    canImportExcel: true,
    canExportData: true,
    canCloseSeason: true,
    canViewAllDisciplines: true,
    isScopedToAssignedCategoriesOnly: false,
    breakdown: {
      sector: 'Presidencia, Gerencia & Alta Dirección',
      responsibilities: [
        'Tablero Recharts: Curvas de ingresos vs egresos, superávit operativo y proyección.',
        'Censo y crecimiento de atletas por disciplina deportiva.',
        'Cierre oficial y formal de temporada deportiva (facultad exclusiva).',
        'Aprobación de convenios, becas institucionales y descuentos familiares.',
        'Supervisión y auditoría de recaudación de tesorería.'
      ]
    },
    limitations: [
      'No realiza venta de mostrador en la tienda oficial.',
      'No altera los planes comerciales de la plataforma FRAOVIA ni accede a otros clubes.',
      'No puede alterar el diseño visual, fondos ni colores de ventanas del software (exclusivo Superadmin).'
    ]
  },

  // ROL 2 DEL CLUB: ADMINISTRACIÓN
  ADMINISTRACIÓN: {
    role: 'ADMINISTRACIÓN',
    displayName: 'Administración',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Gestión operativa diaria, secretaría, cobranzas, emisión de recibos y arqueo de caja.',
    allowedSectors: [
      'administracion_finanzas',
      'caja_tesoreria',
      'comprobantes',
      'jugadores_padron',
      'asistencia_deportiva',
      'configuracion_club',
      'auditoria',
      'viajes_torneos'
    ],
    canManageClubs: false,
    canManagePlans: false,
    canManageBetas: false,
    canAccessGeneralCash: true,
    canEmitReceipts: true,
    canVoidReceipts: true,
    canTakeAttendance: true,
    canManageStoreStock: false,
    canProcessStoreSale: false,
    canImportExcel: true,
    canExportData: true,
    canCloseSeason: false,
    canViewAllDisciplines: true,
    isScopedToAssignedCategoriesOnly: false,
    breakdown: {
      sector: 'Secretaría, Tesorería & Padrón de Socios',
      responsibilities: [
        'Padrón de deportistas: Altas, bajas, control de cupo contratado y apto médico.',
        'Cobranza de cuotas mensuales y seguimiento de deudores morosos.',
        'Emisión de comprobantes oficiales inmutables con numeración FRA-2026-XXXXXX.',
        'Anulación justificada de comprobantes con contraasiento contable automático.',
        'Gestión de cajas, arqueo de fondos y movimientos de tesorería.',
        'Importador masivo Excel de 6 pasos con resolución de duplicados por DNI.'
      ]
    },
    limitations: [
      'No puede cerrar temporadas deportivas (facultad de Dueño o Gerente).',
      'No toma asistencia deportiva en campo de juego.',
      'No altera la suscripción SaaS del club.'
    ]
  },

  // ROL 3 DEL CLUB: TIENDA
  TIENDA: {
    role: 'TIENDA',
    displayName: 'Tienda',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Venta de indumentaria oficial, merchandising, comprobantes de mostrador y caja de tienda.',
    allowedSectors: [
      'tienda_pos',
      'caja_tesoreria',
      'comprobantes'
    ],
    canManageClubs: false,
    canManagePlans: false,
    canManageBetas: false,
    canAccessGeneralCash: false,
    canEmitReceipts: true, // Emite recibos y movimientos de caja para ventas e ingresos de tienda
    canVoidReceipts: false, // Inmutable: no se editan ni se borran
    canTakeAttendance: false,
    canManageStoreStock: true,
    canProcessStoreSale: true,
    canImportExcel: false,
    canExportData: false,
    canCloseSeason: false,
    canViewAllDisciplines: false,
    isScopedToAssignedCategoriesOnly: false,
    breakdown: {
      sector: 'Punto de Venta Mostrador (POS), Mercadería & Caja de Tienda',
      responsibilities: [
        'Catálogo de indumentaria deportiva, indumentaria de competencia y accesorios.',
        'Control de stock en tiempo real con alertas de reposición mínima y descuento automático.',
        'Punto de venta rápido en mostrador (POS) con cálculo automático de vuelto.',
        'Emisión de comprobante oficial inmutable con numeración correlativa FRA-AAAA-XXXXXX.',
        'Registro de movimientos de caja de tienda (amount > 0, inmutables).'
      ]
    },
    limitations: [
      'RESTRICCIÓN DEPORTIVA: Sin acceso al padrón de deportistas ni fichas médicas.',
      'RESTRICCIÓN DE COBRANZA SOCIAL: No gestiona cuotas societarias ni convenios de becas.',
      'Sin acceso a temporadas ni identidades institucionales de otros clubes.'
    ]
  },

  // ROL 4 DEL CLUB: PROFESOR
  PROFESOR: {
    role: 'PROFESOR',
    displayName: 'Profesor',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Entrenador y cuerpo técnico en cancha. Alcance estrictamente delimitado a sus planteles.',
    allowedSectors: [
      'profesor_cancha',
      'asistencia_deportiva'
    ],
    canManageClubs: false,
    canManagePlans: false,
    canManageBetas: false,
    canAccessGeneralCash: false,
    canEmitReceipts: false,
    canVoidReceipts: false,
    canTakeAttendance: true,
    canManageStoreStock: false,
    canProcessStoreSale: false,
    canImportExcel: false,
    canExportData: false,
    canCloseSeason: false,
    canViewAllDisciplines: false,
    isScopedToAssignedCategoriesOnly: true,
    breakdown: {
      sector: 'Cuerpo Técnico & Entrenamiento en Cancha',
      responsibilities: [
        'Acceso exclusivo a sus categorías asignadas (ej. Fútbol Sub 15 y Sub 17).',
        'Toma de asistencia táctil en 1 clic (Presente, Ausente, Justificado, Lesionado).',
        'Semáforo de apto médico: Alerta inmediata de deportistas con certificado vencido.',
        'Ficha de contacto de emergencia de los tutores de cada jugador.',
        'Registro de observaciones técnicas del entrenamiento.'
      ]
    },
    limitations: [
      'RESTRICCIÓN FINANCIERA TOTAL: No ve saldos, deudas ni movimientos de caja.',
      'RESTRICCIÓN DE ALCANCE: No puede acceder a categorías de otros profesores.',
      'Sin acceso a la tienda oficial ni configuración del club.',
      'No emite ni anula comprobantes oficiales.'
    ]
  },

  // Alias para retrocompatibilidad
  GENERAL: {
    role: 'GENERAL',
    displayName: 'Dueño o Gerente',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Máxima autoridad y conducción del club. Decisión estratégica, macro finanzas y cierre de ciclos.',
    allowedSectors: [
      'dueno_executive',
      'administracion_finanzas',
      'caja_tesoreria',
      'comprobantes',
      'jugadores_padron',
      'configuracion_club',
      'temporadas',
      'auditoria',
      'viajes_torneos'
    ],
    canManageClubs: false,
    canManagePlans: false,
    canManageBetas: false,
    canAccessGeneralCash: true,
    canEmitReceipts: true,
    canVoidReceipts: true,
    canTakeAttendance: false,
    canManageStoreStock: false,
    canProcessStoreSale: false,
    canImportExcel: true,
    canExportData: true,
    canCloseSeason: true,
    canViewAllDisciplines: true,
    isScopedToAssignedCategoriesOnly: false,
    breakdown: {
      sector: 'Presidencia, Gerencia & Alta Dirección',
      responsibilities: [
        'Tablero Recharts: Curvas de ingresos vs egresos, superávit operativo y proyección.',
        'Censo y crecimiento de atletas por disciplina deportiva.',
        'Cierre oficial y formal de temporada deportiva (facultad exclusiva).',
        'Aprobación de convenios, becas institucionales y descuentos familiares.'
      ]
    },
    limitations: [
      'No realiza venta de mostrador en la tienda oficial.',
      'No realiza toma de asistencia en campo ni entrenamientos.'
    ]
  }
};

export function canRoleAccessSector(role: UserRole, sector: SystemSector): boolean {
  const perms = ROLE_PERMISSIONS_MATRIX[role];
  if (!perms) return false;
  return perms.allowedSectors.includes(sector);
}
