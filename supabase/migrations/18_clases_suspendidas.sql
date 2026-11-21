-- ==============================================================================
-- FRAOVIA · 18 · CLASES SUSPENDIDAS (lluvia, clima, mantenimiento, feriado...)
-- Se corre en Supabase > SQL Editor. Es seguro correrlo más de una vez.
-- Una sesión suspendida NO cuenta como falta: no tiene presentes ni ausentes.
-- ==============================================================================

ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(30),
  ADD COLUMN IF NOT EXISTS suspension_notes TEXT;

ALTER TABLE public.attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_suspension_reason_chk;
ALTER TABLE public.attendance_sessions
  ADD CONSTRAINT attendance_sessions_suspension_reason_chk
  CHECK (suspension_reason IS NULL OR suspension_reason IN
    ('lluvia','clima','mantenimiento','feriado','fuerza_mayor','otro'));

DROP FUNCTION IF EXISTS public.record_attendance(UUID, DATE, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.record_attendance(
  p_category_id UUID, p_date DATE, p_title TEXT, p_entries JSONB,
  p_suspended BOOLEAN DEFAULT FALSE, p_reason TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_club UUID := public.get_my_club_id();
  v_session UUID;
  v_susp BOOLEAN := COALESCE(p_suspended, FALSE);
BEGIN
  IF auth.uid() IS NULL OR v_club IS NULL THEN RAISE EXCEPTION 'FRAOVIA: Usuario no autorizado.'; END IF;
  IF public.is_superadmin() THEN
    RAISE EXCEPTION 'FRAOVIA: El SUPERADMIN está en modo fantasma (solo lectura).';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND club_id = v_club) THEN
    RAISE EXCEPTION 'FRAOVIA: Categoría no encontrada.';
  END IF;
  IF NOT public.can_access_category(p_category_id) THEN
    RAISE EXCEPTION 'FRAOVIA: No tenés permiso para tomar asistencia en esta categoría.';
  END IF;
  IF v_susp AND (p_reason IS NULL OR p_reason NOT IN ('lluvia','clima','mantenimiento','feriado','fuerza_mayor','otro')) THEN
    RAISE EXCEPTION 'FRAOVIA: Indicá el motivo de la suspensión.';
  END IF;

  INSERT INTO public.attendance_sessions
    (club_id, category_id, date, session_title, recorded_by_user_id, is_suspended, suspension_reason, suspension_notes)
  VALUES (v_club, p_category_id, p_date, COALESCE(NULLIF(trim(p_title), ''), 'Entrenamiento'), auth.uid(),
          v_susp, CASE WHEN v_susp THEN p_reason END, CASE WHEN v_susp THEN NULLIF(trim(p_notes), '') END)
  ON CONFLICT (category_id, date) DO UPDATE
    SET session_title = EXCLUDED.session_title,
        recorded_by_user_id = EXCLUDED.recorded_by_user_id,
        is_suspended = EXCLUDED.is_suspended,
        suspension_reason = EXCLUDED.suspension_reason,
        suspension_notes = EXCLUDED.suspension_notes
  RETURNING id INTO v_session;

  DELETE FROM public.attendance_entries WHERE session_id = v_session;
  IF NOT v_susp THEN
    INSERT INTO public.attendance_entries (club_id, session_id, player_id, status, notes)
    SELECT v_club, v_session, (x ->> 'playerId')::UUID, x ->> 'status', NULLIF(x ->> 'notes', '')
    FROM jsonb_array_elements(COALESCE(p_entries, '[]'::jsonb)) x
    WHERE EXISTS (SELECT 1 FROM public.players pl WHERE pl.id = (x ->> 'playerId')::UUID
                  AND pl.club_id = v_club AND pl.category_id = p_category_id);
  END IF;

  PERFORM public.log_audit(
    CASE WHEN v_susp THEN 'CLASE_SUSPENDIDA' ELSE 'ASISTENCIA_REGISTRADA' END,
    CASE WHEN v_susp THEN format('Clase suspendida el %s (motivo: %s).', p_date, p_reason)
         ELSE format('Asistencia registrada para el %s.', p_date) END,
    'asistencia');
  RETURN v_session;
END;
$$;

REVOKE ALL ON FUNCTION public.record_attendance(UUID, DATE, TEXT, JSONB, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_attendance(UUID, DATE, TEXT, JSONB, BOOLEAN, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
