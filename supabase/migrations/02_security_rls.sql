-- ==============================================================================
-- FRAOVIA | MIGRACIÓN 02: SEGURIDAD Y ROW LEVEL SECURITY (RLS)
-- Plataforma: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 1. FUNCIONES AUXILIARES DE SEGURIDAD (SECURITY DEFINER)
-- Se ejecutan con los privilegios del creador para evitar recursiones en las políticas.

CREATE OR REPLACE FUNCTION public.get_my_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPERADMIN' AND status = 'activo'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_club_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('DUEÑO', 'ADMINISTRACIÓN')
      AND status = 'activo'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.receipt_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLÍTICAS: SUBSCRIPTION_PLANS
-- ==============================================================================
CREATE POLICY "Public read active plans"
    ON public.subscription_plans FOR SELECT
    TO authenticated
    USING (is_active = TRUE OR public.is_superadmin());

CREATE POLICY "Superadmin manage plans"
    ON public.subscription_plans FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- ==============================================================================
-- 4. POLÍTICAS: CLUBS
-- ==============================================================================
CREATE POLICY "Superadmin full access to clubs"
    ON public.clubs FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Club users view own club"
    ON public.clubs FOR SELECT
    TO authenticated
    USING (id = public.get_my_club_id());

CREATE POLICY "Club owner can update branding and info"
    ON public.clubs FOR UPDATE
    TO authenticated
    USING (id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN'))
    WITH CHECK (id = public.get_my_club_id());

-- ==============================================================================
-- 5. POLÍTICAS: PROFILES (USUARIOS)
-- Regla crítica: Un usuario no puede cambiarse su propio role ni club_id.
-- ==============================================================================
CREATE POLICY "Superadmin full access to profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Club members view colleagues of same club"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Club Admin can manage users of their club"
    ON public.profiles FOR ALL
    TO authenticated
    USING (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN'))
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Users can update only their own basic info (not role or club)"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND club_id = public.get_my_club_id() 
        AND role = public.get_my_role() -- Impide auto-escalamiento de privilegios
    );

-- ==============================================================================
-- 6. POLÍTICAS: SEASONS
-- ==============================================================================
CREATE POLICY "Superadmin full seasons"
    ON public.seasons FOR ALL TO authenticated
    USING (public.is_superadmin());

CREATE POLICY "Club users view seasons"
    ON public.seasons FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Club admins manage seasons"
    ON public.seasons FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 7. POLÍTICAS: DISCIPLINES Y CATEGORIES
-- ==============================================================================
CREATE POLICY "Superadmin full disciplines"
    ON public.disciplines FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view disciplines"
    ON public.disciplines FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());

CREATE POLICY "Club admins manage disciplines"
    ON public.disciplines FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin full categories"
    ON public.categories FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view categories"
    ON public.categories FOR SELECT TO authenticated
    USING (
        club_id = public.get_my_club_id()
        AND (
            public.get_my_role() <> 'PROFESOR'
            OR (
                SELECT (p.scope->'categoryIds') ? id::text
                FROM public.profiles p WHERE p.id = auth.uid()
            )
            OR (
                SELECT jsonb_array_length(COALESCE(p.scope->'categoryIds', '[]'::jsonb)) = 0
                FROM public.profiles p WHERE p.id = auth.uid()
            )
        )
    );

CREATE POLICY "Club admins manage categories"
    ON public.categories FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 8. POLÍTICAS: PLAYERS (JUGADORES)
-- Profesores ven solo jugadores de sus categorías asignadas.
-- ==============================================================================
CREATE POLICY "Superadmin full players"
    ON public.players FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club view players"
    ON public.players FOR SELECT TO authenticated
    USING (
        club_id = public.get_my_club_id()
        AND (
            public.get_my_role() <> 'PROFESOR'
            OR (
                SELECT (p.scope->'categoryIds') ? category_id::text
                FROM public.profiles p WHERE p.id = auth.uid()
            )
            OR (
                SELECT jsonb_array_length(COALESCE(p.scope->'categoryIds', '[]'::jsonb)) = 0
                FROM public.profiles p WHERE p.id = auth.uid()
            )
        )
    );

