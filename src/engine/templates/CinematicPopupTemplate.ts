import { CinematicPopupSettings, RenderContext } from '../../types';
import { Easing } from '../../utils/easing';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class CinematicPopupTemplate {
  public static defaultSettings: CinematicPopupSettings = {
    duration: 8,
    speed: 1.0,
    backgroundColor: '#060608',
    backgroundType: 'gradient',
    gradientId: 'crimson-ember',
    gradientColors: ['#420c16', '#22040a', '#0a0103'],
    gradientAngle: 160,
    gradientRadial: false,
    cardBorderRadius: 20,
    cardBorderColor: 'rgba(251, 113, 133, 0.4)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    staggerDelay: 0.2,
    overshoot: 1.5,
    initialScale: 0.2,
    cardWidth: 230,
    cardHeight: 330,
    blurGlow: true,
  };

  public render(ctxRef: RenderContext, settings: CinematicPopupSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const scale = bounds.scaleFactor;

    // Ambient cinematic spotlight
    const grad = ctx.createRadialGradient(
      bounds.centerX,
      bounds.centerY * 0.75,
      40 * scale,
      bounds.centerX,
      bounds.centerY,
      bounds.width * 0.7
    );
    grad.addColorStop(0, 'rgba(159, 18, 57, 0.16)');
    grad.addColorStop(0.5, 'rgba(136, 19, 55, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    let cardW = settings.cardWidth * scale;
    let cardH = settings.cardHeight * scale;
    let spacing = 26 * scale;

    const totalWidth = count * cardW + (count - 1) * spacing;
    if (totalWidth > bounds.usableWidth) {
      const shrink = bounds.usableWidth / totalWidth;
      cardW *= shrink;
      cardH *= shrink;
      spacing *= shrink;
    }

    const finalRowWidth = count * cardW + (count - 1) * spacing;
    const startX = bounds.centerX - finalRowWidth / 2;

    const loopTime = settings.duration > 0 ? (time * settings.speed) % settings.duration : 0;

    for (let i = 0; i < count; i++) {
      const delay = i * settings.staggerDelay;
      const animDuration = 0.95;
      const progress = Easing.clamp((loopTime - delay) / animDuration, 0, 1);

      if (progress <= 0) continue; // Not revealed yet

      const easedProgress = progress < 1 ? Easing.easeOutBack(progress, settings.overshoot) : 1.0;
      const currentScale = settings.initialScale + (1.0 - settings.initialScale) * Math.max(0, easedProgress);
      const opacity = Easing.clamp(progress * 2.0, 0, 1);

      const targetX = startX + i * (cardW + spacing) + cardW / 2;
      const targetY = bounds.centerY;

      // Entrance upward motion
      const yOffset = (1 - progress) * 85 * scale;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(targetX, targetY + yOffset);
      ctx.scale(Math.max(0.001, currentScale), Math.max(0.001, currentScale));

      // Glow halo backdrop behind card
      if (settings.blurGlow && progress > 0.3) {
        ctx.save();
        ctx.shadowColor = 'rgba(225, 29, 72, 0.38)';
        ctx.shadowBlur = 35 * scale;
        ctx.fillStyle = 'rgba(225, 29, 72, 0.08)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, settings.cardBorderRadius * scale);
        } else {
          ctx.rect(-cardW / 2, -cardH / 2, cardW, cardH);
        }
        ctx.fill();
        ctx.restore();
      }

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
