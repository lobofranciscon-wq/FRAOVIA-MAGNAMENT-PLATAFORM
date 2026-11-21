-- ==============================================================================
-- FRAOVIA | Multi-Club Architecture & Row Level Security (RLS) PostgreSQL Schema
-- Platform: Supabase / PostgreSQL 15+
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CLUBS (ORGANIZACIONES MULTI-TENANT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cuit VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address TEXT,
    logo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'suspendido', 'en_mantenimiento')),
    current_season_id UUID,
    subscription_plan_id VARCHAR(50) NOT NULL DEFAULT 'plan-pro',
    contracted_players_quota INT NOT NULL DEFAULT 800,
    contracted_users_quota INT NOT NULL DEFAULT 10,
    branding JSONB NOT NULL DEFAULT '{"primaryColor": "#10b981", "secondaryColor": "#0ea5e9", "darkSidebar": true}'::jsonb,
    active_modules JSONB NOT NULL DEFAULT '{"base": true, "deportivo": true, "caja": true, "tienda": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. TEMPORADAS (SEASONS)
-- Cada registro pertenece estrictamente a su club
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'cerrada', 'futura')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_season_year_per_club UNIQUE (club_id, year)
);

-- Foreign key back to club current season
ALTER TABLE public.clubs 
    DROP CONSTRAINT IF EXISTS fk_clubs_current_season;
ALTER TABLE public.clubs 
    ADD CONSTRAINT fk_clubs_current_season 
    FOREIGN KEY (current_season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

-- ==============================================================================
-- 3. PERFILES DE USUARIO (PROFILES / USERS)
-- Un usuario normal pertenece a un solo club_id.
-- Solo SUPERADMIN tiene club_id NULL.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
    club_id UUID REFERENCES public.clubs(id) ON DELETE RESTRICT,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'PROFESOR', 'TIENDA')),
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'restringido', 'deshabilitado')),
    phone VARCHAR(50),
    scope JSONB DEFAULT '{}'::jsonb, -- Scope por disciplina_ids o categoria_ids
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    CONSTRAINT check_superadmin_club_null CHECK (
        (role = 'SUPERADMIN' AND club_id IS NULL) OR 
        (role <> 'SUPERADMIN' AND club_id IS NOT NULL)
    )
);

-- ==============================================================================
-- 4. DISCIPLINAS (SPORTS DISCIPLINES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Activity',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    coordinator_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_discipline_code_per_club UNIQUE (club_id, code)
);

-- ==============================================================================
-- 5. CATEGORÍAS (CATEGORIES / DIVISIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(50),
    gender VARCHAR(20) CHECK (gender IN ('Masculino', 'Femenino', 'Mixto')),
    monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    color_block_name VARCHAR(100) DEFAULT 'Bloque Azul',
    training_schedule TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_category_name_per_discipline UNIQUE (discipline_id, name)
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color_block_name VARCHAR(100) DEFAULT 'Bloque Azul';

-- ==============================================================================
-- 6. JUGADORES / DEPORTISTAS (PLAYERS)
-- Incluye protección contra downgrade de plan: is_restricted (Solo Lectura)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    dni VARCHAR(30) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact JSONB NOT NULL DEFAULT '{"name": "", "relationship": "", "phone": ""}'::jsonb,
    medical_certificate_valid BOOLEAN NOT NULL DEFAULT TRUE,
    medical_expiry_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'restringido', 'moroso', 'suspendido')),
    suspension_reason VARCHAR(50),
    suspension_note TEXT,
    suspended_at TIMESTAMPTZ,
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE, -- Activado si excede cupo del plan
    restricted_reason TEXT,
    photo_url TEXT,
    jersey_number INT,
    position VARCHAR(100),
    color_block_name VARCHAR(100),
    blood_type VARCHAR(10),
    medical_notes TEXT,
    health_insurance VARCHAR(150),
    dominant_side VARCHAR(20),
    monthly_payments JSONB DEFAULT '{}'::jsonb,
    scholarship_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    scholarship_type VARCHAR(50) NOT NULL DEFAULT 'ninguna',
    scholarship_reason TEXT,
    monthly_fee_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_dni_per_club UNIQUE (club_id, dni)
);

-- Migraciones idempotentes para tablas ya existentes
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE public.players ADD CONSTRAINT players_status_check CHECK (status IN ('activo', 'inactivo', 'restringido', 'moroso', 'suspendido'));
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(50);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS suspension_note TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS jersey_number INT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS family_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS color_block_name VARCHAR(100);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS health_insurance VARCHAR(150);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS dominant_side VARCHAR(20);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS monthly_payments JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS scholarship_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS scholarship_type VARCHAR(50) NOT NULL DEFAULT 'ninguna';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS scholarship_reason TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS monthly_fee_due NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ==============================================================================
-- 7. GRUPOS FAMILIARES (FAMILY GROUPS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.family_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_discount_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL CHECK (action IN ('set_percent', 'detach')),
    new_percent NUMERIC(5,2),
    effective_from DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aplicado', 'cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ASISTENCIAS & ENTRENAMIENTOS (ATTENDANCE & CLASES SUSPENDIDAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    recorded_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspension_reason VARCHAR(30),
    suspension_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(30);
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS suspension_notes TEXT;

CREATE TABLE IF NOT EXISTS public.attendance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('presente', 'ausente', 'justificado', 'lesionado')),
    notes TEXT,
    CONSTRAINT unique_player_per_session UNIQUE (session_id, player_id)
);

