-- ==============================================================================
-- FRAOVIA | MIGRACIÓN 05: DATOS DE PRUEBA Y VERIFICACIÓN (SEED DATA)
-- Plataforma: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 1. PLANES COMERCIALES
INSERT INTO public.subscription_plans (id, name, description, max_players, max_users, monthly_price, annual_price)
VALUES 
    ('starter', 'SaaS Starter', 'Para clubes formativos y barriales', 300, 3, 29000, 290000),
    ('pro', 'SaaS Profesional', 'Para instituciones multideporte medianas', 800, 10, 59000, 590000),
    ('elite', 'SaaS Élite Federación', 'Clubes de alta competencia y federaciones', 2500, 30, 129000, 1290000)
ON CONFLICT (id) DO NOTHING;

-- 2. CLUB A: CLUB ATLÉTICO SAN MARTÍN
INSERT INTO public.clubs (
    id, name, slug, cuit, email, phone, address, 
    subscription_plan_id, contracted_players_quota, contracted_users_quota,
    branding
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Club Atlético San Martín',
    'san-martin',
    '30-68492019-4',
    'administracion@sanmartin.com.ar',
    '+54 388 422 1928',
    'Av. San Martín 1420, Jujuy',
    'pro',
    800,
    10,
    '{"primaryColor": "#0284c7", "secondaryColor": "#38bdf8", "darkSidebar": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 3. CLUB B: CLUB SOCIAL Y DEPORTIVO GORRITI
INSERT INTO public.clubs (
    id, name, slug, cuit, email, phone, address, 
    subscription_plan_id, contracted_players_quota, contracted_users_quota,
    branding
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'Club Social y Deportivo Gorriti',
    'gorriti',
    '30-55910482-1',
    'contacto@clubgorriti.com.ar',
    '+54 388 423 8811',
    'Calle Gorriti 850, Jujuy',
    'starter',
    300,
    3,
    '{"primaryColor": "#e11d48", "secondaryColor": "#fb7185", "darkSidebar": false}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 4. TEMPORADAS (SEASONS)
INSERT INTO public.seasons (id, club_id, name, year, status, start_date, end_date)
VALUES 
    ('a1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Temporada Oficial 2026', 2026, 'activa', '2026-01-01', '2026-12-31'),
    ('b1111111-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Temporada Gorriti 2026', 2026, 'activa', '2026-02-01', '2026-11-30')
ON CONFLICT (id) DO NOTHING;

UPDATE public.clubs SET current_season_id = 'a1111111-0000-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.clubs SET current_season_id = 'b1111111-0000-0000-0000-000000000002' WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- 5. DISCIPLINAS Y CATEGORÍAS
-- San Martín
INSERT INTO public.disciplines (id, club_id, name, code, icon_name)
VALUES 
    ('a2222222-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Fútbol Juvenil', 'FUT-JUV', 'Activity'),
    ('a2222222-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Básquet', 'BASQ', 'Trophy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, club_id, discipline_id, name, age_group, monthly_fee, color_block_name)
VALUES 
    ('a3333333-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Sub-15 A', '14-15 años', 24000, 'Bloque Azul'),
    ('a3333333-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Sub-17 Competitiva', '16-17 años', 26000, 'Bloque Oro')
ON CONFLICT (id) DO NOTHING;

-- Gorriti
INSERT INTO public.disciplines (id, club_id, name, code, icon_name)
VALUES 
    ('b2222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Vóley Femenino', 'VOL-FEM', 'Flame')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, club_id, discipline_id, name, age_group, monthly_fee, color_block_name)
VALUES 
    ('b3333333-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'Primera División Vóley', 'Mayores', 20000, 'Bloque Rojo')
ON CONFLICT (id) DO NOTHING;

-- 6. CAJAS
INSERT INTO public.cash_boxes (id, club_id, name, type, responsible_user_id, current_balance, status)
VALUES 
    ('a4444444-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Caja General Sede San Martín', 'general', '00000000-0000-0000-0000-000000000001', 185000, 'abierta'),
    ('b4444444-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Caja Central Gorriti', 'general', '00000000-0000-0000-0000-000000000002', 45000, 'abierta')
ON CONFLICT (id) DO NOTHING;

-- 7. JUGADORES CON DIFERENTES NIVELES DE BECA (TESTING DE CUOTA AUTOMÁTICA)
-- San Martín: Jugador 1 (Sin beca: cuota $24.000)
INSERT INTO public.players (
    id, club_id, discipline_id, category_id, dni, first_name, last_name, 
    birth_date, jersey_number, scholarship_percent, scholarship_type
) VALUES (
    'a5555555-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000001',
    'a3333333-0000-0000-0000-000000000001',
    '44102938',
    'Mateo',
    'Gutiérrez',
    '2010-04-12',
    10,
    0,
    'ninguna'
) ON CONFLICT (id) DO NOTHING;

-- San Martín: Jugador 2 (Media Beca 50%: cuota $12.000)
INSERT INTO public.players (
    id, club_id, discipline_id, category_id, dni, first_name, last_name, 
    birth_date, jersey_number, scholarship_percent, scholarship_type, scholarship_reason
) VALUES (
    'a5555555-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000001',
    'a3333333-0000-0000-0000-000000000001',
    '44991203',
    'Tomás',
    'Ríos',
    '2010-08-25',
    7,
    50,
    'media',
    'Descuento familiar por hermano en club'
) ON CONFLICT (id) DO NOTHING;

-- San Martín: Jugador 3 (Beca Completa 100%: cuota $0)
INSERT INTO public.players (
    id, club_id, discipline_id, category_id, dni, first_name, last_name, 
    birth_date, jersey_number, scholarship_percent, scholarship_type, scholarship_reason
) VALUES (
    'a5555555-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000001',
    'a3333333-0000-0000-0000-000000000001',
    '45330192',
    'Lautaro',
    'Martínez P.',
    '2011-01-15',
    9,
    100,
    'completa',
    'Mérito deportivo - Convocatoria federativa'
) ON CONFLICT (id) DO NOTHING;

-- Gorriti: Jugadora 1 (Sin beca en club B)
INSERT INTO public.players (
    id, club_id, discipline_id, category_id, dni, first_name, last_name, 
    birth_date, jersey_number, scholarship_percent, scholarship_type
) VALUES (
    'b5555555-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b2222222-0000-0000-0000-000000000001',
    'b3333333-0000-0000-0000-000000000001',
    '42819203',
    'Valentina',
    'Solís',
    '2003-05-18',
    4,
    0,
    'ninguna'
) ON CONFLICT (id) DO NOTHING;

-- 8. TIENDA DE EJEMPLO
INSERT INTO public.store_products (id, club_id, name, sku, category, cost_price, sale_price, stock, min_stock_alert)
VALUES 
    ('a6666666-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Camiseta Oficial San Martín 2026', 'CAM-SM-2026', 'Indumentaria', 12000, 24000, 30, 5),
    ('b6666666-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Campera Gorriti Vóley', 'CMP-GOR-01', 'Indumentaria', 18000, 35000, 15, 3)
ON CONFLICT (id) DO NOTHING;

-- 9. RECIBO DE PRUEBA
INSERT INTO public.receipts (
    id, club_id, customer_name, customer_dni, player_id, concept, 
    amount, payment_method, cash_box_id, issued_by_user_id
) VALUES (
    'a7777777-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Familia Gutiérrez',
    '44102938',
    'a5555555-0000-0000-0000-000000000001',
    'Cuota Social Marzo 2026 - Sub-15 A',
    24000,
    'transferencia',
    'a4444444-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;
