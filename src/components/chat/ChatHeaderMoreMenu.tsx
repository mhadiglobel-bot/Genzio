import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Share2,
  Download,
  FileText,
  Camera,
  Trash2,
} from 'lucide-react';
import { ChatSession } from '../../types';

export interface ChatHeaderMoreMenuProps {
  activeChat: ChatSession | null;
  onTogglePin: (chatId: string) => void;
  onOpenShare: (chat: ChatSession) => void;
  onExportPdf: (chat: ChatSession) => void;
  onExportMarkdown: (chat: ChatSession) => void;
  onOpenSnapshot: (chat: ChatSession) => void;
  onDeleteChat: (chatId: string) => void;
  disabled?: boolean;
}

export const ChatHeaderMoreMenu: React.FC<ChatHeaderMoreMenuProps> = ({
  activeChat,
  onTogglePin,
  onOpenShare,
  onExportPdf,
  onExportMarkdown,
  onOpenSnapshot,
  onDeleteChat,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasMessages = Boolean(activeChat && activeChat.messages && activeChat.messages.length > 0);
  const isPinned = Boolean(activeChat?.pinned);

  // Click outside and escape handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (callback: () => void) => {
    setIsOpen(false);
    callback();
  };

  if (!activeChat) {
    return null;
  }

  return (
    <div className="relative inline-block text-left select-none" ref={menuRef} id="header-more-actions-container">
      {/* ⋯ Header Trigger Button */}
      <button
        type="button"
        id="header-more-actions-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="More options"
        aria-label="More options"
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer shadow-xs select-none ${
          isOpen
            ? 'bg-white/[0.08] text-white shadow-[0_0_16px_rgba(0,240,255,0.12)]'
            : 'bg-white/[0.035] hover:bg-white/[0.07] text-slate-300 hover:text-white'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          id="header-more-actions-menu"
          className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-[#14161c]/98 border border-white/[0.05] shadow-2xl z-50 p-1.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* 1. Pin to Top / Unpin from Top */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-toggle-pin"
            onClick={() => handleAction(() => onTogglePin(activeChat.id))}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              {isPinned ? (
                <PinOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Pin className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
              )}
              <span>{isPinned ? 'Unpin from Top' : 'Pin to Top'}</span>
            </div>
            {isPinned && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-amber-500/15 text-amber-300 border border-amber-500/25">
                Pinned
              </span>
            )}
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* 2. Share Chat */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-share"
            onClick={() => handleAction(() => onOpenShare(activeChat))}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2.5 cursor-pointer group"
          >
            <Share2 className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
            <span>Share Chat</span>
          </button>

          {/* 3. Export as PDF */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-export-pdf"
            disabled={!hasMessages}
            onClick={() => handleAction(() => onExportPdf(activeChat))}
            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors flex items-center gap-2.5 ${
              hasMessages
                ? 'text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer group'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Download className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Export as PDF</span>
          </button>

          {/* 4. Export as Markdown (.md) */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-export-md"
            disabled={!hasMessages}
            onClick={() => handleAction(() => onExportMarkdown(activeChat))}
            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors flex items-center gap-2.5 ${
              hasMessages
                ? 'text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer group'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Export as Markdown (.md)</span>
          </button>

          {/* 5. Snapshot */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-snapshot"
            disabled={!hasMessages}
            onClick={() => handleAction(() => onOpenSnapshot(activeChat))}
            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors flex items-center gap-2.5 ${
              hasMessages
                ? 'text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer group'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Camera className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Snapshot</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* 6. Delete Chat */}
          <button
            type="button"
            role="menuitem"
            id="more-menu-delete"
            onClick={() => handleAction(() => onDeleteChat(activeChat.id))}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Delete Chat</span>
          </button>
        </div>
      )}
    </div>
  );
};
