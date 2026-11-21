-- ==============================================================================
-- FRAOVIA | MIGRACIÓN 01: ESTRUCTURA DE BASE DE DATOS Y TABLAS (DDL)
-- Plataforma: Supabase / PostgreSQL 15+
-- Nota: Utiliza gen_random_uuid() nativo de PostgreSQL 13+.
-- ==============================================================================

-- 1. EXTENSIÓN PARA CRIPTOGRAFÍA Y UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- FUNCIÓN AUXILIAR GENÉRICA: ACTUALIZACIÓN AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. PLANES COMERCIALES SAAS (SUBSCRIPTION PLANS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'starter', 'pro', 'elite'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_players INT NOT NULL DEFAULT 300,
    max_users INT NOT NULL DEFAULT 5,
    max_disciplines VARCHAR(20) NOT NULL DEFAULT 'unlimited',
    monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    annual_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    storage_gb INT NOT NULL DEFAULT 10,
    modules JSONB NOT NULL DEFAULT '{"base": true, "deportivo": true, "caja": true, "tienda": true}'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CLUBES (ORGANIZACIONES MULTI-TENANT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cuit VARCHAR(25), -- Opcional en trámite inicial
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address TEXT,
    logo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'suspendido', 'en_mantenimiento')),
    current_season_id UUID, -- Conectado con FK abajo
    subscription_plan_id VARCHAR(50) NOT NULL DEFAULT 'pro' REFERENCES public.subscription_plans(id) ON UPDATE CASCADE,
    contracted_players_quota INT NOT NULL DEFAULT 800,
    contracted_users_quota INT NOT NULL DEFAULT 10,
    branding JSONB NOT NULL DEFAULT '{"primaryColor": "#10b981", "secondaryColor": "#0ea5e9", "darkSidebar": true}'::jsonb,
    active_modules JSONB NOT NULL DEFAULT '{"base": true, "deportivo": true, "caja": true, "tienda": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. TEMPORADAS (SEASONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'cerrada', 'futura')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_season_year_per_club UNIQUE (club_id, year)
);

-- Conexión de clave foránea en clubs hacia seasons
ALTER TABLE public.clubs 
    DROP CONSTRAINT IF EXISTS fk_clubs_current_season;
ALTER TABLE public.clubs 
    ADD CONSTRAINT fk_clubs_current_season 
    FOREIGN KEY (current_season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

-- ==============================================================================
-- 5. PERFILES DE USUARIO (PROFILES / AUTH)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'PROFESOR', 'TIENDA')),
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'restringido', 'deshabilitado')),
    phone VARCHAR(50),
    scope JSONB DEFAULT '{"categoryIds": [], "disciplineIds": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    CONSTRAINT check_superadmin_club_null CHECK (
        (role = 'SUPERADMIN' AND club_id IS NULL) OR 
        (role <> 'SUPERADMIN' AND club_id IS NOT NULL)
    )
);

-- ==============================================================================
-- 6. DISCIPLINAS Y CATEGORÍAS DEPORTIVAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Activity',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    coordinator_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_discipline_code_per_club UNIQUE (club_id, code)
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ==============================================================================
-- 7. GRUPOS FAMILIARES Y DESCUENTOS POR HERMANOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. JUGADORES / DEPORTISTAS (PLAYERS CON BECAS Y GRUPOS FAMILIARES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
    dni VARCHAR(30) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    photo_url TEXT,
    jersey_number INT,
    position VARCHAR(50),
    color_block_name VARCHAR(100),
    emergency_contact JSONB NOT NULL DEFAULT '{"name": "", "relationship": "", "phone": ""}'::jsonb,
    medical_certificate_valid BOOLEAN NOT NULL DEFAULT TRUE,
    medical_expiry_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'restringido', 'moroso', 'suspendido')),
    suspension_reason VARCHAR(50),
    suspension_note TEXT,
    suspended_at TIMESTAMPTZ,
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    restricted_reason TEXT,
    scholarship_percent INT NOT NULL DEFAULT 0 CHECK (scholarship_percent BETWEEN 0 AND 100),
    scholarship_type VARCHAR(30) NOT NULL DEFAULT 'ninguna' CHECK (scholarship_type IN ('ninguna', 'media', 'completa', 'personalizada')),
    scholarship_reason TEXT,
    family_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (family_discount_percent BETWEEN 0 AND 100),
    monthly_fee_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_dni_per_club UNIQUE (club_id, dni)
);

-- CAMBIOS PROGRAMADOS EN DESCUENTO FAMILIAR
CREATE TABLE IF NOT EXISTS public.family_discount_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 9. ASISTENCIAS A ENTRENAMIENTOS (ATTENDANCE & CLASES SUSPENDIDAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    recorded_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspension_reason VARCHAR(30) CHECK (suspension_reason IS NULL OR suspension_reason IN ('lluvia', 'clima', 'mantenimiento', 'feriado', 'fuerza_mayor', 'otro')),
    suspension_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_attendance_session_date UNIQUE (category_id, date)
);

CREATE TABLE IF NOT EXISTS public.attendance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('presente', 'ausente', 'justificado', 'lesionado')),
    notes TEXT,
    CONSTRAINT unique_player_attendance_entry UNIQUE (session_id, player_id)
);

