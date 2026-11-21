import React, { useState, useRef } from 'react';
import { 
  X, 
  Palette, 
  Sparkles, 
  Sliders, 
  Upload, 
  Check, 
  Layers, 
  Image as ImageIcon,
  Type,
  Eye,
  Zap,
  Copy,
  Trash2,
  Move,
  RotateCw,
  Maximize2,
  Minimize2,
  Shield,
  Lightbulb,
  Columns,
  Download,
  Plus,
  Edit3,
  MousePointer,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Club, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { compressAndConvertToWebP, formatBytes } from '../../utils/imageOptimizer';

export interface FloatingElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  // Position
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  size: number; // width in px or font size in px
  opacity: number; // 0.1 to 1.0
  rotation: number; // -180 to 180 degrees
  zIndex: number; // 1 to 50
  // Image props
  imageUrl?: string;
  imageFormat?: string;
  // Text props
  text?: string;
  fontFamily?: 'sans' | 'impact' | 'serif' | 'mono' | 'brush';
  orientation?: 'horizontal' | 'vertical';
  style3D?: 'none' | 'solid' | 'outline' | '3d-pop' | 'neon';
  textColor?: string;
  shadowColor?: string;
  // Shape props
  shapeType?: 'diagonal-stripe' | 'spotlight' | 'shield-badge' | 'carbon-mesh';
  shapeColor?: string;
}

export interface ScreenCustomizationState {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  headerTitle: string;
  headerSubtitle: string;
  coverUrl: string;
  borderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  cardShadow: 'none' | 'soft' | 'glow';
  elements: FloatingElement[];
  // Editable blocks
  statsBlockTitle: string;
  statsCard1Title: string;
  statsCard1Value: string;
  statsCard2Title: string;
  statsCard2Value: string;
  ctaButtonText: string;
  ctaButtonColor: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  createdAt: string;
  state: ScreenCustomizationState;
}

interface CanvaPageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  onApplyTemplate: () => void;
}

const DEFAULT_PRESETS: { id: string; name: string; category: string; primary: string; secondary: string; bg: string; desc: string }[] = [
  { id: 'elite-zafiro', name: 'Élite Deportivo Zafiro', category: 'Alto Rendimiento', primary: '#0072FF', secondary: '#00E5FF', bg: '#070D1E', desc: 'Resplandores azul eléctrico, bordes squircle y estética aerodinámica.' },
  { id: 'campeon-gold', name: 'Torneo Champion Gold', category: 'Competición VIP', primary: '#F59E0B', secondary: '#EF4444', bg: '#0F172A', desc: 'Acentos dorados y contrastes intensos para torneos y copas.' },
  { id: 'corporativo-verde', name: 'Institucional Esmeralda', category: 'Club Social', primary: '#10B981', secondary: '#0284C7', bg: '#061A14', desc: 'Diseño sobrio y elegante para comisiones directivas tradicionales.' },
  { id: 'cyber-neon', name: 'Glassmorphism Neón', category: 'Futurista', primary: '#8B5CF6', secondary: '#EC4899', bg: '#0A051B', desc: 'Bordes traslúcidos con reflejo de luz cyan y cards flotantes.' }
];

