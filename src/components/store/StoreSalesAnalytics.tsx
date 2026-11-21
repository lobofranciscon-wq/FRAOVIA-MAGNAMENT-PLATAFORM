import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  Calendar, 
  Trophy, 
  CreditCard, 
  Shirt, 
  Tag, 
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  PackageCheck
} from 'lucide-react';
import { StoreProduct, StoreSale } from '../../types/fraovia';

interface StoreSalesAnalyticsProps {
  sales: StoreSale[];
  products: StoreProduct[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Indumentaria': '#f97316', // Orange
  'Accesorios': '#06b6d4',   // Cyan
  'Calzado': '#10b981',      // Emerald
  'Merchandising': '#8b5cf6', // Purple
  'Equipamiento Deportivo': '#eab308' // Yellow
};

const PALETTE = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export const StoreSalesAnalytics: React.FC<StoreSalesAnalyticsProps> = ({
  sales,
  products
}) => {
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(7);

  // Filter sales by selected timeframe
  const filteredSales = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
    return sales.filter(s => new Date(s.timestamp) >= cutoffDate);
  }, [sales, timeframeDays]);

  // 1. Group daily revenue flow for Area Chart
  const dailyFlowData = useMemo(() => {
    const daysMap: Record<string, { dateStr: string; label: string; ingresos: number; tickets: number; subtotal: number; descuento: number }> = {};

    // Initialize all days in timeframe so chart has no holes
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      daysMap[isoDay] = {
        dateStr: isoDay,
        label: dayLabel,
        ingresos: 0,
        tickets: 0,
        subtotal: 0,
        descuento: 0
      };
    }

    filteredSales.forEach(sale => {
      const dayKey = sale.timestamp.split('T')[0];
      if (daysMap[dayKey]) {
        daysMap[dayKey].ingresos += sale.total;
        daysMap[dayKey].tickets += 1;
        daysMap[dayKey].subtotal += (sale.subtotal || sale.total);
        daysMap[dayKey].descuento += (sale.discountAmount || 0);
      }
    });

    return Object.values(daysMap);
  }, [filteredSales, timeframeDays]);

  // 2. Top Selling Products Aggregation
  const topProductsData = useMemo(() => {
    const productStats: Record<string, { id: string; name: string; category: string; unitsSold: number; revenue: number; imageUrl?: string; currentStock: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const name = prod?.name || item.productName.replace(/ \(Talle .*\)/, '');
        const id = item.productId || name;

        if (!productStats[id]) {
          productStats[id] = {
            id,
            name,
            category: prod?.category || 'Indumentaria',
            unitsSold: 0,
            revenue: 0,
            imageUrl: prod?.imageUrl,
            currentStock: prod?.stock ?? 0
          };
        }

        productStats[id].unitsSold += item.quantity;
        productStats[id].revenue += item.total;
      });
    });

    return Object.values(productStats).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filteredSales, products]);

  // 3. Category Breakdown for Pie Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const cat = prod?.category || 'Indumentaria';
        catMap[cat] = (catMap[cat] || 0) + it.total;
      });
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredSales, products]);

  // 4. Payment Methods Breakdown
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      const pm = s.paymentMethod || 'efectivo';
      map[pm] = (map[pm] || 0) + s.total;
    });

    return Object.entries(map).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
  }, [filteredSales]);

  // Overall KPI Metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalDiscountsGiven = filteredSales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
  const totalTickets = filteredSales.length;
  const averageTicket = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;
  const totalUnitsSold = topProductsData.reduce((acc, p) => acc + p.unitsSold, 0);
  const topProduct = topProductsData[0];

  // Custom Chart Tooltips
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1">
          <div className="font-bold text-white flex items-center justify-between gap-4 pb-1 border-b border-slate-800">
            <span>{data.label}</span>
            <span className="font-mono text-orange-400">{data.tickets} tickets</span>
          </div>
          <div className="text-emerald-400 font-mono font-bold text-sm">
            Ingresos: ${data.ingresos.toLocaleString('es-AR')}
          </div>
          {data.descuento > 0 && (
            <div className="text-purple-300 font-mono text-[10px]">
              Descuentos: -${data.descuento.toLocaleString('es-AR')}
            </div>
          )}
          <div className="text-slate-400 text-[10px] font-mono">
            Ticket promedio: ${data.tickets > 0 ? Math.round(data.ingresos / data.tickets).toLocaleString('es-AR') : '$0'}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1">
          <span className="font-bold text-white block">{data.name}</span>
          <div className="text-orange-400 font-mono font-bold">
            {data.unitsSold} unidades vendidas
          </div>
          <div className="text-emerald-400 font-mono text-xs">
            Facturado: ${data.revenue.toLocaleString('es-AR')}
          </div>
          <div className="text-slate-400 font-mono text-[10px]">
            Stock restante en depósito: {data.currentStock} un.
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#0C162D] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="font-black text-white text-base">
              Análisis de Ventas Rápidas & Visualización de Datos
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo en tiempo real del flujo de ingresos diarios, productos más demandados y hábitos de compra.
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-orange-400" />
            <span>Periodo:</span>
          </span>
          {([7, 14, 30] as const).map(days => (
            <button
              key={days}
              onClick={() => setTimeframeDays(days)}
              className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer ${
                timeframeDays === days
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days} días
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Ingresos Facturados
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ${totalRevenue.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono block">
            {totalTickets} tickets cobrados en caja
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-1">
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Unidades Vendidas
          </span>
          <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
            {totalUnitsSold} <span className="text-sm font-normal text-slate-400">prendas/art.</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            Promedio {(totalUnitsSold / (totalTickets || 1)).toFixed(1)} un. por venta
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Ticket Promedio
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ${averageTicket.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-purple-300 font-mono block">
            Ahorro en promos: ${totalDiscountsGiven.toLocaleString('es-AR')}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1">
            <Trophy className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Artículo Estrella
          </span>
          <div className="text-sm font-black text-amber-300 truncate">
            {topProduct ? topProduct.name : 'Sin datos'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            {topProduct ? `${topProduct.unitsSold} un. vendidas ($${topProduct.revenue.toLocaleString('es-AR')})` : '0 ventas'}
          </span>
        </div>
      </div>

      {/* CHART 1: FLUJO DE INGRESOS DIARIOS (AreaChart) */}
      <div className="p-5 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="font-black text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span>Flujo de Ingresos Diarios de la Tienda</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Evolución diaria de la recaudación ingresada a la caja durante los últimos {timeframeDays} días.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              <span>Ingresos Netos ($)</span>
            </span>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="storeRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748B" 
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748B" 
                tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <Area 
                type="monotone" 
                dataKey="ingresos" 
                stroke="#f97316" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#storeRevenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS ROW 2: PRODUCTOS MÁS VENDIDOS & PARTICIPACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP SELLING PRODUCTS BAR CHART (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span>Ranking de Productos Más Vendidos</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Volumen de unidades comercializadas por artículo del catálogo.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              Top Artículos
            </span>
          </div>

          {/* BarChart Container */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topProductsData.slice(0, 6)} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748B" 
                  width={130}
                  tick={{ fill: '#E2E8F0', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 18)}...` : val}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar 
                  dataKey="unitsSold" 
                  radius={[0, 8, 8, 0]}
                >
                  {topProductsData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Leaderboard Table */}
          <div className="pt-2 divide-y divide-slate-800/80 text-xs">
            {topProductsData.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                    idx === 0 ? 'bg-amber-400 text-slate-950 shadow-sm' :
                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Categoría: {p.category} · Stock actual: {p.currentStock} un.
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-white font-mono block">
                    {p.unitsSold} un. vendidas
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    ${p.revenue.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PIE CHART: CATEGORY DISTRIBUTION (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-[#0C162D] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800">
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <span>Ventas por Categoría</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribución porcentual de facturación.
              </p>
            </div>

            {/* Donut PieChart */}
            <div className="w-full h-52 relative flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.name] || PALETTE[index % PALETTE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Facturación']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                <span className="text-sm font-black text-white font-mono">
                  ${totalRevenue.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Category breakdown legend */}
            <div className="space-y-1.5 pt-2 text-xs">
              {categoryData.map((cat, idx) => {
                const pct = totalRevenue > 0 ? Math.round((cat.value / totalRevenue) * 100) : 0;
                const color = CATEGORY_COLORS[cat.name] || PALETTE[idx % PALETTE.length];
                return (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-300 font-medium truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white text-[11px]">
                      ${cat.value.toLocaleString('es-AR')} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods quick footer */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
              Cobros por Medio de Pago:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              {paymentMethodData.map((pm) => (
                <div key={pm.name} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">{pm.name}</span>
                  <span className="font-mono font-bold text-orange-300 text-[11px] block mt-0.5">
                    ${pm.value.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
