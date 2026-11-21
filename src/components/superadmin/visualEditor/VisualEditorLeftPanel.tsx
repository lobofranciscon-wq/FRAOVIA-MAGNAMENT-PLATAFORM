import React, { useState } from 'react';
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  CreditCard, 
  BarChart2, 
  Sparkles, 
  Layout, 
  Divide, 
  FolderOpen, 
  History, 
  Camera, 
  Palette, 
  Copy, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Trash2,
  Eye,
  Sliders,
  Upload
} from 'lucide-react';
import { 
  VisualElementType, 
  SavedDesign, 
  BackgroundConfig, 
  DesignVersion 
} from './visualEditorTypes';
import { ReferenceImageGuide } from './ReferenceImageGuide';

interface VisualEditorLeftPanelProps {
  onAddElement: (type: VisualElementType) => void;
  backgroundConfig: BackgroundConfig;
  onUpdateBackgroundConfig: (updated: BackgroundConfig) => void;
  referenceImageUrl?: string;
  referenceImageOpacity: number;
  onUpdateReferenceImage: (url?: string) => void;
  onUpdateReferenceOpacity: (opacity: number) => void;
  isOverlayActive: boolean;
  onToggleOverlay: () => void;
  // Mis Creaciones
  allDesigns: SavedDesign[];
  currentDesignId: string;
  onSelectDesign: (design: SavedDesign) => void;
  onDuplicateDesign: (designId: string) => void;
  onRenameDesign: (designId: string, newName: string) => void;
  onArchiveDesign: (designId: string) => void;
  onDeleteDesign: (designId: string) => void;
  onNewDesign: () => void;
  onPreviewDesign: (design: SavedDesign) => void;
  // Versiones
  versions: DesignVersion[];
  currentVersion: string;
  onRestoreVersion: (versionNum: string) => void;
}

