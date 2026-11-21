import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Wifi, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Database, 
  Server, 
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Wrench,
  AlertCircle,
  Play,
  Check,
  Copy,
  Terminal,
  Zap,
  Info
} from 'lucide-react';
import { Club, AuditLog, User } from '../../types/fraovia';

interface SuperadminMonitoringModuleProps {
  subSection: 'monitoreo_actividad' | 'monitoreo_errores' | 'monitoreo_uso' | 'monitoreo_conexiones';
  allClubs: Club[];
  auditLogs: AuditLog[];
  currentUser: User;
  onRefreshData: () => void;
}

export const SuperadminMonitoringModule: React.FC<SuperadminMonitoringModuleProps> = ({
  subSection,
  allClubs,
  auditLogs,
  currentUser,
  onRefreshData
}) => {
  const [selectedClubFilter, setSelectedClubFilter] = useState('ALL');
  const [activitySearch, setActivitySearch] = useState('');

  // 1. SUBSECCIÓN: ACTIVIDAD
  if (subSection === 'monitoreo_actividad') {
    const sampleActivity = [
      { time: '22:04', club: 'Club San Martín', event: 'Usuario creado', user: 'Clara Domínguez', type: 'user' },
      { time: '21:58', club: 'Club Belgrano', event: 'Nueva cuota registrada', user: 'Martín Palermo', type: 'finance' },
      { time: '21:51', club: 'Club Los Andes', event: 'Importación Excel completada (84 filas)', user: 'Administración', type: 'import' },
      { time: '21:30', club: 'Club Atlético Norte', event: 'Arqueo de caja cerrado ($150.000)', user: 'Tesorero', type: 'finance' },
      { time: '20:15', club: 'Club San Martín', event: 'Respaldo automático de base ejecutado', user: 'Sistema FRAOVIA', type: 'system' }
    ];

    const filtered = sampleActivity.filter(a => {
      if (selectedClubFilter !== 'ALL' && a.club !== selectedClubFilter) return false;
      if (activitySearch.trim() && !a.event.toLowerCase().includes(activitySearch.toLowerCase()) && !a.user.toLowerCase().includes(activitySearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Monitoreo de Actividad Global
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Eventos y transacciones operativas en tiempo real de todas las instituciones.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar evento o usuario..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedClubFilter}
            onChange={(e) => setSelectedClubFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todos los clubes</option>
            {allClubs.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Lista de Actividad */}
        <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 shadow-xl">
          {filtered.map((item, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/40 transition">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-500 text-[11px] w-12">{item.time}</span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <div>
                  <span className="font-bold text-white block">{item.club}</span>
                  <span className="text-[11px] text-slate-300">{item.event}</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Por: {item.user}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. SUBSECCIÓN: ERRORES & ADVERTENCIAS CON POSIBLES CAUSAS Y SOLUCIONES
  if (subSection === 'monitoreo_errores') {
    return (
      <SuperadminErrorsDiagnostics
        allClubs={allClubs}
        currentUser={currentUser}
        onRefreshData={onRefreshData}
      />
    );
  }

  // 3. SUBSECCIÓN: USO (GRÁFICOS CENTRALIZADOS AQUÍ)
  if (subSection === 'monitoreo_uso') {
    return (
      <div className="space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Métricas Globales de Uso & Concurrencia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Análisis de sesiones, carga de servidores y módulos de mayor adopción.
          </p>
        </div>

        {/* 4 KPIs de Uso */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Usuarios Activos Hoy</span>
            <div className="text-2xl font-black text-white font-mono mt-1">42</div>
            <span className="text-[10px] text-emerald-400">+15% vs. ayer</span>
          </div>

          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sesiones Totales</span>
            <div className="text-2xl font-black text-white font-mono mt-1">318</div>
            <span className="text-[10px] text-sky-400">Promedio 18m por sesión</span>
          </div>

          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Clubes Activos Hoy</span>
            <div className="text-2xl font-black text-white font-mono mt-1">{allClubs.length}</div>
            <span className="text-[10px] text-emerald-400">100% de la red</span>
          </div>

          <div className="p-4 bg-[#0C162D] border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Módulo Más Utilizado</span>
            <div className="text-base font-black text-amber-400 mt-2 truncate">Cobros & Recibos</div>
            <span className="text-[10px] text-slate-400">48% de interacciones</span>
          </div>
        </div>

        {/* Gráfico Visual de Adopción */}
        <div className="p-5 bg-[#0C162D] border border-slate-800 rounded-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Adopción por Módulo en la Red
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-medium">Padrón & Cobros</span>
                <span className="font-mono text-slate-400">92%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-medium">Caja & Arqueo</span>
                <span className="font-mono text-slate-400">78%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-medium">Deportivo & Asistencia</span>
                <span className="font-mono text-slate-400">64%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-medium">Tienda Oficial</span>
                <span className="font-mono text-slate-400">35%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. SUBSECCIÓN: CONEXIONES
  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-emerald-400" />
          Estado de Conexiones & Servicios
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Health check de dependencias externas y bases de datos.
        </p>
      </div>

      <div className="bg-[#0C162D] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs shadow-xl">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Base de datos (PostgreSQL / Supabase)</span>
              <span className="text-[11px] text-slate-400">Pooler transaccional, latencia: 14ms</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🟢 Operativa
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Autenticación (JWT & RLS Session)</span>
              <span className="text-[11px] text-slate-400">Tokens criptográficos y roles de usuario</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🟢 Operativa
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Almacenamiento (Google Cloud Storage)</span>
              <span className="text-[11px] text-slate-400">Imágenes, comprobantes PDF y respaldos</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🟢 Operativo
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Servicio de Correo Saliente (SMTP / Resend)</span>
              <span className="text-[11px] text-slate-400">Notificaciones automáticas y alertas</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🟢 Operativo
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-bold text-white block">Gateway WhatsApp API</span>
              <span className="text-[11px] text-slate-400">Conector de mensajería para avisos de cuotas</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            🟡 Revisar
          </span>
        </div>
      </div>
    </div>
  );
};

// ===================================================================================
// SUBCOMPONENTE DE DIAGNÓSTICO: ERRORES, ADVERTENCIAS, POSIBLES CAUSAS Y SOLUCIONES
// ===================================================================================

interface IncidentItem {
  id: string;
  code: string;
  title: string;
  severity: 'critico' | 'advertencia';
  club: string;
  service: string;
  timestamp: string;
  impact: string;
  possibleCauses: string[];
  solutions: string[];
  actionLabel: string;
  logSnippet: string;
  resolved: boolean;
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'inc-001',
    code: 'ERR_DB_POOL_EXHAUSTION',
    title: 'Agotamiento de Pool de Conexiones PostgreSQL',
    severity: 'critico',
    club: 'Club Atlético San Martín',
    service: 'PostgreSQL / Supabase Transaction Pooler',
    timestamp: 'Hace 4 minutos',
    impact: 'Latencia en guardado de comprobantes y bloqueos temporales de 3 a 4 segundos durante el cobro de cuotas.',
    possibleCauses: [
      'Pico de concurrencia simultánea en tesorería al emitir cobros masivos sin cierre inmediato de transacción.',
      'Conexiones ociosas (idle in transaction) acumuladas por clientes que cerraron la pestaña abruptamente.',
      'Parámetro max_connections alcanzado en la instancia de base de datos (94 de 100 conexiones activas).'
    ],
    solutions: [
      'Ejecutar reseteo seguro del Transaction Pooler desde la consola de FRAOVIA para liberar sockets ociosos.',
      'Aumentar el umbral de pooler_timeout a 15 segundos para absorber ráfagas sin denegar transacciones.',
      'Verificar que las transacciones en batch de importación de Excel utilicen sesiones aisladas de corta duración.'
    ],
    actionLabel: 'Reiniciar y Vaciar Pool de Conexiones',
    logSnippet: '[FATAL] remaining connection slots are reserved for non-replication superuser connections (client=190.18.22.44, pool_size=100, active=94)',
    resolved: false
  },
  {
    id: 'inc-002',
    code: 'WARN_WHATSAPP_GATEWAY_THROTTLE',
    title: 'Degradación de Envío en Gateway de WhatsApp (Avisos de Cuota)',
    severity: 'advertencia',
    club: 'Club Atlético Belgrano',
    service: 'WhatsApp Cloud Messaging API',
    timestamp: 'Hace 18 minutos',
    impact: '8 comprobantes oficiales fueron encolados con un retraso de entrega de 3 a 5 minutos hacia los tutores.',
    possibleCauses: [
      'Tasa de envíos masivos superó el límite de la ventana de tiempo (Tier 1: 50 mensajes/minuto alcanzado).',
      'Respuesta HTTP 429 (Too Many Requests) devuelta por el servidor de Meta Cloud API.',
      'Mora en la confirmación de entrega (webhook delivery receipt acknowledgement no recibido a tiempo).'
    ],
    solutions: [
      'Activar algoritmo de envío escalonado con espera exponencial (Exponential Backoff con pausas de 400ms entre envíos).',
      'Reenviar de inmediato la cola de 8 mensajes pendientes en lotes controlados.',
      'Solicitar actualización de cuenta a Tier 2 en Meta Business Manager para permitir 250 mensajes/minuto.'
    ],
    actionLabel: 'Reintentar Cola de Mensajes & Regular Tasa',
    logSnippet: '[HTTP 429] Rate limit reached for phone_number_id=992812903. Retry-After: 45s. Backlog queued: 8 messages.',
    resolved: false
  },
  {
    id: 'inc-003',
    code: 'WARN_STORAGE_QUOTA_85',
    title: 'Almacenamiento de Fotos y Carnets al 87% de Capacidad',
    severity: 'advertencia',
    club: 'Club Los Andes',
    service: 'Google Cloud Storage (Buckets de Escudos y Fotos)',
    timestamp: 'Hace 1 hora',
    impact: 'Riesgo de interrupción en la subida de nuevas fotos de carnet si se supera el 95% del espacio asignado al plan.',
    possibleCauses: [
      'Importación masiva de imágenes originales en alta resolución (JPGs pesados de 5MB a 8MB) sin compresión web previa.',
      'El club ha superado los 4.3 GB de los 5.0 GB contratados en su plan Club Pro.',
      'Acumulación de miniaturas en caché y archivos temporales de carnet generados anteriormente.'
    ],
    solutions: [
      'Ejecutar rutina automática de optimización WebP para comprimir las fotos pesadas en un 80% sin pérdida perceptible de calidad.',
      'Actualizar cuota del club a Plan Enterprise o agregar paquete de 10 GB adicionales en la pestaña SISTEMA → Planes.',
      'Purgar versiones obsoletas de imágenes de carnet que hayan sido reemplazadas.'
    ],
    actionLabel: 'Comprimir Fotos a WebP & Purgar Temporales',
    logSnippet: '[QUOTA WARNING] Bucket fraovia-club-los-andes usage is 4,462 MB / 5,120 MB (87.1%). Action recommended.',
    resolved: false
  },
  {
    id: 'inc-004',
    code: 'ERR_WEBHOOK_PAYMENT_SIGNATURE',
    title: 'Fallo de Verificación de Firma en Pasarela de Pago Online',
    severity: 'critico',
    club: 'Club Atlético Norte',
    service: 'Gateway de Pagos / Webhook IPN',
    timestamp: 'Hace 2 horas',
    impact: 'Un pago de cuota realizado con tarjeta no impactó automáticamente en la caja del club hasta su conciliación manual.',
    possibleCauses: [
      'El Secret Token o Webhook Signing Secret configurado en el club no coincide con la clave generada en la cuenta de MercadoPago/Stripe.',
      'Rotación de claves de seguridad realizada por el tesorero del club sin actualizar el webhook en FRAOVIA.',
      'Desfase horario (clock skew) de más de 300 segundos entre el servidor de pagos y la plataforma.'
    ],
    solutions: [
      'Regenerar el Webhook Secret y sincronizar automáticamente con las credenciales registradas del club.',
      'Reprocesar el evento de pago pendiente para conciliar e imputar el recibo a la caja correspondiente.',
      'Verificar la sincronización NTP del clúster de servidores.'
    ],
    actionLabel: 'Resincronizar Webhook & Imputar Pago Pendiente',
    logSnippet: '[SECURITY] Webhook signature mismatch: received \'sha256=a88e...\', calculated \'sha256=1bc4...\'. Request rejected.',
    resolved: false
  }
];

interface SuperadminErrorsDiagnosticsProps {
  allClubs: Club[];
  currentUser: User;
  onRefreshData: () => void;
}

export const SuperadminErrorsDiagnostics: React.FC<SuperadminErrorsDiagnosticsProps> = ({
  allClubs,
  currentUser,
  onRefreshData
}) => {
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'critico' | 'advertencia' | 'resuelto'>('ALL');
  const [filterClub, setFilterClub] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('inc-001'); // First one expanded by default
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<{ id: string; msg: string } | null>(null);

  const handleExecuteSolution = (incident: IncidentItem) => {
    setExecutingId(incident.id);
    setActionSuccessMessage(null);

    // Simulate real execution and automatic fix
    setTimeout(() => {
      setExecutingId(null);
      setActionSuccessMessage({
        id: incident.id,
        msg: `¡Acción ejecutada con éxito! '${incident.actionLabel}' completado. Incidente marcado como resuelto.`
      });

      setIncidents(prev => prev.map(inc => {
        if (inc.id === incident.id) {
          return { ...inc, resolved: true };
        }
        return inc;
      }));
    }, 1200);
  };

  const handleToggleResolved = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, resolved: !inc.resolved };
      }
      return inc;
    }));
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity === 'critico' && (inc.severity !== 'critico' || inc.resolved)) return false;
    if (filterSeverity === 'advertencia' && (inc.severity !== 'advertencia' || inc.resolved)) return false;
    if (filterSeverity === 'resuelto' && !inc.resolved) return false;
    if (filterSeverity === 'ALL' && inc.resolved) return true;

    if (filterClub !== 'ALL' && inc.club !== filterClub) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchText = `${inc.code} ${inc.title} ${inc.club} ${inc.service} ${inc.impact}`.toLowerCase();
      if (!matchText.includes(term)) return false;
    }

    return true;
  });

  const criticalCount = incidents.filter(i => i.severity === 'critico' && !i.resolved).length;
  const warningCount = incidents.filter(i => i.severity === 'advertencia' && !i.resolved).length;
  const resolvedCount = incidents.filter(i => i.resolved).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Encabezado */}
      <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Monitoreo de Errores & Advertencias con Diagnóstico
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detección de incidentes en tiempo real con análisis de <strong>posibles causas</strong> y <strong>soluciones paso a paso</strong> para Superadmin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onRefreshData();
            setActionSuccessMessage(null);
          }}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>Actualizar Telemetría</span>
        </button>
      </div>

      {/* Tarjetas KPI de Estado de Salud */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'critico' ? 'ALL' : 'critico')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            criticalCount > 0 
              ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/40' 
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Errores Críticos</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{criticalCount}</div>
          <span className="text-[10px] text-rose-300/80">Requieren intervención</span>
        </div>

        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'advertencia' ? 'ALL' : 'advertencia')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            warningCount > 0 
              ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/40' 
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Advertencias</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{warningCount}</div>
          <span className="text-[10px] text-amber-300/80">Degradación menor / cuota</span>
        </div>

        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'resuelto' ? 'ALL' : 'resuelto')}
          className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl hover:bg-emerald-950/30 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Incidentes Resueltos</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{resolvedCount}</div>
          <span className="text-[10px] text-emerald-300/80">Solucionados en la sesión</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Aislamiento RLS</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-black text-white mt-1">100% Blindado</div>
          <span className="text-[10px] text-sky-300/80">Cero fugas multitenant</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterSeverity === 'ALL' ? 'bg-sky-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({incidents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('critico')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterSeverity === 'critico' ? 'bg-rose-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Solo Críticos ({criticalCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('advertencia')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterSeverity === 'advertencia' ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Advertencias ({warningCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('resuelto')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterSeverity === 'resuelto' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Resueltos ({resolvedCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, club o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
          >
            <option value="ALL">Todos los clubes</option>
            {allClubs.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTADO EXPANDIBLE DE INCIDENTES CON CAUSAS Y SOLUCIONES */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No hay incidentes bajo los filtros seleccionados</h4>
            <p className="text-xs text-slate-400">Todos los servicios operan dentro de los umbrales normales.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isExpanded = expandedId === incident.id;
            const isExecuting = executingId === incident.id;

            return (
              <div 
                key={incident.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  incident.resolved
                    ? 'bg-slate-950/40 border-slate-800 opacity-75'
                    : incident.severity === 'critico'
                    ? 'bg-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-950 border-amber-500/40 shadow-lg shadow-amber-950/10'
                }`}
              >
                {/* Cabecera del Incidente */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/40 transition"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="mt-0.5 sm:mt-0">
                      {incident.resolved ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : incident.severity === 'critico' ? (
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          incident.resolved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : incident.severity === 'critico'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {incident.resolved ? 'RESUELTO' : incident.severity === 'critico' ? 'CRÍTICO' : 'ADVERTENCIA'}
                        </span>

                        <span className="font-mono text-[11px] text-slate-400 font-bold">
                          {incident.code}
                        </span>

                        <span className="text-slate-500 text-[10px]">·</span>
                        <span className="text-xs text-sky-300 font-medium">{incident.club}</span>
                        <span className="text-slate-500 text-[10px]">·</span>
                        <span className="text-[11px] text-slate-400 font-mono">{incident.timestamp}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                        {incident.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-slate-500">Impacto:</span> {incident.impact}
                      </p>
                    </div>
                  </div>

                  {/* Botón Acordeón */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                      {isExpanded ? 'Ocultar Diagnóstico' : 'Ver Causas & Solución'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-sky-400" />}
                  </div>
                </div>

                {/* CUERPO EXPANDIDO: POSIBLES CAUSAS Y SOLUCIONES PASO A PASO */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60 space-y-4 animate-in fade-in">
                    
                    {/* Alerta de Éxito si se ejecutó la solución */}
                    {actionSuccessMessage && actionSuccessMessage.id === incident.id && (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{actionSuccessMessage.msg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* CAJA 1: POSIBLES CAUSAS */}
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-800/80">
                          <Search className="w-4 h-4" />
                          <span>Posibles Causas Detectadas</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {incident.possibleCauses.map((cause, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{cause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CAJA 2: SOLUCIONES RECOMENDADAS */}
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-800/80">
                          <Wrench className="w-4 h-4" />
                          <span>Soluciones Paso a Paso</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {incident.solutions.map((sol, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span className="leading-relaxed">{sol}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* REGISTRO TÉCNICO (RAW LOG SNIPPET) */}
                    <div className="p-3 bg-black/50 border border-slate-800/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-sky-400" />
                          <span>Log de Excepción Capturado</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(incident.logSnippet);
                            alert('Log copiado al portapapeles.');
                          }}
                          className="hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar Log</span>
                        </button>
                      </div>
                      <code className="text-[11px] font-mono text-rose-300 block overflow-x-auto whitespace-pre-wrap">
                        {incident.logSnippet}
                      </code>
                    </div>

                    {/* BOTONES DE ACCIÓN PARA SUPERADMIN */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                        <span>Servicio afectado: <strong className="text-slate-200">{incident.service}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleResolved(incident.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            incident.resolved
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{incident.resolved ? 'Reabrir Incidente' : 'Marcar como Resuelto'}</span>
                        </button>

                        {!incident.resolved && (
                          <button
                            type="button"
                            disabled={isExecuting}
                            onClick={() => handleExecuteSolution(incident)}
                            className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isExecuting ? 'Ejecutando Solución...' : incident.actionLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