-- ==============================================================================
-- 9. LISTADO PROVISORIO Y SOLICITUDES DE APROBACIÓN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provisional_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(30) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact JSONB DEFAULT '{"name": "", "relationship": "", "phone": ""}'::jsonb,
    notes TEXT,
    photo_url TEXT,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'enviado', 'aprobado', 'rechazado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    player_count INT NOT NULL DEFAULT 1,
    request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
    provisional_player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- 10. CAJAS & SUBPUNTOS (CASH BOXES)
-- Soporta 1. General, 2. Independientes por disciplina, 3. Con subpuntos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cash_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('general', 'disciplina', 'subpunto', 'tienda', 'viajes')),
    parent_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
    responsible_user_id UUID NOT NULL REFERENCES public.profiles(id),
    current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta', 'cerrada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cash_boxes DROP CONSTRAINT IF EXISTS cash_boxes_type_check;
ALTER TABLE public.cash_boxes ADD CONSTRAINT cash_boxes_type_check CHECK (type IN ('general', 'disciplina', 'subpunto', 'tienda', 'viajes'));

-- ==============================================================================
-- 9. COMPROBANTES DE PAGO (RECEIPTS / INMUTABLES)
-- Numeración automática, inmutables (solo anulación con contraasiento y bitácora)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL, -- ej: FRA-2026-000101
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_name VARCHAR(255) NOT NULL,
    customer_dni VARCHAR(30),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    concept VARCHAR(255) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    status VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'anulado')),
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by_user_id UUID REFERENCES public.profiles(id),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL,
    cash_movement_id UUID,
    issued_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_receipt_number_per_club UNIQUE (club_id, receipt_number)
);

ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES public.players(id) ON DELETE SET NULL;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL;

-- ==============================================================================
-- 10. MOVIMIENTOS DE CAJA (CASH MOVEMENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    cash_box_id UUID NOT NULL REFERENCES public.cash_boxes(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ingreso', 'egreso')),
    amount NUMERIC(14,2) NOT NULL,
    concept VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cuota', 'inscripcion', 'tienda', 'proveedor', 'sueldo', 'mantenimiento', 'anulacion_recibo', 'otro')),
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    registered_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

ALTER TABLE public.cash_movements DROP CONSTRAINT IF EXISTS cash_movements_category_check;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_category_check CHECK (category IN ('cuota', 'inscripcion', 'tienda', 'proveedor', 'sueldo', 'mantenimiento', 'anulacion_recibo', 'otro'));

-- ==============================================================================
-- 11. TIENDA OFICIAL (PRODUCTS & SALES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'agotado', 'discontinuado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sku_per_club UNIQUE (club_id, sku)
);

ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS sizes_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS public.store_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(30) NOT NULL CHECK (type IN ('porcentaje', 'monto_fijo', '2x1', 'categoria_descuento')),
    value NUMERIC(12,2) NOT NULL DEFAULT 0,
    applies_to VARCHAR(30) NOT NULL CHECK (applies_to IN ('todos', 'categoria', 'producto_especifico')),
    target_category VARCHAR(100),
    target_product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
    min_purchase_amount NUMERIC(12,2),
    status VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'pausada', 'vencida')),
    valid_until TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE RESTRICT,
    cashier_user_id UUID NOT NULL REFERENCES public.profiles(id),
    total NUMERIC(14,2) NOT NULL,
    subtotal NUMERIC(14,2),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    applied_promotion_name VARCHAR(255),
    payment_method VARCHAR(30) NOT NULL,
    customer_name VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. AUDITORÍA INMUTABLE (AUDIT LOGS)
-- Bitácora de seguridad y trazabilidad estricta
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL, -- NULL si es evento global plataforma
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('seguridad', 'caja', 'planes', 'jugadores', 'sistema', 'superadmin', 'becas', 'tienda', 'deportivo', 'administracion'))
);

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_category_check;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_category_check CHECK (category IN ('seguridad', 'caja', 'planes', 'jugadores', 'sistema', 'superadmin', 'becas', 'tienda', 'deportivo', 'administracion'));

