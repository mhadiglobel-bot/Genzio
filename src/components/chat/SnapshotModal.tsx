import React, { useState } from 'react';
import { Camera, X, Check, Image as ImageIcon, MessageSquare, Download, Layers, Loader2 } from 'lucide-react';
import { ChatSession, ChatMessage } from '../../types';
import { captureElementToPng } from '../../services/snapshotService';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  onToast: (msg: string) => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  session,
  onToast,
}) => {
  const [captureMode, setCaptureMode] = useState<'viewport' | 'message' | 'full'>('viewport');
  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    session?.messages?.[session.messages.length - 1]?.id || ''
  );
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isOpen || !session) return null;

  const messages = session.messages || [];

  const handleExecuteCapture = async () => {
    if (messages.length === 0) {
      onToast('No messages available in this conversation to capture.');
      return;
    }

    setIsCapturing(true);

    try {
      let targetElement: HTMLElement | null = null;
      const cleanTitle = (session.title || 'chat')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 24);
      let filename = `genzio_snapshot_${cleanTitle}_${Date.now()}.png`;

      if (captureMode === 'message') {
        const msgId = selectedMessageId || messages[messages.length - 1]?.id;
        targetElement =
          document.getElementById(`message-${msgId}`) ||
          document.getElementById(`msg-${msgId}`);
        filename = `genzio_msg_${cleanTitle}_${Date.now()}.png`;
      } else {
        // Viewport or Full messages container
        targetElement =
          document.getElementById('chat-messages-container') ||
          document.getElementById('messages-scroll-area') ||
          document.querySelector('main');
      }

      if (!targetElement) {
        onToast('Unable to locate conversation viewport for capture.');
        setIsCapturing(false);
        return;
      }

      const success = await captureElementToPng(targetElement, filename);
      if (success) {
        onToast('Snapshot saved as high-res PNG image (.png)');
        onClose();
      } else {
        onToast('Failed to generate snapshot image.');
      }
    } catch (err) {
      console.error(err);
      onToast('Error generating snapshot.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#14161a] border border-white/10 shadow-2xl overflow-hidden z-10 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Snapshot</h3>
              <p className="text-[11px] text-slate-400">Capture and download conversation as PNG</p>
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

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Capture Mode Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
              Capture Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCaptureMode('viewport')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  captureMode === 'viewport'
                    ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-xs'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Current View</span>
                  {captureMode === 'viewport' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[10px] text-slate-400">Capture visible chat viewport</span>
              </button>

              <button
                type="button"
                onClick={() => setCaptureMode('message')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  captureMode === 'message'
                    ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-xs'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Selected Message</span>
                  {captureMode === 'message' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[10px] text-slate-400">Focus on one specific message</span>
              </button>
            </div>
          </div>

          {/* Specific Message Selection Dropdown (if Selected Message mode) */}
          {captureMode === 'message' && messages.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-slate-300">
                Choose Target Message
              </label>
              <select
                value={selectedMessageId || messages[messages.length - 1]?.id}
                onChange={(e) => setSelectedMessageId(e.target.value)}
                className="w-full bg-[#0d0e11] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                {messages.map((m, idx) => {
                  const roleLabel = m.role === 'user' ? 'User' : 'Genzio';
                  const snippet = m.content.replace(/\s+/g, ' ').substring(0, 45);
                  return (
                    <option key={m.id || idx} value={m.id}>
                      #{idx + 1} [{roleLabel}]: {snippet}...
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Info banner */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200/90 text-[11px] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Generates an uncompressed dark PNG preserving Markdown, code formatting, and styles.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteCapture}
            disabled={isCapturing || messages.length === 0}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Snapshot (.png)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