CREATE POLICY "Club admins manage players"
    ON public.players FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN', 'GENERAL'))
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 9. POLÍTICAS: ATTENDANCE (ASISTENCIA)
-- ==============================================================================
CREATE POLICY "Superadmin attendance"
    ON public.attendance_sessions FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view attendance sessions"
    ON public.attendance_sessions FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club coaches and admins record attendance"
    ON public.attendance_sessions FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin attendance entries"
    ON public.attendance_entries FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view attendance entries"
    ON public.attendance_entries FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club coaches and admins record attendance entries"
    ON public.attendance_entries FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 10. POLÍTICAS: CASH_BOXES, RECEIPTS, CASH_MOVEMENTS
-- ==============================================================================
CREATE POLICY "Superadmin cash boxes"
    ON public.cash_boxes FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club members view cash boxes"
    ON public.cash_boxes FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club admins manage cash boxes"
    ON public.cash_boxes FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

-- RECEIPT COUNTERS
CREATE POLICY "Superadmin receipt counters"
    ON public.receipt_counters FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club users access receipt counters"
    ON public.receipt_counters FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

-- RECEIPTS: Inmutables. Solo INSERT y SELECT. No DELETE ni UPDATE ordinarios.
CREATE POLICY "Superadmin view receipts"
    ON public.receipts FOR SELECT TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view receipts"
    ON public.receipts FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club staff insert receipts"
    ON public.receipts FOR INSERT TO authenticated
    WITH CHECK (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'TIENDA'));

-- CASH MOVEMENTS
CREATE POLICY "Superadmin cash movements"
    ON public.cash_movements FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view cash movements"
    ON public.cash_movements FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club staff insert cash movements"
    ON public.cash_movements FOR INSERT TO authenticated
    WITH CHECK (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN', 'TIENDA'));

-- ==============================================================================
-- 11. POLÍTICAS: STORE (TIENDA OFICIAL)
-- ==============================================================================
CREATE POLICY "Superadmin store products"
    ON public.store_products FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view store products"
    ON public.store_products FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club store staff manage products"
    ON public.store_products FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN', 'TIENDA'))
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin store sales"
    ON public.store_sales FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view and insert store sales"
    ON public.store_sales FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin store sale items"
    ON public.store_sale_items FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view and insert store sale items"
    ON public.store_sale_items FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 12. POLÍTICAS: TOURNAMENTS (TORNEOS Y VIAJES)
-- ==============================================================================
CREATE POLICY "Superadmin tournaments"
    ON public.tournaments FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club view tournaments"
    ON public.tournaments FOR SELECT TO authenticated USING (club_id = public.get_my_club_id());
CREATE POLICY "Club admins manage tournaments"
    ON public.tournaments FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin tournament players"
    ON public.tournament_players FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club tournament players"
    ON public.tournament_players FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin tournament payments"
    ON public.tournament_payments FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Club tournament payments"
    ON public.tournament_payments FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 13. POLÍTICAS: VISUAL DESIGNS (EDITOR VISUAL DE CLUBES)
-- ==============================================================================
CREATE POLICY "Superadmin full control of visual designs"
    ON public.visual_designs FOR ALL TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Club users view published visual designs"
    ON public.visual_designs FOR SELECT TO authenticated
    USING (
        status = 'publicado' AND (
            club_id = public.get_my_club_id() OR
            published_clubs @> jsonb_build_array(public.get_my_club_id()::text)
        )
    );

-- ==============================================================================
-- 14. POLÍTICAS: AUDIT LOGS (SOLO ESCRITURA Y LECTURA AUDITADA)
-- ==============================================================================
CREATE POLICY "Superadmin view all audit logs"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (public.is_superadmin());

CREATE POLICY "Club admins view their audit logs"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner());

