import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AspectRatioType,
  AnyTemplateSettings,
  ExportProgress,
  ExportSettings,
  RenderContext,
  StudioImage,
  TemplateId,
} from './types';
import { TemplateRegistry } from './engine/TemplateRegistry';
import { getDefaultSampleImages } from './utils/sampleImages';
import { VideoExportEngine } from './export/videoExportEngine';
import { TopBar } from './components/TopBar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { Viewport } from './components/Viewport';
import { TimelineBar } from './components/TimelineBar';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  // Studio Core State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('orbit-cards');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  const [cardCount, setCardCount] = useState<number>(7);
  const [images, setImages] = useState<StudioImage[]>([]);

  // Per-template isolated settings cache to prevent setting bleeding
  const [settingsMap, setSettingsMap] = useState<Record<TemplateId, AnyTemplateSettings>>({
    'orbit-cards': TemplateRegistry.getDefaultSettings('orbit-cards'),
    'card-flip': TemplateRegistry.getDefaultSettings('card-flip'),
    'cinematic-popup': TemplateRegistry.getDefaultSettings('cinematic-popup'),
    'staggered-reveal': TemplateRegistry.getDefaultSettings('staggered-reveal'),
    'floating-cards': TemplateRegistry.getDefaultSettings('floating-cards'),
    'image-tunnel': TemplateRegistry.getDefaultSettings('image-tunnel'),
  });

  // Playback & Animation Loop
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [loop, setLoop] = useState<boolean>(true);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    currentFrame: 0,
    totalFrames: 0,
    percentage: 0,
    status: 'idle',
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const exportEngineRef = useRef<VideoExportEngine>(new VideoExportEngine());
  const exportInProgressRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const currentSettings = settingsMap[selectedTemplate];
  const duration = currentSettings.duration || 8;

  // Initialize Sample Images on mount
  useEffect(() => {
    let isMounted = true;
    getDefaultSampleImages(cardCount).then((samples) => {
      if (isMounted) setImages(samples);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Time-based animation loop using requestAnimationFrame
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loopStep = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSec * playbackSpeed;
          if (next >= duration) {
            return loop ? next % duration : duration;
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(loopStep);
    };

    animationFrameRef.current = requestAnimationFrame(loopStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration, loop]);

  // Keyboard shortcut listener (Space to play/pause, R to restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'KeyR') {
        setCurrentTime(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Image manipulation handlers
  const handleAddImages = (files: FileList) => {
    const newItems: Promise<StudioImage>[] = Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
          resolve({
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url,
            name: file.name,
            element: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
      });
    });

    Promise.all(newItems).then((loaded) => {
      setImages((prev) => [...prev, ...loaded]);
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleReorderImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const arr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return arr;
      const temp = arr[index];
      arr[index] = arr[targetIndex];
      arr[targetIndex] = temp;
      return arr;
    });
  };

  // Template switching isolates settings and cleanly resets timeline
  const handleSelectTemplate = (id: TemplateId) => {
    setSelectedTemplate(id);
    setCurrentTime(0);
  };

  const handleUpdateSettings = (updated: AnyTemplateSettings) => {
    setSettingsMap((prev) => ({
      ...prev,
      [selectedTemplate]: updated,
    }));
  };

  const handleResetTemplateSettings = () => {
    setSettingsMap((prev) => ({
      ...prev,
      [selectedTemplate]: TemplateRegistry.getDefaultSettings(selectedTemplate),
    }));
  };

  const handleResetProject = () => {
    getDefaultSampleImages(7).then((samples) => {
      setImages(samples);
      setCardCount(7);
      setAspectRatio('16:9');
      setCurrentTime(0);
      handleResetTemplateSettings();
    });
  };

  // Canvas rendering pass
  const renderFrame = useCallback(
    (ctxRef: RenderContext) => {
      const activeElements = images
        .slice(0, cardCount)
        .map((img) => img.element)
        .filter((el): el is HTMLImageElement => Boolean(el && el.complete));

      TemplateRegistry.renderTemplate(
        selectedTemplate,
        {
          ...ctxRef,
          images: activeElements,
        },
        currentSettings
      );
    },
    [images, cardCount, selectedTemplate, currentSettings]
  );

  // Genuine MP4 Export Handler
  const handleStartExport = async (exportSettings: ExportSettings) => {
    if (exportInProgressRef.current) return;
    exportInProgressRef.current = true;
    setDownloadUrl(null);
    setExportProgress({
      currentFrame: 0,
      totalFrames: 0,
      percentage: 0,
      status: 'rendering',
    });

    try {
      const activeElements = images
        .slice(0, cardCount)
        .map((img) => img.element)
        .filter((el): el is HTMLImageElement => Boolean(el && el.complete));

      if (activeElements.length === 0) {
        throw new Error('Cannot export video: please provide at least one valid image.');
      }

      const renderFn = (c: RenderContext) => {
        TemplateRegistry.renderTemplate(selectedTemplate, c, currentSettings);
      };

      const mp4Blob = await exportEngineRef.current.exportMP4(
        renderFn,
        activeElements,
        exportSettings,
        aspectRatio,
        duration,
        (p) => setExportProgress(p)
      );

      const url = URL.createObjectURL(mp4Blob);
      setDownloadUrl(url);
    } catch (err) {
      setExportProgress({
        currentFrame: 0,
        totalFrames: 0,
        percentage: 0,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Export error encountered',
      });
    } finally {
      exportInProgressRef.current = false;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Bar */}
      <TopBar
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        onOpenExport={() => {
          setDownloadUrl(null);
          setExportProgress({ currentFrame: 0, totalFrames: 0, percentage: 0, status: 'idle' });
          setIsExportModalOpen(true);
        }}
        onResetProject={handleResetProject}
        onNewProject={() => {
          setImages([]);
          setCurrentTime(0);
        }}
      />

      {/* Main Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Template selector & Image Pool */}
        <LeftPanel
          selectedTemplate={selectedTemplate}
          onSelectTemplate={handleSelectTemplate}
          images={images}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          onReorderImage={handleReorderImage}
          onClearAll={() => setImages([])}
          cardCount={cardCount}
          onCardCountChange={setCardCount}
        />

        {/* Center: Live Render Viewport */}
        <Viewport
          aspectRatio={aspectRatio}
          renderFrame={renderFrame}
          images={images.map((i) => i.element).filter((e): e is HTMLImageElement => !!e)}
          currentTime={currentTime}
          duration={duration}
        />

        {/* Right Panel: Template-specific Controls */}
        <RightPanel
          templateId={selectedTemplate}
          settings={currentSettings}
          onChangeSettings={handleUpdateSettings}
          onResetTemplateSettings={handleResetTemplateSettings}
        />
      </div>

      {/* Bottom Timeline Controls */}
      <TimelineBar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onRestart={() => setCurrentTime(0)}
        currentTime={currentTime}
        duration={duration}
        onSeek={setCurrentTime}
        speed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        loop={loop}
        onToggleLoop={() => setLoop(!loop)}
      />

      {/* Hardware-Accelerated Genuine MP4 Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onStartExport={handleStartExport}
        onCancelExport={() => exportEngineRef.current.cancel()}
        progress={exportProgress}
        downloadUrl={downloadUrl}
        aspectRatio={aspectRatio}
      />
    </div>
  );
};

export default App;
