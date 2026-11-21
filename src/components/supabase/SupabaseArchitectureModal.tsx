import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Key, 
  Check, 
  Copy, 
  FileCode, 
  Lock, 
  AlertTriangle,
  Play,
  Layers,
  Table,
  CheckCircle2
} from 'lucide-react';
import { POSTGRESQL_RLS_MATRIX, TableRLSSpec } from '../../services/supabaseSchema';
import { Club, User } from '../../types/fraovia';

interface SupabaseArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  allClubs: Club[];
  allUsers: User[];
}

export const SupabaseArchitectureModal: React.FC<SupabaseArchitectureModalProps> = ({
  isOpen,
  onClose,
  allClubs,
  allUsers
}) => {
  const [activeTab, setActiveTab] = useState<'matriz' | 'sql' | 'simulador_rls'>('matriz');
  const [selectedTable, setSelectedTable] = useState<TableRLSSpec>(POSTGRESQL_RLS_MATRIX[4]); // players
  const [copied, setCopied] = useState(false);

  // RLS test simulator state
  const [testUser, setTestUser] = useState<User>(allUsers[4]); // Profesor San Martin
  const [testTargetClubId, setTestTargetClubId] = useState<string>(allClubs[1]?.id || ''); // Belgrano
  const [testResult, setTestResult] = useState<{
    allowed: boolean;
    reason: string;
    details: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    // Generate clean SQL schema string
    const sqlText = `-- FRAOVIA Multi-Club Architecture & PostgreSQL RLS
-- Generado para Supabase / PostgreSQL 15+
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_auth_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Club users only access their club's players"
  ON public.players FOR ALL
  TO authenticated
  USING (club_id = public.get_auth_club_id())
  WITH CHECK (club_id = public.get_auth_club_id());
`;
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunRlsTest = () => {
    const isSuperadmin = testUser.role === 'SUPERADMIN';
    const sameClub = testUser.clubId === testTargetClubId;

    if (isSuperadmin) {
      setTestResult({
        allowed: true,
        reason: 'ACCESO CONCEDIDO (ROL SUPERADMIN)',
        details: `El usuario ${testUser.fullName} posee el rol SUPERADMIN. La política RLS "is_superadmin()" permite supervisión global multi-tenant.`
      });
    } else if (sameClub) {
      setTestResult({
        allowed: true,
        reason: 'ACCESO CONCEDIDO (MISMO CLUB_ID)',
        details: `El usuario pertenece al club destino (club_id coincide). La política RLS permite lectura/escritura autorizada.`
      });
    } else {
      const userClub = allClubs.find(c => c.id === testUser.clubId);
      const targetClub = allClubs.find(c => c.id === testTargetClubId);
      setTestResult({
        allowed: false,
        reason: 'ACCESO DENEGADO POR POLÍTICA RLS (AISLAMIENTO MULTI-CLUB)',
        details: `VIOLACIÓN DE RLS: Usuario de "${userClub?.name}" intentó consultar datos de "${targetClub?.name}". PostgreSQL filtra y devuelve 0 filas automáticamente sin exponer registros ajenos.`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Arquitectura Multi-Club & Seguridad RLS (PostgreSQL / Supabase)
                </h2>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  PostgreSQL 15+
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aislamiento estricto por columna <code>club_id</code> garantizado a nivel motor de base de datos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/40 px-4 py-2 text-xs">
          <button
            onClick={() => setActiveTab('matriz')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'matriz' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matriz de Tablas & Políticas RLS ({POSTGRESQL_RLS_MATRIX.length})
          </button>
          <button
            onClick={() => setActiveTab('simulador_rls')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'simulador_rls' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulador de Aislamiento RLS en Vivo
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'sql' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Script DDL de Migración SQL
          </button>
        </div>

        {/* Tab 1: Matriz de Tablas & RLS */}
        {activeTab === 'matriz' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Table list */}
            <div className="space-y-1.5 md:border-r md:border-slate-800 md:pr-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
                Tablas con Columna club_id:
              </span>
              {POSTGRESQL_RLS_MATRIX.map((table) => (
                <button
                  key={table.tableName}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                    selectedTable.tableName === table.tableName
                      ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{table.tableName}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> RLS
                  </span>
                </button>
              ))}
            </div>

            {/* Table Detail */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-base font-bold text-emerald-400">
                      public.{selectedTable.tableName}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                      club_id: UUID NOT NULL
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{selectedTable.policies.length} Políticas RLS</span>
                </div>
                <p className="text-xs text-slate-300">{selectedTable.description}</p>
              </div>

              {/* Policies breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                  Políticas Row Level Security Activas:
                </span>
                {selectedTable.policies.map((pol, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-850 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        {pol.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        COMANDO: {pol.command}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="p-2 bg-slate-900 rounded-lg text-emerald-300">
                        <span className="text-slate-400">USING: </span>
                        {pol.usingExpression}
                      </div>
                      {pol.checkExpression && (
                        <div className="p-2 bg-slate-900 rounded-lg text-blue-300">
                          <span className="text-slate-400">WITH CHECK: </span>
                          {pol.checkExpression}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Simulador RLS en vivo */}
        {activeTab === 'simulador_rls' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-slate-300 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Verificador de Aislamiento RLS en Tiempo Real
              </div>
              <p>
                Prueba interactiva: Selecciona un usuario emisor y un club objetivo. El motor evaluará si las políticas RLS permitirían la lectura o si la base de datos bloquearía la consulta.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Usuario Autenticado (auth.uid())</label>
                <select
                  value={testUser.id}
                  onChange={(e) => setTestUser(allUsers.find(u => u.id === e.target.value) || allUsers[0])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {allUsers.map(u => {
                    const c = allClubs.find(club => club.id === u.clubId);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role}) — {c ? c.name : 'Plataforma Global'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Club de los Registros Solicitados (club_id)</label>
                <select
                  value={testTargetClubId}
                  onChange={(e) => setTestTargetClubId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {allClubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (ID: {c.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunRlsTest}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              Ejecutar Consulta con Row Level Security
            </button>

            {testResult && (
              <div className={`p-4 rounded-xl border space-y-2 ${
                testResult.allowed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="font-bold flex items-center gap-2">
                  {testResult.allowed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                  {testResult.reason}
                </div>
                <p className="text-slate-300">{testResult.details}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: DDL SQL */}
        {activeTab === 'sql' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Script SQL con DDL y RLS completo listo para ejecutar en Supabase SQL Editor:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar SQL'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
{`-- ==============================================================================
-- FRAOVIA | Multi-Club Architecture & Row Level Security (RLS) PostgreSQL Schema
-- ==============================================================================

-- 1. Helper security definer functions
CREATE OR REPLACE FUNCTION public.get_auth_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPERADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Strict multi-club policy on players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage all players"
  ON public.players FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Club members can view their club players"
  ON public.players FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());

CREATE POLICY "Club staff can insert players into their club"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (club_id = public.get_auth_club_id());

-- 3. Immutable receipts policy
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club users view only their club receipts"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (club_id = public.get_auth_club_id());`}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Trazabilidad auditada en <code>audit_logs</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
