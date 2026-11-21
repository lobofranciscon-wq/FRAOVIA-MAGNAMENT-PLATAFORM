/**
 * FRAOVIA Multi-Club Supabase & PostgreSQL Architecture Metadata
 * Describes the schema tables, club_id scoping, foreign keys, and RLS policies.
 */

export interface TableRLSSpec {
  tableName: string;
  hasClubId: boolean;
  isolationLevel: 'STRICT_CLUB_ID' | 'SUPERADMIN_ONLY' | 'SCOPED_BY_CATEGORY';
  rlsEnabled: boolean;
  description: string;
  policies: {
    name: string;
    command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    roles: string;
    usingExpression: string;
    checkExpression?: string;
  }[];
}

export const POSTGRESQL_RLS_MATRIX: TableRLSSpec[] = [
  {
    tableName: 'clubs',
    hasClubId: true, // Primary key id is the club_id
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Organizaciones deportivas independientes. Cada club tiene su branding, plan y módulos.',
    policies: [
      {
        name: 'Superadmin full access to clubs',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club users can read own club details',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'id = public.get_auth_club_id()'
      },
      {
        name: 'Club owners can update branding',
        command: 'UPDATE',
        roles: 'authenticated',
        usingExpression: 'id = public.get_auth_club_id()',
        checkExpression: 'id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'profiles',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Cuentas de usuario. Cada usuario normal pertenece a un único club_id (sin selector). Solo SUPERADMIN tiene club_id NULL.',
    policies: [
      {
        name: 'Superadmin full access to profiles',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Users view members of own club',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'disciplines',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Deportes del club (Fútbol, Básquet, Futsal, etc.). Aisladas por club_id.',
    policies: [
      {
        name: 'Superadmin full access to disciplines',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club users access own disciplines',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'categories',
    hasClubId: true,
    isolationLevel: 'SCOPED_BY_CATEGORY',
    rlsEnabled: true,
    description: 'Divisiones por disciplina (Primera, Sub 17, Sub 15).',
    policies: [
      {
        name: 'Superadmin full access to categories',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club users access own categories',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'players',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Fichas de deportistas. Incluye columna is_restricted para garantizar cero pérdida de datos en cambios de plan.',
    policies: [
      {
        name: 'Superadmin can manage all players',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club members view their club players',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      },
      {
        name: 'Club staff insert players in own club',
        command: 'INSERT',
        roles: 'authenticated',
        usingExpression: 'true',
        checkExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'receipts',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Comprobantes oficiales numerados e inmutables. Solo se anulan con contraasiento contable.',
    policies: [
      {
        name: 'Superadmin view all receipts',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club users view only own club receipts',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      },
      {
        name: 'Club staff emit receipts for own club',
        command: 'INSERT',
        roles: 'authenticated',
        usingExpression: 'true',
        checkExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'cash_boxes',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Cajas del club (General, por Disciplina o Subpuntos con caja central).',
    policies: [
      {
        name: 'Superadmin view all cashboxes',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club members access only own cashboxes',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'cash_movements',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Asientos de ingresos y egresos contables asociados a la caja del club.',
    policies: [
      {
        name: 'Club members view own movements',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'store_products',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Artículos de tienda e indumentaria oficial.',
    policies: [
      {
        name: 'Club store staff manage own products',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'store_sales',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Registro de ventas del mostrador con recibo oficial.',
    policies: [
      {
        name: 'Club store staff view own sales',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'audit_logs',
    hasClubId: true,
    isolationLevel: 'STRICT_CLUB_ID',
    rlsEnabled: true,
    description: 'Bitácora inmutable de seguridad y auditoría institucional.',
    policies: [
      {
        name: 'Superadmin view all audit logs',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club admins view their club audit logs',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: 'club_id = public.get_auth_club_id()'
      }
    ]
  },
  {
    tableName: 'visual_designs',
    hasClubId: true,
    isolationLevel: 'SUPERADMIN_ONLY',
    rlsEnabled: true,
    description: 'Capa visual del Editor de Clubes: plantillas, borradores, versiones y diseños publicados multi-club.',
    policies: [
      {
        name: 'Superadmin full access to visual designs',
        command: 'ALL',
        roles: 'authenticated',
        usingExpression: 'public.is_superadmin()'
      },
      {
        name: 'Club users read published designs',
        command: 'SELECT',
        roles: 'authenticated',
        usingExpression: "status = 'publicado' AND (club_id = public.get_auth_club_id() OR published_clubs @> jsonb_build_array(public.get_auth_club_id()::text))"
      }
    ]
  }
];
