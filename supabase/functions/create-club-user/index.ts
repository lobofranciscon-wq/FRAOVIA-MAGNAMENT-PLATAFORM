import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ROLES = ['SUPERADMIN', 'DUEÑO', 'ADMINISTRACIÓN', 'GENERAL', 'PROFESOR', 'TIENDA'] as const;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Configuración del servidor incompleta (variables de entorno faltantes).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validar que el llamador esté autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: No autorizado. Cabecera Authorization requerida.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente con token del operador que hace la llamada para verificar identidad
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userAuthError } = await userClient.auth.getUser();
    if (userAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Sesión inválida o expirada. Inicie sesión nuevamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener perfil del operador desde public.profiles
    const { data: callerProfile, error: profileErr } = await userClient
      .from('profiles')
      .select('full_name, role, club_id, status')
      .eq('id', callerUser.id)
      .single();

    if (profileErr || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Perfil del operador no encontrado en la base de datos.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.status !== 'activo') {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Acceso denegado. El perfil del operador no se encuentra activo.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parsear el payload
    const payload = await req.json();
    const {
      email,
      password,
      fullName,
      role: requestedRole,
      clubId: requestedClubId,
      phone,
      scope = { categoryIds: [], disciplineIds: [] }
    } = payload;

    if (!email || !password || !fullName || !requestedRole) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Faltan campos obligatorios: email, password, fullName y role.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validar requestedRole
    // REGLA INSTITUCIONAL: Existe un único SUPERADMIN y ya está creado en la base de datos.
    // La app no debe permitir crear, ascender ni promover a nadie a SUPERADMIN bajo ningún concepto.
    if (requestedRole === 'SUPERADMIN') {
      return new Response(
        JSON.stringify({
          error: 'FRAOVIA: Operación no permitida. Existe un único SUPERADMIN y no es posible crear, ascender ni promover cuentas a dicho rol.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_ROLES.includes(requestedRole)) {
      return new Response(
        JSON.stringify({
          error: `FRAOVIA: El rol "${requestedRole}" no es válido. Debe ser uno de: ${VALID_ROLES.filter(r => r !== 'SUPERADMIN').join(', ')}.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Jerarquía de autorización por rol del operador:
    // - SUPERADMIN: puede crear usuarios para cualquier club o SUPERADMIN
    // - DUEÑO: puede crear usuarios de su club (excepto SUPERADMIN y DUEÑO)
    // - ADMINISTRACIÓN: solo puede crear GENERAL, PROFESOR y TIENDA dentro de su club
    // - Otros roles: denegado
    const callerRole = callerProfile.role;
    let targetClubId = requestedClubId;

    if (callerRole === 'SUPERADMIN') {
      targetClubId = requestedRole === 'SUPERADMIN' ? null : requestedClubId;
    } else if (callerRole === 'DUEÑO') {
      targetClubId = callerProfile.club_id;
      if (requestedRole === 'SUPERADMIN' || requestedRole === 'DUEÑO') {
        return new Response(
          JSON.stringify({ error: 'FRAOVIA: Un DUEÑO no puede crear otros DUEÑOS ni SUPERADMINS.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (callerRole === 'ADMINISTRACIÓN') {
      targetClubId = callerProfile.club_id;
      const allowedRoles = ['GENERAL', 'PROFESOR', 'TIENDA'];
      if (!allowedRoles.includes(requestedRole)) {
        return new Response(
          JSON.stringify({ error: 'FRAOVIA: ADMINISTRACIÓN solo puede dar de alta usuarios GENERAL, PROFESOR o TIENDA.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Su rol no posee permisos para registrar usuarios en el sistema.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si el usuario no es SUPERADMIN, debe tener un club_id asignado
    if (requestedRole !== 'SUPERADMIN' && !targetClubId) {
      return new Response(
        JSON.stringify({ error: 'FRAOVIA: Todo usuario operativo debe pertenecer obligatoriamente a una institución deportiva.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente seguro con Service Role Key en el servidor
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 5. Control de cupos del plan contratado
    if (targetClubId && requestedRole !== 'SUPERADMIN') {
      const { data: clubData, error: clubErr } = await adminClient
        .from('clubs')
        .select('contracted_users_quota, subscription_plans(max_users)')
        .eq('id', targetClubId)
        .single();

      if (!clubErr && clubData) {
        const { count: currentUsersCount, error: countErr } = await adminClient
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', targetClubId);

        if (!countErr) {
          const limit = clubData.contracted_users_quota || (clubData.subscription_plans as any)?.max_users || 10;
          if ((currentUsersCount ?? 0) >= limit) {
            return new Response(
              JSON.stringify({
                error: `FRAOVIA: Límite de cupo alcanzado. El club ya tiene ${currentUsersCount} cuentas activas (máximo contratado: ${limit}).`,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // 6. Crear el usuario en auth.users con app_metadata protegido
    // Nota: El trigger trg_on_auth_user_created en la base crea automáticamente el perfil en public.profiles
    const { data: createdAuthUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      app_metadata: {
        fraovia_role: requestedRole,
        fraovia_club_id: targetClubId,
        fraovia_scope: scope
      },
      user_metadata: {
        full_name: fullName.trim(),
        role: requestedRole,
        club_id: targetClubId,
        phone: phone?.trim() || ''
      }
    });

    if (createUserError || !createdAuthUser?.user) {
      return new Response(
        JSON.stringify({ error: `FRAOVIA: ${createUserError?.message || 'Error al generar credenciales de acceso.'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = createdAuthUser.user.id;

    // Actualizar teléfono opcional en el perfil si fue provisto
    if (phone && phone.trim()) {
      await adminClient
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', newUserId);
    }

    // 7. Insertar auditoría DIRECTO en audit_logs con adminClient (service_role)
    const operatorName = callerProfile.full_name || callerUser.email || 'Operador';
    const { error: auditErr } = await adminClient.from('audit_logs').insert({
      club_id: targetClubId,
      user_id: callerUser.id,
      user_name: operatorName,
      role: callerProfile.role,
      action: 'USUARIO_CREADO',
      detail: `El operador ${operatorName} (${callerProfile.role}) dio de alta al usuario ${fullName} (${email}) con rol ${requestedRole}.`,
      category: 'seguridad'
    });

    if (auditErr) {
      console.warn('Aviso: No se pudo asentar registro de auditoría en Edge Function:', auditErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario creado exitosamente con credenciales y perfil activo.',
        userId: newUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `FRAOVIA: ${err.message || 'Error interno del servidor en Edge Function'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
