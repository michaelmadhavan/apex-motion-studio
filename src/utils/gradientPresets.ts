export interface GradientPreset {
  id: string;
  name: string;
  type: 'linear' | 'radial';
  colors: [string, string, string];
  angle?: number;
  previewCss: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'velvet-burgundy',
    name: 'Velvet Burgundy',
    type: 'linear',
    colors: ['#3b0717', '#1a040b', '#080104'],
    angle: 135,
    previewCss: 'linear-gradient(135deg, #3b0717 0%, #1a040b 50%, #080104 100%)',
  },
  {
    id: 'midnight-nebula',
    name: 'Midnight Nebula',
    type: 'linear',
    colors: ['#0d132b', '#080b18', '#03040a'],
    angle: 145,
    previewCss: 'linear-gradient(145deg, #0d132b 0%, #080b18 55%, #03040a 100%)',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyber Noir',
    type: 'linear',
    colors: ['#280826', '#120417', '#06010a'],
    angle: 125,
    previewCss: 'linear-gradient(125deg, #280826 0%, #120417 50%, #06010a 100%)',
  },
  {
    id: 'obsidian-spotlight',
    name: 'Obsidian Spotlight',
    type: 'radial',
    colors: ['#242432', '#121219', '#050507'],
    previewCss: 'radial-gradient(circle, #242432 0%, #121219 55%, #050507 100%)',
  },
  {
    id: 'crimson-ember',
    name: 'Crimson Ember',
    type: 'linear',
    colors: ['#420c16', '#22040a', '#0a0103'],
    angle: 160,
    previewCss: 'linear-gradient(160deg, #420c16 0%, #22040a 50%, #0a0103 100%)',
  },
  {
    id: 'emerald-abyss',
    name: 'Emerald Abyss',
    type: 'linear',
    colors: ['#04261b', '#03140e', '#010805'],
    angle: 135,
    previewCss: 'linear-gradient(135deg, #04261b 0%, #03140e 50%, #010805 100%)',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    type: 'linear',
    colors: ['#290b3b', '#13051c', '#06010a'],
    angle: 150,
    previewCss: 'linear-gradient(150deg, #290b3b 0%, #13051c 50%, #06010a 100%)',
  },
  {
    id: 'deep-maritime',
    name: 'Deep Maritime',
    type: 'radial',
    colors: ['#09263a', '#05131d', '#02070b'],
    previewCss: 'radial-gradient(circle, #09263a 0%, #05131d 55%, #02070b 100%)',
  },
  {
    id: 'solar-dusk',
    name: 'Solar Dusk',
    type: 'linear',
    colors: ['#38150a', '#1e0a05', '#0a0301'],
    angle: 130,
    previewCss: 'linear-gradient(130deg, #38150a 0%, #1e0a05 50%, #0a0301 100%)',
  },
  {
    id: 'cosmic-vortex',
    name: 'Cosmic Violet',
    type: 'radial',
    colors: ['#28103c', '#150821', '#06020a'],
    previewCss: 'radial-gradient(circle, #28103c 0%, #150821 55%, #06020a 100%)',
  },
  {
    id: 'carbon-titanium',
    name: 'Carbon Steel',
    type: 'linear',
    colors: ['#1c1d22', '#101114', '#060607'],
    angle: 180,
    previewCss: 'linear-gradient(180deg, #1c1d22 0%, #101114 50%, #060607 100%)',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Teal',
    type: 'linear',
    colors: ['#082a2f', '#04161a', '#02090b'],
    angle: 140,
    previewCss: 'linear-gradient(140deg, #082a2f 0%, #04161a 50%, #02090b 100%)',
  },
];
