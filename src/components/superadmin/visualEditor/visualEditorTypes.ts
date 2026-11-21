export type VisualElementType = 
  | 'header'
  | 'stat_card'
  | 'banner'
  | 'quick_action'
  | 'text_block'
  | 'image_block'
  | 'button_custom'
  | 'widget_recent_payments'
  | 'widget_categories'
  | 'divider'
  | 'spacer';

export interface VisualElement {
  id: string;
  type: VisualElementType;
  title: string;
  subtitle?: string;
  value?: string;
  subValue?: string;
  badgeText?: string;
  buttonText?: string;
  imageUrl?: string;
  iconName?: string;
  cardLayout?: 'standard' | 'minimal' | 'hero' | 'metric';
  padding?: 'compact' | 'normal' | 'relaxed';
  // Positioning & Dimensions
  x: number; // grid or px
  y: number;
  width: number; // percentage or cols (1 to 12)
  height?: number; // px or auto
  colSpan: number; // 1 to 12 for responsive grid
  // Background & Glassmorphism
  bgType: 'color' | 'gradient' | 'image' | 'transparent';
  bgColor: string;
  bgGradient?: string;
  bgImageUrl?: string;
  opacity: number; // 0 to 100
  blur: number; // 0 to 20 px
  overlayDarkness: number; // 0 to 100
  // Borders & Shadows
  borderWidth: number;
  borderColor: string;
  borderRadius: string; // 'rounded-none' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl'
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  // Typography
  textColor: string;
  accentColor?: string;
  fontFamily: string;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight: 'normal' | 'medium' | 'bold' | 'extrabold' | 'black';
  textAlign: 'left' | 'center' | 'right';
  // State
  isVisible: boolean;
  isLocked: boolean; // cannot be moved or deleted
  zIndex: number;
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image';
  color: string;
  gradient: string;
  imageUrl?: string;
  opacity: number; // 0 to 100
  blur: number; // 0 to 20px
  overlayDarkness: number; // 0 to 100
}

export interface DesignVersion {
  version: string;
  timestamp: string;
  author: string;
  changeNote: string;
  elements: VisualElement[];
  backgroundConfig: BackgroundConfig;
}

export interface SavedDesign {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  status: 'borrador' | 'publicado' | 'archivado';
  currentVersion: string;
  publishedTo: 'none' | 'this_club' | 'selected_clubs' | 'all_clubs';
  publishedClubNames?: string[];
  createdAt: string;
  updatedAt: string;
  elements: VisualElement[];
  backgroundConfig: BackgroundConfig;
  versions: DesignVersion[];
  referenceImageUrl?: string;
  referenceImageOpacity?: number;
}

export interface VisualTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  accentColor: string;
  backgroundConfig: BackgroundConfig;
  elements: VisualElement[];
}
