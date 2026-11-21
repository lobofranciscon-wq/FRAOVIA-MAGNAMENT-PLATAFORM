import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Club, Discipline, Category, Player, User, CashBox, CashMovement, Receipt, Season } from '../types/fraovia';

/**
 * Función auxiliar para formatear y propagar errores de base de datos PostgreSQL / RLS.
 * Si el error de la base empieza o contiene "FRAOVIA:", se muestra tal cual.
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Error desconocido de conexión';
  const msg = typeof error === 'string' ? error : (error.message || error.details || error.hint || JSON.stringify(error));
  if (msg.includes('FRAOVIA:')) {
    const start = msg.indexOf('FRAOVIA:');
    const tail = msg.slice(start);
    const end = tail.search(/["\r\n]/);
    return end !== -1 ? tail.slice(0, end).trim() : tail.trim();
  }
  if (msg.includes('FRAOVIA')) {
    const start = msg.indexOf('FRAOVIA');
    const tail = msg.slice(start);
    const end = tail.search(/["\r\n]/);
    return end !== -1 ? tail.slice(0, end).trim() : tail.trim();
  }
  // Errores comunes de la base, explicados en lenguaje simple
  if (msg.includes('unique_player_dni_per_club')) {
    return 'Ya existe un deportista con ese DNI en este club.';
  }
  if (msg.includes('unique_category_name_per_discipline')) {
    return 'Ya existe una categoría con ese nombre en esa disciplina.';
  }
  if (msg.includes('invalid input syntax for type uuid')) {
    return 'Falta elegir una disciplina válida. Cerrá la ventana, volvé a abrirla y elegí la disciplina de la lista.';
  }
  if (msg.includes('row-level security')) {
    return 'Tu rol no tiene permiso para realizar esta acción.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión a internet.';
  }
  return msg;
}

// ==============================================================================
// MAPEOS: Base de Datos (snake_case) <-> Frontend TypeScript (camelCase)
// ==============================================================================

export function mapClubFromDb(row: any): Club {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    cuit: row.cuit || '',
    phone: row.phone || '',
    email: row.email,
    address: row.address || '',
    logoUrl: row.logo_url || '',
    status: row.status || 'activo',
    currentSeasonId: row.current_season_id || '',
    subscriptionPlanId: row.subscription_plan_id || 'pro',
    contractedPlayersQuota: row.contracted_players_quota ?? 800,
    contractedUsersQuota: row.contracted_users_quota ?? 10,
    branding: row.branding || {
      primaryColor: '#0072FF',
      secondaryColor: '#00C6FF',
      darkSidebar: true
    },
    activeModules: row.active_modules || {
      base: true,
      deportivo: true,
      caja: true,
      tienda: true
    },
    monthlyGoal: row.monthly_goal != null ? Number(row.monthly_goal) : undefined,
    whatsappConfig: row.whatsapp_config || undefined,
    receiptTemplate: row.receipt_template || undefined,
    feeReminderAutomation: row.fee_reminder_automation || undefined,
    subscriptionAlert: row.subscription_alert || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function mapDisciplineFromDb(row: any): Discipline {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    code: row.code,
    iconName: row.icon_name || 'Activity',
    active: row.active !== false,
    coordinatorName: row.coordinator_name || ''
  };
}

export function mapCategoryFromDb(row: any): Category {
  return {
    id: row.id,
    clubId: row.club_id,
    disciplineId: row.discipline_id,
    name: row.name,
    ageGroup: row.age_group || '',
    gender: row.gender || 'Mixto',
    monthlyFee: Number(row.monthly_fee) || 0,
    colorBlockName: row.color_block_name || 'Bloque Azul',
    trainingSchedule: row.training_schedule || '',
    coachId: row.coach_id || undefined
  };
}

export function mapPlayerFromDb(row: any): Player {
  return {
    id: row.id,
    clubId: row.club_id,
    disciplineId: row.discipline_id,
    categoryId: row.category_id,
    dni: row.dni,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    phone: row.phone || '',
    email: row.email || '',
    // En photo_url viene la RUTA (club_id/uuid.ext). La UI genera la signedUrl para mostrarla.
    photoUrl: row.photo_url ? (row.photo_url.trim() || undefined) : undefined,
    jerseyNumber: row.jersey_number,
    position: row.position,
    colorBlockName: row.color_block_name,
    emergencyContact: row.emergency_contact || { name: '', relationship: '', phone: '' },
    medicalCertificateValid: row.medical_certificate_valid !== false,
    medicalExpiryDate: row.medical_expiry_date,
    status: row.status || 'activo',
    suspensionReason: row.suspension_reason || undefined,
    bloodType: row.blood_type || undefined,
    dominantSide: row.dominant_side || undefined,
    healthInsurance: row.health_insurance || undefined,
    medicalNotes: row.medical_notes || undefined,
    suspensionNote: row.suspension_note || undefined,
    suspendedAt: row.suspended_at || undefined,
    coachId: row.coach_id || undefined,
    isRestricted: false,
    scholarshipPercent: row.scholarship_percent || 0,
    scholarshipType: row.scholarship_type || 'ninguna',
    scholarshipReason: row.scholarship_reason,
    familyGroupId: row.family_group_id || undefined,
    familyDiscountPercent: Number(row.family_discount_percent) || 0,
    monthlyFeeDue: Number(row.monthly_fee_due) || 0,
    balance: Number(row.balance) || 0,
    joinedDate: row.joined_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
  };
}

export function mapCashBoxFromDb(row: any): CashBox {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    type: row.type,
    parentBoxId: row.parent_box_id || undefined,
    disciplineId: row.discipline_id || undefined,
    responsibleUserId: row.responsible_user_id,
    currentBalance: Number(row.current_balance) || 0,
    status: row.status || 'abierta',
    initialCashAmount: row.initial_cash_amount !== null && row.initial_cash_amount !== undefined ? Number(row.initial_cash_amount) : undefined,
    openedAt: row.opened_at || undefined,
    openedByUserId: row.opened_by_user_id || undefined,
    shiftName: row.shift_name || undefined,
    closedAt: row.closed_at || undefined,
    closedByUserId: row.closed_by_user_id || undefined,
    closedCountedAmount: row.closed_counted_amount !== null && row.closed_counted_amount !== undefined ? Number(row.closed_counted_amount) : undefined,
    closingDifference: row.closing_difference !== null && row.closing_difference !== undefined ? Number(row.closing_difference) : undefined
  };
}

export function mapCashMovementFromDb(row: any): CashMovement {
  return {
    id: row.id,
    clubId: row.club_id,
    cashBoxId: row.cash_box_id,
    type: row.type,
    amount: Number(row.amount) || 0,
    concept: row.concept,
    category: row.category,
    receiptId: row.receipt_id || undefined,
    paymentMethod: row.payment_method,
    registeredByUserId: row.registered_by_user_id,
    timestamp: row.timestamp || new Date().toISOString(),
    notes: row.notes || undefined
  };
}

export function mapReceiptFromDb(row: any): Receipt {
  return {
    id: row.id,
    clubId: row.club_id,
    receiptNumber: row.receipt_number,
    date: row.date || row.created_at || new Date().toISOString(),
    customerName: row.customer_name,
    customerDni: row.customer_dni || undefined,
    playerId: row.player_id || undefined,
    concept: row.concept,
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method,
    status: row.status || 'emitido',
    voidReason: row.void_reason || undefined,
    voidedAt: row.voided_at || undefined,
    voidedByUserId: row.voided_by_user_id || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    cashBoxId: row.cash_box_id || undefined,
    issuedByUserId: row.issued_by_user_id
  };
}

// ==============================================================================
// SERVICIO DE DATOS REALES (FASE 1 & FASE 2)
// ==============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: any): boolean {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function mapProfileFromDb(row: any): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    clubId: row.club_id || null,
    status: row.status,
    phone: row.phone || '',
    avatarUrl: row.avatar_url?.trim() || undefined,
    scope: row.scope || { categoryIds: [], disciplineIds: [] },
    createdAt: row.created_at,
    lastLogin: row.last_login || undefined
  };
}

export function mapSeasonFromDb(row: any): Season {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    year: row.year,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date
  };
}

export const supabaseDataService = {
  // ----------------------------------------------------------------------------
  // USUARIOS DEL CLUB (perfiles), PROFESORES Y TEMPORADAS
  // ----------------------------------------------------------------------------
  async getClubUsers(clubId: string): Promise<User[]> {
    if (!isSupabaseConfigured() || !clubId) return [];
    const { data, error } = await supabase
      .from('profiles').select('*').eq('club_id', clubId).order('full_name', { ascending: true });
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapProfileFromDb);
  },

  async updateProfile(userId: string, updates: { fullName?: string; phone?: string; avatarUrl?: string | null }): Promise<User> {
    const payload: any = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone.trim();
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapProfileFromDb(data);
  },

  async setUserStatus(userId: string, status: 'activo' | 'restringido' | 'deshabilitado'): Promise<User> {
    const { data, error } = await supabase.from('profiles').update({ status }).eq('id', userId).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapProfileFromDb(data);
  },

  async setUserScope(userId: string, scope: { categoryIds?: string[]; disciplineIds?: string[] }): Promise<User> {
    const { data, error } = await supabase.from('profiles').update({ scope }).eq('id', userId).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapProfileFromDb(data);
  },

  async setCategoryCoach(categoryId: string, coachId: string | null): Promise<void> {
    const real = isUuid(coachId) ? coachId : null;
    const { error } = await supabase.from('categories').update({ coach_id: real }).eq('id', categoryId);
    if (error) throw new Error(formatSupabaseError(error));
    // El profesor titular también pasa a ser el profesor de los deportistas de esa categoría
    const { error: pErr } = await supabase.from('players').update({ coach_id: real }).eq('category_id', categoryId);
    if (pErr) throw new Error(formatSupabaseError(pErr));
  },

  async setPlayerCoach(playerId: string, coachId: string | null): Promise<void> {
    const { error } = await supabase.from('players').update({ coach_id: isUuid(coachId) ? coachId : null }).eq('id', playerId);
    if (error) throw new Error(formatSupabaseError(error));
  },

  async getSeasons(clubId: string): Promise<Season[]> {
    if (!isSupabaseConfigured() || !clubId) return [];
    const { data, error } = await supabase.from('seasons').select('*').eq('club_id', clubId).order('year', { ascending: false });
    if (error) throw new Error(formatSupabaseError(error));
    return (data || []).map(mapSeasonFromDb);
  },

  async createSeason(clubId: string, s: { name: string; year: number; status: Season['status']; startDate: string; endDate: string }): Promise<Season> {
    const { data, error } = await supabase.from('seasons').insert({
      club_id: clubId, name: s.name, year: s.year, status: s.status, start_date: s.startDate, end_date: s.endDate
    }).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapSeasonFromDb(data);
  },

  async closeSeason(seasonId: string): Promise<Season> {
    const { data, error } = await supabase.from('seasons').update({ status: 'cerrada' }).eq('id', seasonId).select().single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapSeasonFromDb(data);
  },

  async setModuleVisibility(modules: Record<string, boolean>): Promise<Record<string, boolean>> {
    const { data, error } = await supabase.rpc('set_club_module_visibility', { p_modules: modules });
    if (error) throw new Error(formatSupabaseError(error));
    return data as Record<string, boolean>;
  },

  // ----------------------------------------------------------------------------
  // 1. SESIÓN Y PERFIL
  // ----------------------------------------------------------------------------
  async loadUserProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error al cargar perfil desde Supabase:', error);
      return null;
    }

    if (profile.status !== 'activo') {
      throw new Error('FRAOVIA: Su cuenta se encuentra ' + profile.status + '. Contacte al administrador.');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      clubId: profile.club_id || '',
      status: profile.status,
      phone: profile.phone || '',
      avatarUrl: profile.avatar_url?.trim() || undefined,
      scope: profile.scope || { categoryIds: [], disciplineIds: [] },
      createdAt: profile.created_at
    };
  },

  // ----------------------------------------------------------------------------
  // 2. CLUBES (solo SUPERADMIN ve todos; usuarios de club ven su propio club)
  // ----------------------------------------------------------------------------
  async getClubs(currentUser: User): Promise<Club[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('clubs').select('*');
    if (currentUser.role !== 'SUPERADMIN') {
      if (!currentUser.clubId) return [];
      query = query.eq('id', currentUser.clubId);
    }

    const { data, error } = await query.order('name');
    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapClubFromDb);
  },

  async getClubById(clubId: string): Promise<Club | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (error || !data) return null;
    return mapClubFromDb(data);
  },

  async createClub(club: Omit<Club, 'id'>): Promise<Club> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    // El ID lo genera PostgreSQL automáticamente con gen_random_uuid()
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: club.name.trim(),
        slug: club.slug.trim(),
        cuit: club.cuit?.trim() || null,
        phone: club.phone?.trim() || null,
        email: club.email.trim(),
        address: club.address?.trim() || null,
        logo_url: club.logoUrl || null,
        status: club.status || 'activo',
        subscription_plan_id: club.subscriptionPlanId || 'pro',
        contracted_players_quota: club.contractedPlayersQuota || 800,
        contracted_users_quota: club.contractedUsersQuota || 10,
        branding: club.branding || {},
        active_modules: club.activeModules || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapClubFromDb(data);
  },

  async updateClub(clubId: string, updates: Partial<Club>): Promise<Club> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.slug !== undefined) dbPayload.slug = updates.slug;
    if (updates.cuit !== undefined) dbPayload.cuit = updates.cuit;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.email !== undefined) dbPayload.email = updates.email;
    if (updates.address !== undefined) dbPayload.address = updates.address;
    if (updates.logoUrl !== undefined) dbPayload.logo_url = updates.logoUrl;
    if (updates.branding !== undefined) dbPayload.branding = updates.branding;
    if (updates.activeModules !== undefined) dbPayload.active_modules = updates.activeModules;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.subscriptionPlanId !== undefined) dbPayload.subscription_plan_id = updates.subscriptionPlanId;
    if (updates.contractedPlayersQuota !== undefined) dbPayload.contracted_players_quota = updates.contractedPlayersQuota;
    if (updates.contractedUsersQuota !== undefined) dbPayload.contracted_users_quota = updates.contractedUsersQuota;
    if (updates.monthlyGoal !== undefined) dbPayload.monthly_goal = updates.monthlyGoal;
    if (updates.whatsappConfig !== undefined) dbPayload.whatsapp_config = updates.whatsappConfig;
    if (updates.receiptTemplate !== undefined) dbPayload.receipt_template = updates.receiptTemplate;
    if (updates.feeReminderAutomation !== undefined) dbPayload.fee_reminder_automation = updates.feeReminderAutomation;
    if (updates.subscriptionAlert !== undefined) dbPayload.subscription_alert = updates.subscriptionAlert;

    const { data, error } = await supabase
      .from('clubs')
      .update(dbPayload)
      .eq('id', clubId)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapClubFromDb(data);
  },

  // ----------------------------------------------------------------------------
  // 3. DISCIPLINAS
  // ----------------------------------------------------------------------------
  async getDisciplines(clubId: string): Promise<Discipline[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .eq('club_id', clubId)
      .order('name');

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapDisciplineFromDb);
  },

  async createDiscipline(clubId: string, discipline: Omit<Discipline, 'id' | 'clubId'>): Promise<Discipline> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { data, error } = await supabase
      .from('disciplines')
      .insert({
        club_id: clubId,
        name: discipline.name.trim(),
        code: discipline.code.trim().toUpperCase(),
        icon_name: discipline.iconName || 'Activity',
        active: discipline.active !== false,
        coordinator_name: discipline.coordinatorName?.trim() || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapDisciplineFromDb(data);
  },

  // ----------------------------------------------------------------------------
  // 4. CATEGORÍAS (respetando RLS de profesores si corresponde)
  // ----------------------------------------------------------------------------
  async getCategories(clubId: string): Promise<Category[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('club_id', clubId)
      .order('name');

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapCategoryFromDb);
  },

  async createCategory(clubId: string, category: Omit<Category, 'id' | 'clubId'>): Promise<Category> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        club_id: clubId,
        discipline_id: category.disciplineId,
        name: category.name.trim(),
        age_group: category.ageGroup?.trim() || null,
        gender: category.gender || 'Mixto',
        monthly_fee: category.monthlyFee || 0,
        color_block_name: category.colorBlockName || 'Bloque Azul',
        training_schedule: category.trainingSchedule?.trim() || null,
        coach_id: isUuid((category as any).coachId) ? (category as any).coachId : null
      })
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapCategoryFromDb(data);
  },

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.disciplineId !== undefined) payload.discipline_id = updates.disciplineId;
    if (updates.ageGroup !== undefined) payload.age_group = updates.ageGroup;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.monthlyFee !== undefined) payload.monthly_fee = updates.monthlyFee;
    if (updates.colorBlockName !== undefined) payload.color_block_name = updates.colorBlockName;
    if (updates.trainingSchedule !== undefined) payload.training_schedule = updates.trainingSchedule;

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapCategoryFromDb(data);
  },

  async deleteCategory(categoryId: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw new Error(formatSupabaseError(error));
    }
  },

  // ----------------------------------------------------------------------------
  // 5. JUGADORES / DEPORTISTAS
  // ----------------------------------------------------------------------------
  async getPlayers(clubId: string): Promise<Player[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .order('last_name', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapPlayerFromDb);
  },

  async createPlayer(clubId: string, player: Omit<Player, 'id' | 'clubId' | 'isRestricted'>): Promise<Player> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    // Nota: El ID es UUID generado en PostgreSQL con gen_random_uuid(). NO se envía 'id'.
    // Los triggers calculan automáticamente monthly_fee_due y validan cuotas.
    const { data, error } = await supabase
      .from('players')
      .insert({
        club_id: clubId,
        discipline_id: player.disciplineId,
        category_id: player.categoryId,
        dni: player.dni.trim(),
        first_name: player.firstName.trim(),
        last_name: player.lastName.trim(),
        birth_date: player.birthDate,
        phone: player.phone?.trim() || null,
        email: player.email?.trim() || null,
        // Guardar RUTA (club_id/uuid.ext), nunca URL firmada
        photo_url: player.photoUrl || null,
        jersey_number: player.jerseyNumber || null,
        position: player.position || null,
        color_block_name: player.colorBlockName || null,
        emergency_contact: player.emergencyContact || { name: '', relationship: '', phone: '' },
        medical_certificate_valid: player.medicalCertificateValid !== false,
        medical_expiry_date: player.medicalExpiryDate || null,
        status: player.status || 'activo',
        blood_type: player.bloodType || null,
        dominant_side: player.dominantSide || null,
        health_insurance: player.healthInsurance || null,
        medical_notes: player.medicalNotes || null,
        scholarship_percent: player.scholarshipPercent ?? 0,
        scholarship_type: player.scholarshipType || 'ninguna',
        scholarship_reason: player.scholarshipReason || null,
        balance: player.balance ?? 0,
        joined_date: player.joinedDate || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapPlayerFromDb(data);
  },

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const payload: any = {};
    if (updates.firstName !== undefined) payload.first_name = updates.firstName.trim();
    if (updates.lastName !== undefined) payload.last_name = updates.lastName.trim();
    if (updates.dni !== undefined) payload.dni = updates.dni.trim();
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
    if (updates.joinedDate) payload.joined_date = updates.joinedDate;
    if (updates.disciplineId !== undefined) payload.discipline_id = updates.disciplineId;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    // Guardar RUTA en photo_url, no URL firmada
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl;
    if (updates.jerseyNumber !== undefined) payload.jersey_number = updates.jerseyNumber;
    if (updates.position !== undefined) payload.position = updates.position;
    if (updates.colorBlockName !== undefined) payload.color_block_name = updates.colorBlockName;
    if (updates.emergencyContact !== undefined) payload.emergency_contact = updates.emergencyContact;
    if (updates.medicalCertificateValid !== undefined) payload.medical_certificate_valid = updates.medicalCertificateValid;
    if (updates.medicalExpiryDate !== undefined) payload.medical_expiry_date = updates.medicalExpiryDate;
    if (updates.status !== undefined) payload.status = updates.status;
    // Cadena vacía = limpiar el campo (al rehabilitar)
    if (updates.bloodType !== undefined) payload.blood_type = updates.bloodType || null;
    if (updates.dominantSide !== undefined) payload.dominant_side = updates.dominantSide || null;
    if (updates.healthInsurance !== undefined) payload.health_insurance = updates.healthInsurance || null;
    if (updates.medicalNotes !== undefined) payload.medical_notes = updates.medicalNotes || null;
    if (updates.suspensionReason !== undefined) payload.suspension_reason = updates.suspensionReason || null;
    if (updates.suspensionNote !== undefined) payload.suspension_note = updates.suspensionNote || null;
    if (updates.suspendedAt !== undefined) payload.suspended_at = updates.suspendedAt || null;
    if (updates.scholarshipPercent !== undefined) payload.scholarship_percent = updates.scholarshipPercent;
    if (updates.scholarshipType !== undefined) payload.scholarship_type = updates.scholarshipType;
    if (updates.scholarshipReason !== undefined) payload.scholarship_reason = updates.scholarshipReason;
    if (updates.balance !== undefined) payload.balance = updates.balance;

    const { data, error } = await supabase
      .from('players')
      .update(payload)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return mapPlayerFromDb(data);
  },

  async deletePlayer(playerId: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      throw new Error(formatSupabaseError(error));
    }
  },

  // ----------------------------------------------------------------------------
  // 6. CAJAS (CASH BOXES) - FASE 2
  // Solo DUEÑO y ADMINISTRACIÓN las administran. responsible_user_id es el id real (UUID) del usuario logueado.
  // NUNCA enviar ni editar current_balance: la base lo actualiza sola.
  // ----------------------------------------------------------------------------
  async getCashBoxes(clubId: string): Promise<CashBox[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    const { data, error } = await supabase
      .from('cash_boxes')
      .select('*')
      .eq('club_id', clubId)
      .order('name');

    if (error) {
      console.error('Error cargando cash_boxes:', error);
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapCashBoxFromDb);
  },

  async createCashBox(params: {
    clubId: string;
    name: string;
    type: 'general' | 'disciplina' | 'subpunto';
    parentBoxId?: string | null;
    disciplineId?: string | null;
    responsibleUserId: string;
  }): Promise<CashBox> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    // NUNCA enviar current_balance: la base lo inicializa en 0
    const payload = {
      club_id: params.clubId,
      name: params.name.trim(),
      type: params.type,
      parent_box_id: params.parentBoxId || null,
      discipline_id: params.disciplineId || null,
      responsible_user_id: params.responsibleUserId,
      status: 'abierta'
    };

    const { data, error } = await supabase
      .from('cash_boxes')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error al crear cash_box:', error);
      throw new Error(formatSupabaseError(error));
    }

    return mapCashBoxFromDb(data);
  },

  async updateCashBoxStatus(boxId: string, status: 'abierta' | 'cerrada'): Promise<CashBox> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    // NUNCA enviar ni editar current_balance: la base lo actualiza sola
    const { data, error } = await supabase
      .from('cash_boxes')
      .update({ status })
      .eq('id', boxId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado de cash_box:', error);
      throw new Error(formatSupabaseError(error));
    }

    return mapCashBoxFromDb(data);
  },

  // ----------------------------------------------------------------------------
  // 7. MOVIMIENTOS DE CAJA (CASH MOVEMENTS) - FASE 2
  // Egresos e ingresos con amount mayor a 0.
  // NUNCA update ni delete sobre cash_movements ni receipts.
  // ----------------------------------------------------------------------------
  async getCashMovements(clubId: string, cashBoxId?: string): Promise<CashMovement[]> {
    if (!isSupabaseConfigured() || !clubId) return [];

    let query = supabase
      .from('cash_movements')
      .select('*')
      .eq('club_id', clubId);

    if (cashBoxId) {
      query = query.eq('cash_box_id', cashBoxId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      console.error('Error al obtener cash_movements:', error);
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).map(mapCashMovementFromDb);
  },

  async createCashMovement(params: {
    clubId: string;
    cashBoxId: string;
    type: 'ingreso' | 'egreso';
    amount: number;
    concept: string;
    category: 'cuota' | 'inscripcion' | 'tienda' | 'proveedor' | 'sueldo' | 'mantenimiento' | 'anulacion_recibo' | 'otro';
    paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
    registeredByUserId: string;
    receiptId?: string | null;
    notes?: string | null;
  }): Promise<CashMovement> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    if (params.amount <= 0) {
      throw new Error('El importe del movimiento de caja debe ser mayor a 0.');
    }

    const validCategories = [
      'cuota', 'inscripcion', 'tienda', 'proveedor',
      'sueldo', 'mantenimiento', 'anulacion_recibo', 'otro'
    ];
    if (!validCategories.includes(params.category)) {
      throw new Error(`Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`);
    }

    const payload = {
      club_id: params.clubId,
      cash_box_id: params.cashBoxId,
      type: params.type,
      amount: Number(params.amount),
      concept: params.concept.trim(),
      category: params.category,
      receipt_id: params.receiptId || null,
      payment_method: params.paymentMethod,
      registered_by_user_id: params.registeredByUserId,
      notes: params.notes?.trim() || null
    };

    const { data, error } = await supabase
      .from('cash_movements')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error al insertar cash_movement:', error);
      throw new Error(formatSupabaseError(error));
    }

    return mapCashMovementFromDb(data);
  }
};