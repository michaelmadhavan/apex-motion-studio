import { AnyTemplateSettings, RenderContext, TemplateId, TemplateMetadata } from '../types';
import { CardFlipTemplate } from './templates/CardFlipTemplate';
import { CinematicPopupTemplate } from './templates/CinematicPopupTemplate';
import { FloatingCardsTemplate } from './templates/FloatingCardsTemplate';
import { ImageTunnelTemplate } from './templates/ImageTunnelTemplate';
import { OrbitCardsTemplate } from './templates/OrbitCardsTemplate';
import { StaggeredRevealTemplate } from './templates/StaggeredRevealTemplate';

export class TemplateRegistry {
  public static readonly templates: TemplateMetadata[] = [
    {
      id: 'orbit-cards',
      name: 'Orbit Cards',
      description: '3D elliptical planetary orbit with trigonometric depth sorting',
      icon: 'Orbit',
    },
    {
      id: 'card-flip',
      name: '3D Card Flip',
      description: 'Cinematic perspective rotation with natural card flip easing',
      icon: 'Layers',
    },
    {
      id: 'cinematic-popup',
      name: 'Cinematic Pop-up',
      description: 'Impactful scale overshoot with glow ambient settling',
      icon: 'Sparkles',
    },
    {
      id: 'staggered-reveal',
      name: 'Staggered Reveal',
      description: 'Directional linear and grid entrances with smooth cubic offsets',
      icon: 'LayoutGrid',
    },
    {
      id: 'floating-cards',
      name: 'Floating Cards',
      description: 'Organic harmonic levitation with deterministic phase shifts',
      icon: 'Wind',
    },
    {
      id: 'image-tunnel',
      name: 'Image Tunnel',
      description: 'Perspective depth vortex with continuous looping focal flythrough',
      icon: 'Focus',
    },
  ];

  private static instances = {
    'orbit-cards': new OrbitCardsTemplate(),
    'card-flip': new CardFlipTemplate(),
    'cinematic-popup': new CinematicPopupTemplate(),
    'staggered-reveal': new StaggeredRevealTemplate(),
    'floating-cards': new FloatingCardsTemplate(),
    'image-tunnel': new ImageTunnelTemplate(),
  };

  public static getDefaultSettings(id: TemplateId): AnyTemplateSettings {
    switch (id) {
      case 'orbit-cards':
        return { ...OrbitCardsTemplate.defaultSettings };
      case 'card-flip':
        return { ...CardFlipTemplate.defaultSettings };
      case 'cinematic-popup':
        return { ...CinematicPopupTemplate.defaultSettings };
      case 'staggered-reveal':
        return { ...StaggeredRevealTemplate.defaultSettings };
      case 'floating-cards':
        return { ...FloatingCardsTemplate.defaultSettings };
      case 'image-tunnel':
        return { ...ImageTunnelTemplate.defaultSettings };
    }
  }

  public static renderTemplate(
    id: TemplateId,
    ctxRef: RenderContext,
    settings: AnyTemplateSettings
  ) {
    const templateInstance = this.instances[id];
    if (templateInstance && typeof (templateInstance as any).render === 'function') {
      (templateInstance as any).render(ctxRef, settings);
    }
  }
}
