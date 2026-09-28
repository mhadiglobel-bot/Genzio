import React, { useState, useRef, useEffect } from 'react';
import {
  SquarePen,
  Search,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Share2,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  X,
  Archive,
  Smile,
  Terminal,
  Sparkles,
  AlertTriangle,
  Keyboard,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { ChatSession } from '../../types';
import { GenzioLogo } from '../common/GenzioLogo';
import { ChangeIconModal } from './ChangeIconModal';

export type DesktopSidebarMode = 'collapsed' | 'hover-preview' | 'pinned';

export interface ChatSidebarProps {
  /** Mobile / tablet off-canvas drawer open state */
  isOpen: boolean;
  /** Mobile / tablet drawer close handler */
  onCloseMobile?: () => void;
  /** Desktop PINNED OPEN state (persisted) */
  isPinnedOpen: boolean;
  /** Set desktop pinned state to open */
  onPinSidebarOpen: () => void;
  /** Explicitly close/collapse pinned sidebar on desktop */
  onExplicitSidebarClose: () => void;
  /** Optional toggle handler for backwards compatibility */
  onToggleSidebarPin?: () => void;
  /** Notification of active desktop mode: 'collapsed' | 'hover-preview' | 'pinned' */
  onSidebarModeChange?: (mode: DesktopSidebarMode) => void;

  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onArchiveChat?: (id: string) => void;
  onChangeIcon?: (id: string, iconValue: string | undefined, iconCategory?: string) => void;
  onSelectChatFromSearch?: (chatId: string, messageId?: string, term?: string) => void;
  onOpenSearch?: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onOpenCustomInstructions?: () => void;
  onOpenShare: (chat: ChatSession) => void;
  onExportPdf: (chat: ChatSession) => void;
  onOpenImages?: () => void;
  onOpenScheduled?: () => void;
  onOpenProjects?: () => void;
  onToggleTemporaryChat?: () => void;
  isTemporaryChat?: boolean;
}

// Group chats by date: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older
function groupChatsByDate(chats: ChatSession[]) {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const prev7Days: ChatSession[] = [];
  const prev30Days: ChatSession[] = [];
  const older: ChatSession[] = [];

  // Filter out archived chats AND empty unpersisted new chats (0 messages & title === 'New chat')
  const regularChats = chats.filter(
    (c) => !c.pinned && !c.isArchived && (c.messages.length > 0 || c.title !== 'New chat')
  );

  regularChats.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  regularChats.forEach((chat) => {
    const diff = now - (chat.updatedAt || chat.createdAt || now);
    if (diff < ONE_DAY) {
      today.push(chat);
    } else if (diff < ONE_DAY * 2) {
      yesterday.push(chat);
    } else if (diff < ONE_DAY * 7) {
      prev7Days.push(chat);
    } else if (diff < ONE_DAY * 30) {
      prev30Days.push(chat);
    } else {
      older.push(chat);
    }
  });

  return { today, yesterday, prev7Days, prev30Days, older };
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onCloseMobile,
  isPinnedOpen,
  onPinSidebarOpen,
  onExplicitSidebarClose,
  onToggleSidebarPin,
  onSidebarModeChange,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onTogglePin,
  onDeleteChat,
  onRenameChat,
  onArchiveChat,
  onChangeIcon,
  onOpenLibrary,
  onOpenSettings,
  onOpenShare,
  onExportPdf,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [iconModalChat, setIconModalChat] = useState<ChatSession | null>(null);
  const [deleteConfirmChat, setDeleteConfirmChat] = useState<ChatSession | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // ==========================================================
  // 3-STATE DESKTOP MODEL: COLLAPSED | HOVER PREVIEW | PINNED OPEN
  // ==========================================================
  // 1. Temporary hover preview state (only active when NOT pinned open)
  const [isHoverPreview, setIsHoverPreview] = useState(false);

  // 2. Suppression flag: after an explicit collapse click, suppress hover until cursor leaves sidebar
  const suppressHoverRef = useRef(false);

  // 3. Timers
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current desktop mode computed with strict priority: PINNED OPEN > HOVER PREVIEW > COLLAPSED
  const desktopMode: DesktopSidebarMode = isPinnedOpen
    ? 'pinned'
    : isHoverPreview
    ? 'hover-preview'
    : 'collapsed';

  // Inform parent when desktop mode changes
  useEffect(() => {
    onSidebarModeChange?.(desktopMode);
  }, [desktopMode, onSidebarModeChange]);

  // Clean up hover state if pinned open state changes
  useEffect(() => {
    if (isPinnedOpen) {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      setIsHoverPreview(false);
    }
  }, [isPinnedOpen]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------------
  // HOVER HANDLERS (Desktop Only)
  // ----------------------------------------------------------
  const handleMouseEnter = () => {
    // Priority 1: Pinned open ignores hover preview completely
    if (isPinnedOpen) return;

    // Priority 2: If hover is suppressed (user just clicked collapse and hasn't left yet), ignore
    if (suppressHoverRef.current) return;

    // Priority 3: Cancel pending leave collapse timer if returning to preview
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (isHoverPreview) return;

    // Priority 4: Fast hover open delay (40ms)
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setIsHoverPreview(true);
      enterTimerRef.current = null;
    }, 40);
  };

  const handleMouseLeave = () => {
    // 1. Cursor left sidebar boundary: release any hover suppression
    suppressHoverRef.current = false;

    // 2. Clear pending enter timer if cursor was just passing through
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    // 3. PINNED OPEN MODE MUST NEVER CLOSE ON MOUSE LEAVE!
    if (isPinnedOpen) return;

    // 4. In hover preview: start leave collapse delay (250ms)
    if (isHoverPreview) {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = setTimeout(() => {
        setIsHoverPreview(false);
        leaveTimerRef.current = null;
      }, 250);
    }
  };

  // ----------------------------------------------------------
  // CLICK HANDLERS (Explicit Pin / Collapse)
  // ----------------------------------------------------------
  // Explicitly Pin Open (from any click inside hover preview or collapsed rail)
  const handlePinOpen = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    suppressHoverRef.current = false;
    setIsHoverPreview(false);
    if (onPinSidebarOpen) {
      onPinSidebarOpen();
    } else if (onToggleSidebarPin) {
      onToggleSidebarPin();
    }
  };

  // Explicitly Collapse (from Brand button click inside pinned sidebar)
  const handleExplicitCollapse = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    // Suppress hover preview until cursor leaves the sidebar region completely
    suppressHoverRef.current = true;
    setIsHoverPreview(false);
    onExplicitSidebarClose();
  };

  // Click handler on the sidebar container: clicking ANYWHERE when collapsed or in hover pins it!
  const handleAsideClick = (e: React.MouseEvent) => {
    // If in hover preview or collapsed rail, clicking anywhere converts to PINNED OPEN!
    if (desktopMode === 'hover-preview' || desktopMode === 'collapsed') {
      handlePinOpen();
    }
    // Once pinned open, clicking inside the sidebar must NOT close it!
  };

  // ----------------------------------------------------------
  // INLINE SEARCH (⌘K / Ctrl+K)
  // ----------------------------------------------------------
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!isPinnedOpen) {
          handlePinOpen();
        }
        setIsSearchActive(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinnedOpen]);

  const queryLower = searchQuery.trim().toLowerCase();
  const filteredChats = searchQuery.trim()
    ? chats.filter((c) => {
        const matchTitle = c.title.toLowerCase().includes(queryLower);
        const matchContent = c.messages?.some((m) => m.content.toLowerCase().includes(queryLower));
        return matchTitle || matchContent;
      })
    : null;

  const pinnedChats = chats.filter((c) => c.pinned && !c.isArchived);
  const { today, yesterday, prev7Days, prev30Days, older } = groupChatsByDate(chats);

  const startRename = (chat: ChatSession) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setMenuOpenChatId(null);
  };

  const handleSaveRename = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  // ----------------------------------------------------------
  // ITEM CLICK HANDLER: Desktop stays open; Mobile closes drawer
  // ----------------------------------------------------------
  const handleItemNavigation = (action: () => void, isMobile: boolean) => {
    action();
    if (isMobile) {
      onCloseMobile?.();
    } else if (desktopMode === 'hover-preview') {
      // Interacting with sidebar item converts hover preview to PINNED OPEN
      handlePinOpen();
    }
    // On desktop: navigation items NEVER close a pinned open sidebar!
  };

  // ----------------------------------------------------------
  // RENDER CUSTOM CHAT ICON
  // ----------------------------------------------------------
  const renderChatIcon = (chat: ChatSession, isActive: boolean) => {
    const iconVal = chat.icon;
    const category = chat.iconCategory;

    if (iconVal) {
      if (iconVal.startsWith('data:image/') || iconVal.startsWith('http')) {
        return (
          <img
            src={iconVal}
            alt=""
            className="w-4 h-4 rounded-full object-cover shrink-0 shadow-xs"
          />
        );
      }
      if (iconVal.startsWith('orb:')) {
        const orbColor =
          iconVal === 'orb:pink'
            ? 'bg-pink-500 shadow-pink-500/50'
            : iconVal === 'orb:purple'
            ? 'bg-purple-500 shadow-purple-500/50'
            : iconVal === 'orb:emerald'
            ? 'bg-emerald-500 shadow-emerald-500/50'
            : 'bg-cyan-400 shadow-cyan-400/50';
        return (
          <span
            className={`w-2.5 h-2.5 rounded-full ${orbColor} shadow-md shrink-0 border border-white/20`}
          />
        );
      }
      // Render emoji or short string icon
      return <span className="text-xs leading-none shrink-0 select-none">{iconVal}</span>;
    }

    // Category fallback
    if (category === 'coding') {
      return (
        <Terminal
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
          }`}
        />
      );
    }
    if (category === 'doc') {
      return (
        <FileText
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
          }`}
        />
      );
    }
    if (category === 'image') {
      return (
        <Sparkles
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive ? 'text-pink-400' : 'text-slate-400 group-hover:text-pink-400'
          }`}
        />
      );
    }
    if (category === 'research') {
      return (
        <Search
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'
          }`}
        />
      );
    }

    // Standard Default
    return (
      <MessageSquare
        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      />
    );
  };

  // ----------------------------------------------------------
  // RENDER A SINGLE CONVERSATION ROW
  // ----------------------------------------------------------
  const renderChatItem = (chat: ChatSession, isMobile = false) => {
    const isActive = activeChatId === chat.id;
    const isEditing = editingChatId === chat.id;
    const isMenuOpen = menuOpenChatId === chat.id;

    return (
      <div
        key={chat.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer select-none transition-all duration-150 border-l-2 ${
          isActive
            ? 'bg-white/[0.08] border-cyan-400 text-white font-medium shadow-xs'
            : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
        }`}
        title={chat.title}
        onClick={() => {
          if (!isEditing) {
            handleItemNavigation(() => onSelectChat(chat.id), isMobile);
          }
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {renderChatIcon(chat, isActive)}

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(chat.id);
                if (e.key === 'Escape') setEditingChatId(null);
              }}
              onBlur={() => handleSaveRename(chat.id)}
              autoFocus
              className="w-full bg-[#121314] text-white px-2 py-0.5 rounded-md border border-cyan-500/50 focus:outline-none text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate flex-1 text-[13px] leading-snug">{chat.title}</span>
          )}
        </div>

        {/* Action Menu (Pin indicator + 3 dots button) */}
        {!isEditing && (
          <div className="relative shrink-0 flex items-center gap-1">
            {chat.pinned && (
              <Pin className="w-3 h-3 text-cyan-400/90 fill-cyan-400/40 shrink-0" />
            )}

            <button
              type="button"
              id={`chat-options-btn-${chat.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenChatId(isMenuOpen ? null : chat.id);
              }}
              className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-opacity cursor-pointer ${
                isMenuOpen || isActive ? 'opacity-100' : 'opacity-70 lg:opacity-0 lg:group-hover:opacity-100'
              }`}
              title="Options"
              aria-label="Conversation options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Context Dropdown */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenChatId(null);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1b1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl z-40 p-1 space-y-0.5 text-xs text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(chat.id);
                      setMenuOpenChatId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    {chat.pinned ? (
                      <PinOff className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Pin className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{chat.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(chat);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIconModalChat(chat);
                      setMenuOpenChatId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    <Smile className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Icon</span>
                  </button>

                  {onArchiveChat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveChat(chat.id);
                        setMenuOpenChatId(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Archive</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShare(chat);
                      setMenuOpenChatId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportPdf(chat);
                      setMenuOpenChatId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmChat(chat);
                      setMenuOpenChatId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 text-left cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------------
  // RENDER EXPANDED CONTENT (Nav, Search, Recents, Profile)
  // ----------------------------------------------------------
  const renderExpandedBody = (isMobile = false) => (
    <>
      {/* Primary Navigation: New Chat, Library, Search */}
      <nav className="p-2.5 space-y-1 shrink-0" aria-label="Primary Navigation">
        {/* 1. New Chat */}
        <button
          type="button"
          id={isMobile ? 'mobile-nav-new-chat' : 'sidebar-nav-new-chat'}
          onClick={() => handleItemNavigation(onNewChat, isMobile)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-200 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer group"
          aria-label="New Chat"
        >
          <SquarePen className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform" />
          <span>New Chat</span>
        </button>

        {/* 2. Library */}
        <button
          type="button"
          id={isMobile ? 'mobile-nav-library' : 'sidebar-nav-library'}
          onClick={() => handleItemNavigation(onOpenLibrary, isMobile)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer group"
          aria-label="Library"
        >
          <LayoutGrid className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
          <span>Library</span>
        </button>

        {/* 3. Search Chat */}
        {!isSearchActive ? (
          <button
            type="button"
            id={isMobile ? 'mobile-nav-search-chat' : 'sidebar-nav-search-chat'}
            onClick={() => {
              setIsSearchActive(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer group"
            title="Search Chat (⌘K)"
            aria-label="Search Chat"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
              <span className="truncate">Search Chat</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/[0.04] rounded">
              ⌘K
            </kbd>
          </button>
        ) : (
          <div className="space-y-1 pt-0.5">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                id="sidebar-inline-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#121314] text-white placeholder-slate-500 rounded-xl border border-cyan-500/50 focus:border-cyan-400 focus:outline-none text-xs transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (searchQuery) setSearchQuery('');
                    else setIsSearchActive(false);
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  } else {
                    setIsSearchActive(false);
                  }
                }}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title={searchQuery ? 'Clear search' : 'Close search'}
                aria-label="Close search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="px-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {filteredChats ? filteredChats.length : 0}{' '}
                  {filteredChats && filteredChats.length === 1 ? 'chat found' : 'chats found'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Conversation History Scroll: Search Results OR Recents */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-4 min-h-0">
        {searchQuery.trim() ? (
          <div className="space-y-1.5">
            <div className="px-2.5 text-[11px] font-semibold text-cyan-400 tracking-wider flex items-center justify-between">
              <span>Matching Chats</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {filteredChats?.length || 0} found
              </span>
            </div>
            {filteredChats && filteredChats.length > 0 ? (
              <div className="space-y-0.5">
                {filteredChats.map((c) => renderChatItem(c, isMobile))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center space-y-1">
                <p className="text-xs text-slate-400">No chats matching &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-[11px] text-slate-600">Try another keyword</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedChats.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Pin className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400/50" />
                  <span>Pinned</span>
                </div>
                {pinnedChats.map((c) => renderChatItem(c, isMobile))}
              </div>
            )}

            {/* Recents Section */}
            <div className="space-y-3">
              <div className="px-2.5 text-[11px] font-semibold text-slate-400 tracking-wider">
                Recents
              </div>

              {today.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Today
                  </div>
                  {today.map((c) => renderChatItem(c, isMobile))}
                </div>
              )}

              {yesterday.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Yesterday
                  </div>
                  {yesterday.map((c) => renderChatItem(c, isMobile))}
                </div>
              )}

              {prev7Days.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  {prev7Days.map((c) => renderChatItem(c, isMobile))}
                </div>
              )}

              {prev30Days.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Previous 30 Days
                  </div>
                  {prev30Days.map((c) => renderChatItem(c, isMobile))}
                </div>
              )}

              {older.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Older
                  </div>
                  {older.map((c) => renderChatItem(c, isMobile))}
                </div>
              )}

              {chats.length === 0 && (
                <div className="px-3 py-8 text-center text-xs text-slate-500">
                  No conversations yet
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Profile / Settings Footer */}
      <div className="p-2 bg-white/[0.015] shrink-0 mt-auto">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors group">
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            onClick={() => handleItemNavigation(onOpenSettings, isMobile)}
            title="Account Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/80 via-purple-500/80 to-pink-500/80 p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#121314] flex items-center justify-center text-[11px] font-bold text-white">
                G
              </div>
            </div>

            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Genzio User
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Pro Workspace
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleItemNavigation(onOpenSettings, isMobile)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ======================================================= */}
      {/* 1. MOBILE BACKDROP OVERLAY (< 640px)                     */}
      {/* ======================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs sm:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* ======================================================= */}
      {/* 2. DESKTOP SIDEBAR (sm: 640px+)                          */}
      {/* ======================================================= */}
      {/* Outer in-flow layout container: maintains layout stability */}
      <div
        className={`hidden sm:block shrink-0 h-full relative transition-[width] duration-300 ease-in-out ${
          isPinnedOpen ? 'w-[280px]' : 'w-16'
        }`}
      >
        <aside
          id="genzio-desktop-sidebar"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleAsideClick}
          className={`h-full flex flex-col select-none transition-[width,box-shadow,background-color] duration-300 ease-in-out ${
            desktopMode === 'pinned'
              ? 'relative w-[280px] z-30'
              : desktopMode === 'hover-preview'
              ? 'absolute top-0 bottom-0 left-0 z-50 w-[280px] shadow-2xl cursor-pointer'
              : 'relative w-16 z-30 cursor-pointer'
          }`}
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            boxShadow:
              desktopMode === 'hover-preview'
                ? '0 20px 48px rgba(0,0,0,0.9), 4px 0 24px -2px rgba(0,0,0,0.5)'
                : '4px 0 20px -4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top Header Area: Brand Lockup only (Zero dedicated toggle buttons) */}
          <div
            className="h-14 px-3 flex items-center justify-between shrink-0"
          >
            {/* A) PINNED OPEN HEADER: Brand Lockup (Clicking brand lockup unpins and collapses sidebar) */}
            {desktopMode === 'pinned' && (
              <div className="flex items-center w-full">
                <button
                  type="button"
                  id="sidebar-brand-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExplicitCollapse();
                  }}
                  className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group text-left w-full"
                  title="Click brand to collapse sidebar"
                  aria-label="Click brand to collapse sidebar"
                >
                  <GenzioLogo size="sm" showText={false} interactive={true} />
                  <span className="text-[15px] font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                    Genzio
                  </span>
                </button>
              </div>
            )}

            {/* B) HOVER PREVIEW HEADER: Brand Lockup (Clicking brand lockup pins sidebar open) */}
            {desktopMode === 'hover-preview' && (
              <div className="flex items-center w-full">
                <button
                  type="button"
                  id="sidebar-brand-hover-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinOpen();
                  }}
                  className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group text-left w-full"
                  title="Click to pin sidebar open"
                  aria-label="Click to pin sidebar open"
                >
                  <GenzioLogo size="sm" showText={false} interactive={true} />
                  <span className="text-[15px] font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                    Genzio
                  </span>
                </button>
              </div>
            )}

            {/* C) COLLAPSED RAIL HEADER: Centered Genzio Logo (Hover expands preview; Click pins open) */}
            {desktopMode === 'collapsed' && (
              <div className="w-full flex items-center justify-center">
                <button
                  type="button"
                  id="sidebar-brand-collapsed-logo"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinOpen();
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-all cursor-pointer relative group"
                  title="Click to pin sidebar open"
                  aria-label="Genzio"
                >
                  <GenzioLogo size="xs" showText={false} />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Body: Expanded (Pinned/Hover) OR Collapsed Rail */}
          {desktopMode !== 'collapsed' ? (
            renderExpandedBody(false)
          ) : (
            <>
              {/* Collapsed Rail Mode Icons */}
              <div className="flex flex-col items-center py-3 space-y-2 shrink-0">
                {/* 1. New Chat */}
                <button
                  type="button"
                  id="sidebar-rail-new-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinOpen();
                    onNewChat();
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  title="New Chat"
                  aria-label="New Chat"
                >
                  <SquarePen className="w-4 h-4" />
                </button>

                {/* 2. Library */}
                <button
                  type="button"
                  id="sidebar-rail-library"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinOpen();
                    onOpenLibrary();
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  title="Library"
                  aria-label="Library"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                {/* 3. Search Chat */}
                <button
                  type="button"
                  id="sidebar-rail-search-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinOpen();
                    setIsSearchActive(true);
                    setTimeout(() => searchInputRef.current?.focus(), 80);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  title="Search Chat"
                  aria-label="Search Chat"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Collapsed Bottom Icons: Settings Avatar Only (No expand toggle button) */}
              <div className="p-2 flex flex-col items-center">
                {/* Settings Avatar */}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-colors cursor-pointer"
                  title="Settings"
                  aria-label="Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500/80 via-purple-500/80 to-pink-500/80 p-0.5 shrink-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#121314] flex items-center justify-center text-[10px] font-bold text-white">
                      G
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ======================================================= */}
      {/* 3. MOBILE & TABLET DRAWER (< 640px)                      */}
      {/* ======================================================= */}
      <aside
        id="genzio-mobile-drawer"
        className={`sm:hidden fixed z-50 top-0 bottom-0 left-0 w-72 max-w-[85vw] flex flex-col shadow-2xl select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
        }}
      >
        {/* Mobile Header: Full Brand + Explicit X Close Button */}
        <div
          className="h-14 px-3 flex items-center justify-between shrink-0"
        >
          <button
            type="button"
            onClick={() => handleItemNavigation(onNewChat, true)}
            className="flex items-center gap-2.5 px-1 py-1 rounded-xl text-left cursor-pointer group"
          >
            <GenzioLogo size="sm" showText={false} />
            <span className="text-[16px] font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
              Genzio
            </span>
          </button>

          <button
            type="button"
            id="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Expanded Body */}
        {renderExpandedBody(true)}
      </aside>

      {/* Change Icon Modal */}
      {iconModalChat && (
        <ChangeIconModal
          chat={iconModalChat}
          isOpen={!!iconModalChat}
          onClose={() => setIconModalChat(null)}
          onSaveIcon={(chatId, iconValue, iconCategory) => {
            if (onChangeIcon) {
              onChangeIcon(chatId, iconValue, iconCategory);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-[#161719] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Delete conversation?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{deleteConfirmChat.title}&rdquo;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmChat(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteChat(deleteConfirmChat.id);
                  setDeleteConfirmChat(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#18191a] border border-[#2e3033] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#26282b]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Keyboard Shortcuts</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#242629]">
                <span className="text-slate-300">Open Search</span>
                <kbd className="px-2 py-0.5 rounded bg-[#25272a] text-cyan-300 font-mono text-[11px]">⌘K / Ctrl+K</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#242629]">
                <span className="text-slate-300">Start New Chat</span>
                <kbd className="px-2 py-0.5 rounded bg-[#25272a] text-cyan-300 font-mono text-[11px]">⌘N / Ctrl+N</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#242629]">
                <span className="text-slate-300">Close Modals / Overlays</span>
                <kbd className="px-2 py-0.5 rounded bg-[#25272a] text-slate-300 font-mono text-[11px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#18191a] border border-[#2e3033] rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#26282b]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Genzio AI Help</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Genzio AI provides real-time streaming conversational intelligence, image studio creation, project contextualization, and persistent session management.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>• Pinned items stay at top of your navigation.</p>
              <p>• Recent items group automatically by chronological date.</p>
              <p>• Use the Library to insert reusable prompt templates.</p>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#2b2d31] hover:bg-[#34373d] text-white text-xs font-medium cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
