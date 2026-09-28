import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { ChatSession } from '../../types';

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  onToast: (msg: string) => void;
}

export const ShareChatModal: React.FC<ShareChatModalProps> = ({
  isOpen,
  onClose,
  session,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session) return null;

  // Real URL architecture using current window origin
  const shareUrl = `${window.location.origin}/share/${session.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast('Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      onToast('Failed to copy link to clipboard');
    }
  };

  const handleOpen = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#14161a] border border-white/10 shadow-2xl overflow-hidden z-10 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Share Chat</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {session.title || 'Conversation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-slate-300 text-xs leading-relaxed">
            Anyone with this link can view a clean transcript of this conversation. Your private settings and API keys are never shared.
          </p>

          {/* Generated Share URL box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">Shareable Link</label>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0d0e11] border border-white/10 focus-within:border-cyan-500/50 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 ml-2 shrink-0" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-1.5 py-1 text-xs text-slate-200 font-mono select-all focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02] text-xs">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
