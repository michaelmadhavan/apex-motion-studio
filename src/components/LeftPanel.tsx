import React, { useRef } from 'react';
import { StudioImage, TemplateId } from '../types';
import { TemplateRegistry } from '../engine/TemplateRegistry';
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Orbit,
  Layers,
  Sparkles,
  LayoutGrid,
  Wind,
  Focus,
  Image as ImageIcon,
} from 'lucide-react';

interface LeftPanelProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  images: StudioImage[];
  onAddImages: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onReorderImage: (index: number, direction: 'up' | 'down') => void;
  onClearAll: () => void;
  cardCount: number;
  onCardCountChange: (count: number) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  selectedTemplate,
  onSelectTemplate,
  images,
  onAddImages,
  onRemoveImage,
  onReorderImage,
  onClearAll,
  cardCount,
  onCardCountChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTemplateIcon = (id: TemplateId) => {
    switch (id) {
      case 'orbit-cards':
        return <Orbit className="w-4 h-4 text-rose-400" />;
      case 'card-flip':
        return <Layers className="w-4 h-4 text-rose-400" />;
      case 'cinematic-popup':
        return <Sparkles className="w-4 h-4 text-rose-400" />;
      case 'staggered-reveal':
        return <LayoutGrid className="w-4 h-4 text-rose-400" />;
      case 'floating-cards':
        return <Wind className="w-4 h-4 text-rose-400" />;
      case 'image-tunnel':
        return <Focus className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <aside className="w-80 bg-studio-950 border-r border-studio-800 flex flex-col h-full select-none flex-shrink-0">
      {/* Templates Section */}
      <div className="p-4 border-b border-studio-800">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
          Motion Templates
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {TemplateRegistry.templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl.id)}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-600/70 shadow-sm shadow-rose-950/50'
                    : 'bg-studio-900 border-studio-800 hover:border-studio-700 hover:bg-studio-850'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {getTemplateIcon(tpl.id)}
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                    {tpl.name}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 line-clamp-1">
                  {tpl.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Count Selector */}
      <div className="p-4 border-b border-studio-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Card Count
          </span>
          <span className="text-xs font-mono text-rose-400 font-medium">
            {Math.min(cardCount, images.length)} / {cardCount} active
          </span>
        </div>
        <div className="flex gap-1.5">
          {[3, 5, 7, 10].map((num) => (
            <button
              key={num}
              onClick={() => onCardCountChange(num)}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                cardCount === num
                  ? 'bg-rose-900/60 border-rose-700/60 text-white font-medium'
                  : 'bg-studio-900 border-studio-800 text-zinc-400 hover:bg-studio-800 hover:text-zinc-200'
              }`}
            >
              {num}
            </button>
          ))}
          <input
            type="number"
            min="1"
            max="30"
            value={cardCount}
            onChange={(e) => onCardCountChange(Math.max(1, parseInt(e.target.value) || 1))}
            title="Custom Count"
            className="w-14 px-1.5 py-1 text-xs text-center rounded border border-studio-800 bg-studio-900 text-zinc-200 focus:outline-none focus:border-rose-600 font-mono"
          />
        </div>
      </div>

      {/* Image Manager Header */}
      <div className="p-4 flex items-center justify-between border-b border-studio-850">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Image Pool ({images.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddImages(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-studio-800 hover:bg-studio-750 text-white text-xs font-medium border border-studio-700 transition-colors"
          >
            <Upload className="w-3 h-3 text-rose-400" />
            <span>Upload</span>
          </button>
          {images.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all images"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-studio-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {images.length === 0 ? (
          <div className="h-44 border border-dashed border-studio-800 rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <Upload className="w-7 h-7 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No images uploaded</p>
            <p className="text-[11px] text-zinc-600 mt-1">Supports PNG, JPG, JPEG, WEBP</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-3 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs rounded transition-colors"
            >
              Select Images
            </button>
          </div>
        ) : (
          images.map((img, idx) => {
            const isActive = idx < cardCount;
            return (
              <div
                key={img.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-studio-900 border-studio-800'
                    : 'bg-studio-950/60 border-studio-900 opacity-50'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-10 h-14 object-cover rounded bg-studio-950 border border-studio-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-rose-400 font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {img.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {isActive ? 'Active in animation' : 'Queued in pool'}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => onReorderImage(idx, 'up')}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-studio-800 disabled:opacity-20"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === images.length - 1}
                    onClick={() => onReorderImage(idx, 'down')}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-studio-800 disabled:opacity-20"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveImage(img.id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-studio-800"
                    title="Delete image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
