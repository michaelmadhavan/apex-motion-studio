import React, { useRef } from 'react';
import { AnyTemplateSettings, TemplateId } from '../types';
import { GRADIENT_PRESETS } from '../utils/gradientPresets';
import { Sliders, Palette, Box, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

interface RightPanelProps {
  templateId: TemplateId;
  settings: AnyTemplateSettings;
  onChangeSettings: (settings: AnyTemplateSettings) => void;
  onResetTemplateSettings: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  templateId,
  settings,
  onChangeSettings,
  onResetTemplateSettings,
}) => {
  const gradientScrollRef = useRef<HTMLDivElement>(null);

  const updateField = (key: string, value: any) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  const scrollGradients = (direction: 'left' | 'right') => {
    if (gradientScrollRef.current) {
      const scrollDistance = 180;
      gradientScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth',
      });
    }
  };

  const handleUpdateGradientColor = (index: 0 | 1 | 2, color: string) => {
    const currentColors: [string, string, string] = settings.gradientColors
      ? [...settings.gradientColors]
      : ['#3b0717', '#1a040b', '#080104'];
    currentColors[index] = color;
    onChangeSettings({
      ...settings,
      backgroundType: 'gradient',
      gradientColors: currentColors,
      backgroundColor: currentColors[0],
    });
  };

  return (
    <aside className="w-80 bg-studio-950 border-l border-studio-800 flex flex-col h-full select-none flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-studio-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-400" />
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Template Parameters
          </h2>
        </div>
        <button
          onClick={onResetTemplateSettings}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Reset Defaults
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Orbit Cards Specific Controls */}
        {templateId === 'orbit-cards' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Orbit Geometry
            </h3>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Horizontal Radius</span>
                <span className="font-mono text-zinc-400">{(settings as any).radiusX}px</span>
              </div>
              <input
                type="range"
                min="150"
                max="600"
                value={(settings as any).radiusX}
                onChange={(e) => updateField('radiusX', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Vertical Radius</span>
                <span className="font-mono text-zinc-400">{(settings as any).radiusY}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={(settings as any).radiusY}
                onChange={(e) => updateField('radiusY', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Tilt Angle</span>
                <span className="font-mono text-zinc-400">{(settings as any).tiltAngle}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={(settings as any).tiltAngle}
                onChange={(e) => updateField('tiltAngle', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Orbit Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {['clockwise', 'counter-clockwise'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => updateField('direction', dir)}
                    className={`py-1 text-xs rounded border capitalize transition-colors ${
                      (settings as any).direction === dir
                        ? 'bg-rose-950/60 border-rose-700 text-white font-medium'
                        : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-300">Align Orientation</span>
              <input
                type="checkbox"
                checked={(settings as any).enableOrientationAlign}
                onChange={(e) => updateField('enableOrientationAlign', e.target.checked)}
                className="accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 3D Card Flip Controls */}
        {templateId === 'card-flip' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Flip Attributes
            </h3>
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Flip Axis</label>
              <div className="grid grid-cols-2 gap-2">
                {['horizontal', 'vertical'].map((axis) => (
                  <button
                    key={axis}
                    onClick={() => updateField('flipAxis', axis)}
                    className={`py-1 text-xs rounded border capitalize transition-colors ${
                      (settings as any).flipAxis === axis
                        ? 'bg-rose-950/60 border-rose-700 text-white font-medium'
                        : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {axis}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Stagger Delay</span>
                <span className="font-mono text-zinc-400">{(settings as any).staggerDelay}s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={(settings as any).staggerDelay}
                onChange={(e) => updateField('staggerDelay', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        )}

        {/* Cinematic Pop-Up Controls */}
        {templateId === 'cinematic-popup' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Pop-Up Physics
            </h3>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Overshoot Elasticity</span>
                <span className="font-mono text-zinc-400">{(settings as any).overshoot}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.4"
                step="0.05"
                value={(settings as any).overshoot}
                onChange={(e) => updateField('overshoot', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Stagger Delay</span>
                <span className="font-mono text-zinc-400">{(settings as any).staggerDelay}s</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={(settings as any).staggerDelay}
                onChange={(e) => updateField('staggerDelay', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-300">Ambient Glow Aura</span>
              <input
                type="checkbox"
                checked={(settings as any).blurGlow}
                onChange={(e) => updateField('blurGlow', e.target.checked)}
                className="accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Staggered Reveal Controls */}
        {templateId === 'staggered-reveal' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Layout & Entrance
            </h3>
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Layout Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {['grid', 'horizontal'].map((m) => (
                  <button
                    key={m}
                    onClick={() => updateField('layoutType', m)}
                    className={`py-1 text-xs rounded border capitalize transition-colors ${
                      (settings as any).layoutType === m
                        ? 'bg-rose-950/60 border-rose-700 text-white font-medium'
                        : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Entrance Direction</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['bottom', 'top', 'left'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => updateField('direction', dir)}
                    className={`py-1 text-xs rounded border capitalize transition-colors ${
                      (settings as any).direction === dir
                        ? 'bg-rose-950/60 border-rose-700 text-white font-medium'
                        : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Stagger Delay</span>
                <span className="font-mono text-zinc-400">{(settings as any).staggerDelay}s</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={(settings as any).staggerDelay}
                onChange={(e) => updateField('staggerDelay', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        )}

        {/* Floating Cards Controls */}
        {templateId === 'floating-cards' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Harmonic Float Wave
            </h3>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Wave Amplitude</span>
                <span className="font-mono text-zinc-400">{(settings as any).amplitude}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={(settings as any).amplitude}
                onChange={(e) => updateField('amplitude', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Frequency Speed</span>
                <span className="font-mono text-zinc-400">{(settings as any).frequency}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.1"
                value={(settings as any).frequency}
                onChange={(e) => updateField('frequency', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Tilt Rotation</span>
                <span className="font-mono text-zinc-400">{(settings as any).rotationIntensity}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="18"
                step="0.5"
                value={(settings as any).rotationIntensity}
                onChange={(e) => updateField('rotationIntensity', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        )}

        {/* Image Tunnel Controls */}
        {templateId === 'image-tunnel' && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Perspective Vortex
            </h3>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Tunnel Fly Speed</span>
                <span className="font-mono text-zinc-400">{(settings as any).tunnelSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.5"
                step="0.1"
                value={(settings as any).tunnelSpeed}
                onChange={(e) => updateField('tunnelSpeed', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Spiral Intensity</span>
                <span className="font-mono text-zinc-400">{(settings as any).spiralIntensity}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={(settings as any).spiralIntensity}
                onChange={(e) => updateField('spiralIntensity', Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        )}

        {/* Global Card Appearance Settings */}
        <div className="pt-4 border-t border-studio-800 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            <Box className="w-3.5 h-3.5 text-zinc-400" />
            <span>Card Geometry</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Card Width</span>
              <span className="font-mono text-zinc-400">{(settings as any).cardWidth}px</span>
            </div>
            <input
              type="range"
              min="140"
              max="420"
              value={(settings as any).cardWidth}
              onChange={(e) => updateField('cardWidth', Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Card Height</span>
              <span className="font-mono text-zinc-400">{(settings as any).cardHeight}px</span>
            </div>
            <input
              type="range"
              min="180"
              max="580"
              value={(settings as any).cardHeight}
              onChange={(e) => updateField('cardHeight', Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Corner Radius</span>
              <span className="font-mono text-zinc-400">{settings.cardBorderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="36"
              value={settings.cardBorderRadius}
              onChange={(e) => updateField('cardBorderRadius', Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Border Width</span>
              <span className="font-mono text-zinc-400">{settings.cardBorderWidth}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={settings.cardBorderWidth}
              onChange={(e) => updateField('cardBorderWidth', Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">Drop Shadows</span>
            <input
              type="checkbox"
              checked={settings.showShadows}
              onChange={(e) => updateField('showShadows', e.target.checked)}
              className="accent-rose-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Global Environment Settings: Gradient Background Images & Custom Styles */}
        <div className="pt-4 border-t border-studio-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-rose-400" />
              <span>Environment</span>
            </div>

            {/* Background Mode Switch */}
            <div className="flex items-center bg-studio-900 border border-studio-800 rounded-md p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => updateField('backgroundType', 'gradient')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  settings.backgroundType !== 'color'
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Gradients
              </button>
              <button
                type="button"
                onClick={() => updateField('backgroundType', 'color')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  settings.backgroundType === 'color'
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Solid
              </button>
            </div>
          </div>

          {/* Gradient Background Images Carousel with Functional Scroll Buttons */}
          {settings.backgroundType !== 'color' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Gradient Backgrounds
                </span>
                {/* Working Horizontal Scroll Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollGradients('left')}
                    title="Scroll left"
                    className="w-6 h-6 rounded flex items-center justify-center bg-studio-900 hover:bg-studio-850 active:scale-95 border border-studio-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollGradients('right')}
                    title="Scroll right"
                    className="w-6 h-6 rounded flex items-center justify-center bg-studio-900 hover:bg-studio-850 active:scale-95 border border-studio-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Gradient Cards */}
              <div
                ref={gradientScrollRef}
                className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scroll-smooth"
                style={{ scrollbarWidth: 'thin' }}
              >
                {GRADIENT_PRESETS.map((preset) => {
                  const isSelected =
                    settings.backgroundType !== 'color' &&
                    settings.gradientId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onChangeSettings({
                          ...settings,
                          backgroundType: 'gradient',
                          gradientId: preset.id,
                          gradientColors: [...preset.colors],
                          gradientRadial: preset.type === 'radial',
                          gradientAngle: preset.angle ?? 135,
                          backgroundColor: preset.colors[0],
                        });
                      }}
                      className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-md shadow-rose-950/60 scale-[1.02]'
                          : 'border-studio-800 hover:border-studio-700 bg-studio-900 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Gradient preview swatch */}
                      <div
                        className="h-14 w-full relative flex items-end p-1.5 transition-opacity group-hover:opacity-95"
                        style={{ background: preset.previewCss }}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-studio-950" />
                        )}
                        <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-black/65 text-zinc-300 backdrop-blur-xs font-medium">
                          {preset.type}
                        </span>
                      </div>
                      <div className="p-1.5 bg-studio-900 border-t border-studio-800/80">
                        <div className="text-[10px] font-medium text-zinc-300 truncate group-hover:text-white">
                          {preset.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Gradient Fine-Tuning Controls */}
              <div className="pt-2 border-t border-studio-850 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Gradient Type
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 w-36">
                    <button
                      type="button"
                      onClick={() => updateField('gradientRadial', false)}
                      className={`py-1 text-xs rounded border text-center transition-colors ${
                        !settings.gradientRadial
                          ? 'bg-rose-950/70 border-rose-700 text-rose-200 font-medium'
                          : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('gradientRadial', true)}
                      className={`py-1 text-xs rounded border text-center transition-colors ${
                        settings.gradientRadial
                          ? 'bg-rose-950/70 border-rose-700 text-rose-200 font-medium'
                          : 'bg-studio-900 border-studio-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Radial
                    </button>
                  </div>
                </div>

                {/* Angle Slider (for Linear Gradients) */}
                {!settings.gradientRadial && (
                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-zinc-400" />
                        <span>Gradient Angle</span>
                      </span>
                      <span className="font-mono text-zinc-400">
                        {settings.gradientAngle ?? 135}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={settings.gradientAngle ?? 135}
                      onChange={(e) => updateField('gradientAngle', Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Color Stops Customizer */}
                <div>
                  <label className="text-xs text-zinc-300 block mb-1.5">
                    Gradient Color Stops
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((idx) => {
                      const color =
                        settings.gradientColors && settings.gradientColors[idx]
                          ? settings.gradientColors[idx]
                          : idx === 0
                          ? '#3b0717'
                          : idx === 1
                          ? '#1a040b'
                          : '#080104';
                      const label = idx === 0 ? 'Start' : idx === 1 ? 'Mid' : 'End';
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) =>
                              handleUpdateGradientColor(idx as 0 | 1 | 2, e.target.value)
                            }
                            className="w-full h-8 rounded border border-studio-700 bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] text-zinc-400 mt-1">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Solid Color Picker */
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Solid Canvas Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded border border-studio-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-400 uppercase">
                  {settings.backgroundColor}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
