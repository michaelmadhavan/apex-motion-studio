import { ImageTunnelSettings, RenderContext } from '../../types';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class ImageTunnelTemplate {
  public static defaultSettings: ImageTunnelSettings = {
    duration: 12,
    speed: 1.0,
    backgroundColor: '#040407',
    backgroundType: 'gradient',
    gradientId: 'obsidian-spotlight',
    gradientColors: ['#242432', '#121219', '#050507'],
    gradientRadial: true,
    cardBorderRadius: 16,
    cardBorderColor: 'rgba(255, 255, 255, 0.35)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    tunnelSpeed: 2.0,
    depthSeparation: 650,
    maxDistance: 3200,
    cardWidth: 260,
    cardHeight: 360,
    spiralIntensity: 24,
  };

  public render(ctxRef: RenderContext, settings: ImageTunnelSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const focalLength = 650 * bounds.scaleFactor;
    const maxZ = settings.maxDistance;
    const t = time * settings.speed * settings.tunnelSpeed * 220;

    // Atmospheric center tunnel glow
    const tunnelGlow = ctx.createRadialGradient(
      bounds.centerX,
      bounds.centerY,
      10 * bounds.scaleFactor,
      bounds.centerX,
      bounds.centerY,
      bounds.usableWidth * 0.55
    );
    tunnelGlow.addColorStop(0, 'rgba(190, 24, 71, 0.15)');
    tunnelGlow.addColorStop(0.6, 'rgba(30, 10, 20, 0.05)');
    tunnelGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tunnelGlow;
    ctx.fillRect(0, 0, width, height);

    interface TunnelCard {
      img: HTMLImageElement;
      x: number;
      y: number;
      z: number;
      scale: number;
      alpha: number;
      rot: number;
    }

    const cards: TunnelCard[] = [];
    const totalVirtualCards = count * 2;
    const totalLength = totalVirtualCards * settings.depthSeparation;

    for (let i = 0; i < totalVirtualCards; i++) {
      const img = images[i % count];
      const baseZ = i * settings.depthSeparation;
      const rawZ = baseZ - (t % totalLength);
      const z = ((rawZ % maxZ) + maxZ) % maxZ; // Wrap into [0, maxZ]

      if (z < 70) continue; // Behind camera clipping

      const perspectiveScale = focalLength / (focalLength + z);
      const spiralAngle = (z / 800) * ((settings.spiralIntensity * Math.PI) / 180);

      // Radial placement around tunnel cylinder
      const radius = 330 * bounds.scaleFactor;
      const angle = (i * ((Math.PI * 2) / count)) + spiralAngle;
      const worldX = Math.cos(angle) * radius;
      const worldY = Math.sin(angle) * radius;

      const projX = bounds.centerX + worldX * perspectiveScale;
      const projY = bounds.centerY + worldY * perspectiveScale;

      // Distance fog fade-out
      const alpha = Math.max(0, Math.min(1, 1 - z / maxZ));

      cards.push({
        img,
        x: projX,
        y: projY,
        z,
        scale: perspectiveScale,
        alpha,
        rot: angle + Math.PI / 2,
      });
    }

    // Sort far to near (painter's algorithm)
    cards.sort((a, b) => b.z - a.z);

    for (const card of cards) {
      ctx.save();
      ctx.globalAlpha = card.alpha;
      ctx.translate(card.x, card.y);
      ctx.rotate(card.rot * 0.2);

      const w = settings.cardWidth * bounds.scaleFactor * card.scale;
      const h = settings.cardHeight * bounds.scaleFactor * card.scale;

      drawCoverImage(
        ctx,
        card.img,
        -w / 2,
        -h / 2,
        w,
        h,
        settings.cardBorderRadius * bounds.scaleFactor * card.scale,
        settings.showShadows,
        settings.cardBorderWidth * bounds.scaleFactor,
        settings.cardBorderColor
      );

      ctx.restore();
    }
  }
}
