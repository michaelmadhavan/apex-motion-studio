import React, { useRef, useEffect } from 'react';
import { AspectRatioType, RenderContext } from '../types';

interface ViewportProps {
  aspectRatio: AspectRatioType;
  renderFrame: (ctxRef: RenderContext) => void;
  images: HTMLImageElement[];
  currentTime: number;
  duration: number;
}

export const Viewport: React.FC<ViewportProps> = ({
  aspectRatio,
  renderFrame,
  images,
  currentTime,
  duration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Aspect ratio classes for responsive framing
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16]';
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Viewport resolution standard (crisp virtual 1080p composition)
    let w = 1920;
    let h = 1080;

    switch (aspectRatio) {
      case '16:9':
        w = 1920;
        h = 1080;
        break;
      case '9:16':
        w = 1080;
        h = 1920;
        break;
      case '1:1':
        w = 1080;
        h = 1080;
        break;
      case '4:5':
        w = 1080;
        h = 1350;
        break;
    }

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const progress = duration > 0 ? (currentTime % duration) / duration : 0;

    renderFrame({
      ctx,
      width: w,
      height: h,
      images,
      time: currentTime,
      progress,
      aspectRatio,
    });
  }, [aspectRatio, renderFrame, images, currentTime, duration]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-studio-900 flex items-center justify-center p-6 sm:p-8 overflow-hidden relative"
    >
      {/* Composition Canvas Container */}
      <div
        className={`max-h-full max-w-full ${getAspectRatioClasses()} relative rounded-xl overflow-hidden shadow-2xl border border-studio-800 bg-studio-950 flex items-center justify-center transition-all duration-300`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
        />

        {images.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-semibold text-zinc-400">Preview Canvas Ready</p>
            <p className="text-xs text-zinc-600 mt-1">Upload images or load samples to start motion rendering</p>
          </div>
        )}
      </div>
    </div>
  );
};
