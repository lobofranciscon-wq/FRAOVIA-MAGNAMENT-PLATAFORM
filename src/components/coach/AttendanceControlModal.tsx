import React, { useMemo, useState } from 'react';
import { X, ClipboardCheck, Search, Download, ChevronRight } from 'lucide-react';
import { AttendanceRecord, Category, Player } from '../../types/fraovia';
import { useAppTheme } from '../../context/ThemeContext';

interface AttendanceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  categories: Category[];
  attendanceRecords: AttendanceRecord[];
}

type Status = 'presente' | 'ausente' | 'justificado' | 'lesionado';
type SortKey = 'pct_asc' | 'faltas_desc' | 'nombre';

const STATUS_LABEL: Record<Status, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  justificado: 'Justificado',
  lesionado: 'Lesionado'
};

const STATUS_COLOR: Record<Status, string> = {
  presente: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  ausente: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  justificado: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  lesionado: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
};

const pctColor = (pct: number | null) =>
  pct === null ? 'text-slate-500' : pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-300' : 'text-rose-400';
const barColor = (pct: number | null) =>
  pct === null ? 'bg-slate-600' : pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-500';

export const AttendanceControlModal: React.FC<AttendanceControlModalProps> = ({
  isOpen,
  onClose,
  players,
  categories,
  attendanceRecords
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const [categoryId, setCategoryId] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('pct_asc');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const allowedCatIds = useMemo(() => new Set(categories.map(c => c.id)), [categories]);
  const catName = (id: string) => categories.find(c => c.id === id)?.name || '—';

  // Clases del período filtrado (solo de las categorías visibles para este usuario)
  const sessions = useMemo(
    () =>
      attendanceRecords.filter(r => {
        if (r.isSuspended) return false; // clase suspendida: no cuenta como dictada
        if (!allowedCatIds.has(r.categoryId)) return false;
        if (categoryId !== 'all' && r.categoryId !== categoryId) return false;
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
      }),
    [attendanceRecords, allowedCatIds, categoryId, from, to]
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = players.filter(p => {
      if (!allowedCatIds.has(p.categoryId)) return false;
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (term && !`${p.lastName} ${p.firstName} ${p.dni || ''}`.toLowerCase().includes(term)) return false;
      return true;
    });

    const list = base.map(p => {
      const c = { presente: 0, ausente: 0, justificado: 0, lesionado: 0 } as Record<Status, number>;
      sessions.forEach(s => {
        const e = s.entries.find(x => x.playerId === p.id);
        if (e && c[e.status as Status] !== undefined) c[e.status as Status] += 1;
      });
      const total = c.presente + c.ausente + c.justificado + c.lesionado;
      // El porcentaje cuenta solo presentes vs ausentes: justificados y lesionados no bajan el porcentaje.
      const counted = c.presente + c.ausente;
      const pct = counted > 0 ? Math.round((c.presente / counted) * 100) : null;
      return { player: p, ...c, total, pct };
    });

    list.sort((a, b) => {
      if (sortKey === 'nombre') return `${a.player.lastName} ${a.player.firstName}`.localeCompare(`${b.player.lastName} ${b.player.firstName}`);
      if (sortKey === 'faltas_desc') return b.ausente - a.ausente;
      return (a.pct === null ? 101 : a.pct) - (b.pct === null ? 101 : b.pct);
    });
    return list;
  }, [players, allowedCatIds, categoryId, search, sessions, sortKey]);

  const totals = useMemo(() => {
    const t = { presente: 0, ausente: 0, justificado: 0, lesionado: 0 } as Record<Status, number>;
    rows.forEach(r => {
      t.presente += r.presente;
      t.ausente += r.ausente;
      t.justificado += r.justificado;
      t.lesionado += r.lesionado;
    });
    const counted = t.presente + t.ausente;
    return { ...t, pct: counted > 0 ? Math.round((t.presente / counted) * 100) : null };
  }, [rows]);

  const selected = rows.find(r => r.player.id === selectedPlayerId) || null;
  const selectedHistory = useMemo(() => {
    if (!selected) return [];
    return sessions
      .map(s => ({ s, e: s.entries.find(x => x.playerId === selected.player.id) }))
      .filter(x => !!x.e)
      .sort((a, b) => (a.s.date < b.s.date ? 1 : -1));
  }, [selected, sessions]);

  const exportCsv = () => {
    const header = ['Apellido', 'Nombre', 'DNI', 'Categoría', 'Clases', 'Presentes', 'Ausentes', 'Justificados', 'Lesionados', '% Asistencia'];
    const lines = rows.map(r =>
      [r.player.lastName, r.player.firstName, r.player.dni || '', catName(r.player.categoryId), r.total, r.presente, r.ausente, r.justificado, r.lesionado, r.pct === null ? '' : r.pct]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob(['' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'control_asistencia.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const light = theme === 'light';
  const inputCls = `px-3 py-2 rounded-xl border text-xs outline-none ${light ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-slate-100'}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className={`border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${light ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'}`}>
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">Control de Asistencia</h3>
              <p className="text-xs text-emerald-100">Faltas y porcentaje de asistencia por alumno</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto text-xs">
          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar alumno por nombre o DNI…"
                className={`${inputCls} w-full pl-9`}
              />
            </div>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSelectedPlayerId(null); }} className={inputCls}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Desde</span>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={`${inputCls} flex-1`} />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Hasta</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={`${inputCls} flex-1`} />
            </label>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className={`p-3 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Clases dictadas</div>
              <div className="text-xl font-black">{sessions.length}</div>
            </div>
            <div className={`p-3 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Asistencia global</div>
              <div className={`text-xl font-black ${pctColor(totals.pct)}`}>{totals.pct === null ? '—' : `${totals.pct}%`}</div>
            </div>
            <div className={`p-3 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Faltas</div>
              <div className="text-xl font-black text-rose-400">{totals.ausente}</div>
            </div>
            <div className={`p-3 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Justificadas</div>
              <div className="text-xl font-black text-amber-300">{totals.justificado}</div>
            </div>
            <div className={`p-3 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Lesionados</div>
              <div className="text-xl font-black text-sky-300">{totals.lesionado}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">
              El % se calcula con presentes y ausentes. Las faltas justificadas y los lesionados no bajan el porcentaje.
            </p>
            <div className="flex items-center gap-2">
              <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className={inputCls}>
                <option value="pct_asc">Menor asistencia primero</option>
                <option value="faltas_desc">Más faltas primero</option>
                <option value="nombre">Orden alfabético</option>
              </select>
              <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className={`rounded-2xl border overflow-x-auto ${light ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full min-w-[640px]">
              <thead className={light ? 'bg-slate-100 text-slate-500' : 'bg-slate-950 text-slate-400'}>
                <tr className="text-left text-[10px] uppercase">
                  <th className="p-2.5">Alumno</th>
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5 text-center">Clases</th>
                  <th className="p-2.5 text-center">Pres.</th>
                  <th className="p-2.5 text-center">Faltas</th>
                  <th className="p-2.5 text-center">Just.</th>
                  <th className="p-2.5 text-center">Les.</th>
                  <th className="p-2.5 w-40">% Asistencia</th>
                  <th className="p-2.5 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-slate-500">No hay alumnos con esos filtros.</td></tr>
                )}
                {rows.map(r => (
                  <tr
                    key={r.player.id}
                    onClick={() => setSelectedPlayerId(selectedPlayerId === r.player.id ? null : r.player.id)}
                    className={`cursor-pointer border-t ${light ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800 hover:bg-slate-900'} ${selectedPlayerId === r.player.id ? (light ? 'bg-emerald-50' : 'bg-emerald-950/30') : ''}`}
                  >
                    <td className="p-2.5 font-bold">{r.player.lastName}, {r.player.firstName}</td>
                    <td className="p-2.5 text-slate-400">{catName(r.player.categoryId)}</td>
                    <td className="p-2.5 text-center">{r.total}</td>
                    <td className="p-2.5 text-center text-emerald-400">{r.presente}</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">{r.ausente}</td>
                    <td className="p-2.5 text-center text-amber-300">{r.justificado}</td>
                    <td className="p-2.5 text-center text-sky-300">{r.lesionado}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${light ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <div className={`h-full ${barColor(r.pct)}`} style={{ width: `${r.pct ?? 0}%` }} />
                        </div>
                        <span className={`font-black w-10 text-right ${pctColor(r.pct)}`}>{r.pct === null ? '—' : `${r.pct}%`}</span>
                      </div>
                    </td>
                    <td className="p-2.5"><ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition ${selectedPlayerId === r.player.id ? 'rotate-90' : ''}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalle del alumno */}
          {selected && (
            <div className={`p-4 rounded-2xl border ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-sm">{selected.player.lastName}, {selected.player.firstName} · detalle por clase</h4>
                <span className={`font-black ${pctColor(selected.pct)}`}>{selected.pct === null ? 'Sin datos' : `${selected.pct}%`}</span>
              </div>
              {selectedHistory.length === 0 ? (
                <p className="text-slate-500">Sin clases registradas en este período.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                  {selectedHistory.map(({ s, e }) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-800/60">
                      <div className="min-w-0">
                        <div className="font-bold">{new Date(s.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.sessionTitle || catName(s.categoryId)}{e?.notes ? ` · ${e.notes}` : ''}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase shrink-0 ${STATUS_COLOR[e!.status as Status]}`}>
                        {STATUS_LABEL[e!.status as Status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
