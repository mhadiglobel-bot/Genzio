import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MessageSquare, Pin, Bot, User } from 'lucide-react';
import { ChatSession } from '../../types';

interface HeaderSearchChatProps {
  chats: ChatSession[];
  onSelectChat: (chatId: string, messageId?: string, term?: string) => void;
  className?: string;
}

function renderHighlightedText(text: string, query: string) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-cyan-500/30 text-cyan-200 font-semibold px-0.5 py-0.2 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippet(content: string, query: string, maxLength = 100): string {
  if (!query) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + query.length + 50);
  let snippet = content.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  return snippet;
}

export const HeaderSearchChat: React.FC<HeaderSearchChatProps> = ({
  chats,
  onSelectChat,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsActive(true);
      } else if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Handle clicking outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsActive(false);
      }
    };
    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActive]);

  // Focus input on active
  useEffect(() => {
    if (isActive) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
      setIsHovered(false);
    }
  }, [isActive]);

  const trimmedQuery = query.trim().toLowerCase();

  // Real Search Algorithm across conversation titles and messages
  const searchResults: Array<{
    chat: ChatSession;
    matchedMessage?: { id: string; role: string; content: string };
    isTitleMatch: boolean;
  }> = [];

  for (const chat of chats) {
    if (!trimmedQuery) {
      // List recent conversations if active but no search term typed yet
      searchResults.push({
        chat,
        matchedMessage: chat.messages[chat.messages.length - 1],
        isTitleMatch: false,
      });
      continue;
    }

    const titleMatches = (chat.title || '').toLowerCase().includes(trimmedQuery);
    const matchingMessages = (chat.messages || []).filter((m) =>
      (m.content || '').toLowerCase().includes(trimmedQuery)
    );

    if (titleMatches || matchingMessages.length > 0) {
      if (matchingMessages.length > 0) {
        matchingMessages.slice(0, 3).forEach((msg) => {
          searchResults.push({
            chat,
            matchedMessage: msg,
            isTitleMatch: titleMatches,
          });
        });
      } else {
        searchResults.push({
          chat,
          matchedMessage: undefined,
          isTitleMatch: true,
        });
      }
    }
  }

  const handleSelectResult = (chatId: string, messageId?: string) => {
    onSelectChat(chatId, messageId, trimmedQuery || undefined);
    setIsActive(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none ${className}`}
      id="header-search-chat-container"
      onMouseEnter={() => !isActive && setIsHovered(true)}
      onMouseLeave={() => !isActive && setIsHovered(false)}
    >
      {/* Search Input / Button Component with 180ms smooth width transition */}
      <div
        className={`h-9 flex items-center rounded-xl transition-all duration-200 ease-out overflow-hidden shadow-xs cursor-pointer ${
          isActive
            ? 'w-44 xs:w-56 sm:w-80 md:w-96 px-3 bg-[#16181c] ring-1 ring-cyan-500/30'
            : isHovered
            ? 'w-9 sm:w-36 px-0 sm:px-2.5 justify-center sm:justify-start bg-white/[0.07] text-slate-200'
            : 'w-9 justify-center bg-white/[0.035] hover:bg-white/[0.07] text-slate-300'
        }`}
        onClick={() => {
          if (!isActive) setIsActive(true);
        }}
      >
        <Search
          className={`shrink-0 transition-colors ${
            isActive
              ? 'w-3.5 h-3.5 text-cyan-400 mr-2'
              : isHovered
              ? 'w-4 h-4 text-cyan-300 sm:mr-2'
              : 'w-4 h-4 text-slate-300'
          }`}
          aria-hidden="true"
        />

        {/* Active State Input */}
        {isActive ? (
          <div className="flex-1 flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              id="header-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
              aria-label="Search chats"
            />
            {query ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                Esc
              </kbd>
            )}
          </div>
        ) : isHovered ? (
          /* Hover State Label (Smooth 180ms expansion on desktop) */
          <span className="hidden sm:inline text-xs text-slate-200 font-medium whitespace-nowrap animate-in fade-in duration-150 truncate">
            Search Chat
          </span>
        ) : null}
      </div>

      {/* Popover Dropdown Results List */}
      {isActive && (
        <div
          id="header-search-results-dropdown"
          className="absolute top-full right-0 mt-2 w-80 sm:w-96 max-h-[420px] rounded-2xl bg-[#14161c]/98 border border-white/[0.05] shadow-2xl z-50 overflow-hidden backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header count info */}
          <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {trimmedQuery ? `Matches for "${trimmedQuery}"` : 'Recent Conversations'}
            </span>
            <span>{searchResults.length} found</span>
          </div>

          {/* Results Scroll Area */}
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <p className="font-semibold text-slate-200 text-sm">No matching chats</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  No conversations match your search term.
                </p>
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const dateStr = item.chat.updatedAt
                  ? new Date(item.chat.updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <button
                    key={`${item.chat.id}-${item.matchedMessage?.id || idx}`}
                    type="button"
                    onClick={() => handleSelectResult(item.chat.id, item.matchedMessage?.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.chat.pinned ? (
                          <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0" />
                        )}
                        <span className="font-medium text-xs text-slate-200 group-hover:text-white truncate">
                          {renderHighlightedText(item.chat.title, trimmedQuery)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{dateStr}</span>
                    </div>

                    {/* Matched message snippet if available */}
                    {item.matchedMessage && (
                      <div className="flex items-start gap-1.5 pl-5 text-[11px] text-slate-400 group-hover:text-slate-300">
                        {item.matchedMessage.role === 'user' ? (
                          <User className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                        ) : (
                          <Bot className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <span className="line-clamp-2 leading-relaxed">
                          {renderHighlightedText(
                            getSnippet(item.matchedMessage.content, trimmedQuery),
                            trimmedQuery
                          )}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
