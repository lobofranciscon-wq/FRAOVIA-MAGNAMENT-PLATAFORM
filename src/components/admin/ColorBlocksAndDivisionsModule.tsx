import React, { useState } from 'react';
import { 
  Palette, 
  Layers, 
  Plus, 
  Search, 
  Users, 
  Shield, 
  ChevronRight, 
  Filter, 
  Award, 
  Check, 
  Calendar, 
  Activity,
  Flame,
  CircleDot,
  Compass,
  Zap,
  Building2,
  Trash2,
  FolderTree
} from 'lucide-react';
import { Category, Club, ColorBlock, Discipline, Player, SportsDivisionTier, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';

interface ColorBlocksAndDivisionsModuleProps {
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  players: Player[];
  onRefreshData: () => void;
  onSelectCategory?: (category: Category) => void;
}

const DEFAULT_BLOCKS: ColorBlock[] = [
  { id: 'block-blanco', name: 'Bloque Blanco', colorHex: '#FFFFFF', badgeBg: 'bg-white/10', badgeText: 'text-white', badgeBorder: 'border-white/40' },
  { id: 'block-azul', name: 'Bloque Azul', colorHex: '#3B82F6', badgeBg: 'bg-blue-500/15', badgeText: 'text-blue-400', badgeBorder: 'border-blue-500/30' },
  { id: 'block-rojo', name: 'Bloque Rojo', colorHex: '#EF4444', badgeBg: 'bg-rose-500/15', badgeText: 'text-rose-400', badgeBorder: 'border-rose-500/30' },
  { id: 'block-negro', name: 'Bloque Negro', colorHex: '#0F172A', badgeBg: 'bg-slate-800', badgeText: 'text-slate-300', badgeBorder: 'border-slate-600' },
  { id: 'block-verde', name: 'Bloque Verde', colorHex: '#10B981', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-400', badgeBorder: 'border-emerald-500/30' },
  { id: 'block-oro', name: 'Bloque Oro / Amarillo', colorHex: '#F59E0B', badgeBg: 'bg-amber-500/15', badgeText: 'text-amber-400', badgeBorder: 'border-amber-500/30' }
];

// Tier definitions per sport
const FUTBOL_TIERS: { tier: SportsDivisionTier; label: string; ageRange: string }[] = [
  { tier: 'Escuelita', label: 'Escuelita Formativa', ageRange: '2018 - 2017 (5 a 7 años)' },
  { tier: 'Pre-Infantiles', label: 'Pre-Infantiles', ageRange: '2016 - 2015 (8 a 9 años)' },
  { tier: 'Infantiles', label: 'Infantiles (ej. Sub 13 / 2013)', ageRange: '2014 - 2013 (10 a 13 años)' },
  { tier: 'Inferiores', label: 'Inferiores / Juveniles', ageRange: 'Sub 15, Sub 17, Sub 19' },
  { tier: 'Primera', label: 'Primera División & Reserva', ageRange: 'Plantel Superior Federado' }
];

const BASQUET_TIERS: { tier: SportsDivisionTier; label: string; ageRange: string }[] = [
  { tier: 'Mosquitos', label: 'Mosquitos', ageRange: '4 a 6 años' },
  { tier: 'Pre-Mini', label: 'Pre-Mini', ageRange: '9 a 10 años' },
  { tier: 'Mini', label: 'Mini Básquet', ageRange: '11 a 12 años' },
  { tier: 'U13', label: 'U13 Formativas', ageRange: '13 años' },
  { tier: 'U15', label: 'U15 Cadetes', ageRange: '14 a 15 años' },
  { tier: 'U17', label: 'U17 Juveniles', ageRange: '16 a 17 años' },
  { tier: 'U19', label: 'U19 / U21', ageRange: '18 a 21 años' },
  { tier: 'Primera Básquet', label: 'Primera División CAB', ageRange: 'Plantel Superior' }
];

export const ColorBlocksAndDivisionsModule: React.FC<ColorBlocksAndDivisionsModuleProps> = ({
  currentClub,
  currentUser,
  disciplines,
  categories,
  players,
  onRefreshData,
  onSelectCategory
}) => {
  const [colorBlocks, setColorBlocks] = useState<ColorBlock[]>(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showNewBlockModal, setShowNewBlockModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockColor, setNewBlockColor] = useState('#3B82F6');

  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDisciplineId, setNewCatDisciplineId] = useState(disciplines[0]?.id || '');
  const [newCatAgeGroup, setNewCatAgeGroup] = useState('2013 (13 años)');
  const [newCatFee, setNewCatFee] = useState(25000);
  const [newCatTier, setNewCatTier] = useState<SportsDivisionTier>('Infantiles');
  const [newCatBlockId, setNewCatBlockId] = useState('block-blanco');

  // Handle adding new color block
  const handleCreateColorBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;

    const newBlock: ColorBlock = {
      id: `block-${Date.now()}`,
      clubId: currentClub.id,
      name: newBlockName.trim(),
      colorHex: newBlockColor,
      badgeBg: 'bg-slate-900',
      badgeText: 'text-white',
      badgeBorder: 'border-white/30'
    };

    setColorBlocks(prev => [...prev, newBlock]);
    setNewBlockName('');
    setShowNewBlockModal(false);
  };

  // Determine which tiers to display based on selected discipline
  const selectedDiscipline = disciplines.find(d => d.id === selectedDisciplineId);
  const isBasquet = selectedDiscipline?.name.toLowerCase().includes('básquet') || selectedDiscipline?.code === 'BSQ';
  const activeTiers = isBasquet ? BASQUET_TIERS : FUTBOL_TIERS;

  // Filtered categories
  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = selectedDisciplineId === 'all' || c.disciplineId === selectedDisciplineId;
    
    // Match block
    const matchesBlock = selectedBlockId === 'all' || 
      (c.colorBlockId === selectedBlockId) || 
      (selectedBlockId === 'block-blanco' && c.name.toLowerCase().includes('blanco')) ||
      (selectedBlockId === 'block-azul' && c.name.toLowerCase().includes('azul')) ||
      (selectedBlockId === 'block-rojo' && c.name.toLowerCase().includes('rojo')) ||
      (selectedBlockId === 'block-negro' && c.name.toLowerCase().includes('negro')) ||
      (selectedBlockId === 'block-verde' && c.name.toLowerCase().includes('verde')) ||
      (selectedBlockId === 'block-oro' && (c.name.toLowerCase().includes('oro') || c.name.toLowerCase().includes('amarillo')));

    const matchesTier = selectedTier === 'all' || c.divisionTier === selectedTier;

    return matchesSearch && matchesDiscipline && matchesBlock && matchesTier;
  });

  // Calculate players inside the filtered selection
  const filteredCategoryIds = new Set(filteredCategories.map(c => c.id));
  const scopedPlayers = players.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.dni.includes(searchTerm) || 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && filteredCategoryIds.has(p.categoryId);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div 
        className="p-5 rounded-2xl border text-white shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #082F49 100%)',
          borderColor: '#0284C7'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Secretaría Deportiva
                </span>
                <span className="text-xs text-sky-200">
                  {currentClub.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Bloques por Color & Jerarquía Deportiva
              </h2>
              <p className="text-xs text-sky-100">
                Organización de planteles por color (ej. 2013 Blanco, Sub 13 Azul) y divisiones federadas (Pre-Infantiles, U13, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewBlockModal(true)}
              className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-white/20 shadow"
            >
              <Palette className="w-4 h-4 text-sky-400" />
              <span>Nuevo Bloque de Color</span>
            </button>
            <button
              onClick={() => setShowNewCategoryModal(true)}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría de Bloque</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Global Filter Bar */}
      <div className="p-4 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Integrated Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar categoría, jugador por DNI, apellido o bloque de color (ej: '2013', 'blanco', 'U13')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Discipline Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Deporte:</span>
            <select
              value={selectedDisciplineId}
              onChange={(e) => {
                setSelectedDisciplineId(e.target.value);
                setSelectedTier('all');
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todas las disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color Block Selector Tabs (Visualizar cada grupo en conjunto) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              Filtrar y Visualizar por Bloque de Color en Conjunto:
            </span>
            <span className="text-xs text-sky-400 font-mono font-semibold">
              {filteredCategories.length} categorías · {scopedPlayers.length} deportistas
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedBlockId('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedBlockId === 'all'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span>Todos los Bloques</span>
            </button>

            {colorBlocks.map((block) => {
              const isSelected = selectedBlockId === block.id;
              return (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-slate-800 text-white border-white/60 shadow-md ring-1 ring-white/30'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: block.colorHex }}
                  />
                  <span>{block.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sports Division Tiers Selector */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
              Jerarquía Deportiva:
            </span>
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedTier === 'all' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas las Jerarquías
            </button>
            {activeTiers.map((t) => (
              <button
                key={t.tier}
                onClick={() => setSelectedTier(t.tier)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedTier === t.tier ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title={t.ageRange}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main View: Grid of Categories with Color Blocks and Players Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): Categories Organized by Color Block & Tier */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Planteles del Bloque Seleccionado
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {filteredCategories.length} planteles activos
            </span>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center bg-[#0C162D] border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No se encontraron categorías que coincidan con el bloque o filtro seleccionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCategories.map((cat) => {
                const count = players.filter(p => p.categoryId === cat.id).length;
                const disc = disciplines.find(d => d.id === cat.disciplineId);

                // Detect color tag
                const isBlanco = cat.colorBlockName === 'Blanco' || cat.name.toLowerCase().includes('blanco');
                const isAzul = cat.colorBlockName === 'Azul' || cat.name.toLowerCase().includes('azul');
                const isRojo = cat.colorBlockName === 'Rojo' || cat.name.toLowerCase().includes('rojo');
                const isOro = cat.colorBlockName === 'Oro' || cat.name.toLowerCase().includes('oro');

                const badgeBg = isBlanco ? 'bg-white/10 text-white border-white/30'
                  : isAzul ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : isRojo ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isOro ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                return (
                  <div
                    key={cat.id}
                    onClick={() => onSelectCategory && onSelectCategory(cat)}
                    className="p-4 rounded-2xl border border-slate-800 bg-[#0C162D] hover:border-sky-500/50 hover:bg-slate-900 transition cursor-pointer flex flex-col justify-between space-y-3 shadow-sm group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                          {cat.colorBlockName || (isBlanco ? 'Bloque Blanco' : isAzul ? 'Bloque Azul' : 'Plantel')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cat.divisionTier || 'Infantiles'}
                        </span>
                      </div>

                      <h5 className="font-bold text-white text-sm group-hover:text-sky-400 transition">
                        {cat.name}
                      </h5>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {disc?.name} · {cat.ageGroup}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-white font-mono">{count}</strong> fichas
                      </span>
                      <span className="font-mono text-sky-400 font-bold">
                        ${cat.monthlyFee.toLocaleString('es-AR')}/mes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Roster of Players in this Block */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-[#1B2B4C] bg-[#0C162D] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Padrón Consolidado del Bloque
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Deportistas inscriptos en el grupo visualizado
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {scopedPlayers.length} jugadores
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {scopedPlayers.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No hay deportistas vinculados a este bloque.
              </div>
            ) : (
              scopedPlayers.map((player) => {
                const cat = categories.find(c => c.id === player.categoryId);
                return (
                  <div 
                    key={player.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{player.firstName} {player.lastName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {cat?.name || 'Categoría'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        DNI: {player.dni} · Saldo: ${player.balance.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      player.balance === 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {player.balance === 0 ? 'Al Día' : 'Con Saldo'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Bloque de Color */}
      {showNewBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                Crear Nuevo Bloque por Color
              </h4>
              <button onClick={() => setShowNewBlockModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateColorBlock} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre del Bloque</label>
                <input
                  type="text"
                  placeholder="Ej: Bloque Blanco, Bloque Azul, Bloque Oro..."
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Color Distintivo del Bloque</label>
                <div className="flex items-center gap-2 pt-1">
                  {['#FFFFFF', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0F172A'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewBlockColor(c)}
                      className={`w-7 h-7 rounded-full border cursor-pointer transition flex items-center justify-center ${
                        newBlockColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newBlockColor === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Registrar Bloque de Color
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Categoría de Bloque */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Nueva Categoría de Bloque Deportivo
              </h4>
              <button onClick={() => setShowNewCategoryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre de la Categoría</label>
                <input
                  type="text"
                  placeholder="Ej: 2013 Blanco, Sub 13 Blanco, U13 Azul, Pre-Infantiles..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Deporte</label>
                  <select
                    value={newCatDisciplineId}
                    onChange={(e) => setNewCatDisciplineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bloque de Color</label>
                  <select
                    value={newCatBlockId}
                    onChange={(e) => setNewCatBlockId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    {colorBlocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jerarquía Deportiva</label>
                  <select
                    value={newCatTier}
                    onChange={(e) => setNewCatTier(e.target.value as SportsDivisionTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    {activeTiers.map(t => (
                      <option key={t.tier} value={t.tier}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cuota Mensual ($ ARS)</label>
                  <input
                    type="number"
                    value={newCatFee}
                    onChange={(e) => setNewCatFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    const blk = colorBlocks.find(b => b.id === newCatBlockId);
                    try {
                      await dataActions.createCategory(currentClub.id, {
                        disciplineId: newCatDisciplineId,
                        name: newCatName.trim(),
                        ageGroup: newCatAgeGroup,
                        gender: 'Masculino',
                        monthlyFee: newCatFee,
                        colorBlockId: newCatBlockId,
                        colorBlockName: blk?.name.replace('Bloque ', '') || 'Blanco',
                        colorHex: blk?.colorHex || '#FFFFFF',
                        divisionTier: newCatTier
                      } as any, currentUser);
                      onRefreshData();
                      setShowNewCategoryModal(false);
                      setNewCatName('');
                    } catch (err: any) {
                      alert(err.message || 'Error al crear la categoría');
                    }
                  }}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Guardar Categoría de Bloque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
