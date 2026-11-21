-- ==============================================================================
-- FRAOVIA | MIGRACIÓN 03: REGLAS DE NEGOCIO, TRIGGERS Y FUNCIONES
-- Plataforma: Supabase / PostgreSQL 15+
-- ==============================================================================

-- ==============================================================================
-- 1. NUMERACIÓN ATÓMICA DE RECIBOS (SIN COLISIONES DE CONCURRENCIA)
-- Formato: FRA-AAAA-000001 (único por club y año)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_next_receipt_number(p_club_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
    v_next_val INT;
    v_formatted VARCHAR(50);
BEGIN
    -- Bloqueo de fila para concurrencia segura (FOR UPDATE)
    INSERT INTO public.receipt_counters (club_id, year, last_number, updated_at)
    VALUES (p_club_id, v_year, 1, NOW())
    ON CONFLICT (club_id, year)
    DO UPDATE SET 
        last_number = public.receipt_counters.last_number + 1,
        updated_at = NOW()
    RETURNING last_number INTO v_next_val;

    v_formatted := 'FRA-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');
    RETURN v_formatted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para asignar automáticamente el número de recibo correlativo si no viene provisto
CREATE OR REPLACE FUNCTION public.trg_assign_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := public.generate_next_receipt_number(NEW.club_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_insert_receipt ON public.receipts;
CREATE TRIGGER trg_before_insert_receipt
    BEFORE INSERT ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.trg_assign_receipt_number();

-- ==============================================================================
-- 2. INMUTABILIDAD DE RECIBOS Y AUDITORÍA
-- Bloquear UPDATE y DELETE sobre receipts y audit_logs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_receipt_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: Los comprobantes de pago son inmutables por ley deportiva y no pueden eliminarse.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Solo se permite pasar de 'emitido' a 'anulado' a través de la función void_receipt()
        IF OLD.status = 'anulado' THEN
            RAISE EXCEPTION 'FRAOVIA Seguridad: Un comprobante ya anulado no puede ser modificado nuevamente.';
        END IF;

        IF NEW.status = 'anulado' AND OLD.status = 'emitido' THEN
            -- Permitir únicamente si no se tocaron los datos contables
            IF NEW.amount <> OLD.amount OR NEW.receipt_number <> OLD.receipt_number OR NEW.club_id <> OLD.club_id THEN
                RAISE EXCEPTION 'FRAOVIA Seguridad: No se pueden alterar los montos ni el número del recibo al anularlo.';
            END IF;
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'FRAOVIA Seguridad: No se permite modificar los datos de un recibo emitido. Utilice la función de anulación oficial.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_receipts ON public.receipts;
CREATE TRIGGER trg_protect_receipts
    BEFORE UPDATE OR DELETE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.protect_receipt_immutability();

-- Bloqueo absoluto de UPDATE y DELETE en audit_logs (Bitácora inmutable)
CREATE OR REPLACE FUNCTION public.protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'FRAOVIA Seguridad: La bitácora de auditoría es estrictamente inmutable (Append-Only).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_protect_audit_logs
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.protect_audit_logs();

-- ==============================================================================
-- 3. ANULACIÓN SEGURA DE RECIBO CON CONTRAASIENTO EN CAJA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.void_receipt(
    p_receipt_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_receipt RECORD;
    v_user_id UUID := auth.uid();
    v_user_name VARCHAR;
    v_contraasiento_id UUID;
BEGIN
    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RAISE EXCEPTION 'FRAOVIA: Es obligatorio ingresar el motivo formal de anulación del comprobante.';
    END IF;

    SELECT * INTO v_receipt FROM public.receipts WHERE id = p_receipt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comprobante no encontrado.';
    END IF;

    IF v_receipt.status = 'anulado' THEN
        RAISE EXCEPTION 'El comprobante ya se encuentra anulado.';
    END IF;

    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;

    -- 1. Marcar recibo como anulado
    UPDATE public.receipts
    SET 
        status = 'anulado',
        void_reason = p_reason,
        voided_at = NOW(),
        voided_by_user_id = v_user_id
    WHERE id = p_receipt_id;

    -- 2. Si tenía caja asociada, generar movimiento de contraasiento (egreso por reversión)
    IF v_receipt.cash_box_id IS NOT NULL THEN
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
            'CONTRAASIENTO: Anulación comprobante ' || v_receipt.receipt_number,
            'anulacion_recibo',
            v_receipt.id,
            v_receipt.payment_method,
            v_user_id,
            'Motivo: ' || p_reason
        ) RETURNING id INTO v_contraasiento_id;

        -- Actualizar saldo de caja
        UPDATE public.cash_boxes
        SET current_balance = current_balance - v_receipt.amount
        WHERE id = v_receipt.cash_box_id;
    END IF;

    -- 3. Si era pago de jugador, restablecer saldo
    IF v_receipt.player_id IS NOT NULL THEN
        UPDATE public.players
        SET balance = balance + v_receipt.amount
        WHERE id = v_receipt.player_id;
    END IF;

    -- 4. Registrar en bitácora de auditoría
    INSERT INTO public.audit_logs (
        club_id,
        user_id,
        user_name,
        role,
        action,
        detail,
        category
    ) VALUES (
        v_receipt.club_id,
        v_user_id,
        COALESCE(v_user_name, 'Usuario'),
        'ADMINISTRACIÓN',
        'RECIBO_ANULADO',
        'Se anuló el comprobante ' || v_receipt.receipt_number || ' por monto $' || v_receipt.amount || '. Motivo: ' || p_reason,
        'caja'
    );

    RETURN jsonb_build_object(
        'success', true,
        'receipt_number', v_receipt.receipt_number,
        'contraasiento_id', v_contraasiento_id,
        'message', 'Comprobante anulado y contraasiento generado exitosamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. CÁLCULO AUTOMÁTICO DE CUOTA SEGÚN BECA
-- 0%, 50% (Media), 100% (Completa), o personalizada (5% a 95%)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.calculate_player_monthly_fee()
RETURNS TRIGGER AS $$
DECLARE
    v_base_fee NUMERIC(12,2) := 0;
    v_discount NUMERIC(12,2) := 0;
BEGIN
    -- Obtener arancel base de la categoría asignada
    SELECT monthly_fee INTO v_base_fee
    FROM public.categories
    WHERE id = NEW.category_id;

    IF v_base_fee IS NULL THEN
        v_base_fee := 0;
    END IF;

    -- Normalizar porcentaje de beca
    NEW.scholarship_percent := GREATEST(0, LEAST(100, COALESCE(NEW.scholarship_percent, 0)));

    -- Determinar tipo de beca
    IF NEW.scholarship_percent = 100 THEN
        NEW.scholarship_type := 'completa';
        NEW.monthly_fee_due := 0;
    ELSIF NEW.scholarship_percent = 50 THEN
        NEW.scholarship_type := 'media';
        NEW.monthly_fee_due := ROUND(v_base_fee * 0.50, 2);
    ELSIF NEW.scholarship_percent > 0 THEN
        NEW.scholarship_type := 'personalizada';
        v_discount := ROUND(v_base_fee * (NEW.scholarship_percent::NUMERIC / 100.0), 2);
        NEW.monthly_fee_due := GREATEST(0, v_base_fee - v_discount);
    ELSE
        NEW.scholarship_type := 'ninguna';
        NEW.monthly_fee_due := v_base_fee;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_player_fee ON public.players;
CREATE TRIGGER trg_calc_player_fee
    BEFORE INSERT OR UPDATE OF category_id, scholarship_percent ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.calculate_player_monthly_fee();

-- ==============================================================================
-- 5. CONTROL ESTRICTO DE CUPOS DEL PLAN CONTRATADO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_plan_quotas()
RETURNS TRIGGER AS $$
DECLARE
    v_club RECORD;
    v_count INT;
BEGIN
    SELECT c.*, p.max_players, p.max_users
    INTO v_club
    FROM public.clubs c
    LEFT JOIN public.subscription_plans p ON c.subscription_plan_id = p.id
    WHERE c.id = NEW.club_id;

    -- Verificación para jugadores
    IF TG_TABLE_NAME = 'players' THEN
        SELECT COUNT(*) INTO v_count FROM public.players WHERE club_id = NEW.club_id;
        IF v_count >= COALESCE(v_club.contracted_players_quota, v_club.max_players, 800) THEN
            RAISE EXCEPTION 'FRAOVIA Plan Límite: Se ha alcanzado el cupo máximo contratado de % deportistas para este club. Actualice su plan comercial.', 
                COALESCE(v_club.contracted_players_quota, v_club.max_players);
        END IF;
    END IF;

    -- Verificación para usuarios
    IF TG_TABLE_NAME = 'profiles' AND NEW.role <> 'SUPERADMIN' THEN
        SELECT COUNT(*) INTO v_count FROM public.profiles WHERE club_id = NEW.club_id;
        IF v_count >= COALESCE(v_club.contracted_users_quota, v_club.max_users, 10) THEN
            RAISE EXCEPTION 'FRAOVIA Plan Límite: Se ha alcanzado el cupo de % cuentas de usuario para este club.', 
                COALESCE(v_club.contracted_users_quota, v_club.max_users);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_quota_players ON public.players;
CREATE TRIGGER trg_check_quota_players
    BEFORE INSERT ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.check_plan_quotas();

DROP TRIGGER IF EXISTS trg_check_quota_users ON public.profiles;
CREATE TRIGGER trg_check_quota_users
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_plan_quotas();

-- ==============================================================================
-- 6. DESCUENTO DE STOCK EN VENTAS DE TIENDA Y ALERTA DE STOCK MÍNIMO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.deduct_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INT;
    v_min_stock INT;
    v_prod_name VARCHAR;
BEGIN
    SELECT stock, min_stock_alert, name
    INTO v_current_stock, v_min_stock, v_prod_name
    FROM public.store_products
    WHERE id = NEW.product_id;

    IF v_current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'FRAOVIA Stock Insuficiente: "%" solo dispone de % unidades.', v_prod_name, v_current_stock;
    END IF;

    UPDATE public.store_products
    SET 
        stock = stock - NEW.quantity,
        status = CASE WHEN (stock - NEW.quantity) = 0 THEN 'agotado' ELSE status END
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_stock ON public.store_sale_items;
CREATE TRIGGER trg_deduct_stock
    AFTER INSERT ON public.store_sale_items
    FOR EACH ROW EXECUTE FUNCTION public.deduct_product_stock();

-- ==============================================================================
-- 7. CREACIÓN AUTOMÁTICA DE PERFIL CUANDO SE REGISTRA EN auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(30);
    v_club_id UUID;
    v_full_name VARCHAR(255);
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'ADMINISTRACIÓN');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    -- SEGURIDAD CRÍTICA: Impedir auto-escalamiento a SUPERADMIN desde la API pública
    -- Nadie que se registre por la web puede auto-asignarse rol SUPERADMIN.
    -- El rol SUPERADMIN solo puede ser asignado por otro SUPERADMIN ya autenticado
    -- o directamente desde la consola/SQL de Supabase por el dueño del sistema.
    IF v_role = 'SUPERADMIN' THEN
        IF NOT public.is_superadmin() THEN
            -- Si un atacante envía role: 'SUPERADMIN' en el payload de signUp, se degrada forzosamente
            v_role := 'ADMINISTRACIÓN';
            v_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
        ELSE
            v_club_id := NULL;
        END IF;
    ELSE
        v_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
    END IF;

    -- Si no tiene club_id y no es superadmin verificado, no puede crearse sin institución
    IF v_role <> 'SUPERADMIN' AND v_club_id IS NULL THEN
        RAISE EXCEPTION 'FRAOVIA Seguridad: Todo usuario operativo debe pertenecer obligatoriamente a un club válido.';
    END IF;

    INSERT INTO public.profiles (
        id,
        club_id,
        email,
        full_name,
        role,
        status,
        scope
    ) VALUES (
        NEW.id,
        v_club_id,
        NEW.email,
        v_full_name,
        v_role,
        'activo',
        COALESCE(NEW.raw_user_meta_data->'scope', '{"categoryIds": [], "disciplineIds": []}'::jsonb)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
