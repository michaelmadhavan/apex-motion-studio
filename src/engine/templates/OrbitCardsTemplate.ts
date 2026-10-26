import { OrbitCardsSettings, RenderContext } from '../../types';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class OrbitCardsTemplate {
  public static defaultSettings: OrbitCardsSettings = {
    duration: 10,
    speed: 1.0,
    backgroundColor: '#070709',
    backgroundType: 'gradient',
    gradientId: 'velvet-burgundy',
    gradientColors: ['#3b0717', '#1a040b', '#080104'],
    gradientAngle: 135,
    gradientRadial: false,
    cardBorderRadius: 18,
    cardBorderColor: 'rgba(244, 63, 94, 0.45)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    radiusX: 380,
    radiusY: 130,
    tiltAngle: 14,
    cardWidth: 220,
    cardHeight: 300,
    direction: 'clockwise',
    enableOrientationAlign: false,
  };

  public render(ctxRef: RenderContext, settings: OrbitCardsSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    // Canvas environment background
    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const scale = bounds.scaleFactor;

    // Scale radius dynamically with composition size to prevent viewport clipping
    const maxUsableRadiusX = (bounds.usableWidth * 0.46);
    const maxUsableRadiusY = (bounds.usableHeight * 0.38);
    const effectiveRadiusX = Math.min(settings.radiusX * scale, maxUsableRadiusX);
    const effectiveRadiusY = Math.min(settings.radiusY * scale, maxUsableRadiusY);

    const cardW = settings.cardWidth * scale;
    const cardH = settings.cardHeight * scale;

    const speedMultiplier = settings.direction === 'clockwise' ? 1 : -1;
    const cycleTime = settings.duration > 0 ? (time % settings.duration) / settings.duration : 0;
    const baseAngle = cycleTime * Math.PI * 2 * settings.speed * speedMultiplier;
    const tiltRad = (settings.tiltAngle * Math.PI) / 180;

    // Ambient radial glow behind orbit
    const radialGlow = ctx.createRadialGradient(
      bounds.centerX,
      bounds.centerY,
      20 * scale,
      bounds.centerX,
      bounds.centerY,
      effectiveRadiusX * 1.4
    );
    radialGlow.addColorStop(0, 'rgba(225, 29, 72, 0.12)');
    radialGlow.addColorStop(0.5, 'rgba(159, 18, 57, 0.05)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Subtle orbital ring guide
    ctx.save();
    ctx.translate(bounds.centerX, bounds.centerY);
    ctx.rotate(tiltRad);
    ctx.beginPath();
    ctx.ellipse(0, 0, effectiveRadiusX, effectiveRadiusY, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
    ctx.restore();

    // Calculate cards trigonometric positions and depth
    interface OrbitCard {
      img: HTMLImageElement;
      x: number;
      y: number;
      z: number;
      scale: number;
      angle: number;
    }

    const cards: OrbitCard[] = [];

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i * (Math.PI * 2 / count));
      // Elliptical coordinate in flat space
      const orbitX = Math.cos(angle) * effectiveRadiusX;
      const orbitY = Math.sin(angle) * effectiveRadiusY;

      // Rotate by tilt angle
      const rx = orbitX * Math.cos(tiltRad) - orbitY * Math.sin(tiltRad);
      const ry = orbitX * Math.sin(tiltRad) + orbitY * Math.cos(tiltRad);

      // Depth z is based on sin(angle) (ranges from -1 to 1)
      const z = Math.sin(angle);
      const depthNormalized = (z + 1) / 2; // 0 to 1
      const depthScale = 0.68 + depthNormalized * 0.44; // Scale between ~0.68 and ~1.12

      cards.push({
        img: images[i],
        x: bounds.centerX + rx,
        y: bounds.centerY + ry,
        z,
        scale: depthScale,
        angle,
      });
    }

    // Sort by depth: render cards that are further away (lower z) first
    cards.sort((a, b) => a.z - b.z);

    // Render cards
    for (const card of cards) {
      ctx.save();
      ctx.translate(card.x, card.y);

      if (settings.enableOrientationAlign) {
        ctx.rotate(card.angle + Math.PI / 2);
      }

      const w = cardW * card.scale;
      const h = cardH * card.scale;

      // Distance dimming
      const dimFactor = 0.5 + ((card.z + 1) / 2) * 0.5;
      ctx.globalAlpha = Math.max(0.3, dimFactor);

      drawCoverImage(
        ctx,
        card.img,
        -w / 2,
        -h / 2,
        w,
        h,
        settings.cardBorderRadius * card.scale,
        settings.showShadows,
        settings.cardBorderWidth * scale,
        settings.cardBorderColor
      );

      ctx.restore();
    }
  }
}