-- ==============================================================================
-- 13. PLANES COMERCIALES SAAS Y FUNCIONES BETA (PLATAFORMA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.commercial_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'activo',
    monthly_price NUMERIC(12,2) NOT NULL,
    annual_price NUMERIC(12,2) NOT NULL,
    max_players INT NOT NULL,
    max_login_users INT NOT NULL,
    storage_gb INT NOT NULL,
    modules JSONB NOT NULL,
    features JSONB NOT NULL,
    addons JSONB NOT NULL,
    max_disciplines VARCHAR(20) NOT NULL DEFAULT 'unlimited',
    is_custom_for_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.beta_features (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'experimental',
    enabled_club_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- ==============================================================================
-- 14. EDITOR VISUAL DE CLUBES (VISUAL DESIGNS & TEMPLATES)
-- Capa visual independiente, borradores, versiones y publicación multi-club
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.visual_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE, -- NULL si es plantilla global
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicado', 'archivado')),
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    background JSONB NOT NULL DEFAULT '{}'::jsonb,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    versions_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_clubs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES IMPLEMENTATION
-- ==============================================================================
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas operativas
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_discount_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisional_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_designs ENABLE ROW LEVEL SECURITY;

-- 2. Funciones auxiliares de seguridad (Security Definer)
-- Extrae el club_id del usuario autenticado sin recursión
CREATE OR REPLACE FUNCTION public.get_auth_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica si el usuario autenticado tiene rol SUPERADMIN
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPERADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- POLÍTICAS RLS ESPECÍFICAS
-- ==============================================================================

-- --- A. CLUBS ---
CREATE POLICY "Superadmin full access to clubs"
  ON public.clubs FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club users can read own club details"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (id = public.get_auth_club_id());

CREATE POLICY "Club owners/managers can update their own club branding"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (id = public.get_auth_club_id())
  WITH CHECK (id = public.get_auth_club_id());

-- --- B. PROFILES (USUARIOS) ---
CREATE POLICY "Superadmin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Users can view members of their own club"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND club_id = public.get_auth_club_id());

-- --- C. JUGADORES (PLAYERS) ---
-- Aislamiento estricto: Club A jamás puede consultar ni modificar jugadores de Club B
CREATE POLICY "Superadmin can manage all players"
  ON public.players FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club members can view their club players"
  ON public.players FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());

CREATE POLICY "Club staff can insert players into their club"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (club_id = public.get_auth_club_id());

CREATE POLICY "Club staff can update un-restricted players in their club"
  ON public.players FOR UPDATE
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- D. COMPROBANTES (RECEIPTS) ---
-- Inmutabilidad: No se permite UPDATE ni DELETE a comprobantes emitidos.
CREATE POLICY "Superadmin can view all receipts"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club users view only their club receipts"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());

CREATE POLICY "Club staff insert receipts for their club"
  ON public.receipts FOR INSERT
  TO authenticated
  WITH CHECK (club_id = public.get_auth_club_id());

CREATE POLICY "Only voiding status update allowed via controlled function"
  ON public.receipts FOR UPDATE
  TO authenticated
  USING (club_id = public.get_auth_club_id() AND status = 'emitido')
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- E. CAJAS & MOVIMIENTOS ---
CREATE POLICY "Superadmin view all cashboxes"
  ON public.cash_boxes FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club members access only their club cashboxes"
  ON public.cash_boxes FOR ALL
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

CREATE POLICY "Superadmin view all cash movements"
  ON public.cash_movements FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club members access only their club movements"
  ON public.cash_movements FOR ALL
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- F. TIENDA (PRODUCTOS & VENTAS) ---
CREATE POLICY "Superadmin full access to store"
  ON public.store_products FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club store users access own products"
  ON public.store_products FOR ALL
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

CREATE POLICY "Superadmin view all sales"
  ON public.store_sales FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club store users view own sales"
  ON public.store_sales FOR ALL
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- G. AUDITORÍA (AUDIT LOGS) ---
-- Solo lectura para clubes; escritura mediante triggers o servicios autorizados.
CREATE POLICY "Superadmin view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club admins view their club audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());

CREATE POLICY "System insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin() OR 
    club_id = public.get_auth_club_id() OR
    club_id IS NULL
  );

-- --- H. EDITOR VISUAL DE CLUBES (VISUAL DESIGNS) ---
-- Capa visual independiente: Superadmin tiene control total; Clubes solo leen diseños publicados aplicados.
CREATE POLICY "Superadmin full access to visual designs"
  ON public.visual_designs FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club users read published designs for their club"
  ON public.visual_designs FOR SELECT
  TO authenticated
  USING (
    status = 'publicado' AND (
      club_id = public.get_auth_club_id() OR
      published_clubs @> jsonb_build_array(public.get_auth_club_id()::text)
    )
  );

-- --- I. GRUPOS FAMILIARES & CAMBIOS ---
CREATE POLICY "Superadmin family groups"
  ON public.family_groups FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club users view family groups"
  ON public.family_groups FOR SELECT TO authenticated USING (club_id = public.get_auth_club_id());
CREATE POLICY "Club admins manage family groups"
  ON public.family_groups FOR ALL TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

CREATE POLICY "Superadmin family changes"
  ON public.family_discount_changes FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club users view family changes"
  ON public.family_discount_changes FOR SELECT TO authenticated USING (club_id = public.get_auth_club_id());
CREATE POLICY "Club admins manage family changes"
  ON public.family_discount_changes FOR ALL TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- J. LISTADO PROVISORIO & SOLICITUDES DE APROBACIÓN ---