-- ==============================================================================
-- 10. LISTADO PROVISORIO Y SOLICITUDES DE APROBACIÓN DE PROFESOR
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provisional_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 11. CAJAS Y MOVIMIENTOS FINANCIEROS (CASH BOXES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cash_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ==============================================================================
-- 10. CONTADORES DE RECIBOS POR CLUB Y AÑO (RECEIPT COUNTERS ATÓMICOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.receipt_counters (
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    year INT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (club_id, year)
);

-- ==============================================================================
-- 11. COMPROBANTES DE PAGO OFICIALES (RECEIPTS INMUTABLES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL, -- ej: FRA-2026-000001
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_name VARCHAR(255) NOT NULL,
    customer_dni VARCHAR(30),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    concept VARCHAR(255) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    status VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'anulado')),
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by_user_id UUID REFERENCES public.profiles(id),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL,
    issued_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_receipt_number_per_club UNIQUE (club_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ==============================================================================
-- 13. TIENDA OFICIAL (PRODUCTOS, PROMOCIONES, VENTAS E ITEMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock_alert INT NOT NULL DEFAULT 5,
    sizes JSONB DEFAULT '[]'::jsonb,
    sizes_stock JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'agotado', 'discontinuado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sku_per_club UNIQUE (club_id, sku)
);

CREATE TABLE IF NOT EXISTS public.store_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE RESTRICT,
    cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE RESTRICT,
    cashier_user_id UUID NOT NULL REFERENCES public.profiles(id),
    customer_name VARCHAR(255) NOT NULL,
    total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
    subtotal NUMERIC(14,2),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    applied_promotion_name VARCHAR(255),
    payment_method VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.store_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. TORNEOS, VIAJES Y DELEGACIONES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost_per_player NUMERIC(12,2) NOT NULL DEFAULT 0,
    installments_count INT NOT NULL DEFAULT 1,
    cash_box_id UUID REFERENCES public.cash_boxes(id) ON DELETE SET NULL,
    background_config JSONB DEFAULT '{"backgroundType": "color", "backgroundColor": "#0F172A", "backgroundOpacity": 90}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'inscripciones' CHECK (status IN ('planificacion', 'inscripciones', 'en_recaudacion', 'confirmado', 'en_curso', 'finalizado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    tutor_name VARCHAR(255),
    tutor_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmado' CHECK (status IN ('interesado', 'confirmado', 'baja', 'al_dia', 'en_pagos', 'pendiente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tournament_player UNIQUE (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.tournament_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. EDITOR VISUAL DE CLUBES (VISUAL DESIGNS & TEMPLATES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.visual_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE, -- NULL si es plantilla global
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicado', 'archivado')),
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    background JSONB NOT NULL DEFAULT '{"backgroundType": "gradient", "backgroundGradient": "from-slate-900 to-sky-950", "backgroundOpacity": 100}'::jsonb,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    versions_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_clubs JSONB NOT NULL DEFAULT '[]'::jsonb,
    reference_image_url TEXT,
    reference_image_opacity INT DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. AUDITORÍA INMUTABLE (AUDIT LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('seguridad', 'caja', 'planes', 'jugadores', 'becas', 'sistema', 'superadmin'))
);

-- ==============================================================================
-- 16. ÍNDICES DE ALTO RENDIMIENTO (PERFORMANCE & SEARCH)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON public.clubs(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON public.profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_disciplines_club_id ON public.disciplines(club_id);
CREATE INDEX IF NOT EXISTS idx_categories_club_id ON public.categories(club_id);
CREATE INDEX IF NOT EXISTS idx_categories_discipline_id ON public.categories(discipline_id);

CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_category_id ON public.players(category_id);
CREATE INDEX IF NOT EXISTS idx_players_dni ON public.players(dni);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_scholarship ON public.players(club_id, scholarship_percent);

CREATE INDEX IF NOT EXISTS idx_receipts_club_id_date ON public.receipts(club_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(club_id, receipt_number);
CREATE INDEX IF NOT EXISTS idx_cash_movements_club_id ON public.cash_movements(club_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cash_boxes_club_id ON public.cash_boxes(club_id);

CREATE INDEX IF NOT EXISTS idx_store_products_club_sku ON public.store_products(club_id, sku);
CREATE INDEX IF NOT EXISTS idx_store_promotions_club_id ON public.store_promotions(club_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_club_id ON public.family_groups(club_id);
CREATE INDEX IF NOT EXISTS idx_family_discount_changes_club_id ON public.family_discount_changes(club_id);
CREATE INDEX IF NOT EXISTS idx_provisional_players_club_id ON public.provisional_players(club_id);
CREATE INDEX IF NOT EXISTS idx_coach_approval_requests_club_id ON public.coach_approval_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_cat_date ON public.attendance_sessions(category_id, date);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON public.tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_visual_designs_club_id ON public.visual_designs(club_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_club_timestamp ON public.audit_logs(club_id, timestamp DESC);

-- ==============================================================================
-- 17. TRIGGERS DE updated_at AUTOMÁTICOS
-- ==============================================================================
CREATE TRIGGER trg_clubs_updated_at
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_store_products_updated_at
    BEFORE UPDATE ON public.store_products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_visual_designs_updated_at
    BEFORE UPDATE ON public.visual_designs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