export const VisualEditorLeftPanel: React.FC<VisualEditorLeftPanelProps> = ({
  onAddElement,
  backgroundConfig,
  onUpdateBackgroundConfig,
  referenceImageUrl,
  referenceImageOpacity,
  onUpdateReferenceImage,
  onUpdateReferenceOpacity,
  isOverlayActive,
  onToggleOverlay,
  allDesigns,
  currentDesignId,
  onSelectDesign,
  onDuplicateDesign,
  onRenameDesign,
  onArchiveDesign,
  onDeleteDesign,
  onNewDesign,
  onPreviewDesign,
  versions,
  currentVersion,
  onRestoreVersion
}) => {
  const [activeTab, setActiveTab] = useState<'elementos' | 'fondos' | 'referencia' | 'creaciones' | 'versiones'>('elementos');
  const [renamingDesignId, setRenamingDesignId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleStartRename = (design: SavedDesign) => {
    setRenamingDesignId(design.id);
    setRenameInput(design.name);
  };

  const handleSaveRename = (designId: string) => {
    if (renameInput.trim()) {
      onRenameDesign(designId, renameInput.trim());
    }
    setRenamingDesignId(null);
  };

  return (
    <div className="w-80 bg-[#0B132B] border-r border-slate-800 flex flex-col h-full shrink-0 select-none text-slate-100">
      {/* Tab Switcher Icons */}
      <div className="grid grid-cols-5 p-1 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold">
        {[
          { id: 'elementos', label: 'Elementos', icon: Plus },
          { id: 'fondos', label: 'Fondos', icon: Palette },
          { id: 'referencia', label: 'Guía', icon: Camera },
          { id: 'creaciones', label: 'Diseños', icon: FolderOpen },
          { id: 'versiones', label: 'Versión', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition cursor-pointer ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-black shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* =========================================================
            TAB 1: ELEMENTOS
            ========================================================= */}
        {activeTab === 'elementos' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Agregar Componente
              </h3>
              <p className="text-[11px] text-slate-400">
                Haz clic para insertar nuevos bloques visuales al canvas del club.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Básicos & Tipografía
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAddElement('text_block')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center gap-2.5"
                >
                  <Type className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">+ Texto</span>
                    <span className="text-[10px] text-slate-400">Título / párrafo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('image_block')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center gap-2.5"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">+ Imagen</span>
                    <span className="text-[10px] text-slate-400">Foto o banner</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('button_custom')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">+ Botón</span>
                    <span className="text-[10px] text-slate-400">Acción destacada</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('divider')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center gap-2.5"
                >
                  <Divide className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">+ Separador</span>
                    <span className="text-[10px] text-slate-400">Línea divisoria</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tarjetas & Métricas del Club
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onAddElement('header')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Layout className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white block">+ Encabezado / Hero</span>
                      <span className="text-[10px] text-slate-400">Banner institucional superior con título y botón</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('stat_card')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">+ Estadística / KPI</span>
                      <span className="text-[10px] text-slate-400">Tarjeta de métrica con monto, socios y tendencia</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('banner')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="font-bold text-white block">+ Banner Promocional</span>
                      <span className="text-[10px] text-slate-400">Torneos, viajes o avisos con foto de fondo</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('quick_action')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="font-bold text-white block">+ Accesos Directos</span>
                      <span className="text-[10px] text-slate-400">Bloque de botones operativos frecuentes</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('widget_recent_payments')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">+ Widget Cobros Recientes</span>
                      <span className="text-[10px] text-slate-400">Lista en tiempo real de cuotas cobradas</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddElement('widget_categories')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Layout className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-bold text-white block">+ Widget Categorías</span>
                      <span className="text-[10px] text-slate-400">Cuadrícula con disciplinas del club</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: FONDOS (MULTINIVEL)
            ========================================================= */}
        {activeTab === 'fondos' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                Fondo General del Sistema
              </h3>
              <p className="text-[11px] text-slate-400">
                Ajusta el fondo principal sobre el cual se disponen las tarjetas y paneles.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">Tipo de Fondo</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                {(['color', 'gradient', 'image'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onUpdateBackgroundConfig({ ...backgroundConfig, type })}
                    className={`py-1.5 rounded-lg text-center font-bold text-[11px] capitalize transition cursor-pointer ${
                      backgroundConfig.type === type 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type === 'color' ? 'Color' : type === 'gradient' ? 'Degradado' : 'Imagen'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subir imagen de fondo */}
            {backgroundConfig.type === 'image' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">Imagen de Fondo</label>
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video">
                    <img 
                      src={backgroundConfig.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'} 
                      alt="Fondo actual" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:border-amber-400 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subir imagen desde mi PC</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          onUpdateBackgroundConfig({
                            ...backgroundConfig,
                            imageUrl: loadEvent.target?.result as string
                          });
                        };
                        reader.readAsDataURL(file);
                      }} 
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Sliders de fondo */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Opacidad del Fondo:</span>
                  <span className="text-amber-400 font-bold font-mono">{backgroundConfig.opacity}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={backgroundConfig.opacity}
                  onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, opacity: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Desenfoque (Blur):</span>
                  <span className="text-amber-400 font-bold font-mono">{backgroundConfig.blur}px</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={backgroundConfig.blur}
                  onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, blur: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Overlay Oscuro:</span>
                  <span className="text-amber-400 font-bold font-mono">{backgroundConfig.overlayDarkness}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={backgroundConfig.overlayDarkness}
                  onChange={(e) => onUpdateBackgroundConfig({ ...backgroundConfig, overlayDarkness: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: IMAGEN DE REFERENCIA
            ========================================================= */}
        {activeTab === 'referencia' && (
          <ReferenceImageGuide
            referenceImageUrl={referenceImageUrl}
            referenceImageOpacity={referenceImageOpacity}
            onUpdateImage={onUpdateReferenceImage}
            onUpdateOpacity={onUpdateReferenceOpacity}
            isOverlayActive={isOverlayActive}
            onToggleOverlay={onToggleOverlay}
          />
        )}

        {/* =========================================================
            TAB 4: MIS CREACIONES
            ========================================================= */}
        {activeTab === 'creaciones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  MIS CREACIONES
                </h3>
                <p className="text-[11px] text-slate-400">Tus diseños y plantillas guardadas.</p>
              </div>
              <button
                type="button"
                onClick={onNewDesign}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer"
                title="Crear nuevo diseño"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {allDesigns.map(design => {
                const isCurrent = design.id === currentDesignId;

                return (
                  <div
                    key={design.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Estado Badge */}
                        <div className="flex items-center gap-1.5">
                          {design.status === 'publicado' ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                              🟢 Publicado ({design.currentVersion})
                            </span>
                          ) : design.status === 'archivado' ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold flex items-center gap-1">
                              ⚪ Archivado
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
                              🟡 Borrador ({design.currentVersion})
                            </span>
                          )}
                        </div>

                        {renamingDesignId === design.id ? (
                          <div className="flex items-center gap-1 pt-1">
                            <input
                              type="text"
                              value={renameInput}
                              onChange={(e) => setRenameInput(e.target.value)}
                              className="w-full bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs text-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(design.id)}
                              className="px-2 py-1 bg-amber-500 text-slate-950 rounded text-[10px] font-bold"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div className="font-extrabold text-xs text-white truncate">
                            {design.name}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400">
                          Club: {design.clubName}
                        </div>

                        {design.status === 'publicado' && design.publishedClubNames && (
                          <div className="text-[9px] text-emerald-400/90 font-mono">
                            Publicado en: {design.publishedClubNames.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones del Diseño */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[10px]">
                      <div className="flex items-center gap-1">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => onSelectDesign(design)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPreviewDesign(design)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Vista previa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateDesign(design.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Duplicar diseño (crea copia independiente)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(design)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Renombrar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onArchiveDesign(design.id)}
                          className="p-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                          title={design.status === 'archivado' ? 'Desarchivar' : 'Archivar'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        {allDesigns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteDesign(design.id)}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                            title="Eliminar diseño"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: VERSIONES DEL DISEÑO ACTUAL
            ========================================================= */}
        {activeTab === 'versiones' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Historial de Versiones
              </h3>
              <p className="text-[11px] text-slate-400">
                Versión actual: <strong className="text-amber-400 font-mono">{currentVersion}</strong>. Puedes restaurar versiones anteriores en cualquier momento.
              </p>
            </div>

            <div className="space-y-2.5">
              {versions.slice().reverse().map(ver => {
                const isCurrent = ver.version === currentVersion;

                return (
                  <div
                    key={ver.version}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-md' 
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                        {ver.version}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ver.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug mb-2">
                      {ver.changeNote}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800">
                      <span className="text-slate-500">{ver.author}</span>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onRestoreVersion(ver.version)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>↩ Restaurar</span>
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-emerald-400 font-bold">● Versión Activa</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
