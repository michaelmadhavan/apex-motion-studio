import React from 'react';
import { Play, Pause, RotateCcw, Repeat } from 'lucide-react';

interface TimelineBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  loop: boolean;
  onToggleLoop: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  isPlaying,
  onTogglePlay,
  onRestart,
  currentTime,
  duration,
  onSeek,
  speed,
  onSpeedChange,
  loop,
  onToggleLoop,
}) => {
  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-16 bg-studio-950 border-t border-studio-800 px-6 flex items-center gap-6 select-none">
      {/* Play / Restart Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRestart}
          title="Restart animation (0:00)"
          className="p-2 rounded-lg bg-studio-900 border border-studio-800 text-zinc-400 hover:text-white hover:bg-studio-850 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-lg bg-gradient-to-r from-rose-700 to-burgundy-700 hover:from-rose-600 hover:to-burgundy-600 text-white flex items-center justify-center shadow-md shadow-rose-950/60 border border-rose-500/30 transition-transform active:scale-95"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>
      </div>

      {/* Scrubber Bar */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-400 w-12 text-right">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-studio-800 rounded-lg appearance-none"
        />

        <span className="text-xs font-mono text-zinc-500 w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Speed & Loop Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-studio-900 border border-studio-800 rounded-lg p-0.5">
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-[11px] font-mono rounded font-medium transition-colors ${
                speed === s
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onToggleLoop}
          title={loop ? 'Looping enabled' : 'Looping disabled'}
          className={`p-2 rounded-lg border transition-colors ${
            loop
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-400'
              : 'bg-studio-900 border-studio-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
