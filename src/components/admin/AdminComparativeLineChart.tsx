import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Maximize2, 
  Minimize2, 
  Plus, 
  TrendingUp, 
  Palette, 
  Calendar, 
  Sparkles, 
  Sliders, 
  X,
  Check,
  BarChart3
} from 'lucide-react';

interface MetricSeries {
  id: string;
  name: string;
  key: string;
  color: string;
  active: boolean;
  strokeWidth: number;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Mock monthly comparative financial & registration data
const DEFAULT_CHART_DATA = [
  { month: 'Ene', y2024: 1200000, y2025: 1650000, y2026: 2100000, socios2025: 490, socios2026: 580, morosidad: 11.2 },
  { month: 'Feb', y2024: 1280000, y2025: 1720000, y2026: 2240000, socios2025: 510, socios2026: 605, morosidad: 10.5 },
  { month: 'Mar', y2024: 1450000, y2025: 1980000, y2026: 2510000, socios2025: 535, socios2026: 630, morosidad: 9.8 },
  { month: 'Abr', y2024: 1410000, y2025: 1920000, y2026: 2340000, socios2025: 540, socios2026: 642, morosidad: 8.5 },
  { month: 'May', y2024: 1390000, y2025: 1890000, y2026: 2420000, socios2025: 545, socios2026: 655, morosidad: 8.2 },
  { month: 'Jun', y2024: 1480000, y2025: 2010000, y2026: 2600000, socios2025: 550, socios2026: 668, morosidad: 7.9 },
  { month: 'Jul', y2024: 1420000, y2025: 1950000, y2026: 2530000, socios2025: 548, socios2026: 660, morosidad: 8.1 },
  { month: 'Ago', y2024: 1530000, y2025: 2100000, y2026: 2720000, socios2025: 560, socios2026: 680, morosidad: 7.5 },
  { month: 'Sep', y2024: 1510000, y2025: 2080000, y2026: 2690000, socios2025: 562, socios2026: 685, morosidad: 7.4 },
  { month: 'Oct', y2024: 1590000, y2025: 2190000, y2026: 2850000, socios2025: 570, socios2026: 700, morosidad: 7.1 },
  { month: 'Nov', y2024: 1620000, y2025: 2250000, y2026: 2920000, socios2025: 575, socios2026: 710, morosidad: 6.9 },
  { month: 'Dic', y2024: 1700000, y2025: 2380000, y2026: 3100000, socios2025: 580, socios2026: 725, morosidad: 6.5 }
];

const PRESET_PALETTE = [
  '#0284C7', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];

export const AdminComparativeLineChart: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartMode, setChartMode] = useState<'recaudacion_anual' | 'socios_activos' | 'morosidad'>('recaudacion_anual');
  
  // Dynamic series configuration with user-selectable colors
  const [seriesList, setSeriesList] = useState<MetricSeries[]>([
    { id: 's2026', name: 'Temporada 2026 (Actual)', key: 'y2026', color: '#0284C7', active: true, strokeWidth: 3 },
    { id: 's2025', name: 'Temporada 2025', key: 'y2025', color: '#10B981', active: true, strokeWidth: 2 },
    { id: 's2024', name: 'Temporada 2024', key: 'y2024', color: '#F59E0B', active: false, strokeWidth: 2 }
  ]);

  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);
  const [showAddSeriesModal, setShowAddSeriesModal] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesColor, setNewSeriesColor] = useState('#8B5CF6');

  const toggleSeries = (id: string) => {
    setSeriesList(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updateSeriesColor = (id: string, color: string) => {
    setSeriesList(prev => prev.map(s => s.id === id ? { ...s, color } : s));
    setShowColorPickerForId(null);
  };

  const handleAddCustomSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) return;

    const newId = `custom-${Date.now()}`;
    // Assign custom progression for the demo
    const baseMult = 1.15;
    DEFAULT_CHART_DATA.forEach((d: any) => {
      d[newId] = Math.round(d.y2026 * (0.8 + Math.random() * 0.4));
    });

    setSeriesList(prev => [
      ...prev,
      {
        id: newId,
        name: newSeriesName.trim(),
        key: newId,
        color: newSeriesColor,
        active: true,
        strokeWidth: 2
      }
    ]);

    setNewSeriesName('');
    setShowAddSeriesModal(false);
  };

  const formatTooltipValue = (value: number | string | readonly (string | number)[] | undefined) => {
    if (value === undefined) return '';
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numericValue)) return String(value);

    if (chartMode === 'recaudacion_anual') {
      return `$${numericValue.toLocaleString('es-AR')}`;
    }
    if (chartMode === 'morosidad') {
      return `${numericValue}%`;
    }
    return `${numericValue.toLocaleString('es-AR')} deportistas`;
  };

  const currentChartHeight = isExpanded ? 520 : 320;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4 transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 overflow-y-auto max-w-7xl mx-auto shadow-2xl ring-2 ring-sky-500/50' : 'relative'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                Análisis Comparativo Interanual
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Cuadrícula Analítica
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Evolución Mensual & Comparativa de Temporadas
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Chart Metric Mode Selector */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setChartMode('recaudacion_anual');
                setSeriesList([
                  { id: 's2026', name: 'Temporada 2026', key: 'y2026', color: '#0284C7', active: true, strokeWidth: 3 },
                  { id: 's2025', name: 'Temporada 2025', key: 'y2025', color: '#10B981', active: true, strokeWidth: 2 },
                  { id: 's2024', name: 'Temporada 2024', key: 'y2024', color: '#F59E0B', active: false, strokeWidth: 2 }
                ]);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartMode === 'recaudacion_anual' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cobranzas ($)
            </button>
            <button
              onClick={() => {
                setChartMode('socios_activos');
                setSeriesList([
                  { id: 'soc2026', name: 'Socios 2026', key: 'socios2026', color: '#0284C7', active: true, strokeWidth: 3 },
                  { id: 'soc2025', name: 'Socios 2025', key: 'socios2025', color: '#10B981', active: true, strokeWidth: 2 }
                ]);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartMode === 'socios_activos' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Socios Activos
            </button>
            <button
              onClick={() => {
                setChartMode('morosidad');
                setSeriesList([
                  { id: 'morosidad', name: 'Índice de Mora %', key: 'morosidad', color: '#EF4444', active: true, strokeWidth: 3 }
                ]);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartMode === 'morosidad' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Morosidad %
            </button>
          </div>

          {/* Add Series Button */}
          <button
            onClick={() => setShowAddSeriesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Cargar y comparar otra serie o año con un color específico"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Comparar Valor</span>
          </button>

          {/* Expand / Minimize Fullscreen Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title={isExpanded ? 'Contraer vista' : 'Expandir a pantalla completa'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4 text-sky-400" /> : <Maximize2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Series Filter & Custom Color Toggles Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          Series Visibles & Paleta:
        </span>
        {seriesList.map((series) => (
          <div 
            key={series.id} 
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800"
          >
            {/* Color Dot Button to trigger color change */}
            <button
              type="button"
              onClick={() => setShowColorPickerForId(showColorPickerForId === series.id ? null : series.id)}
              className="w-3.5 h-3.5 rounded-full border border-white/20 transition hover:scale-110 cursor-pointer shrink-0"
              style={{ backgroundColor: series.color }}
              title="Cambiar color de esta línea"
            />

            {/* Toggle series visibility */}
            <button
              type="button"
              onClick={() => toggleSeries(series.id)}
              className={`cursor-pointer transition select-none ${
                series.active ? 'font-bold text-white' : 'line-through text-slate-500'
              }`}
            >
              {series.name}
            </button>

            {/* Color Picker Popover */}
            {showColorPickerForId === series.id && (
              <div className="absolute top-8 left-0 z-30 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-1.5 animate-in fade-in">
                {PRESET_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateSeriesColor(series.id, c)}
                    className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {series.color === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Line Chart with background grid (Cuadrícula analítica) */}
      <div className="w-full transition-all" style={{ height: currentChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={DEFAULT_CHART_DATA} margin={{ top: 15, right: 25, left: 10, bottom: 5 }}>
            {/* Background Grid - Cuadrícula de fondo */}
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={true} horizontal={true} />
            <XAxis 
              dataKey="month" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }} 
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => chartMode === 'recaudacion_anual' ? `$${(v / 1000).toFixed(0)}k` : chartMode === 'morosidad' ? `${v}%` : String(v)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0F172A', 
                borderColor: '#1E293B', 
                borderRadius: '0.75rem', 
                color: '#F8FAFC',
                fontSize: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={formatTooltipValue}
              labelStyle={{ fontWeight: 'bold', color: '#94A3B8', marginBottom: '0.25rem' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} 
            />

            {/* Dynamic Lines rendered with assigned custom colors */}
            {seriesList.filter(s => s.active).map((series) => (
              <Line 
                key={series.id}
                type="monotone" 
                dataKey={series.key} 
                name={series.name}
                stroke={series.color} 
                strokeWidth={series.strokeWidth}
                dot={{ r: 3.5, strokeWidth: 2, fill: '#0F172A' }}
                activeDot={{ r: 6, stroke: series.color, strokeWidth: 2, fill: '#FFFFFF' }}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Haz clic en cualquier punto de la línea para consultar el acumulado y la variación interanual.
        </span>
        <span className="font-mono text-emerald-400 font-bold">
          Crecimiento interanual proyectado: +28.4%
        </span>
      </div>

      {/* Add Custom Series Modal */}
      {showAddSeriesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Cargar Nueva Serie para Comparar
              </h4>
              <button onClick={() => setShowAddSeriesModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddCustomSeries} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre de la Serie o Temporada</label>
                <input
                  type="text"
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  placeholder="Ej: Temporada 2023, Presupuesto Objetivo, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Color de la Línea</label>
                <div className="flex items-center gap-2 pt-1">
                  {PRESET_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSeriesColor(color)}
                      className={`w-7 h-7 rounded-full border transition cursor-pointer flex items-center justify-center ${
                        newSeriesColor === color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newSeriesColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Agregar al Gráfico Comparativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
