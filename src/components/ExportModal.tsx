import React, { useState } from 'react';
import { ExportProgress, ExportSettings, AspectRatioType } from '../types';
import { getResolutionDimensions } from '../utils/layout';
import { Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExport: (settings: ExportSettings) => void;
  onCancelExport: () => void;
  progress: ExportProgress;
  downloadUrl: string | null;
  aspectRatio: AspectRatioType;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onStartExport,
  onCancelExport,
  progress,
  downloadUrl,
  aspectRatio,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '2K' | '4K' | 'custom'>('1080p');
  const [frameRate, setFrameRate] = useState<number>(30);
  const [bitrateMbps, setBitrateMbps] = useState<number>(18);
  const [customWidth, setCustomWidth] = useState<number>(1000);
  const [customHeight, setCustomHeight] = useState<number>(350);

  if (!isOpen) return null;

  const isExporting =
    progress.status === 'rendering' ||
    progress.status === 'encoding' ||
    progress.status === 'finalizing';

  const currentDims =
    resolution === 'custom'
      ? { width: customWidth, height: customHeight }
      : getResolutionDimensions(resolution, aspectRatio);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-studio-900 border border-studio-800 rounded-xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-studio-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Export Genuine MP4 Video
            </h2>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isExporting && progress.status !== 'completed' && (
            <>
              {/* Resolution Selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Resolution Output
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1080p', '2K', '4K', 'custom'] as const).map((res) => {
                    const dims =
                      res === 'custom'
                        ? { width: customWidth, height: customHeight }
                        : getResolutionDimensions(res, aspectRatio);
                    return (
                      <button
                        key={res}
                        onClick={() => {
                          setResolution(res);
                          if (res !== 'custom') {
                            setBitrateMbps(res === '4K' ? 36 : res === '2K' ? 24 : 18);
                          }
                        }}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          resolution === res
                            ? 'bg-rose-950/50 border-rose-600 text-white shadow-sm shadow-rose-950/50'
                            : 'bg-studio-950 border-studio-800 text-zinc-400 hover:border-studio-700'
                        }`}
                      >
                        <div className="text-sm font-bold">{res === 'custom' ? 'Custom' : res}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {dims.width} × {dims.height}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {resolution === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Width (px)
                    <input
                      type="number"
                      min="16"
                      max="8192"
                      step="2"
                      value={customWidth}
                      onChange={(event) => setCustomWidth(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-studio-800 bg-studio-950 px-3 py-2 text-sm font-mono text-zinc-200"
                    />
                  </label>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Height (px)
                    <input
                      type="number"
                      min="16"
                      max="8192"
                      step="2"
                      value={customHeight}
                      onChange={(event) => setCustomHeight(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-studio-800 bg-studio-950 px-3 py-2 text-sm font-mono text-zinc-200"
                    />
                  </label>
                </div>
              )}

              {/* Framerate & Bitrate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Frame Rate
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[30, 60].map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setFrameRate(fps)}
                        className={`py-2 text-xs rounded-lg border font-mono transition-colors ${
                          frameRate === fps
                            ? 'bg-rose-950/50 border-rose-600 text-white font-medium'
                            : 'bg-studio-950 border-studio-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <span>Target Bitrate</span>
                    <span className="font-mono text-rose-400">{bitrateMbps} Mbps</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="60"
                    value={bitrateMbps}
                    onChange={(e) => setBitrateMbps(Number(e.target.value))}
                    className="w-full accent-rose-500 mt-2"
                  />
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3 rounded-lg bg-studio-950 border border-studio-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-400 leading-relaxed">
                  Encoded as H.264 video in an ISO Base Media File Format (<code className="text-zinc-200 font-mono">.mp4</code>), never WebM renamed as MP4. H.264 export depends on browser and device encoder support.
                </div>
              </div>
            </>
          )}

          {/* Export in progress feedback */}
          {isExporting && (
            <div className="py-6 space-y-4 text-center">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-white capitalize">
                  {progress.status} Frame {progress.currentFrame} of {progress.totalFrames}...
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Encoding genuine H.264 frames at {currentDims.width} × {currentDims.height}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-studio-950 rounded-full overflow-hidden border border-studio-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-burgundy-600 transition-all duration-150"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="text-xs font-mono text-rose-400">{progress.percentage}% Complete</div>

              <button
                onClick={onCancelExport}
                className="px-4 py-1.5 rounded-lg border border-studio-700 bg-studio-950 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel Export
              </button>
            </div>
          )}

          {/* Export Completed State */}
          {progress.status === 'completed' && downloadUrl && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Video Export Completed!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Your H.264 MP4 file has been successfully finalized and is ready to download.
                </p>
              </div>
              <a
                href={downloadUrl}
                download={`apex-motion-${resolution.toLowerCase()}.mp4`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-950/80 hover:brightness-110 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video</span>
              </a>
            </div>
          )}

          {/* Error State */}
          {progress.status === 'error' && (
            <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-300">Export Unsuccessful</div>
                <div className="mt-1">{progress.errorMessage || 'An error occurred during video encoding.'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && progress.status !== 'completed' && (
          <div className="px-6 py-4 bg-studio-950 border-t border-studio-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-studio-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onStartExport({
                  resolution,
                  frameRate,
                  bitrateMbps,
                  format: 'mp4',
                  ...(resolution === 'custom' ? { width: customWidth, height: customHeight } : {}),
                })
              }
              disabled={isExporting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-700 to-burgundy-700 hover:from-rose-600 hover:to-burgundy-600 text-xs font-semibold text-white shadow-md shadow-rose-950/60 transition-all"
            >
              Start Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
