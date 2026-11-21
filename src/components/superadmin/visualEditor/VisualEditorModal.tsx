import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Rocket, 
  Eye, 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Camera, 
  Check, 
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { Club, User } from '../../../types/fraovia';
import { 
  SavedDesign, 
  VisualElement, 
  VisualElementType, 
  BackgroundConfig 
} from './visualEditorTypes';
import { visualDesignService } from '../../../services/visualDesignService';
import { VisualEditorCanvas } from './VisualEditorCanvas';
import { VisualEditorLeftPanel } from './VisualEditorLeftPanel';
import { VisualEditorPropertiesPanel } from './VisualEditorPropertiesPanel';
import { VisualEditorPreviewModal } from './VisualEditorPreviewModal';
import { PublishDesignModal } from './PublishDesignModal';

interface VisualEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  allClubs: Club[];
  currentUser: User;
  onRefreshData: () => void;
  initialDesignId?: string;
}

export const VisualEditorModal: React.FC<VisualEditorModalProps> = ({
  isOpen,
  onClose,
  club,
  allClubs,
  currentUser,
  onRefreshData,
  initialDesignId
}) => {
  // All designs
  const [allDesigns, setAllDesigns] = useState<SavedDesign[]>([]);
  // Active design loaded
  const [currentDesign, setCurrentDesign] = useState<SavedDesign | null>(null);
  // Selected element ID in canvas
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  // Device view
  const [device, setDevice] = useState<'pc' | 'laptop' | 'tablet' | 'mobile'>('pc');
  // Reference image overlay toggle
  const [isOverlayActive, setIsOverlayActive] = useState(true);
  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load designs on open
  useEffect(() => {
    if (!isOpen) return;

    const list = visualDesignService.getAllDesigns();
    setAllDesigns(list);

    // Pick target design
    if (initialDesignId) {
      const match = list.find(d => d.id === initialDesignId);
      if (match) {
        setCurrentDesign(JSON.parse(JSON.stringify(match)));
        return;
      }
    }

    // Default: find design for this club or create one
    const clubDesign = list.find(d => d.clubId === club.id);
    if (clubDesign) {
      setCurrentDesign(JSON.parse(JSON.stringify(clubDesign)));
    } else {
      const created = visualDesignService.createNewDesign(club);
      setCurrentDesign(created);
      setAllDesigns(visualDesignService.getAllDesigns());
    }
  }, [isOpen, initialDesignId, club.id]);

  if (!isOpen || !currentDesign) return null;

  // Selected element object
  const selectedElement = currentDesign.elements.find(el => el.id === selectedElementId) || null;

  // 1. ADD ELEMENT
  const handleAddElement = (type: VisualElementType) => {
    const newId = `el-${type}-${Date.now().toString(36)}`;
    
    let defaultTitle = 'Nuevo Bloque';
    let defaultColSpan = 6;
    let defaultBgColor = '#0B132B';
    let defaultValue = undefined;
    let defaultSubValue = undefined;
    let defaultButtonText = undefined;
    let defaultBadgeText = undefined;

    switch (type) {
      case 'header':
        defaultTitle = 'TÍTULO DEL ENCABEZADO';
        defaultColSpan = 12;
        defaultBadgeText = 'COMUNICADO OFICIAL';
        defaultButtonText = 'Ver Más';
        break;
      case 'stat_card':
        defaultTitle = 'Métrica Deportiva';
        defaultValue = '$120.000';
        defaultSubValue = '↑ 8% este período';
        defaultColSpan = 4;
        break;
      case 'banner':
        defaultTitle = 'TORNEO DE PRIMAVERA';
        defaultColSpan = 8;
        defaultBadgeText = 'INSCRIPCIONES';
        defaultButtonText = 'Inscribirme';
        break;
      case 'quick_action':
        defaultTitle = 'Accesos Rápidos';
        defaultColSpan = 4;
        break;
      case 'button_custom':
        defaultTitle = 'Botón Destacado';
        defaultButtonText = '¡Hacer Clic Aquí!';
        defaultColSpan = 4;
        break;
      case 'divider':
        defaultTitle = 'Separador';
        defaultColSpan = 12;
        break;
      case 'spacer':
        defaultTitle = 'Espaciador';
        defaultColSpan = 12;
        break;
      default:
        defaultTitle = 'Bloque Personalizado';
        defaultColSpan = 6;
    }

    const newElement: VisualElement = {
      id: newId,
      type,
      title: defaultTitle,
      subtitle: type === 'header' || type === 'banner' ? 'Subtítulo o descripción descriptiva.' : undefined,
      value: defaultValue,
      subValue: defaultSubValue,
      badgeText: defaultBadgeText,
      buttonText: defaultButtonText,
      x: 0,
      y: currentDesign.elements.length,
      width: 100,
      colSpan: defaultColSpan,
      bgType: 'color',
      bgColor: defaultBgColor,
      opacity: 80,
      blur: 8,
      overlayDarkness: 20,
      borderWidth: 1,
      borderColor: 'rgba(56,189,248,0.2)',
      borderRadius: 'rounded-2xl',
      shadow: 'md',
      textColor: '#FFFFFF',
      accentColor: '#38BDF8',
      fontFamily: 'Inter',
      fontSize: 'base',
      fontWeight: 'bold',
      textAlign: 'left',
      isVisible: true,
      isLocked: false,
      zIndex: 1
    };

    const updatedElements = [...currentDesign.elements, newElement];
    setCurrentDesign({
      ...currentDesign,
      elements: updatedElements
    });
    setSelectedElementId(newId);
    showToast(`Elemento agregado: ${type}`);
  };

  // 2. UPDATE ELEMENT
  const handleUpdateElement = (updated: VisualElement) => {
    const updatedElements = currentDesign.elements.map(el => 
      el.id === updated.id ? updated : el
    );
    setCurrentDesign({
      ...currentDesign,
      elements: updatedElements
    });
  };

  // 3. DUPLICATE ELEMENT
  const handleDuplicateElement = (elementId: string) => {
    const original = currentDesign.elements.find(el => el.id === elementId);
    if (!original) return;

    const copyId = `el-${original.type}-${Date.now().toString(36)}`;
    const copy: VisualElement = {
      ...JSON.parse(JSON.stringify(original)),
      id: copyId,
      title: `${original.title} (Copia)`
    };

    const idx = currentDesign.elements.findIndex(el => el.id === elementId);
    const updated = [...currentDesign.elements];
    updated.splice(idx + 1, 0, copy);

    setCurrentDesign({
      ...currentDesign,
      elements: updated
    });
    setSelectedElementId(copyId);
    showToast('Elemento duplicado');
  };

  // 4. DELETE ELEMENT
  const handleDeleteElement = (elementId: string) => {
    const updated = currentDesign.elements.filter(el => el.id !== elementId);
    setCurrentDesign({
      ...currentDesign,
      elements: updated
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
    showToast('Elemento eliminado');
  };

  // 5. MOVE ELEMENT (UP / DOWN)
  const handleMoveElement = (elementId: string, direction: 'up' | 'down') => {
    const idx = currentDesign.elements.findIndex(el => el.id === elementId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentDesign.elements.length) return;

    const updated = [...currentDesign.elements];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);

    setCurrentDesign({
      ...currentDesign,
      elements: updated
    });
  };

  // 6. UPDATE BACKGROUND CONFIG
  const handleUpdateBackgroundConfig = (updatedBg: BackgroundConfig) => {
    setCurrentDesign({
      ...currentDesign,
      backgroundConfig: updatedBg
    });
  };

  // 7. SAVE DRAFT (💾 GUARDAR BORRADOR)
  const handleSaveDraft = () => {
    const saved = visualDesignService.saveDraft(currentDesign);
    setCurrentDesign(saved);
    setAllDesigns(visualDesignService.getAllDesigns());
    showToast('💾 Borrador guardado con éxito. No afecta al club hasta publicar.');
  };

  // 8. DUPLICATE DESIGN
  const handleDuplicateDesign = (designId: string) => {
    const duplicated = visualDesignService.duplicateDesign(designId);
    setAllDesigns(visualDesignService.getAllDesigns());
    setCurrentDesign(duplicated);
    showToast(`Diseño duplicado: "${duplicated.name}"`);
  };

  // 9. RENAME DESIGN
  const handleRenameDesign = (designId: string, newName: string) => {
    const renamed = visualDesignService.renameDesign(designId, newName);
    setAllDesigns(visualDesignService.getAllDesigns());
    if (currentDesign.id === designId) {
      setCurrentDesign(renamed);
    }
    showToast('Diseño renombrado');
  };

  // 10. ARCHIVE DESIGN
  const handleArchiveDesign = (designId: string) => {
    const updated = visualDesignService.archiveDesign(designId);
    setAllDesigns(visualDesignService.getAllDesigns());
    if (currentDesign.id === designId) {
      setCurrentDesign(updated);
    }
    showToast(`Diseño marcado como ${updated.status}`);
  };

  // 11. DELETE DESIGN
  const handleDeleteDesign = (designId: string) => {
    if (allDesigns.length <= 1) {
      alert('No puedes eliminar el único diseño.');
      return;
    }
    visualDesignService.deleteDesign(designId);
    const updatedList = visualDesignService.getAllDesigns();
    setAllDesigns(updatedList);
    if (currentDesign.id === designId) {
      setCurrentDesign(updatedList[0]);
    }
    showToast('Diseño eliminado');
  };

  // 12. NEW DESIGN
  const handleNewDesign = () => {
    const created = visualDesignService.createNewDesign(club);
    setAllDesigns(visualDesignService.getAllDesigns());
    setCurrentDesign(created);
    showToast('Nuevo diseño creado como borrador');
  };

  // 13. RESTORE VERSION (↩ RESTAURAR VERSIÓN ANTERIOR)
  const handleRestoreVersion = (versionNum: string) => {
    const restored = visualDesignService.restoreVersion(currentDesign.id, versionNum);
    setCurrentDesign(restored);
    setAllDesigns(visualDesignService.getAllDesigns());
    showToast(`↩ Versión ${versionNum} restaurada exitosamente`);
  };

  // 14. CONFIRM PUBLISH (🚀 PUBLICAR)
  const handleConfirmPublish = (
    target: 'this_club' | 'selected_clubs' | 'all_clubs',
    selectedClubIds: string[]
  ) => {
    const result = visualDesignService.publishDesign(
      currentDesign.id,
      target,
      selectedClubIds,
      allClubs,
      currentUser
    );

    setCurrentDesign(result.updatedDesign);
    setAllDesigns(visualDesignService.getAllDesigns());
    setIsPublishOpen(false);
    onRefreshData();
    showToast(`🚀 ¡Publicado con éxito! Implementado en ${result.affectedClubsCount} club(es).`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070D1E] text-slate-100 flex flex-col overflow-hidden">
      {/* =========================================================
          TOP BAR (TIPO CANVA / FIGMA)
          ========================================================= */}
      <header className="h-14 bg-[#0B132B] border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 z-40 select-none">
        {/* Left: Back + Club Badge + Editor Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-800"
            title="Volver a la vista del club"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">← {club.name}</span>
            <span className="sm:hidden">← Salir</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>🖌️</span>
              <span>EDITOR VISUAL</span>
            </span>

            {/* Status indicator */}
            {currentDesign.status === 'publicado' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                🟢 {currentDesign.currentVersion}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                🟡 Borrador
              </span>
            )}
          </div>
        </div>

        {/* Center: Device Switcher (PC, Laptop, Tablet, Móvil) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('pc')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
              device === 'pc' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('laptop')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
              device === 'laptop' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
              device === 'tablet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
              device === 'mobile' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Móvil</span>
          </button>
        </div>

        {/* Right Actions: Referencia, Vista Previa, Guardar Borrador, Publicar */}
        <div className="flex items-center gap-2">
          {currentDesign.referenceImageUrl && (
            <button
              type="button"
              onClick={() => setIsOverlayActive(!isOverlayActive)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isOverlayActive 
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
              title="Alternar imagen de referencia en canvas"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Guía</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-700"
            title="Ver pantalla completa como la verá el club"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Vista previa</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition cursor-pointer border border-slate-700 shadow"
            title="Guardar borrador sin afectar al club"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guardar Borrador</span>
            <span className="sm:hidden">Guardar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25"
            title="Publicar e implementar diseño en el club"
          >
            <Rocket className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publicar</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN 3-COLUMN WORKSPACE: LEFT PANEL | CANVAS | PROPERTIES
          ========================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Elementos, Fondos, Referencia, Mis Creaciones, Versiones */}
        <VisualEditorLeftPanel
          onAddElement={handleAddElement}
          backgroundConfig={currentDesign.backgroundConfig}
          onUpdateBackgroundConfig={handleUpdateBackgroundConfig}
          referenceImageUrl={currentDesign.referenceImageUrl}
          referenceImageOpacity={currentDesign.referenceImageOpacity ?? 40}
          onUpdateReferenceImage={(url) => {
            setCurrentDesign({ ...currentDesign, referenceImageUrl: url });
          }}
          onUpdateReferenceOpacity={(op) => {
            setCurrentDesign({ ...currentDesign, referenceImageOpacity: op });
          }}
          isOverlayActive={isOverlayActive}
          onToggleOverlay={() => setIsOverlayActive(!isOverlayActive)}
          allDesigns={allDesigns}
          currentDesignId={currentDesign.id}
          onSelectDesign={(d) => {
            setCurrentDesign(JSON.parse(JSON.stringify(d)));
            setSelectedElementId(null);
          }}
          onDuplicateDesign={handleDuplicateDesign}
          onRenameDesign={handleRenameDesign}
          onArchiveDesign={handleArchiveDesign}
          onDeleteDesign={handleDeleteDesign}
          onNewDesign={handleNewDesign}
          onPreviewDesign={(d) => {
            setCurrentDesign(d);
            setIsPreviewOpen(true);
          }}
          versions={currentDesign.versions}
          currentVersion={currentDesign.currentVersion}
          onRestoreVersion={handleRestoreVersion}
        />

        {/* Central Design Canvas */}
        <VisualEditorCanvas
          club={club}
          currentUser={currentUser}
          elements={currentDesign.elements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onMoveElement={handleMoveElement}
          backgroundConfig={currentDesign.backgroundConfig}
          device={device}
          referenceImageUrl={currentDesign.referenceImageUrl}
          referenceImageOpacity={currentDesign.referenceImageOpacity ?? 40}
          isOverlayActive={isOverlayActive}
        />

        {/* Right Properties Panel */}
        <VisualEditorPropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          backgroundConfig={currentDesign.backgroundConfig}
          onUpdateBackgroundConfig={handleUpdateBackgroundConfig}
        />
      </div>

      {/* =========================================================
          TOAST NOTIFICATION
          ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 border border-amber-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-bounce backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          MODAL: VISTA PREVIA LIMPIA
          ========================================================= */}
      <VisualEditorPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        design={currentDesign}
        club={club}
        onOpenPublishModal={() => {
          setIsPreviewOpen(false);
          setIsPublishOpen(true);
        }}
      />

      {/* =========================================================
          MODAL: IMPLEMENTAR DISEÑO / PUBLICAR
          ========================================================= */}
      <PublishDesignModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        design={currentDesign}
        currentClub={club}
        allClubs={allClubs}
        onConfirmPublish={handleConfirmPublish}
      />
    </div>
  );
};
