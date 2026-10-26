import { AspectRatioType, BaseAnimationSettings } from '../types';

export interface LayoutBounds {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  safeMarginX: number;
  safeMarginY: number;
  usableWidth: number;
  usableHeight: number;
  scaleFactor: number;
}

/**
 * Renders the studio environment background (solid color or rich linear/radial gradient)
 */
export function renderEnvironmentBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BaseAnimationSettings
) {
  if (settings.backgroundType === 'gradient' && settings.gradientColors && settings.gradientColors.length >= 2) {
    const [c1, c2, c3] = settings.gradientColors;
    if (settings.gradientRadial) {
      // Radial Gradient centered on composition
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.max(width, height) * 0.72;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3 || '#040406');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Linear Gradient with customizable angle
      const angleDeg = settings.gradientAngle ?? 135;
      const angleRad = (angleDeg * Math.PI) / 180;
      const halfW = width / 2;
      const halfH = height / 2;
      const radius = Math.sqrt(halfW * halfW + halfH * halfH);
      const x1 = halfW - Math.cos(angleRad) * radius;
      const y1 = halfH - Math.sin(angleRad) * radius;
      const x2 = halfW + Math.cos(angleRad) * radius;
      const y2 = halfH + Math.sin(angleRad) * radius;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3 || c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Solid background color
    ctx.fillStyle = settings.backgroundColor || '#070709';
    ctx.fillRect(0, 0, width, height);
  }
}

export function computeLayoutBounds(width: number, height: number, marginPercent = 0.08): LayoutBounds {
  const safeMarginX = width * marginPercent;
  const safeMarginY = height * marginPercent;
  const usableWidth = width - safeMarginX * 2;
  const usableHeight = height - safeMarginY * 2;

  // Normalized against standard 1080p height
  const baseDim = Math.min(width, height);
  const scaleFactor = Math.max(0.3, baseDim / 1080);

  return {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    safeMarginX,
    safeMarginY,
    usableWidth,
    usableHeight,
    scaleFactor,
  };
}

export function getResolutionDimensions(
  resolution: '1080p' | '2K' | '4K',
  aspectRatio: AspectRatioType
): { width: number; height: number } {
  let baseLong: number;
  switch (resolution) {
    case '4K':
      baseLong = 3840;
      break;
    case '2K':
      baseLong = 2560;
      break;
    case '1080p':
    default:
      baseLong = 1920;
      break;
  }

  let w: number;
  let h: number;

  switch (aspectRatio) {
    case '16:9':
      w = baseLong;
      h = Math.round((baseLong * 9) / 16);
      break;
    case '9:16':
      h = baseLong;
      w = Math.round((baseLong * 9) / 16);
      break;
    case '1:1':
      w = Math.round((baseLong * 1080) / 1920);
      h = w;
      break;
    case '4:5':
      h = baseLong;
      w = Math.round((baseLong * 4) / 5);
      break;
  }

  // Force even numbers required by H.264 macroblock encoders
  w = w % 2 === 0 ? w : w - 1;
  h = h % 2 === 0 ? h : h - 1;

  return { width: w, height: h };
}

/**
 * Draws an image with object-fit: cover inside a destination rect with rounded corners & border
 */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  radius = 16,
  shadow = true,
  borderWidth = 0,
  borderColor = 'rgba(255,255,255,0.2)'
) {
  if (!img.complete || img.naturalWidth === 0) return;

  ctx.save();

  const safeRadius = Math.max(0, Math.min(radius, dw / 2, dh / 2));

  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.min(dw, dh) * 0.12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.min(dw, dh) * 0.05;
  }

  // Rounded rectangle path
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(dx, dy, dw, dh, safeRadius);
  } else {
    // Manual fallback for older canvas implementations
    ctx.moveTo(dx + safeRadius, dy);
    ctx.lineTo(dx + dw - safeRadius, dy);
    ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + safeRadius);
    ctx.lineTo(dx + dw, dy + dh - safeRadius);
    ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - safeRadius, dy + dh);
    ctx.lineTo(dx + safeRadius, dy + dh);
    ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - safeRadius);
    ctx.lineTo(dx, dy + safeRadius);
    ctx.quadraticCurveTo(dx, dy, dx + safeRadius, dy);
  }
  ctx.closePath();

  // Dark card background in case of transparent image edges
  ctx.fillStyle = '#0f0f15';
  ctx.fill();

  // Clip to rounded rect
  ctx.clip();

  // Reset shadow for inner image paint
  ctx.shadowColor = 'transparent';

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const hRatio = dw / iw;
  const vRatio = dh / ih;
  const ratio = Math.max(hRatio, vRatio);

  const sw = dw / ratio;
  const sh = dh / ratio;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  ctx.restore();

  // Border outline drawn on top if requested
  if (borderWidth > 0) {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(dx, dy, dw, dh, safeRadius);
    } else {
      ctx.rect(dx, dy, dw, dh);
    }
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.restore();
  }
}