CREATE POLICY "Superadmin provisional players"
  ON public.provisional_players FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club users view provisional players"
  ON public.provisional_players FOR SELECT TO authenticated USING (club_id = public.get_auth_club_id());
CREATE POLICY "Coaches and admins manage provisional players"
  ON public.provisional_players FOR ALL TO authenticated
  USING (club_id = public.get_auth_club_id() AND (coach_id = auth.uid() OR public.is_superadmin()))
  WITH CHECK (club_id = public.get_auth_club_id() AND (coach_id = auth.uid() OR public.is_superadmin()));

CREATE POLICY "Superadmin coach approval requests"
  ON public.coach_approval_requests FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club users view coach approval requests"
  ON public.coach_approval_requests FOR SELECT TO authenticated USING (club_id = public.get_auth_club_id());
CREATE POLICY "Coaches create coach approval requests"
  ON public.coach_approval_requests FOR INSERT TO authenticated
  WITH CHECK (club_id = public.get_auth_club_id() AND coach_id = auth.uid());
CREATE POLICY "Club admins manage coach approval requests"
  ON public.coach_approval_requests FOR ALL TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- --- K. PROMOCIONES DE TIENDA ---
CREATE POLICY "Superadmin store promotions"
  ON public.store_promotions FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view store promotions"
  ON public.store_promotions FOR SELECT TO authenticated USING (club_id = public.get_auth_club_id());
CREATE POLICY "Club store staff manage promotions"
  ON public.store_promotions FOR ALL TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());

-- ==============================================================================
-- REFUERZO DE SEGURIDAD A NIVEL DE BASE DE DATOS (BACKEND ISOLATION TRIGGERS)
-- ==============================================================================

-- A. Auto-asignación / Validación forzada de club_id en INSERTs
CREATE OR REPLACE FUNCTION public.enforce_tenant_club_id()
RETURNS TRIGGER AS $$
DECLARE
    v_my_club UUID;
BEGIN
    IF public.is_superadmin() THEN
        RETURN NEW;
    END IF;

    v_my_club := public.get_auth_club_id();
    IF v_my_club IS NULL THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: No tienes un club asignado para realizar esta operación.';
    END IF;

    IF NEW.club_id IS NULL THEN
        NEW.club_id := v_my_club;
    ELSIF NEW.club_id <> v_my_club THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: Violación de aislamiento multi-tenant. No puedes operar sobre otro club.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_player_club_id ON public.players;
CREATE TRIGGER trg_enforce_player_club_id
    BEFORE INSERT OR UPDATE OF club_id ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_club_id();

DROP TRIGGER IF EXISTS trg_enforce_receipt_club_id ON public.receipts;
CREATE TRIGGER trg_enforce_receipt_club_id
    BEFORE INSERT OR UPDATE OF club_id ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_club_id();

DROP TRIGGER IF EXISTS trg_enforce_cash_movement_club_id ON public.cash_movements;
CREATE TRIGGER trg_enforce_cash_movement_club_id
    BEFORE INSERT OR UPDATE OF club_id ON public.cash_movements
    FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_club_id();

DROP TRIGGER IF EXISTS trg_enforce_attendance_session_club_id ON public.attendance_sessions;
CREATE TRIGGER trg_enforce_attendance_session_club_id
    BEFORE INSERT OR UPDATE OF club_id ON public.attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_club_id();

-- B. Integridad relacional intra-club
CREATE OR REPLACE FUNCTION public.verify_player_tenant_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_cat_club UUID;
    v_disc_club UUID;
BEGIN
    SELECT club_id INTO v_cat_club FROM public.categories WHERE id = NEW.category_id;
    IF v_cat_club IS NOT NULL AND v_cat_club <> NEW.club_id THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: La categoría asignada no pertenece al mismo club del deportista.';
    END IF;

    SELECT club_id INTO v_disc_club FROM public.disciplines WHERE id = NEW.discipline_id;
    IF v_disc_club IS NOT NULL AND v_disc_club <> NEW.club_id THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: La disciplina asignada no pertenece al mismo club del deportista.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_player_tenant_integrity ON public.players;
CREATE TRIGGER trg_verify_player_tenant_integrity
    BEFORE INSERT OR UPDATE OF category_id, discipline_id, club_id ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.verify_player_tenant_integrity();

-- C. Sincronización Supabase Auth -> profiles con garantía de club único
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(30);
    v_club_id UUID;
    v_full_name VARCHAR(255);
