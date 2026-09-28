import React, { useState } from 'react';
import { Copy, Check, Sparkles, Wand2, Film, Image as ImageIcon } from 'lucide-react';

interface PromptBlockProps {
  prompt: string;
  category?: 'image' | 'video' | 'general' | 'sora' | 'veo' | 'flow' | 'midjourney';
  targetModel?: string;
  title?: string;
  onGenerateImage?: (prompt: string) => void;
  onToast?: (message: string) => void;
}

export const PromptBlock: React.FC<PromptBlockProps> = ({
  prompt,
  category = 'image',
  targetModel,
  title,
  onGenerateImage,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanPrompt = prompt.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanPrompt);
      setCopied(true);
      if (onToast) {
        onToast('Prompt copied to clipboard');
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const isVideo = category === 'video' || category === 'sora' || category === 'veo' || category === 'flow';
  const isImage = !isVideo;

  const displayCategory = title || (
    isVideo
      ? (category === 'sora' ? 'Sora Video Prompt' : category === 'veo' ? 'Veo Video Prompt' : category === 'flow' ? 'Google Flow Prompt' : 'Video Generation Prompt')
      : (category === 'midjourney' ? 'Midjourney Prompt' : 'Image Generation Prompt')
  );

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden bg-[#111317] border border-[#2b2e35] shadow-xl transition-all duration-200 hover:border-[#3b3f49]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181a1f] border-b border-[#26282f] select-none">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <Film className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
          ) : (
            <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {displayCategory}
          </span>
          {targetModel && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              {targetModel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isImage && onGenerateImage && (
            <button
              type="button"
              onClick={() => onGenerateImage(cleanPrompt)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 text-cyan-200 hover:text-white border border-cyan-500/30 text-xs font-medium transition-all duration-150 cursor-pointer shadow-xs"
              title="Generate this image directly in Genzio"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" aria-hidden="true" />
              <span>Generate Image</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22252c] hover:bg-[#2c3038] text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer border border-[#333742]"
            title="Copy prompt text only"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt Body */}
      <div className="p-4 bg-[#0d0f12] text-[#f1f3f5] font-mono text-[13.5px] leading-relaxed select-text whitespace-pre-wrap break-words">
        {cleanPrompt}
      </div>

      {/* Footer subtle tip */}
      <div className="px-4 py-2 bg-[#14161b] border-t border-[#1f2228] flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400/80 shrink-0" aria-hidden="true" />
          <span>Ready to paste into Midjourney, DALL-E, Sora, or Imagen</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {cleanPrompt.length} chars
        </span>
      </div>
    </div>
  );
};
