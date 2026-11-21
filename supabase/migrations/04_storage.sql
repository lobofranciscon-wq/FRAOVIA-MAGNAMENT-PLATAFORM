-- ==============================================================================
-- FRAOVIA | MIGRACIÓN 04: STORAGE (BUCKETS Y POLÍTICAS DE ARCHIVOS)
-- Plataforma: Supabase Storage
-- ==============================================================================

-- 1. CREACIÓN DE BUCKETS DE ALMACENAMIENTO
-- Inserción directa en storage.buckets con control público/privado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('logos', 'logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('players', 'players', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('visual-editor', 'visual-editor', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('mockups', 'mockups', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 2. POLÍTICAS DE ACCESO RLS EN storage.objects
-- Convención de ruta: {club_id}/{nombre_archivo}
-- ==============================================================================

-- --- A. BUCKET: LOGOS ---
-- Lectura pública para poder mostrar los escudos en el carnet, credenciales y login
CREATE POLICY "Public read logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'logos');

CREATE POLICY "Club admins upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'logos' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    );

CREATE POLICY "Club admins update or delete logos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'logos' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    );

-- --- B. BUCKET: PLAYERS (FOTOS 1:1 DEPORTISTAS) ---
CREATE POLICY "Public read player photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'players');

CREATE POLICY "Club staff manage player photos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'players' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    )
    WITH CHECK (
        bucket_id = 'players' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    );

-- --- C. BUCKET: VISUAL-EDITOR (FONDOS Y ELEMENTOS) ---
CREATE POLICY "Public read visual editor assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'visual-editor');

CREATE POLICY "Superadmin manage visual editor assets"
    ON storage.objects FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- --- D. BUCKET: MOCKUPS (IMÁGENES DE REFERENCIA) ---
CREATE POLICY "Superadmin and club view mockups"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'mockups' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    );

CREATE POLICY "Superadmin and club manage mockups"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'mockups' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    )
    WITH CHECK (
        bucket_id = 'mockups' AND (
            public.is_superadmin() OR 
            (storage.foldername(name))[1] = public.get_my_club_id()::text
        )
    );
