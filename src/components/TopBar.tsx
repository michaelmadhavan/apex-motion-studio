import React from 'react';
import { AspectRatioType } from '../types';
import { Film, Download, RefreshCw, PlusCircle } from 'lucide-react';

interface TopBarProps {
  aspectRatio: AspectRatioType;
  onAspectRatioChange: (ar: AspectRatioType) => void;
  onOpenExport: () => void;
  onResetProject: () => void;
  onNewProject: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  aspectRatio,
  onAspectRatioChange,
  onOpenExport,
  onResetProject,
  onNewProject,
}) => {
  const ratios: { label: string; value: AspectRatioType }[] = [
    { label: '16:9 Landscape', value: '16:9' },
    { label: '9:16 Vertical', value: '9:16' },
    { label: '1:1 Square', value: '1:1' },
    { label: '4:5 Portrait', value: '4:5' },
  ];

  return (
    <header className="h-14 bg-studio-950 border-b border-studio-800 px-4 flex items-center justify-between select-none">
      {/* Studio Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-burgundy-600 to-rose-700 flex items-center justify-center shadow-lg shadow-burgundy-900/40">
          <Film className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-wide">APEX</span>
          <span className="text-rose-400 font-semibold text-xs ml-1.5 uppercase tracking-wider">Motion Studio</span>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="flex items-center bg-studio-900 border border-studio-800 rounded-lg p-0.5">
        {ratios.map((r) => (
          <button
            key={r.value}
            onClick={() => onAspectRatioChange(r.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              aspectRatio === r.value
                ? 'bg-rose-950/80 text-white border border-rose-700/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-studio-800/60'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewProject}
          title="New blank project"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-studio-900 hover:bg-studio-850 border border-studio-800 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>New</span>
        </button>

        <button
          onClick={onResetProject}
          title="Reset project to default cards and layout"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-studio-900 hover:bg-studio-850 border border-studio-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Reset</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-rose-700 to-burgundy-700 hover:from-rose-600 hover:to-burgundy-600 shadow-md shadow-rose-950/60 border border-rose-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MP4</span>
        </button>
      </div>
    </header>
  );
};
