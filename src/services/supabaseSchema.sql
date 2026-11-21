-- ====================================================================
-- FRAOVIA | Supabase & PostgreSQL DDL Schema with Multi-Club RLS
-- ====================================================================

-- 1. CLUBS TABLE
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cuit TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'suspendido', 'en_mantenimiento')),
  current_season_id UUID,
  subscription_plan_id UUID,
  contracted_players_quota INT NOT NULL DEFAULT 300,
  contracted_users_quota INT NOT NULL DEFAULT 5,
  branding JSONB DEFAULT '{"primaryColor": "#10b981", "secondaryColor": "#0ea5e9", "darkSidebar": true}'::jsonb,
  active_modules JSONB DEFAULT '{"base": true, "deportivo": true, "caja": true, "tienda": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS PROFILE & CLUB MEMBERSHIP
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'PROFESOR', 'TIENDA')),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'restringido', 'deshabilitado')),
  phone TEXT,
  scope JSONB DEFAULT '{}'::jsonb, -- discipline_ids, category_ids for scoped roles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 3. DISCIPLINES & CATEGORIES
CREATE TABLE disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Trophy',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT,
  gender TEXT CHECK (gender IN ('Masculino', 'Femenino', 'Mixto')),
  monthly_fee NUMERIC(10,2) DEFAULT 0,
  training_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PLAYERS (WITH PLAN QUOTA RESTRICTION PROTECTION)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  dni TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  medical_certificate_valid BOOLEAN DEFAULT TRUE,
  medical_expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'restringido', 'moroso')),
  is_restricted BOOLEAN DEFAULT FALSE, -- Set when club downgrades plan quota
  restricted_reason TEXT,
  monthly_fee_due NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) DEFAULT 0,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_dni_per_club UNIQUE (club_id, dni)
);

-- 5. CASH BOXES & MOVEMENTS
CREATE TABLE cash_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'disciplina', 'subpunto')),
  parent_box_id UUID REFERENCES cash_boxes(id),
  discipline_id UUID REFERENCES disciplines(id),
  responsible_user_id UUID REFERENCES profiles(id),
  current_balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'abierta' CHECK (status IN ('abierta', 'cerrada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  date TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_dni TEXT,
  concept TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'anulado')),
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by_user_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_by_user_id UUID NOT NULL REFERENCES profiles(id)
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch requesting user's club_id and role
CREATE OR REPLACE FUNCTION current_user_club_id() 
RETURNS UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_superadmin() 
RETURNS BOOLEAN AS $$
  SELECT (role = 'SUPERADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Enforcement Policy Example: PLAYERS
CREATE POLICY "Superadmin has full access to all players"
  ON players FOR ALL
  TO authenticated
  USING (is_superadmin());

CREATE POLICY "Club users only access their club's players"
  ON players FOR ALL
  TO authenticated
  USING (club_id = current_user_club_id())
  WITH CHECK (club_id = current_user_club_id());
