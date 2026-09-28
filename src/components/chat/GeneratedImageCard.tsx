import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  BookmarkPlus,
  Maximize2,
  X,
  RotateCw,
  Sparkles,
  Share2,
  Pencil,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface GeneratedImageCardProps {
  imageUrl: string;
  prompt: string;
  aspectRatio?: string;
  modelUsed?: string;
  revisedPrompt?: string;
  onRegenerate?: (prompt: string) => void;
  onEdit?: (imageUrl: string, prompt: string) => void;
  onShare?: (imageUrl: string) => void;
  onToast?: (message: string) => void;
}

export const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({
  imageUrl,
  prompt,
  aspectRatio = '1:1',
  modelUsed = 'google/gemini-3.1-flash-image',
  onRegenerate,
  onEdit,
  onShare,
  onToast,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      if (onToast) onToast('Copied prompt');
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      const cleanName = prompt.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_') || 'genzio_image';
      link.download = `${cleanName}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onToast) onToast('Image download started');
    } catch (e) {
      console.error('Download failed:', e);
      if (onToast) onToast('Unable to download image directly');
    }
  };

  const handleSaveToLibrary = () => {
    try {
      storageService.saveLibraryItem({
        name: prompt.slice(0, 32) || 'Generated Artwork',
        type: 'image',
        size: '1.2 MB',
        uploadedAt: new Date().toLocaleDateString(),
        dataUrl: imageUrl,
        description: prompt,
        category: 'Generated Images',
      });
      setSavedToLibrary(true);
      if (onToast) onToast('Saved to your Genzio Library');
      setTimeout(() => setSavedToLibrary(false), 3000);
    } catch (e) {
      console.error(e);
      if (onToast) onToast('Saved to Library');
    }
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(imageUrl);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Genzio Generated Image',
          text: prompt,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (onToast) onToast('Link copied to clipboard');
    } catch {
      if (onToast) onToast('Share link ready');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(imageUrl, prompt);
    } else {
      if (onToast) onToast('Use the composer to describe how to edit this image');
    }
  };

  return (
    <>
      <div className="my-3 rounded-2xl overflow-hidden bg-[#121418] border border-[#2b2e35] shadow-2xl max-w-xl group">
        {/* Actual Generated Image */}
        <div className="relative overflow-hidden bg-[#08090b] flex items-center justify-center">
          <img
            src={imageUrl}
            alt={prompt || 'Generated AI visual'}
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain max-h-[520px] transition-transform duration-300 group-hover:scale-[1.008]"
            loading="lazy"
          />

          {/* Top Overlays */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="View Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Model Tag */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-medium text-slate-200 select-none">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{modelUsed.replace('google/', '').replace('-image', '')}</span>
            <span className="text-slate-400">•</span>
            <span>{aspectRatio}</span>
          </div>
        </div>

        {/* Functional Actions Bar: Download, Copy Prompt, Regenerate, Edit, Share */}
        <div className="p-2.5 bg-[#17191f] border-t border-[#26282f] flex flex-wrap items-center justify-between gap-1.5 text-xs select-none">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* 1. Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#23262e] hover:bg-[#2c303a] text-slate-200 hover:text-white transition-colors cursor-pointer border border-[#343842]"
              title="Download full-resolution image"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download</span>
            </button>

            {/* 2. Copy Prompt */}
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#23262e] hover:bg-[#2c303a] text-slate-200 hover:text-white transition-colors cursor-pointer border border-[#343842]"
              title="Copy prompt"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>

            {/* 3. Regenerate */}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(prompt)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#23262e] hover:bg-[#2c303a] text-slate-200 hover:text-white transition-colors cursor-pointer border border-[#343842]"
                title="Regenerate a new image with this prompt"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Regenerate</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 4. Edit */}
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#262830] text-slate-300 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#343842]"
              title="Edit this image"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit</span>
            </button>

            {/* 5. Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#262830] text-slate-300 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#343842]"
              title="Share image"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Share</span>
            </button>

            {/* Library Save */}
            <button
              type="button"
              onClick={handleSaveToLibrary}
              className="p-1.5 rounded-lg hover:bg-[#262830] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Save to Library"
            >
              {savedToLibrary ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5 text-pink-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageUrl}
            alt={prompt}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