export const CanvaPageEditorModal: React.FC<CanvaPageEditorModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  onApplyTemplate
}) => {
  if (!isOpen) return null;

  // Active Tool Mode
  const [editorMode, setEditorMode] = useState<'pencil' | 'preview' | 'idea-split' | 'templates'>('pencil');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeInspectorBlock, setActiveInspectorBlock] = useState<'header' | 'banner' | 'stats' | 'buttons' | 'background' | null>(null);

  // Screen State
  const [screenState, setScreenState] = useState<ScreenCustomizationState>(() => {
    return {
      primaryColor: currentClub.branding.primaryColor || '#0072FF',
      secondaryColor: currentClub.branding.secondaryColor || '#00E5FF',
      backgroundColor: '#070D1E',
      headerTitle: currentClub.name,
      headerSubtitle: 'PANEL OFICIAL DE GESTIÓN DEPORTIVA & COMPETENCIA 2026',
      coverUrl: currentClub.branding.coverUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
      borderRadius: 'rounded-2xl',
      cardShadow: 'glow',
      statsBlockTitle: 'Rendimiento y Socios al Día',
      statsCard1Title: 'SOCIOS ACTIVOS',
      statsCard1Value: '342 Deportistas',
      statsCard2Title: 'CUOTAS AL DÍA',
      statsCard2Value: '98.4%',
      ctaButtonText: 'Registrar Cobranza',
      ctaButtonColor: currentClub.branding.primaryColor || '#0072FF',
      elements: [
        {
          id: 'shield-watermark',
          type: 'image',
          x: 82,
          y: 20,
          size: 160,
          opacity: 0.25,
          rotation: 0,
          zIndex: 2,
          imageUrl: currentClub.branding?.badgeUrl || currentClub.logoUrl || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80'
        },
        {
          id: 'title-badge-3d',
          type: 'text',
          x: 15,
          y: 8,
          size: 28,
          opacity: 0.95,
          rotation: 0,
          zIndex: 10,
          text: 'OFICIAL 2026',
          fontFamily: 'impact',
          orientation: 'horizontal',
          style3D: '3d-pop',
          textColor: '#00E5FF',
          shadowColor: '#0072FF'
        }
      ]
    };
  });

  // Idea Replicator State
  const [ideaImageUrl, setIdeaImageUrl] = useState<string | null>(null);
  const [ideaOpacity, setIdeaOpacity] = useState<number>(0.5);
  const [ideaViewMode, setIdeaViewMode] = useState<'split' | 'overlay'>('split');

  // Saved templates list (LocalStorage)
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('fraovia_custom_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newTemplateName, setNewTemplateName] = useState('');

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Convert and add image element with WebP compression
  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressAndConvertToWebP(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.85 });
      const newElem: FloatingElement = {
        id: 'img-' + Date.now(),
        type: 'image',
        x: 50,
        y: 40,
        size: 150,
        opacity: 0.9,
        rotation: 0,
        zIndex: 15,
        imageUrl: res.dataUrl,
        imageFormat: res.format
      };

      setScreenState(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
      setSelectedElementId(newElem.id);
      showToast(`⚡ Imagen agregada y optimizada en formato WebP (${formatBytes(res.originalBytes)} ➔ ${formatBytes(res.compressedBytes)}, -${res.savingsPct}%)`);
    } catch (err: any) {
      alert('Error al procesar imagen: ' + err.message);
    }
  };

  // Upload Idea Image with WebP conversion
  const handleUploadIdea = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressAndConvertToWebP(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });
      setIdeaImageUrl(res.dataUrl);
      setEditorMode('idea-split');
      showToast(`💡 Idea cargada y optimizada a WebP liviano (${formatBytes(res.compressedBytes)}). ¡Ahora puedes replicarla visualmente!`);
    } catch (err: any) {
      alert('Error al subir idea: ' + err.message);
    }
  };

  // Add text element
  const handleAddText = () => {
    const newElem: FloatingElement = {
      id: 'txt-' + Date.now(),
      type: 'text',
      x: 30,
      y: 50,
      size: 26,
      opacity: 1.0,
      rotation: 0,
      zIndex: 20,
      text: 'TEXTO PERSONALIZADO',
      fontFamily: 'impact',
      orientation: 'horizontal',
      style3D: '3d-pop',
      textColor: screenState.secondaryColor,
      shadowColor: screenState.primaryColor
    };
    setScreenState(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
    showToast('Nuevo texto 3D agregado. Puedes moverlo, cambiar la tipografía o ponerlo vertical.');
  };

  // Add background shape
  const handleAddShape = (shapeType: FloatingElement['shapeType']) => {
    const newElem: FloatingElement = {
      id: 'shp-' + Date.now(),
      type: 'shape',
      shapeType,
      x: 50,
      y: 50,
      size: 250,
      opacity: 0.3,
      rotation: 0,
      zIndex: 1,
      shapeColor: screenState.primaryColor
    };
    setScreenState(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
    showToast('Figura de fondo agregada. Posiciónala detrás de los textos.');
  };

  // Remove element
  const handleRemoveElement = (id: string) => {
    setScreenState(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Selected element helper
  const selectedElement = screenState.elements.find(e => e.id === selectedElementId);

  // Update selected element
  const updateSelectedElement = (updates: Partial<FloatingElement>) => {
    if (!selectedElementId) return;
    setScreenState(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === selectedElementId ? { ...e, ...updates } : e)
    }));
  };

  // SAVE AS TEMPLATE (DOES NOT IMPLEMENT TO USER SOFTWARE YET)
  const handleSaveAsDraftTemplate = () => {
    const name = newTemplateName.trim() || `Plantilla Personalizada ${savedTemplates.length + 1}`;
    const newTemplate: SavedTemplate = {
      id: 'tpl-' + Date.now(),
      name,
      createdAt: new Date().toLocaleDateString('es-AR'),
      state: screenState
    };

    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('fraovia_custom_templates', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage limit reached', e);
    }
    setNewTemplateName('');
    showToast(`✓ Plantilla "${name}" guardada en tu biblioteca privada. (NO implementada en el club para que sigas experimentando)`);
  };

  // LOAD TEMPLATE
  const handleLoadTemplate = (tpl: SavedTemplate) => {
    setScreenState(tpl.state);
    showToast(`Plantilla "${tpl.name}" cargada en el lienzo de trabajo.`);
  };

  // IMPLEMENT / DEPLOY TO ACTIVE CLUB SOFTWARE
  const handleDeployToSoftware = () => {
    currentClub.branding.primaryColor = screenState.primaryColor;
    currentClub.branding.secondaryColor = screenState.secondaryColor;
    currentClub.branding.coverUrl = screenState.coverUrl;
    (currentClub.branding as any).screenCustomization = screenState;

    fraoviaDB.updateClub(currentClub, currentUser);
    fraoviaDB.logAudit(
      currentUser,
      'DISENO_VISUAL_APLICADO',
      `Diseño visual con elementos 3D y colores aplicado directamente al software de ${currentClub.name}`,
      'sistema',
      currentClub.id
    );

    showToast(`🚀 ¡Diseño implementado exitosamente en el software del Club ${currentClub.name}!`);
    setTimeout(() => {
      onApplyTemplate();
      onClose();
    }, 1500);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(screenState, null, 2);
    navigator.clipboard.writeText(dataStr);
    showToast('¡Código de plantilla copiado al portapapeles!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-100 animate-in fade-in">
      
      {/* Top Main Toolbar */}
      <div className="h-14 border-b border-slate-800 bg-[#091122] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white">
                Editor Visual de Pantalla (Modo Lápiz WYSIWYG)
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                Sin tocar código
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Toca directamente con el lápiz para modificar textos, agregar fotos WebP, letras 3D y guardar como plantilla.
            </p>
          </div>
        </div>

        {/* View & Tool Mode Selectors */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <button
            onClick={() => { setEditorMode('pencil'); setSelectedElementId(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              editorMode === 'pencil' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Toca cualquier espacio de la pantalla para editarlo directamente"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modo Lápiz</span>
          </button>

          <button
            onClick={() => { setEditorMode('preview'); setSelectedElementId(null); setActiveInspectorBlock(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              editorMode === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Ver cómo queda la pantalla en limpio sin marcas ni lápices"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vista Previa Limpia</span>
          </button>

          <button
            onClick={() => setEditorMode('idea-split')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              editorMode === 'idea-split' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Subir una foto de una idea o boceto y replicarla paso a paso"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subir Idea & Replicar</span>
          </button>

          <button
            onClick={() => setEditorMode('templates')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              editorMode === 'templates' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Ver plantillas guardadas o cargar presets"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plantillas</span>
          </button>
        </div>

        {/* Action Buttons: Guardar Plantilla vs Cargar en Software */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAsDraftTemplate}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
            title="Guardar como borrador o plantilla privada sin implementarla aún en el software"
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Guardar como Plantilla</span>
          </button>

          <button
            onClick={handleDeployToSoftware}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/25"
            title="Implementar este diseño directamente en el software del usuario"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Implementar en Software</span>
          </button>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 shrink-0 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Floating Layer Toolbar (Modo Lápiz) */}
        {editorMode === 'pencil' && (
          <div className="w-full md:w-64 border-r border-slate-800 bg-[#070D1E] p-3 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-48 md:max-h-full">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
              🛠️ Herramientas de Edición Visual
            </span>

            {/* Add Image / Shield button (WebP auto-compress) */}
            <div>
              <label className="w-full p-2.5 rounded-xl border border-dashed border-blue-500/40 hover:bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center gap-2 cursor-pointer text-xs transition">
                <ImageIcon className="w-4 h-4" />
                <span>+ Foto / Escudo (WebP)</span>
                <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
              </label>
              <span className="text-[9px] text-slate-500 block text-center mt-1">
                ⚡ Se optimiza a WebP liviano automático (-85% peso)
              </span>
            </div>

            {/* Add 3D Text Button */}
            <button
              onClick={handleAddText}
              className="w-full p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center gap-2 cursor-pointer text-xs transition"
            >
              <Type className="w-4 h-4" />
              <span>+ Letras 3D / Título Flotante</span>
            </button>

            {/* Add Background Shapes */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">Figuras en el Fondo:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddShape('diagonal-stripe')}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700"
                >
                  Franja Diagonal
                </button>
                <button
                  onClick={() => handleAddShape('spotlight')}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700"
                >
                  Círculo Neón
                </button>
                <button
                  onClick={() => handleAddShape('shield-badge')}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700"
                >
                  Insignia Escudo
                </button>
                <button
                  onClick={() => handleAddShape('carbon-mesh')}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700"
                >
                  Malla Deportiva
                </button>
              </div>
            </div>

            {/* Quick Palette Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Colores Principales:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[9px] text-slate-500 block">Primario:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={screenState.primaryColor}
                      onChange={(e) => setScreenState({ ...screenState, primaryColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <span className="font-mono text-[10px] text-white">{screenState.primaryColor}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-slate-500 block">Secundario:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={screenState.secondaryColor}
                      onChange={(e) => setScreenState({ ...screenState, secondaryColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <span className="font-mono text-[10px] text-white">{screenState.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements Layers List */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 flex-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Capas Activas ({screenState.elements.length}):
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {screenState.elements.map((elem) => (
                  <div
                    key={elem.id}
                    onClick={() => setSelectedElementId(elem.id)}
                    className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer transition ${
                      selectedElementId === elem.id 
                        ? 'bg-purple-950/40 border-purple-500 text-white font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {elem.type === 'image' ? <ImageIcon className="w-3 h-3 text-blue-400 shrink-0" /> :
                       elem.type === 'text' ? <Type className="w-3 h-3 text-purple-400 shrink-0" /> :
                       <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span className="truncate">{elem.text || elem.type}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveElement(elem.id); }}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center: Interactive Canvas Screen */}
        <div className="flex-1 overflow-auto bg-[#040813] p-4 flex flex-col items-center relative">
          
          {/* Top Canvas Helper Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-purple-400" />
              <span>Haz clic sobre el encabezado, tarjetas o botones para editarlos directamente</span>
            </span>
            <span className="font-mono text-purple-300">
              {editorMode === 'preview' ? 'Modo Vista Limpia Activo' : 'Lápiz de Diseño Activo'}
            </span>
          </div>

          {/* THE MOCKUP SCREEN (WYSIWYG LIVE CANVAS) */}
          <div 
            className={`w-full max-w-4xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative select-none transition-all ${
              screenState.cardShadow === 'glow' ? 'shadow-[0_0_50px_rgba(0,114,255,0.15)]' : ''
            }`}
            style={{
              backgroundColor: screenState.backgroundColor,
              minHeight: '520px'
            }}
          >
            {/* BACKGROUND DECORATIVE SHAPES / MESH */}
            {screenState.elements.filter(e => e.type === 'shape').map((elem) => (
              <div
                key={elem.id}
                onClick={() => editorMode === 'pencil' && setSelectedElementId(elem.id)}
                className={`absolute pointer-events-auto cursor-pointer transition-all ${selectedElementId === elem.id ? 'ring-2 ring-amber-400' : ''}`}
                style={{
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  transform: `translate(-50%, -50%) rotate(${elem.rotation}deg)`,
                  opacity: elem.opacity,
                  zIndex: elem.zIndex
                }}
              >
                {elem.shapeType === 'diagonal-stripe' && (
                  <div 
                    className="w-96 h-12"
                    style={{ background: `linear-gradient(90deg, transparent, ${elem.shapeColor || screenState.primaryColor}, transparent)` }}
                  />
                )}
                {elem.shapeType === 'spotlight' && (
                  <div 
                    className="w-64 h-64 rounded-full filter blur-3xl"
                    style={{ backgroundColor: elem.shapeColor || screenState.secondaryColor }}
                  />
                )}
                {elem.shapeType === 'shield-badge' && (
                  <div 
                    className="w-48 h-48 border-4 border-dashed rounded-3xl"
                    style={{ borderColor: elem.shapeColor || screenState.primaryColor }}
                  />
                )}
                {elem.shapeType === 'carbon-mesh' && (
                  <div 
                    className="w-96 h-64 opacity-20"
                    style={{ background: `radial-gradient(circle, ${elem.shapeColor} 10%, transparent 11%)`, backgroundSize: '16px 16px' }}
                  />
                )}
              </div>
            ))}

            {/* FLOATING IMAGES & SHIELDS */}
            {screenState.elements.filter(e => e.type === 'image' && e.imageUrl && e.imageUrl.trim()).map((elem) => (
              <div
                key={elem.id}
                onClick={() => editorMode === 'pencil' && setSelectedElementId(elem.id)}
                className={`absolute cursor-pointer transition-transform ${selectedElementId === elem.id ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black' : ''}`}
                style={{
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  transform: `translate(-50%, -50%) rotate(${elem.rotation}deg)`,
                  opacity: elem.opacity,
                  zIndex: elem.zIndex,
                  width: `${elem.size}px`
                }}
              >
                <img 
                  src={elem.imageUrl} 
                  alt="Elemento flotante" 
                  className="w-full h-auto object-contain drop-shadow-xl" 
                />
              </div>
            ))}

            {/* FLOATING 3D TEXTS (Horizontal / Vertical) */}
            {screenState.elements.filter(e => e.type === 'text').map((elem) => {
              const fontClass = 
                elem.fontFamily === 'impact' ? 'font-black tracking-wider uppercase' :
                elem.fontFamily === 'serif' ? 'font-serif font-black' :
                elem.fontFamily === 'mono' ? 'font-mono font-bold' :
                'font-extrabold';

              const shadow3D = elem.style3D === '3d-pop'
                ? `2px 2px 0px ${elem.shadowColor || '#0072FF'}, 4px 4px 0px #030712, 6px 6px 12px rgba(0,0,0,0.8)`
                : elem.style3D === 'neon'
                ? `0 0 10px ${elem.textColor}, 0 0 20px ${elem.shadowColor}`
                : 'none';

              return (
                <div
                  key={elem.id}
                  onClick={() => editorMode === 'pencil' && setSelectedElementId(elem.id)}
                  className={`absolute cursor-pointer select-none transition-transform ${selectedElementId === elem.id ? 'ring-2 ring-purple-400 p-1 rounded' : ''}`}
                  style={{
                    left: `${elem.x}%`,
                    top: `${elem.y}%`,
                    transform: `translate(-50%, -50%) rotate(${elem.rotation}deg)`,
                    opacity: elem.opacity,
                    zIndex: elem.zIndex,
                    writingMode: elem.orientation === 'vertical' ? 'vertical-rl' : 'horizontal-tb'
                  }}
                >
                  <span
                    className={`${fontClass} leading-none block`}
                    style={{
                      fontSize: `${elem.size}px`,
                      color: elem.style3D === 'outline' ? 'transparent' : elem.textColor,
                      WebkitTextStroke: elem.style3D === 'outline' ? `2px ${elem.textColor}` : 'none',
                      textShadow: shadow3D
                    }}
                  >
                    {elem.text}
                  </span>
                </div>
              );
            })}

            {/* SCREEN COMPONENT: Top Header Bar */}
            <div 
              onClick={() => editorMode === 'pencil' && setActiveInspectorBlock('header')}
              className={`p-4 border-b border-white/10 flex items-center justify-between relative cursor-pointer group transition ${
                activeInspectorBlock === 'header' ? 'ring-2 ring-purple-500' : 'hover:bg-white/5'
              }`}
              style={{
                background: `linear-gradient(90deg, ${screenState.primaryColor}20 0%, #03071280 100%)`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg"
                  style={{ backgroundColor: screenState.primaryColor }}
                >
                  {currentClub.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-wide uppercase">
                    {screenState.headerTitle}
                  </h2>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {screenState.headerSubtitle}
                  </p>
                </div>
              </div>

              {editorMode === 'pencil' && (
                <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Encabezado</span>
                </span>
              )}
            </div>

            {/* SCREEN COMPONENT: Hero Banner */}
            <div 
              onClick={() => editorMode === 'pencil' && setActiveInspectorBlock('banner')}
              className={`p-6 sm:p-8 m-4 rounded-2xl relative overflow-hidden cursor-pointer group border border-white/15 transition ${
                activeInspectorBlock === 'banner' ? 'ring-2 ring-purple-500' : 'hover:border-white/30'
              }`}
              style={{
                background: `linear-gradient(135deg, ${screenState.primaryColor}E6 0%, ${screenState.secondaryColor}99 100%)`
              }}
            >
              <div className="relative z-10 max-w-xl space-y-2 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30 font-bold border border-white/20">
                  SISTEMA OFICIAL DE ALTO RENDIMIENTO
                </span>
                <h3 className="text-xl sm:text-2xl font-black drop-shadow-md leading-tight">
                  {screenState.headerTitle} · Temporada 2026
                </h3>
                <p className="text-xs text-white/90 leading-relaxed drop-shadow-sm">
                  Control institucional de planteles, gestión contable, tienda de indumentaria y viajes a torneos.
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (editorMode === 'pencil') setActiveInspectorBlock('buttons'); }}
                    className="px-4 py-2 rounded-xl font-black text-xs text-slate-950 transition shadow-lg cursor-pointer flex items-center gap-1.5"
                    style={{ backgroundColor: screenState.secondaryColor }}
                  >
                    <span>{screenState.ctaButtonText}</span>
                  </button>
                </div>
              </div>

              {editorMode === 'pencil' && (
                <span className="absolute top-3 right-3 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Banner</span>
                </span>
              )}
            </div>

            {/* SCREEN COMPONENT: Metrics & Stat Cards */}
            <div 
              onClick={() => editorMode === 'pencil' && setActiveInspectorBlock('stats')}
              className={`p-4 mx-4 mb-4 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer group transition ${
                activeInspectorBlock === 'stats' ? 'ring-2 ring-purple-500' : 'hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {screenState.statsBlockTitle}
                </span>
                {editorMode === 'pencil' && (
                  <span className="text-[10px] text-purple-400 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Tarjetas</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{screenState.statsCard1Title}</span>
                  <span className="text-base font-black text-white">{screenState.statsCard1Value}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{screenState.statsCard2Title}</span>
                  <span className="text-base font-black text-emerald-400">{screenState.statsCard2Value}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">TORNEOS & VIAJES</span>
                  <span className="text-base font-black text-sky-400">4 En Curso</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ESTADO MÉDICO</span>
                  <span className="text-base font-black text-amber-400">96% Aptos</span>
                </div>
              </div>
            </div>

          </div>

          {/* IDEA SPLIT / OVERLAY COMPARISON BAR */}
          {editorMode === 'idea-split' && (
            <div className="w-full max-w-4xl mt-4 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Modo "Subir una Idea y Replicarla"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 inline mr-1" />
                    <span>Subir Foto de Boceto/Idea</span>
                    <input type="file" accept="image/*" onChange={handleUploadIdea} className="hidden" />
                  </label>
                  {ideaImageUrl && (
                    <button
                      onClick={() => setIdeaImageUrl(null)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Quitar idea
                    </button>
                  )}
                </div>
              </div>

              {ideaImageUrl && ideaImageUrl.trim() ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-amber-300 font-bold">1. LA IDEA QUE SUBISTE:</span>
                    <div className="max-h-64 rounded-xl overflow-hidden border border-amber-500/30 bg-black flex items-center justify-center">
                      <img src={ideaImageUrl} alt="Idea de referencia" className="w-full h-auto object-contain max-h-60" />
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <span className="text-[10px] font-mono text-purple-300 font-bold">2. CÓMO REPLICARLA EN EL SOFTWARE:</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Observa la idea a la izquierda y ve tocando con el <strong>Modo Lápiz</strong> en tu lienzo arriba. Puedes ajustar los colores primarios para igualar los de la imagen, agregar los logos con el botón <strong>+ Foto WebP</strong> y escribir títulos similares con <strong>+ Letras 3D</strong>.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                      <span className="text-amber-400 font-bold block">✨ Paleta sugerida para aplicar en 1 clic:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setScreenState({ ...screenState, primaryColor: '#0072FF', secondaryColor: '#00E5FF' })}
                          className="px-2 py-1 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold"
                        >
                          Azul Zafiro
                        </button>
                        <button
                          onClick={() => setScreenState({ ...screenState, primaryColor: '#E11D48', secondaryColor: '#FBBF24' })}
                          className="px-2 py-1 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold"
                        >
                          Rojo Fuego & Oro
                        </button>
                        <button
                          onClick={() => setScreenState({ ...screenState, primaryColor: '#10B981', secondaryColor: '#06B6D4' })}
                          className="px-2 py-1 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"
                        >
                          Esmeralda & Cyan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-2">
                  <Lightbulb className="w-8 h-8 mx-auto text-amber-400" />
                  <p className="text-xs">
                    ¿Viste una página web o un diseño de app que te gustó? Toma una captura de pantalla y súbela aquí.
                    Se convertirá a WebP liviana y podrás verla lado a lado para replicar cada botón y color sin tocar código.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SAVED TEMPLATES LIBRARY TAB */}
          {editorMode === 'templates' && (
            <div className="w-full max-w-4xl mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Biblioteca de Plantillas Privadas & Presets Oficiales
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Guarda bocetos que no quieras aplicar de inmediato o recupera plantillas guardadas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Nombre de plantilla..."
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={handleSaveAsDraftTemplate}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    Guardar Actual
                  </button>
                </div>
              </div>

              {/* Saved User Templates */}
              {savedTemplates.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Mis Plantillas Guardadas:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedTemplates.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-xs block">{t.name}</span>
                          <span className="text-[10px] text-slate-500">Creada: {t.createdAt}</span>
                        </div>
                        <button
                          onClick={() => handleLoadTemplate(t)}
                          className="px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs"
                        >
                          Cargar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preset Templates */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Presets del Sistema:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setScreenState(prev => ({ ...prev, primaryColor: p.primary, secondaryColor: p.secondary, backgroundColor: p.bg }));
                        showToast(`Preset '${p.name}' aplicado.`);
                      }}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.desc}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.secondary }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Inspector Panel (When an element or block is selected) */}
        {selectedElement && editorMode === 'pencil' && (
          <div className="w-full md:w-72 border-l border-slate-800 bg-[#070D1E] p-4 flex flex-col gap-3 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Propiedades de Capa</span>
              </span>
              <button onClick={() => setSelectedElementId(null)} className="text-slate-500 hover:text-white text-xs">
                Cerrar
              </button>
            </div>

            {/* Position X & Y Sliders */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Posición Horizontal (X):</span>
                <span className="font-mono text-purple-300 font-bold">{selectedElement.x}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.x}
                onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Posición Vertical (Y):</span>
                <span className="font-mono text-purple-300 font-bold">{selectedElement.y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.y}
                onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Tamaño:</span>
                <span className="font-mono text-purple-300 font-bold">{selectedElement.size}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="350"
                value={selectedElement.size}
                onChange={(e) => updateSelectedElement({ size: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Opacity / Transparency Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Transparencia / Opacidad:</span>
                <span className="font-mono text-purple-300 font-bold">{Math.round(selectedElement.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={selectedElement.opacity}
                onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Rotación:</span>
                <span className="font-mono text-purple-300 font-bold">{selectedElement.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedElement.rotation}
                onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* SPECIFIC TEXT PROPS */}
            {selectedElement.type === 'text' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Texto:</label>
                  <input
                    type="text"
                    value={selectedElement.text || ''}
                    onChange={(e) => updateSelectedElement({ text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                {/* Orientation (Horizontal vs Vertical) */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Orientación del Texto:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => updateSelectedElement({ orientation: 'horizontal' })}
                      className={`py-1.5 rounded-lg border text-xs font-bold ${
                        selectedElement.orientation !== 'vertical' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Horizontal
                    </button>
                    <button
                      onClick={() => updateSelectedElement({ orientation: 'vertical' })}
                      className={`py-1.5 rounded-lg border text-xs font-bold ${
                        selectedElement.orientation === 'vertical' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Vertical (90°)
                    </button>
                  </div>
                </div>

                {/* Typography Family */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tipografía:</label>
                  <select
                    value={selectedElement.fontFamily || 'impact'}
                    onChange={(e) => updateSelectedElement({ fontFamily: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="impact">Bloque Atlético (Impact)</option>
                    <option value="sans">Sans Moderna (Inter)</option>
                    <option value="serif">Serif Tradicional (Elegante)</option>
                    <option value="mono">Cyber / Monospace</option>
                  </select>
                </div>

                {/* 3D Effects */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Efecto 3D / Relieve:</label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { id: '3d-pop', label: 'Efecto 3D' },
                      { id: 'solid', label: 'Con Color Sólido' },
                      { id: 'outline', label: 'Hueco / Sin Color' },
                      { id: 'neon', label: 'Resplandor Neón' }
                    ].map(eff => (
                      <button
                        key={eff.id}
                        onClick={() => updateSelectedElement({ style3D: eff.id as any })}
                        className={`p-1.5 rounded-lg border font-semibold ${
                          selectedElement.style3D === eff.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text & 3D Shadow Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Color Letra:</label>
                    <input
                      type="color"
                      value={selectedElement.textColor || '#FFFFFF'}
                      onChange={(e) => updateSelectedElement({ textColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Color 3D / Sombra:</label>
                    <input
                      type="color"
                      value={selectedElement.shadowColor || '#0072FF'}
                      onChange={(e) => updateSelectedElement({ shadowColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Remove element button */}
            <button
              onClick={() => handleRemoveElement(selectedElement.id)}
              className="mt-3 w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar este elemento</span>
            </button>
          </div>
        )}

        {/* Right Side: Inspector for Clicked Component Block */}
        {!selectedElement && activeInspectorBlock && editorMode === 'pencil' && (
          <div className="w-full md:w-72 border-l border-slate-800 bg-[#070D1E] p-4 flex flex-col gap-3 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar {activeInspectorBlock.toUpperCase()}</span>
              </span>
              <button onClick={() => setActiveInspectorBlock(null)} className="text-slate-500 hover:text-white text-xs">
                Cerrar
              </button>
            </div>

            {activeInspectorBlock === 'header' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Nombre del Club en Cabecera:</label>
                  <input
                    type="text"
                    value={screenState.headerTitle}
                    onChange={(e) => setScreenState({ ...screenState, headerTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Subtítulo de Cabecera:</label>
                  <input
                    type="text"
                    value={screenState.headerSubtitle}
                    onChange={(e) => setScreenState({ ...screenState, headerSubtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
              </div>
            )}

            {activeInspectorBlock === 'banner' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Texto del Botón Central:</label>
                  <input
                    type="text"
                    value={screenState.ctaButtonText}
                    onChange={(e) => setScreenState({ ...screenState, ctaButtonText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">URL de Imagen de Fondo (Opcional):</label>
                  <input
                    type="url"
                    value={screenState.coverUrl}
                    onChange={(e) => setScreenState({ ...screenState, coverUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                  />
                </div>
              </div>
            )}

            {activeInspectorBlock === 'stats' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Título del Bloque:</label>
                  <input
                    type="text"
                    value={screenState.statsBlockTitle}
                    onChange={(e) => setScreenState({ ...screenState, statsBlockTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Tarjeta 1 (Valor):</label>
                  <input
                    type="text"
                    value={screenState.statsCard1Value}
                    onChange={(e) => setScreenState({ ...screenState, statsCard1Value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Tarjeta 2 (Valor):</label>
                  <input
                    type="text"
                    value={screenState.statsCard2Value}
                    onChange={(e) => setScreenState({ ...screenState, statsCard2Value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveInspectorBlock(null)}
              className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs"
            >
              Listo
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
