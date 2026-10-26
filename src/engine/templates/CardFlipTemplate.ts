import { CardFlipSettings, RenderContext } from '../../types';
import { Easing } from '../../utils/easing';
import { computeLayoutBounds, drawCoverImage, renderEnvironmentBackground } from '../../utils/layout';

export class CardFlipTemplate {
  public static defaultSettings: CardFlipSettings = {
    duration: 8,
    speed: 1.0,
    backgroundColor: '#09090e',
    backgroundType: 'gradient',
    gradientId: 'midnight-nebula',
    gradientColors: ['#0d132b', '#080b18', '#03040a'],
    gradientAngle: 145,
    gradientRadial: false,
    cardBorderRadius: 16,
    cardBorderColor: 'rgba(255, 255, 255, 0.22)',
    cardBorderWidth: 1.5,
    showShadows: true,
    loop: true,
    flipAxis: 'horizontal',
    staggerDelay: 0.35,
    perspective: 1000,
    cardWidth: 240,
    cardHeight: 340,
    flipCount: 1,
  };

  public render(ctxRef: RenderContext, settings: CardFlipSettings) {
    const { ctx, width, height, images, time } = ctxRef;
    const count = images.length;
    if (count === 0) return;

    renderEnvironmentBackground(ctx, width, height, settings);

    const bounds = computeLayoutBounds(width, height);
    const scale = bounds.scaleFactor;
    let cardW = settings.cardWidth * scale;
    let cardH = settings.cardHeight * scale;
    let spacing = 24 * scale;

    // Check if total row width exceeds usable width
    const totalRowWidth = count * cardW + (count - 1) * spacing;
    if (totalRowWidth > bounds.usableWidth) {
      const shrinkFactor = bounds.usableWidth / totalRowWidth;
      cardW *= shrinkFactor;
      cardH *= shrinkFactor;
      spacing *= shrinkFactor;
    }

    const finalRowWidth = count * cardW + (count - 1) * spacing;
    const startX = bounds.centerX - finalRowWidth / 2;

    const loopTime = settings.duration > 0 ? (time * settings.speed) % settings.duration : 0;

    for (let i = 0; i < count; i++) {
      const centerX = startX + i * (cardW + spacing) + cardW / 2;
      const centerY = bounds.centerY;

      // Sequential flip progression
      const delay = i * settings.staggerDelay;
      const flipDuration = 1.35;
      const progress = Easing.clamp((loopTime - delay) / flipDuration, 0, 1);
      const easedT = Easing.easeInOutCubic(progress);

      // Angle goes from 0 (resting) to PI (full flip rotation) or completes flip
      const flipAngle = easedT * Math.PI;
      const cosVal = Math.cos(flipAngle);

      ctx.save();
      ctx.translate(centerX, centerY);

      // Elevation during flip
      const elevation = Math.sin(flipAngle) * 35 * scale;
      ctx.translate(0, -elevation);

      // 3D perspective simulated transform
      // When cosVal is negative, the card is in the second half of the flip
      const scaleFactor = Math.abs(cosVal);
      const skew = Math.sin(flipAngle) * 0.12;

      if (settings.flipAxis === 'horizontal') {
        // Rotate around Y axis: scale X by cos(angle)
        ctx.transform(Math.max(0.01, scaleFactor), skew, 0, 1, 0, 0);
      } else {
        // Rotate around X axis: scale Y by cos(angle)
        ctx.transform(1, 0, skew, Math.max(0.01, scaleFactor), 0, 0);
      }

      // Draw card
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

      // Dynamic shading overlay as the card turns away from light
      const shadeOpacity = Math.sin(flipAngle) * 0.42;
      if (shadeOpacity > 0.02) {
        ctx.fillStyle = `rgba(0, 0, 0, ${shadeOpacity})`;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, settings.cardBorderRadius * scale);
        } else {
          ctx.rect(-cardW / 2, -cardH / 2, cardW, cardH);
        }
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
