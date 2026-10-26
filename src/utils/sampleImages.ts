import { StudioImage } from '../types';

export function createGeneratedCardImage(title: string, hue: number, index: number): Promise<StudioImage> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d')!;

    // Background gradient with deep cinematic hues
    const grad = ctx.createLinearGradient(0, 0, 1200, 1600);
    grad.addColorStop(0, `hsl(${hue}, 65%, 20%)`);
    grad.addColorStop(0.5, `hsl(${(hue + 35) % 360}, 55%, 12%)`);
    grad.addColorStop(1, `hsl(${(hue + 70) % 360}, 75%, 6%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Decorative geometric rings & abstract lines
    ctx.strokeStyle = `hsla(${hue}, 80%, 75%, 0.16)`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(600, 720, 360, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `hsla(${(hue + 45) % 360}, 90%, 80%, 0.10)`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(600, 720, 440, 0, Math.PI * 2);
    ctx.stroke();

    // Decorative badge
    ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.22)`;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(475, 595, 250, 250, 48);
    } else {
      ctx.rect(475, 595, 250, 250);
    }
    ctx.fill();

    // Index number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`0${index + 1}`, 600, 720);

    // Card Title
    ctx.font = 'bold 58px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(title.toUpperCase(), 600, 1140);

    // Subtitle
    ctx.font = '600 28px "Inter", sans-serif';
    ctx.fillStyle = `hsla(${hue}, 90%, 85%, 0.75)`;
    ctx.fillText('APEX CINEMATICS', 600, 1220);

    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    img.onload = () => {
      resolve({
        id: `sample-${index}-${Date.now()}`,
        url: dataUrl,
        name: `${title}.png`,
        element: img,
        width: 1200,
        height: 1600,
      });
    };
  });
}

export async function getDefaultSampleImages(count = 7): Promise<StudioImage[]> {
  const titles = [
    'Solaris Horizon',
    'Quantum Veil',
    'Neon District',
    'Elysium Rift',
    'Vanguard Arc',
    'Starlight Core',
    'Cyber Monolith',
    'Astral Pulse',
    'Titan Forge',
    'Hyperion Peak',
  ];
  const hues = [345, 210, 275, 160, 35, 190, 315, 45, 230, 290];

  const promises: Promise<StudioImage>[] = [];
  for (let i = 0; i < count; i++) {
    const title = titles[i % titles.length];
    const hue = hues[i % hues.length];
    promises.push(createGeneratedCardImage(title, hue, i));
  }
  return Promise.all(promises);
}
