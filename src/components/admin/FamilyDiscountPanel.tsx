import React, { useCallback, useEffect, useState } from 'react';
import { Users, Search, Link2, CalendarClock, X, AlertCircle, Check } from 'lucide-react';
import { Category, Player, User } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import {
  FamilyInfo,
  PlayerSearchResult,
  supabaseFamilyService
} from '../../services/supabaseFamilyService';

interface FamilyDiscountPanelProps {
  player: Player;
  currentUser: User;
  categories: Category[];
  /** Se avisa cada vez que algo cambió, para refrescar los datos de la app al cerrar la ficha. */
  onChanged: () => void;
}

const today = () => new Date().toISOString().split('T')[0];
const money = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtDate = (d: string) => new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR');

export const FamilyDiscountPanel: React.FC<FamilyDiscountPanelProps> = ({ player, currentUser, categories, onChanged }) => {
  const canManage = currentUser.role === 'DUEÑO' || currentUser.role === 'ADMINISTRACIÓN';
  const catName = (id: string) => categories.find(c => c.id === id)?.name || '—';

  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Vincular hermano
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [picked, setPicked] = useState<PlayerSearchResult | null>(null);
  const [linkPercent, setLinkPercent] = useState<number>(50);

  // Cambiar descuento del grupo
  const [newPercent, setNewPercent] = useState<number>(50);
  const [changeDate, setChangeDate] = useState<string>(today());
  const [changeReason, setChangeReason] = useState('');

  // Separar a este deportista
  const [remainingMode, setRemainingMode] = useState<'sigue' | 'cien' | 'otro'>('sigue');
  const [remainingOther, setRemainingOther] = useState<number>(25);
  const [leaveDate, setLeaveDate] = useState<string>(today());
  const [leaveReason, setLeaveReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const f = await supabaseFamilyService.getFamily(player.id);
      setFamily(f);
      setNewPercent(f.discountPercent || 50);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el grupo familiar');
    } finally {
      setLoading(false);
    }
  }, [player.id]);

  useEffect(() => { load(); }, [load]);

  // Búsqueda de hermano (espera un momento para no consultar en cada tecla)
  useEffect(() => {
    if (picked || term.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        setResults(await supabaseFamilyService.searchPlayers(term, player.id));
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [term, picked, player.id]);

  const run = async (fn: () => Promise<void>, okMessage: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
      setMessage(okMessage);
      onChanged();
      await load();
    } catch (e: any) {
      setError(e.message || 'No se pudo completar la acción');
    } finally {
      setBusy(false);
    }
  };

  const handleLink = () => {
    if (!picked) return;
    run(async () => {
      await dataActions.familyLink(player.id, picked.id, linkPercent, currentUser);
      setPicked(null);
      setTerm('');
    }, 'Hermanos vinculados. La cuota con descuento ya está aplicada.');
  };

  const handleChangePercent = () => {
    if (!family?.groupId) return;
    const scheduled = changeDate > today();
    run(async () => {
      await dataActions.familySetPercent(family.groupId!, newPercent, changeDate, changeReason.trim(), currentUser);
      setChangeReason('');
    }, scheduled ? `Cambio programado para el ${fmtDate(changeDate)}.` : 'Descuento actualizado.');
  };

  const handleRemoveAll = () => {
    if (!family?.groupId) return;
    if (!confirm('¿Quitar el descuento por hermanos a todo el grupo? Pasan a pagar la cuota completa desde la fecha elegida.')) return;
    const scheduled = changeDate > today();
    run(async () => {
      await dataActions.familySetPercent(family.groupId!, 0, changeDate, changeReason.trim() || 'Fin del descuento por hermanos', currentUser);
    }, scheduled ? `Se quitará el descuento el ${fmtDate(changeDate)}.` : 'Descuento por hermanos quitado.');
  };

  const handleLeave = () => {
    const remaining = remainingMode === 'sigue' ? (family?.discountPercent || 0) : remainingMode === 'cien' ? 0 : remainingOther;
    const others = (family?.members || []).filter(m => m.id !== player.id);
    const txt = others.length > 0
      ? `Los hermanos que quedan ${remaining > 0 ? `siguen con ${remaining}% de descuento` : 'pasan a pagar el 100% de la cuota'}.`
      : '';
    if (!confirm(`¿Separar a ${player.lastName}, ${player.firstName} del grupo familiar desde el ${fmtDate(leaveDate)}? ${txt}`)) return;
    const scheduled = leaveDate > today();
    run(async () => {
      await dataActions.familyMemberLeave(player.id, remaining, leaveDate, leaveReason.trim(), currentUser);
      setLeaveReason('');
    }, scheduled ? `Separación programada para el ${fmtDate(leaveDate)}.` : 'Separación aplicada.');
  };

  const handleCancel = (id: string) => {
    run(async () => { await dataActions.familyCancelChange(id, currentUser); }, 'Cambio programado cancelado.');
  };

  const nameOf = (id: string) => {
    const m = family?.members.find(x => x.id === id);
    return m ? `${m.lastName}, ${m.firstName}` : 'Deportista';
  };

  const inputCls = 'bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500';
  const stopEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault(); };

  if (loading) return <div className="p-6 text-center text-slate-500">Cargando grupo familiar…</div>;

  const inGroup = !!family?.groupId;
  const others = (family?.members || []).filter(m => m.id !== player.id);

  return (
    <div className="space-y-4 animate-in fade-in" onKeyDown={stopEnter}>
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          <span>Descuento por Hermanos</span>
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">
          Los hermanos se agrupan y cada uno paga la cuota con descuento. Si hay beca, se aplica la mayor de las dos (no se suman).
          Los cambios valen para las cuotas que se generen desde la fecha elegida; la deuda ya generada no cambia.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" /><span>{message}</span>
        </div>
      )}

      {!canManage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
          Solo Dueño y Administración pueden modificar el descuento por hermanos. Podés consultarlo.
        </div>
      )}

      {/* ESTADO ACTUAL */}
      {inGroup ? (
        <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-white">{family!.groupName}</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-[10px] uppercase">
              Descuento {family!.discountPercent}%
            </span>
          </div>
          <div className="space-y-1.5">
            {family!.members.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="min-w-0">
                  <div className="font-bold text-slate-100 truncate">
                    {m.lastName}, {m.firstName} {m.id === player.id && <span className="text-sky-400 text-[10px]">(este deportista)</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">{catName(m.categoryId)} · DNI {m.dni}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-emerald-400">{money(m.monthlyFeeDue)}</div>
                  <div className="text-[10px] text-slate-500">
                    hermanos {m.familyDiscountPercent}%{m.scholarshipPercent > 0 ? ` · beca ${m.scholarshipPercent}%` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {family!.pending.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Cambios programados
              </div>
              {family!.pending.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="text-[11px] text-amber-100">
                    <strong>{fmtDate(c.effectiveFrom)}</strong> · {nameOf(c.playerId)}:{' '}
                    {c.action === 'detach' ? 'sale del grupo (paga la cuota completa)' : c.newPercent === 0 ? 'pasa a pagar el 100%' : `descuento ${c.newPercent}%`}
                    {c.reason ? <span className="text-amber-200/70"> — {c.reason}</span> : null}
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCancel(c.id)}
                      className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-amber-200 cursor-pointer shrink-0"
                      title="Cancelar este cambio programado"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          Este deportista todavía no tiene hermanos vinculados. Su cuota actual es <strong className="text-white">{money(player.monthlyFeeDue)}</strong>.
        </div>
      )}

      {/* VINCULAR HERMANO */}
      {canManage && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h5 className="font-bold text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-emerald-400" />{inGroup ? 'Sumar otro hermano al grupo' : 'Vincular un hermano'}</h5>

          {picked ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div>
                <div className="font-bold text-white">{picked.lastName}, {picked.firstName}</div>
                <div className="text-[10px] text-slate-400">{catName(picked.categoryId)} · DNI {picked.dni}</div>
              </div>
              <button type="button" onClick={() => { setPicked(null); setTerm(''); }} className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-slate-300 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Buscar hermano por apellido, nombre o DNI…"
                className={`${inputCls} w-full pl-9`}
              />
              {results.length > 0 && (
                <div className="mt-1 rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800 overflow-hidden">
                  {results.map(r => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => { setPicked(r); setResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-900 cursor-pointer"
                    >
                      <span className="font-bold text-slate-100">{r.lastName}, {r.firstName}</span>
                      <span className="text-[10px] text-slate-500"> · {catName(r.categoryId)} · DNI {r.dni}</span>
                      {r.familyGroupId && <span className="text-[10px] text-amber-300"> · ya está en un grupo familiar</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!inGroup && (
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Descuento para cada hermano</span>
              <input type="number" min={1} max={100} value={linkPercent} onChange={e => setLinkPercent(Number(e.target.value))} className={`${inputCls} w-20`} />
              <span className="text-slate-400">%</span>
            </label>
          )}

          <button
            type="button"
            disabled={!picked || busy}
            onClick={handleLink}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold cursor-pointer"
          >
            Vincular como hermanos
          </button>
        </div>
      )}

      {/* CAMBIAR / QUITAR DESCUENTO DEL GRUPO */}
      {canManage && inGroup && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h5 className="font-bold text-white">Cambiar o quitar la oferta del grupo</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="space-y-1">
              <span className="text-slate-400 text-[11px]">Nuevo descuento (%)</span>
              <input type="number" min={0} max={100} value={newPercent} onChange={e => setNewPercent(Number(e.target.value))} className={`${inputCls} w-full`} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-slate-400 text-[11px]">Desde (fecha futura = queda programado)</span>
              <input type="date" value={changeDate} onChange={e => setChangeDate(e.target.value)} className={`${inputCls} w-full`} />
            </label>
          </div>
          <input value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="Motivo (opcional)" className={`${inputCls} w-full`} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={handleChangePercent} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold cursor-pointer">
              Aplicar descuento
            </button>
            <button type="button" disabled={busy} onClick={handleRemoveAll} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold border border-rose-500/30 cursor-pointer">
              Quitar descuento a todos
            </button>
          </div>
        </div>
      )}

      {/* SEPARAR A ESTE DEPORTISTA */}
      {canManage && inGroup && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-3">
          <h5 className="font-bold text-white">Este deportista se va o se separa del grupo</h5>
          <p className="text-[11px] text-slate-400">
            {player.firstName} deja de tener el descuento por hermanos (si sigue en el club, paga su cuota completa o la de su beca).
            {others.length > 0 ? ' ¿Qué pasa con los hermanos que quedan?' : ''}
          </p>

          {others.length > 0 && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={remainingMode === 'sigue'} onChange={() => setRemainingMode('sigue')} />
                <span>Siguen con el descuento actual ({family!.discountPercent}%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={remainingMode === 'cien'} onChange={() => setRemainingMode('cien')} />
                <span>Pasan a pagar el 100% de la cuota</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={remainingMode === 'otro'} onChange={() => setRemainingMode('otro')} />
                <span>Otro descuento:</span>
                <input type="number" min={1} max={100} value={remainingOther} onChange={e => { setRemainingOther(Number(e.target.value)); setRemainingMode('otro'); }} className={`${inputCls} w-20`} />
                <span>%</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-slate-400 text-[11px]">Desde (fecha futura = queda programado)</span>
              <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className={`${inputCls} w-full`} />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 text-[11px]">Motivo (opcional)</span>
              <input value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="ej: se mudó / dejó el club" className={`${inputCls} w-full`} />
            </label>
          </div>
          <button type="button" disabled={busy} onClick={handleLeave} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold cursor-pointer">
            Separar del grupo familiar
          </button>
          <p className="text-[10px] text-slate-500">
            Si además deja el club, dalo de baja por separado (suspensión) desde el listado de jugadores.
          </p>
        </div>
      )}
    </div>
  );
};
