import { FloatingCardsSettings, RenderContext } from '../../types';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class FloatingCardsTemplate {
  public static defaultSettings: FloatingCardsSettings = {
    duration: 10,
    speed: 1.0,
    backgroundColor: '#07070a',
    backgroundType: 'gradient',
    gradientId: 'cosmic-vortex',
    gradientColors: ['#28103c', '#150821', '#06020a'],
    gradientRadial: true,
    cardBorderRadius: 18,
    cardBorderColor: 'rgba(244, 63, 94, 0.35)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    amplitude: 28,
    frequency: 1.2,
    rotationIntensity: 5.5,
    cardWidth: 230,
    cardHeight: 320,
    spread: 1.0,
  };

  public render(ctxRef: RenderContext, settings: FloatingCardsSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const scale = bounds.scaleFactor;
    let cardW = settings.cardWidth * scale;
    let cardH = settings.cardHeight * scale;

    // Subtle atmospheric vignette
    const ambientGrad = ctx.createRadialGradient(
      bounds.centerX,
      bounds.centerY,
      50 * scale,
      bounds.centerX,
      bounds.centerY,
      bounds.width * 0.65
    );
    ambientGrad.addColorStop(0, 'rgba(190, 24, 71, 0.08)');
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, width, height);

    // Compute stable base positions in an organic distributed arc
    const arcRadiusX = Math.min(bounds.usableWidth * 0.42 * settings.spread, bounds.usableWidth / 2 - cardW / 2);
    const arcRadiusY = Math.min(bounds.usableHeight * 0.35 * settings.spread, bounds.usableHeight / 2 - cardH / 2);

    for (let i = 0; i < count; i++) {
      // Angular base distribution
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const baseX = bounds.centerX + Math.cos(angle) * arcRadiusX;
      const baseY = bounds.centerY + Math.sin(angle) * arcRadiusY;

      // Deterministic harmonic oscillations with distinct phase offsets
      const phase1 = i * 1.45;
      const phase2 = i * 2.37;
      const freq = settings.frequency * settings.speed;

      const floatX = Math.sin(time * freq * 0.9 + phase1) * (settings.amplitude * 0.7 * scale);
      const floatY = Math.cos(time * freq + phase2) * (settings.amplitude * scale);
      const floatRot = Math.sin(time * freq * 0.75 + phase1) * ((settings.rotationIntensity * Math.PI) / 180);

      const finalX = baseX + floatX;
      const finalY = baseY + floatY;

      ctx.save();
      ctx.translate(finalX, finalY);
      ctx.rotate(floatRot);

      drawCoverImage(
        ctx,
        images[i],
        -cardW / 2,
        -cardH / 2,
        cardW,
        cardH,
        settings.cardBorderRadius * scale,
        settings.showShadows,
        settings.cardBorderWidth * scale,
        settings.cardBorderColor
      );

      ctx.restore();
    }
  }
}