BEGIN
    v_role := COALESCE(NEW.raw_app_meta_data->>'fraovia_role', NEW.raw_user_meta_data->>'role', 'GENERAL');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', SPLIT_PART(NEW.email, '@', 1));

    IF v_role = 'SUPERADMIN' THEN
        v_club_id := NULL;
    ELSE
        IF NEW.raw_app_meta_data->>'fraovia_club_id' IS NOT NULL THEN
            v_club_id := (NEW.raw_app_meta_data->>'fraovia_club_id')::UUID;
        ELSIF NEW.raw_user_meta_data->>'club_id' IS NOT NULL THEN
            v_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
        ELSIF NEW.raw_user_meta_data->>'clubId' IS NOT NULL THEN
            v_club_id := (NEW.raw_user_meta_data->>'clubId')::UUID;
        ELSE
            RAISE EXCEPTION 'FRAOVIA Seguridad: Todo usuario operativo debe pertenecer exactamente a un club (club_id requerido).';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = v_club_id) THEN
            RAISE EXCEPTION 'FRAOVIA Seguridad: El club especificado no existe o no se encuentra registrado.';
        END IF;
    END IF;

    INSERT INTO public.profiles (
        id,
        club_id,
        email,
        full_name,
        role,
        status,
        phone,
        scope,
        created_at
    ) VALUES (
        NEW.id,
        v_club_id,
        NEW.email,
        v_full_name,
        v_role,
        'activo',
        COALESCE(NEW.raw_user_meta_data->'phone', '')::TEXT,
        COALESCE(NEW.raw_user_meta_data->'scope', '{"categoryIds": [], "disciplineIds": []}'::jsonb),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ==============================================================================
-- 10. SUPABASE STORAGE: BUCKET DE FOTOS DE JUGADORES ('players')
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('players', 'players', false)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura de fotos para usuarios autenticados
CREATE POLICY "Authenticated users can view players photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'players');

-- Política de subida de fotos para usuarios autenticados
CREATE POLICY "Authenticated users can upload players photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'players');

-- Política de actualización de fotos
CREATE POLICY "Authenticated users can update players photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'players');

-- ==============================================================================
-- 15. AUTOMATIZACIONES CONTABLES Y PROCEDIMIENTOS ALMACENADOS (RPC & TRIGGERS)
-- ==============================================================================

-- A. NUMERACIÓN AUTOMÁTICA DE RECIBOS (FRA-YYYY-000001)
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_count INT;
BEGIN
    IF NEW.receipt_number IS NULL OR TRIM(NEW.receipt_number) = '' THEN
        v_year := TO_CHAR(COALESCE(NEW.date, NOW()), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_count
        FROM public.receipts
        WHERE club_id = NEW.club_id
          AND TO_CHAR(date, 'YYYY') = v_year;
        NEW.receipt_number := 'FRA-' || v_year || '-' || LPAD(v_count::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_receipt_number ON public.receipts;
CREATE TRIGGER trg_generate_receipt_number
BEFORE INSERT ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.generate_receipt_number();

-- B. ACTUALIZACIÓN AUTOMÁTICA DE SALDOS DE CAJAS
CREATE OR REPLACE FUNCTION public.update_cash_box_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'ingreso' THEN
            UPDATE public.cash_boxes
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.cash_box_id;
        ELSIF NEW.type = 'egreso' THEN
            UPDATE public.cash_boxes
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.cash_box_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_cash_box_balance ON public.cash_movements;
CREATE TRIGGER trg_update_cash_box_balance
AFTER INSERT ON public.cash_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_cash_box_balance();

-- C. CÁLCULO AUTOMÁTICO DE CUOTA MENSUAL DEL JUGADOR SEGÚN CATEGORÍA Y BECA
CREATE OR REPLACE FUNCTION public.calculate_player_monthly_fee()
RETURNS TRIGGER AS $$
DECLARE
    v_category_fee NUMERIC(12,2) := 0;
    v_discount NUMERIC(5,2) := 0;
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SELECT COALESCE(monthly_fee, 0) INTO v_category_fee
        FROM public.categories
        WHERE id = NEW.category_id;
    END IF;

    v_discount := COALESCE(NEW.scholarship_percent, 0);
    IF v_discount < 0 THEN v_discount := 0; END IF;
    IF v_discount > 100 THEN v_discount := 100; END IF;

    NEW.monthly_fee_due := ROUND(v_category_fee * (1.0 - (v_discount / 100.0)), 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_player_monthly_fee ON public.players;
CREATE TRIGGER trg_calculate_player_monthly_fee
BEFORE INSERT OR UPDATE OF category_id, scholarship_percent ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.calculate_player_monthly_fee();

-- D. RPC: BITÁCORA INMUTABLE DE AUDITORÍA (log_audit)
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action TEXT,
    p_detail TEXT,
    p_category TEXT DEFAULT 'sistema'
)
RETURNS UUID AS $$
DECLARE
    v_user RECORD;
    v_log_id UUID;
    v_valid_category VARCHAR(50);
BEGIN
    SELECT id, full_name, role, club_id INTO v_user
    FROM public.profiles
    WHERE id = auth.uid();

    IF p_category IN ('seguridad', 'caja', 'planes', 'jugadores', 'sistema', 'superadmin', 'becas', 'tienda', 'deportivo', 'administracion') THEN
        v_valid_category := p_category;
    ELSE
        v_valid_category := 'sistema';
    END IF;

    INSERT INTO public.audit_logs (
        club_id,
        user_id,
        user_name,
        role,
        action,
        detail,
        category
    ) VALUES (
        v_user.club_id,
        COALESCE(v_user.id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(v_user.full_name, 'Sistema'),
        COALESCE(v_user.role, 'SISTEMA'),
        p_action,
        p_detail,
        v_valid_category
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. RPC: ANULACIÓN OFICIAL DE RECIBO CON CONTRAASIENTO (void_receipt)
CREATE OR REPLACE FUNCTION public.void_receipt(
    p_receipt_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_receipt RECORD;
    v_caller_club_id UUID;
    v_is_admin BOOLEAN;
    v_contra_id UUID;
BEGIN
    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RAISE EXCEPTION 'FRAOVIA: Es obligatorio ingresar el motivo formal de anulación del comprobante.';
    END IF;

    SELECT * INTO v_receipt FROM public.receipts WHERE id = p_receipt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FRAOVIA: Comprobante no encontrado.';
    END IF;

    IF v_receipt.status = 'anulado' THEN
        RAISE EXCEPTION 'FRAOVIA: El comprobante ya se encuentra anulado.';
    END IF;

    v_caller_club_id := public.get_auth_club_id();
    v_is_admin := public.is_superadmin();
    IF NOT v_is_admin AND (v_caller_club_id IS NULL OR v_caller_club_id != v_receipt.club_id) THEN
        RAISE EXCEPTION 'FRAOVIA: No posee permisos para anular comprobantes de otro club.';
    END IF;

    -- 1. Marcar recibo como anulado
    UPDATE public.receipts
    SET status = 'anulado',
        void_reason = TRIM(p_reason),
        voided_at = NOW(),
        voided_by_user_id = auth.uid()
    WHERE id = p_receipt_id;

    -- 2. Si tenía caja asociada y monto > 0, registrar contraasiento
    IF v_receipt.cash_box_id IS NOT NULL AND v_receipt.amount > 0 THEN
        INSERT INTO public.cash_movements (
            club_id,
            cash_box_id,
            type,
            amount,
            concept,
            category,
            receipt_id,
            payment_method,
            registered_by_user_id,
            notes
        ) VALUES (
            v_receipt.club_id,
            v_receipt.cash_box_id,
            'egreso',
            v_receipt.amount,
            'Contraasiento: Anulación de comprobante ' || v_receipt.receipt_number,
            'anulacion_recibo',
            v_receipt.id,
            v_receipt.payment_method,
            COALESCE(auth.uid(), v_receipt.issued_by_user_id),
            'Motivo: ' || TRIM(p_reason)
        ) RETURNING id INTO v_contra_id;
    END IF;

    -- 3. Si era cuota de jugador, restablecer el saldo
    IF v_receipt.player_id IS NOT NULL AND v_receipt.amount > 0 THEN
        UPDATE public.players
        SET balance = balance + v_receipt.amount,
            status = CASE WHEN (balance + v_receipt.amount) > 0 AND status = 'activo' THEN 'moroso' ELSE status END
        WHERE id = v_receipt.player_id;
    END IF;

    -- 4. Registrar en bitácora inmutable
    PERFORM public.log_audit(
        'RECIBO_ANULADO',
        'Recibo ' || v_receipt.receipt_number || ' anulado. Monto: $' || v_receipt.amount || '. Motivo: ' || TRIM(p_reason),
        'caja'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Comprobante anulado y contraasiento generado exitosamente.',
        'receiptNumber', v_receipt.receipt_number,
        'contraasientoId', v_contra_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 16. MÓDULO VIAJES Y TORNEOS (TABLAS & PROCEDIMIENTOS RPC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    dates_description VARCHAR(150),
    category_description VARCHAR(150),
    coaches_in_charge VARCHAR(250),
    total_cost_per_player NUMERIC(12,2) NOT NULL DEFAULT 0,
    banner_image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'en_recaudacion' CHECK (status IN ('planificacion', 'inscripciones', 'en_recaudacion', 'confirmado', 'en_curso', 'viajando', 'finalizado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    tutor_name VARCHAR(150),
    tutor_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'convocado' CHECK (status IN ('convocado', 'confirmado', 'al_dia', 'en_pagos', 'baja')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tournament_player UNIQUE (tournament_id, player_id)
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read tournaments of their club"
  ON public.tournaments FOR SELECT
  TO authenticated
  USING (public.is_superadmin() OR club_id = public.get_auth_club_id());

CREATE POLICY "Authorized users manage tournaments"
  ON public.tournaments FOR ALL
  TO authenticated
  USING (
    public.is_superadmin() OR (
      club_id = public.get_auth_club_id() AND 
      public.get_auth_user_role() IN ('SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL')
    )
  );

CREATE POLICY "Users read tournament players"
  ON public.tournament_players FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin() OR 
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.club_id = public.get_auth_club_id())
  );

CREATE POLICY "Authorized users manage tournament players"
  ON public.tournament_players FOR ALL
  TO authenticated
  USING (
    public.is_superadmin() OR (
      EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.club_id = public.get_auth_club_id()) AND 
      public.get_auth_user_role() IN ('SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL')
    )
  );

-- RPC: create_trip
CREATE OR REPLACE FUNCTION public.create_trip(
    p_data JSONB,
    p_participants JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_club_id UUID;
    v_trip_id UUID;
    v_cash_box_id UUID;
    v_part JSONB;
BEGIN
    v_club_id := public.get_auth_club_id();
    IF v_club_id IS NULL THEN
        RAISE EXCEPTION 'FRAOVIA: Club no identificado en la sesión actual.';
    END IF;

    -- 1. Crear sub-caja dedicada al torneo si no tiene
    INSERT INTO public.cash_boxes (club_id, name, type, responsible_user_id, current_balance, status)
    VALUES (
        v_club_id,
        'Caja Viaje: ' || COALESCE(p_data->>'name', 'Torneo'),
        'viajes',
        auth.uid(),
        0,
        'abierta'
    ) RETURNING id INTO v_cash_box_id;

    -- 2. Insertar torneo
    INSERT INTO public.tournaments (
        club_id,
        cash_box_id,
        name,
        location,
        dates_description,
        category_description,
        coaches_in_charge,
        total_cost_per_player,
        banner_image_url,
        status
    ) VALUES (
        v_club_id,
        v_cash_box_id,
        COALESCE(p_data->>'name', 'Nuevo Torneo'),
        COALESCE(p_data->>'location', 'Por definir'),
        p_data->>'datesDescription',
        p_data->>'categoryDescription',
        p_data->>'coachesInCharge',
        COALESCE((p_data->>'costPerPlayer')::NUMERIC, 0),
        p_data->>'bannerImageUrl',
        COALESCE(p_data->>'status', 'en_recaudacion')
    ) RETURNING id INTO v_trip_id;

    -- 3. Insertar participantes si se proporcionaron
    IF p_participants IS NOT NULL AND jsonb_array_length(p_participants) > 0 THEN
        FOR v_part IN SELECT * FROM jsonb_array_elements(p_participants)
        LOOP
            IF (v_part->>'playerId') IS NOT NULL THEN
                INSERT INTO public.tournament_players (
                    tournament_id,
                    player_id,
                    total_cost,
                    amount_paid,
                    tutor_name,
                    tutor_phone,
                    notes
                ) VALUES (
                    v_trip_id,
                    (v_part->>'playerId')::UUID,
                    COALESCE((v_part->>'totalCost')::NUMERIC, (p_data->>'costPerPlayer')::NUMERIC, 0),
                    0,
                    v_part->>'tutorName',
                    v_part->>'tutorPhone',
                    v_part->>'notes'
                ) ON CONFLICT (tournament_id, player_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    PERFORM public.log_audit('VIAJE_CREADO', 'Torneo creado: ' || COALESCE(p_data->>'name', ''), 'viajes');
    RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: update_trip
CREATE OR REPLACE FUNCTION public.update_trip(
    p_trip_id UUID,
    p_data JSONB,
    p_participants JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_part JSONB;
BEGIN
    UPDATE public.tournaments
    SET name = COALESCE(p_data->>'name', name),
        location = COALESCE(p_data->>'location', location),
        dates_description = COALESCE(p_data->>'datesDescription', dates_description),
        category_description = COALESCE(p_data->>'categoryDescription', category_description),
        coaches_in_charge = COALESCE(p_data->>'coachesInCharge', coaches_in_charge),
        total_cost_per_player = COALESCE((p_data->>'costPerPlayer')::NUMERIC, total_cost_per_player),
        banner_image_url = COALESCE(p_data->>'bannerImageUrl', banner_image_url),
        status = COALESCE(p_data->>'status', status)
    WHERE id = p_trip_id;

    IF p_participants IS NOT NULL THEN
        FOR v_part IN SELECT * FROM jsonb_array_elements(p_participants)
        LOOP
            IF (v_part->>'playerId') IS NOT NULL THEN
                INSERT INTO public.tournament_players (
                    tournament_id,
                    player_id,
                    total_cost,
                    tutor_name,
                    tutor_phone,
                    notes
                ) VALUES (
                    p_trip_id,
                    (v_part->>'playerId')::UUID,
                    COALESCE((v_part->>'totalCost')::NUMERIC, 0),
                    v_part->>'tutorName',
                    v_part->>'tutorPhone',
                    v_part->>'notes'
                ) ON CONFLICT (tournament_id, player_id) DO UPDATE
                SET total_cost = EXCLUDED.total_cost,
                    tutor_name = COALESCE(EXCLUDED.tutor_name, tournament_players.tutor_name),
                    tutor_phone = COALESCE(EXCLUDED.tutor_phone, tournament_players.tutor_phone),
                    notes = COALESCE(EXCLUDED.notes, tournament_players.notes);
            END IF;
        END LOOP;
    END IF;

    PERFORM public.log_audit('VIAJE_ACTUALIZADO', 'Torneo ID: ' || p_trip_id::text, 'viajes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: record_trip_payment
CREATE OR REPLACE FUNCTION public.record_trip_payment(
    p_trip_id UUID,
    p_player_id UUID,
    p_amount NUMERIC,
    p_payment_method VARCHAR,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_trip RECORD;
    v_player RECORD;
    v_tp RECORD;
    v_receipt_id UUID;
    v_receipt_number VARCHAR(50);
BEGIN
    SELECT * INTO v_trip FROM public.tournaments WHERE id = p_trip_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FRAOVIA: Torneo no encontrado.';
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FRAOVIA: Deportista no encontrado.';
    END IF;

    SELECT * INTO v_tp FROM public.tournament_players WHERE tournament_id = p_trip_id AND player_id = p_player_id;
    IF NOT FOUND THEN
        INSERT INTO public.tournament_players (tournament_id, player_id, total_cost, amount_paid)
        VALUES (p_trip_id, p_player_id, v_trip.total_cost_per_player, 0)
        RETURNING * INTO v_tp;
    END IF;

    -- 1. Actualizar monto abonado en el torneo
    UPDATE public.tournament_players
    SET amount_paid = amount_paid + p_amount,
        status = CASE WHEN (amount_paid + p_amount) >= total_cost THEN 'al_dia' ELSE 'en_pagos' END
    WHERE tournament_id = p_trip_id AND player_id = p_player_id;

    -- 2. Emitir recibo oficial
    v_receipt_number := public.generate_receipt_number();
    INSERT INTO public.receipts (
        club_id,
        receipt_number,
        player_id,
        cash_box_id,
        customer_name,
        customer_dni,
        concept,
        amount,
        payment_method,
        issued_by_user_id,
        status,
        items
    ) VALUES (
        v_trip.club_id,
        v_receipt_number,
        p_player_id,
        v_trip.cash_box_id,
        v_player.last_name || ', ' || v_player.first_name,
        v_player.dni,
        'Pago de Viaje/Torneo: ' || v_trip.name,
        p_amount,
        p_payment_method,
        auth.uid(),
        'emitido',
        jsonb_build_array(jsonb_build_object(
            'description', 'Cuota Torneo ' || v_trip.name || ' (' || v_trip.location || ')',
            'quantity', 1,
            'unitPrice', p_amount,
            'total', p_amount
        ))
    ) RETURNING id INTO v_receipt_id;

    -- 3. Si tiene caja, impactar el movimiento
    IF v_trip.cash_box_id IS NOT NULL THEN
        INSERT INTO public.cash_movements (
            club_id,
            cash_box_id,
            type,
            amount,
            concept,
            category,
            receipt_id,
            payment_method,
            registered_by_user_id,
            notes
        ) VALUES (
            v_trip.club_id,
            v_trip.cash_box_id,
            'ingreso',
            p_amount,
            'Cobro Viaje: ' || v_trip.name || ' - ' || v_player.last_name,
            'cuota',
            v_receipt_id,
            p_payment_method,
            auth.uid(),
            COALESCE(p_notes, '')
        );

        UPDATE public.cash_boxes
        SET current_balance = current_balance + p_amount
        WHERE id = v_trip.cash_box_id;
    END IF;

    PERFORM public.log_audit('PAGO_VIAJE_REGISTRADO', 'Recibo ' || v_receipt_number || ' por $' || p_amount::text, 'viajes');

    RETURN jsonb_build_object(
        'receipt_id', v_receipt_id,
        'receipt_number', v_receipt_number,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: record_attendance
CREATE OR REPLACE FUNCTION public.record_attendance(
    p_category_id UUID,
    p_date DATE,
    p_title VARCHAR,
    p_entries JSONB
)
RETURNS UUID AS $$
DECLARE
    v_club_id UUID;
    v_session_id UUID;
    v_entry JSONB;
BEGIN
    SELECT club_id INTO v_club_id FROM public.categories WHERE id = p_category_id;
    IF v_club_id IS NULL THEN
        v_club_id := public.get_auth_club_id();
    END IF;

    -- 1. Insertar sesión de asistencia
    INSERT INTO public.attendance_sessions (
        club_id,
        category_id,
        date,
        session_title,
        recorded_by_user_id
    ) VALUES (
        v_club_id,
        p_category_id,
        p_date,
        COALESCE(p_title, 'Entrenamiento'),
        auth.uid()
    ) RETURNING id INTO v_session_id;

    -- 2. Insertar entradas
    IF p_entries IS NOT NULL THEN
        FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
        LOOP
            IF (v_entry->>'playerId') IS NOT NULL THEN
                INSERT INTO public.attendance_entries (
                    session_id,
                    player_id,
                    status,
                    notes
                ) VALUES (
                    v_session_id,
                    (v_entry->>'playerId')::UUID,
                    COALESCE(v_entry->>'status', 'presente'),
                    v_entry->>'notes'
                );
            END IF;
        END LOOP;
    END IF;

    PERFORM public.log_audit('ASISTENCIA_REGISTRADA', 'Sesión: ' || COALESCE(p_title, '') || ' (' || p_date::text || ')', 'asistencia');
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FIN DEL SCRIPT DE MIGRACIÓN Y POLÍTICAS RLS
-- ==============================================================================

