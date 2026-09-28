import React, { useState } from 'react';
import { X, Share2, Link as LinkIcon, Copy, Check, FileText, Download, Globe, Lock } from 'lucide-react';
import { ChatSession } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  onExportPdf?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  session,
  onExportPdf,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  if (!isOpen || !session) return null;

  const shareableUrl = `${window.location.origin}/genzio/share/${session.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      let md = `# ${session.title}\n\n`;
      session.messages.forEach((msg) => {
        md += `### ${msg.role === 'user' ? 'User' : 'Genzio'}\n${msg.content}\n\n`;
      });
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-700/80 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Share Conversation</h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{session.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Public Link Section */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? <Globe className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
                <div>
                  <div className="font-semibold text-slate-200">Public Snapshot Link</div>
                  <div className="text-[11px] text-slate-400">
                    {isPublic ? 'Anyone with this link can view a static snapshot' : 'Snapshot link is currently private'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isPublic ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isPublic ? 'Enabled' : 'Enable'}
              </button>
            </div>

            {isPublic && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 bg-[#07090e] px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-slate-300 text-[11px] font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Copy Transcript */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <div className="font-semibold text-slate-200">Copy Formatted Transcript</div>
              <div className="text-[11px] text-slate-400">Full conversation in standard Markdown format</div>
            </div>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedMarkdown ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* PDF Download Shortcut */}
          {onExportPdf && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div>
                <div className="font-semibold text-slate-200">Download PDF (.pdf)</div>
                <div className="text-[11px] text-slate-400">Save full conversation directly to your device as PDF</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#080b12] border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