CREATE POLICY "System insert audit logs"
    ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (
        public.is_superadmin() OR
        club_id = public.get_my_club_id() OR
        club_id IS NULL
    );

-- ==============================================================================
-- 15. POLÍTICAS: GRUPOS FAMILIARES Y DESCUENTOS POR HERMANOS
-- ==============================================================================
CREATE POLICY "Superadmin family groups"
    ON public.family_groups FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view family groups"
    ON public.family_groups FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Club admins manage family groups"
    ON public.family_groups FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

CREATE POLICY "Superadmin family changes"
    ON public.family_discount_changes FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view family changes"
    ON public.family_discount_changes FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Club admins manage family changes"
    ON public.family_discount_changes FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 16. POLÍTICAS: LISTADO PROVISORIO Y SOLICITUDES DE APROBACIÓN
-- ==============================================================================
CREATE POLICY "Superadmin provisional players"
    ON public.provisional_players FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view provisional players"
    ON public.provisional_players FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Coaches and admins manage provisional players"
    ON public.provisional_players FOR ALL TO authenticated
    USING (
        club_id = public.get_my_club_id() 
        AND (coach_id = auth.uid() OR public.is_club_admin_or_owner())
    )
    WITH CHECK (
        club_id = public.get_my_club_id() 
        AND (coach_id = auth.uid() OR public.is_club_admin_or_owner())
    );

CREATE POLICY "Superadmin coach approval requests"
    ON public.coach_approval_requests FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club users view coach approval requests"
    ON public.coach_approval_requests FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Coaches create approval requests"
    ON public.coach_approval_requests FOR INSERT TO authenticated
    WITH CHECK (
        club_id = public.get_my_club_id() 
        AND coach_id = auth.uid()
    );

CREATE POLICY "Club admins manage approval requests"
    ON public.coach_approval_requests FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.is_club_admin_or_owner())
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 17. POLÍTICAS: PROMOCIONES DE TIENDA
-- ==============================================================================
CREATE POLICY "Superadmin store promotions"
    ON public.store_promotions FOR ALL TO authenticated USING (public.is_superadmin());

CREATE POLICY "Club view store promotions"
    ON public.store_promotions FOR SELECT TO authenticated
    USING (club_id = public.get_my_club_id());

CREATE POLICY "Club store staff manage promotions"
    ON public.store_promotions FOR ALL TO authenticated
    USING (club_id = public.get_my_club_id() AND public.get_my_role() IN ('DUEÑO', 'ADMINISTRACIÓN', 'TIENDA'))
    WITH CHECK (club_id = public.get_my_club_id());

-- ==============================================================================
-- 18. REFUERZO DE SEGURIDAD A NIVEL DE BASE DE DATOS (BACKEND ISOLATION)
-- Triggers que impiden suplantación de club_id y mezcla cruzada de claves foráneas.
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

    v_my_club := public.get_my_club_id();
    IF v_my_club IS NULL THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: No tienes un club asignado para realizar esta operación.';
    END IF;

    -- Si no especificó club_id o intentó enviar otro, se fuerza al club del token autenticado
    IF NEW.club_id IS NULL THEN
        NEW.club_id := v_my_club;
    ELSIF NEW.club_id <> v_my_club THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: Violación de aislamiento multi-tenant. No puedes operar sobre otro club.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparadores para asegurar club_id en entidades críticas
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

-- B. Integridad relacional intra-club: Previene que un jugador de Club A apunte a una categoría de Club B
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

-- ==============================================================================
-- 19. SINCRONIZACIÓN SUPABASE AUTH -> PUBLIC.PROFILES CON VERIFICACIÓN DE CLUB ÚNICO
-- ==============================================================================
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
            -- REGLA SUPABASE AUTH: Ningún usuario ordinario puede registrarse sin un club asignado
            RAISE EXCEPTION 'FRAOVIA Seguridad: Todo usuario operativo debe pertenecer exactamente a un club (club_id requerido).';
        END IF;

        -- Validar que el club exista y esté activo
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
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conexión de trigger a auth.users en Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

