export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5';

export interface StudioImage {
  id: string;
  url: string;
  name: string;
  element?: HTMLImageElement;
  width?: number;
  height?: number;
}

export type TemplateId =
  | 'orbit-cards'
  | 'card-flip'
  | 'cinematic-popup'
  | 'staggered-reveal'
  | 'floating-cards'
  | 'image-tunnel';

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
}

export interface BaseAnimationSettings {
  duration: number; // in seconds
  speed: number;
  backgroundColor: string;
  backgroundType: 'color' | 'gradient';
  gradientId?: string;
  gradientColors?: [string, string, string];
  gradientRadial?: boolean;
  gradientAngle?: number;
  cardBorderRadius: number;
  cardBorderColor: string;
  cardBorderWidth: number;
  showShadows: boolean;
  loop: boolean;
}

export interface OrbitCardsSettings extends BaseAnimationSettings {
  radiusX: number;
  radiusY: number;
  tiltAngle: number;
  cardWidth: number;
  cardHeight: number;
  direction: 'clockwise' | 'counter-clockwise';
  enableOrientationAlign: boolean;
}

export interface CardFlipSettings extends BaseAnimationSettings {
  flipAxis: 'horizontal' | 'vertical';
  staggerDelay: number;
  perspective: number;
  cardWidth: number;
  cardHeight: number;
  flipCount: number;
}

export interface CinematicPopupSettings extends BaseAnimationSettings {
  staggerDelay: number;
  overshoot: number;
  initialScale: number;
  cardWidth: number;
  cardHeight: number;
  blurGlow: boolean;
}

export interface StaggeredRevealSettings extends BaseAnimationSettings {
  layoutType: 'grid' | 'horizontal' | 'vertical';
  direction: 'bottom' | 'left' | 'top' | 'fade-only';
  staggerDelay: number;
  spacing: number;
  cardWidth: number;
  cardHeight: number;
}

export interface FloatingCardsSettings extends BaseAnimationSettings {
  amplitude: number;
  frequency: number;
  rotationIntensity: number;
  cardWidth: number;
  cardHeight: number;
  spread: number;
}

export interface ImageTunnelSettings extends BaseAnimationSettings {
  tunnelSpeed: number;
  depthSeparation: number;
  maxDistance: number;
  cardWidth: number;
  cardHeight: number;
  spiralIntensity: number;
}

export type AnyTemplateSettings =
  | OrbitCardsSettings
  | CardFlipSettings
  | CinematicPopupSettings
  | StaggeredRevealSettings
  | FloatingCardsSettings
  | ImageTunnelSettings;

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  images: HTMLImageElement[];
  time: number; // in seconds
  progress: number; // 0.0 to 1.0
  aspectRatio: AspectRatioType;
}

export interface ExportSettings {
  resolution: '1080p' | '2K' | '4K';
  frameRate: number;
  bitrateMbps: number;
  format: 'mp4';
}

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  status: 'idle' | 'rendering' | 'encoding' | 'finalizing' | 'completed' | 'error';
  errorMessage?: string;
}
