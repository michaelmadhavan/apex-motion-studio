export const Easing = {
  linear: (t: number): number => t,

  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => {
    const p = t - 1;
    return p * p * p + 1;
  },
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Cinematic Overshoot with subtle settling
  easeOutBack: (t: number, overshoot = 1.70158): number => {
    const s = overshoot;
    const p = t - 1;
    return p * p * ((s + 1) * p + s) + 1;
  },

  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const scaled = t * 2;
    if (scaled < 1) return 0.5 * Math.pow(2, 10 * (scaled - 1));
    return 0.5 * (-Math.pow(2, -10 * (scaled - 1)) + 2);
  },

  clamp: (val: number, min = 0, max = 1): number => {
    return Math.max(min, Math.min(max, val));
  },
};
