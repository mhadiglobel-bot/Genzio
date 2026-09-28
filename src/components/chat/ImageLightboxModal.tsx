import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  imageAlt?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  imageAlt = 'Image preview',
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (imageUrl) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Toolbar */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-[210] bg-[#14171d]/80 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <a
          href={imageUrl}
          download="attachment-image"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Download image"
        >
          <Download className="w-4 h-4" />
        </a>
        <div className="w-px h-5 bg-white/10 my-auto" />
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close lightbox"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-auto p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-transform duration-200 select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      </div>
    </div>
  );
};
