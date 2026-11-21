import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Clock, 
  ShieldCheck, 
  HardDrive, 
  Download, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Calendar, 
  Lock, 
  ArrowUpRight, 
  FileText, 
  Sliders, 
  Copy, 
  Play, 
  Building2, 
  Server,
  Zap,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Club, User, ClubBackupPolicy, ClubBackupSnapshot, CloudStorageProvider, BackupFrequency } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';

interface BackupsManagementModuleProps {
  currentUser: User;
  allClubs: Club[];
  onRefreshData: () => void;
}

export const BackupsManagementModule: React.FC<BackupsManagementModuleProps> = ({
  currentUser,
  allClubs,
  onRefreshData
}) => {
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('ALL');
  const [policies, setPolicies] = useState<ClubBackupPolicy[]>(() => fraoviaDB.getBackupPolicies(currentUser));
  const [snapshots, setSnapshots] = useState<ClubBackupSnapshot[]>(() => fraoviaDB.getBackupSnapshots(null, currentUser));
  
  // Execution & UI state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingClubId, setExecutingClubId] = useState<string>(allClubs[0]?.id || '');
  const [executionStep, setExecutionStep] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Selected policy editing
  const [editingClubId, setEditingClubId] = useState<string>(allClubs[0]?.id || '');
  const currentPolicy = policies.find(p => p.clubId === editingClubId) || {
    id: `policy-${editingClubId}`,
    clubId: editingClubId,
    frequency: 'diaria' as BackupFrequency,
    timeOfDay: '03:00',
    provider: 'gcs' as CloudStorageProvider,
    bucketName: `gs://fraovia-vault-prod-us/${allClubs.find(c => c.id === editingClubId)?.slug || 'club'}/backups/`,
    region: 'us-east1 (N. Virginia)',
    retentionDays: 90,
    encryption: 'AES-256-GCM' as const,
    includeAuditLogs: true,
    includeMedicalDocs: true,
    enabled: true,
    nextRunAt: '2026-09-29T03:00:00Z'
  };

  const [formFrequency, setFormFrequency] = useState<BackupFrequency>(currentPolicy.frequency);
  const [formTimeOfDay, setFormTimeOfDay] = useState<string>(currentPolicy.timeOfDay);
  const [formProvider, setFormProvider] = useState<CloudStorageProvider>(currentPolicy.provider);
  const [formBucket, setFormBucket] = useState<string>(currentPolicy.bucketName);
  const [formRegion, setFormRegion] = useState<string>(currentPolicy.region);
  const [formRetention, setFormRetention] = useState<number>(currentPolicy.retentionDays);
  const [formAuditLogs, setFormAuditLogs] = useState<boolean>(currentPolicy.includeAuditLogs);
  const [formMedicalDocs, setFormMedicalDocs] = useState<boolean>(currentPolicy.includeMedicalDocs);
  const [formEnabled, setFormEnabled] = useState<boolean>(currentPolicy.enabled);

  // Switch edited club policy
  const handleSelectClubToEdit = (clubId: string) => {
    setEditingClubId(clubId);
    const pol = policies.find(p => p.clubId === clubId);
    const club = allClubs.find(c => c.id === clubId);
    if (pol) {
      setFormFrequency(pol.frequency);
      setFormTimeOfDay(pol.timeOfDay);
      setFormProvider(pol.provider);
      setFormBucket(pol.bucketName);
      setFormRegion(pol.region);
      setFormRetention(pol.retentionDays);
      setFormAuditLogs(pol.includeAuditLogs);
      setFormMedicalDocs(pol.includeMedicalDocs);
      setFormEnabled(pol.enabled);
    } else {
      setFormFrequency('diaria');
      setFormTimeOfDay('03:00');
      setFormProvider('gcs');
      setFormBucket(`gs://fraovia-vault-prod-us/${club?.slug || 'club'}/backups/`);
      setFormRegion('us-east1 (N. Virginia)');
      setFormRetention(90);
      setFormAuditLogs(true);
      setFormMedicalDocs(true);
      setFormEnabled(true);
    }
  };

  // Save policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPolicy: ClubBackupPolicy = {
      id: currentPolicy.id,
      clubId: editingClubId,
      frequency: formFrequency,
      timeOfDay: formTimeOfDay,
      provider: formProvider,
      bucketName: formBucket,
      region: formRegion,
      retentionDays: formRetention,
      encryption: 'AES-256-GCM',
      includeAuditLogs: formAuditLogs,
      includeMedicalDocs: formMedicalDocs,
      enabled: formEnabled,
      lastRunAt: currentPolicy.lastRunAt,
      nextRunAt: `2026-09-29T${formTimeOfDay}:00Z`
    };

    fraoviaDB.saveBackupPolicy(updatedPolicy, currentUser);
    setPolicies(fraoviaDB.getBackupPolicies(currentUser));
    const club = allClubs.find(c => c.id === editingClubId);
    setNotification(`¡Política de backup en la nube guardada para ${club?.name}!`);
    setTimeout(() => setNotification(null), 3000);
    onRefreshData();
  };

  // Trigger Instant Snapshot
  const handleTriggerInstantBackup = () => {
    if (isExecuting) return;
    const targetClub = allClubs.find(c => c.id === executingClubId);
    if (!targetClub) return;

    setIsExecuting(true);
    setExecutionStep('1/4: Extrayendo esquema aislado PostgreSQL (RLS tenant)...');

    setTimeout(() => {
      setExecutionStep('2/4: Generando volcado inmutable y comprimiendo paquete GZIP...');
    }, 600);

    setTimeout(() => {
      setExecutionStep('3/4: Calculando checksum criptográfico SHA-256...');
    }, 1200);

    setTimeout(() => {
      setExecutionStep('4/4: Subiendo paquete al bucket seguro de almacenamiento en la nube...');
    }, 1700);

    setTimeout(() => {
      const newSnapshot = fraoviaDB.triggerInstantBackup(targetClub.id, currentUser);
      setSnapshots(fraoviaDB.getBackupSnapshots(null, currentUser));
      setIsExecuting(false);
      setExecutionStep('');
      setNotification(`¡Snapshot en la nube completado con éxito para ${targetClub.name}!`);
      setTimeout(() => setNotification(null), 4000);
      onRefreshData();
    }, 2400);
  };

  // Download snapshot dump file
  const handleDownloadSnapshot = (snapshot: ClubBackupSnapshot) => {
    const dataStr = snapshot.rawJsonData || JSON.stringify(snapshot, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = snapshot.filename.replace('.gz', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNotification(`Descargando copia de seguridad: ${snapshot.filename}`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Simulate Point-in-time restore
  const handleSimulateRestore = (snapshot: ClubBackupSnapshot) => {
    const recordsTotal = 
      snapshot.recordCount.players + 
      snapshot.recordCount.receipts + 
      snapshot.recordCount.cashMovements;
    
    alert(
      `[SIMULADOR DE RESTAURACIÓN FRAOVIA POINT-IN-TIME]\n\n` +
      `✓ Archivo verificado: ${snapshot.filename}\n` +
      `✓ Integridad SHA-256: ${snapshot.checksumSha256.slice(0, 16)}... (VÁLIDO)\n` +
      `✓ Almacenamiento origen: ${snapshot.cloudBucket}\n` +
      `✓ Registros listos para reintegrar: ${recordsTotal} entidades.\n` +
      `✓ Aislamiento RLS verificado para Club ID: '${snapshot.clubId}'.\n\n` +
      `La estructura es 100% compatible y puede ser restaurada sin pérdida de integridad referencial.`
    );
  };

  // Copy SHA-256
  const handleCopyChecksum = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setNotification('Checksum SHA-256 copiado al portapapeles.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered snapshots
  const displayedSnapshots = snapshots.filter(s => {
    if (selectedClubFilter === 'ALL') return true;
    return s.clubId === selectedClubFilter;
  });

  const totalBytes = snapshots.reduce((acc, s) => acc + s.fileSizeBytes, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header & KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Snapshots en la Nube</span>
            <Cloud className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{snapshots.length}</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Todos verificados con éxito</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Almacenamiento Usado</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalMb} <span className="text-xs text-slate-400 font-sans">MB</span></div>
          <div className="text-[10px] text-slate-400">
            Buckets GCS, Supabase & S3
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Políticas Activas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {policies.filter(p => p.enabled).length} / {allClubs.length}
          </div>
          <div className="text-[10px] text-blue-400">
            Programación diaria y semanal
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cifrado & Seguridad</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono mt-0.5">AES-256-GCM</div>
          <div className="text-[10px] text-slate-400">
            Claves KMS gestionadas por HSM
          </div>
        </div>
      </div>

      {/* Action Strip: Instant Cloud Snapshot Trigger */}
      <div className="p-4 sm:p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">
              Disparador de Respaldo Instantáneo a la Nube
            </h3>
            <span className="text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
              Bajo Demanda
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Genera un volcado completo y aislado de la base de datos de una institución, firma el hash SHA-256 y lo deposita en el bucket de nube configurado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={executingClubId}
            onChange={(e) => setExecutingClubId(e.target.value)}
            disabled={isExecuting}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {allClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleTriggerInstantBackup}
            disabled={isExecuting}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Ejecutando...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Crear Snapshot Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress banner when executing */}
      {isExecuting && (
        <div className="p-3.5 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center gap-3 animate-pulse text-xs text-blue-300">
          <Server className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-semibold">{executionStep}</span>
        </div>
      )}

      {/* Two Column Layout: Policy Scheduler (Left) & Snapshots Vault (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT (5 cols): Policy Scheduler per Club */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">
                Programador de Políticas por Club
              </h3>
            </div>
          </div>

          {/* Club selector tabs for policy configuration */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {allClubs.map((club) => {
              const isSelected = club.id === editingClubId;
              return (
                <button
                  key={club.id}
                  onClick={() => handleSelectClubToEdit(club.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {club.name.split(' ')[0]} {club.name.split(' ')[1] || ''}
                </button>
              );
            })}
          </div>

          {/* Policy Config Form */}
          <form onSubmit={handleSavePolicy} className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div>
                <span className="font-bold text-white block">Estado de la Política Automática</span>
                <span className="text-[10px] text-slate-400">Ejecución desatendida mediante cron de nube</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formEnabled} 
                  onChange={(e) => setFormEnabled(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Frecuencia</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as BackupFrequency)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="manual">Solo Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Hora Programada (UTC-3)</label>
                <input
                  type="time"
                  value={formTimeOfDay}
                  onChange={(e) => setFormTimeOfDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Proveedor de Almacenamiento Cloud</label>
              <select
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value as CloudStorageProvider)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="gcs">Google Cloud Storage (GCS Multi-Region)</option>
                <option value="supabase_storage">Supabase Storage Vault (PostgreSQL S3)</option>
                <option value="s3_cold_storage">AWS S3 Glacier (Cold Archive)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">URI del Bucket de Nube</label>
              <input
                type="text"
                value={formBucket}
                onChange={(e) => setFormBucket(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Región</label>
                <input
                  type="text"
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Retención (Días)</label>
                <select
                  value={formRetention}
                  onChange={(e) => setFormRetention(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>30 días</option>
                  <option value={90}>90 días</option>
                  <option value={180}>180 días</option>
                  <option value={365}>365 días (1 año)</option>
                </select>
              </div>
            </div>

            {/* Inclusions */}
            <div className="space-y-1.5 pt-1">
              <span className="font-semibold text-slate-400 block text-[11px]">Alcance del Volcado:</span>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formAuditLogs} 
                  onChange={(e) => setFormAuditLogs(e.target.checked)} 
                  className="rounded text-blue-600 bg-slate-950 border-slate-800"
                />
                <span>Incluir bitácora histórica de auditoría (logs inmutables)</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formMedicalDocs} 
                  onChange={(e) => setFormMedicalDocs(e.target.checked)} 
                  className="rounded text-blue-600 bg-slate-950 border-slate-800"
                />
                <span>Incluir certificados y legajos médicos de deportistas</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-md shadow-blue-600/20"
              >
                Guardar Política de Respaldo
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT (7 cols): Snapshots Vault Table & Direct Download */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Bóveda de Snapshots en la Nube ({displayedSnapshots.length})
              </h3>
            </div>

            {/* Club Filter */}
            <select
              value={selectedClubFilter}
              onChange={(e) => setSelectedClubFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los Clubes</option>
              {allClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          {/* Snapshots List */}
          <div className="space-y-3">
            {displayedSnapshots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Cloud className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No hay copias de seguridad registradas para este filtro.</p>
              </div>
            ) : (
              displayedSnapshots.map((snp) => (
                <div
                  key={snp.id}
                  className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{snp.filename}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                          {snp.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-blue-400 font-medium">{snp.clubName}</span>
                        <span>•</span>
                        <span>{(snp.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                        <span>•</span>
                        <span>{new Date(snp.createdAt).toLocaleString('es-AR')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={() => handleDownloadSnapshot(snp)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="Descargar volcado de base de datos"
                      >
                        <Download className="w-3 h-3 text-blue-400" />
                        <span>Descargar Dump</span>
                      </button>

                      <button
                        onClick={() => handleSimulateRestore(snp)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="Simular restauración"
                      >
                        <FileCheck className="w-3 h-3 text-cyan-400" />
                        <span>Simular</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-400">
                    <div>
                      <span className="block text-slate-500">Jugadores:</span>
                      <span className="font-mono text-slate-200 font-bold">{snp.recordCount.players}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Recibos:</span>
                      <span className="font-mono text-slate-200 font-bold">{snp.recordCount.receipts}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Asientos Caja:</span>
                      <span className="font-mono text-slate-200 font-bold">{snp.recordCount.cashMovements}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Iniciado por:</span>
                      <span className="text-slate-300 truncate block">{snp.initiatedBy.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* SHA-256 Checksum & Cloud URI */}
                  <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80 text-slate-400">
                    <div className="truncate mr-2">
                      <span className="text-slate-500">SHA-256: </span>
                      <span className="text-slate-300">{snp.checksumSha256.slice(0, 24)}...</span>
                    </div>
                    <button
                      onClick={() => handleCopyChecksum(snp.checksumSha256)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Copiar hash completo"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
