import { RenderContext, StaggeredRevealSettings } from '../../types';
import { Easing } from '../../utils/easing';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class StaggeredRevealTemplate {
  public static defaultSettings: StaggeredRevealSettings = {
    duration: 8,
    speed: 1.0,
    backgroundColor: '#07070b',
    backgroundType: 'gradient',
    gradientId: 'obsidian-spotlight',
    gradientColors: ['#242432', '#121219', '#050507'],
    gradientRadial: true,
    cardBorderRadius: 14,
    cardBorderColor: 'rgba(255, 255, 255, 0.2)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    layoutType: 'grid',
    direction: 'bottom',
    staggerDelay: 0.16,
    spacing: 22,
    cardWidth: 230,
    cardHeight: 290,
  };

  public render(ctxRef: RenderContext, settings: StaggeredRevealSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const scale = bounds.scaleFactor;
    let cardW = settings.cardWidth * scale;
    let cardH = settings.cardHeight * scale;
    let spacing = settings.spacing * scale;

    // Layout configuration
    let cols = count;
    let rows = 1;

    if (settings.layoutType === 'grid') {
      if (count <= 4) {
        cols = count;
        rows = 1;
      } else if (count <= 8) {
        cols = Math.ceil(count / 2);
        rows = 2;
      } else {
        cols = Math.ceil(Math.sqrt(count * 1.25));
        rows = Math.ceil(count / cols);
      }
    } else if (settings.layoutType === 'vertical') {
      cols = 1;
      rows = count;
    }

    // Shrink if needed to fit usable bounding area
    const totalW = cols * cardW + (cols - 1) * spacing;
    const totalH = rows * cardH + (rows - 1) * spacing;

    const scaleW = totalW > bounds.usableWidth ? bounds.usableWidth / totalW : 1.0;
    const scaleH = totalH > bounds.usableHeight ? bounds.usableHeight / totalH : 1.0;
    const fitFactor = Math.min(scaleW, scaleH);

    cardW *= fitFactor;
    cardH *= fitFactor;
    spacing *= fitFactor;

    const finalGridW = cols * cardW + (cols - 1) * spacing;
    const finalGridH = rows * cardH + (rows - 1) * spacing;

    const originX = bounds.centerX - finalGridW / 2;
    const originY = bounds.centerY - finalGridH / 2;

    const loopTime = settings.duration > 0 ? (time * settings.speed) % settings.duration : 0;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const finalX = originX + col * (cardW + spacing) + cardW / 2;
      const finalY = originY + row * (cardH + spacing) + cardH / 2;

      // Sequential entrance timing
      const delay = i * settings.staggerDelay;
      const progress = Easing.clamp((loopTime - delay) / 0.85, 0, 1);
      const eased = Easing.easeOutCubic(progress);

      let deltaX = 0;
      let deltaY = 0;

      if (settings.direction === 'bottom') {
        deltaY = (1 - eased) * 120 * scale;
      } else if (settings.direction === 'top') {
        deltaY = -(1 - eased) * 120 * scale;
      } else if (settings.direction === 'left') {
        deltaX = -(1 - eased) * 150 * scale;
      }

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.translate(finalX + deltaX, finalY + deltaY);

      drawCoverImage(
        ctx,
        images[i],
        -cardW / 2,
        -cardH / 2,
        cardW,
        cardH,
        settings.cardBorderRadius * scale * fitFactor,
        settings.showShadows,
        settings.cardBorderWidth * scale,
        settings.cardBorderColor
      );

      ctx.restore();
    }
  }
}
