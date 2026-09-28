import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Wand2, Download, ArrowRight, Palette } from 'lucide-react';

interface ImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateImagePrompt: (prompt: string) => void;
}

const STYLE_PRESETS = [
  'Photorealistic 8K, cinematic lighting, ultra-detailed',
  'Cyberpunk neon digital art, volumetric smoke',
  '3D Pixar animation style, warm lighting',
  'Minimalist vector illustration, clean lines',
  'Anime studio ghibli aesthetic, soft watercolor',
  'Dark fantasy oil painting, dramatic chiaroscuro',
];

export const ImagesModal: React.FC<ImagesModalProps> = ({
  isOpen,
  onClose,
  onGenerateImagePrompt,
}) => {
  const [promptText, setPromptText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    const fullPrompt = `Please create and generate a visual description / image for: "${promptText.trim()}". Style: ${selectedStyle}. Aspect Ratio: ${aspectRatio}.`;
    onGenerateImagePrompt(fullPrompt);
    setPromptText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#333538] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gemini Image Studio</h2>
              <p className="text-xs text-slate-400">Generate creative visuals, concept art, and high-resolution designs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#2a2b2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Prompt input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Describe what you want to create</span>
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., A futuristic glass greenhouse on Mars at twilight with bioluminescent plants..."
              rows={3}
              className="w-full bg-[#131314] border border-[#333538] focus:border-pink-500 rounded-2xl p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {['1:1', '16:9', '9:16', '4:3', '3:2'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                      : 'bg-[#131314] border-[#333538] text-slate-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Visual Style Preset</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer truncate ${
                    selectedStyle === style
                      ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                      : 'bg-[#131314] border-[#333538] text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!promptText.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mt-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Image with Gemini</span>
          </button>
        </form>
      </div>
    </div>
  );
};
