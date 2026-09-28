import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, Pin, ArrowRight, Clock, User, Bot } from 'lucide-react';
import { ChatSession } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  onSelectChat: (chatId: string, messageId?: string, highlightTerm?: string) => void;
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

function getSnippet(content: string, query: string, maxLength = 120): string {
  if (!query) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 60);
  let snippet = content.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  return snippet;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  chats,
  onSelectChat,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim().toLowerCase();

  // Search through all chats: check title and check all messages
  const searchResults: Array<{
    chat: ChatSession;
    matchedMessage?: { id: string; role: string; content: string };
    isTitleMatch: boolean;
  }> = [];

  for (const chat of chats) {
    if (!trimmedQuery) {
      searchResults.push({
        chat,
        matchedMessage: chat.messages[chat.messages.length - 1],
        isTitleMatch: false,
      });
      continue;
    }

    const titleMatches = chat.title.toLowerCase().includes(trimmedQuery);
    const matchingMessages = chat.messages.filter((m) =>
      m.content.toLowerCase().includes(trimmedQuery)
    );

    if (titleMatches || matchingMessages.length > 0) {
      if (matchingMessages.length > 0) {
        // Add entry with first matching message
        searchResults.push({
          chat,
          matchedMessage: matchingMessages[0],
          isTitleMatch: titleMatches,
        });
      } else {
        searchResults.push({
          chat,
          matchedMessage: chat.messages[chat.messages.length - 1],
          isTitleMatch: true,
        });
      }
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      id="search-chat-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl rounded-2xl bg-[#121417] border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#16191d] shrink-0">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            id="search-chat-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats by title or message content..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 select-none">
              No conversations found matching &quot;{query}&quot;
            </div>
          ) : (
            searchResults.map(({ chat, matchedMessage }) => {
              const dateStr = formatDate(chat.updatedAt || chat.createdAt);
              const snippet = matchedMessage ? getSnippet(matchedMessage.content, trimmedQuery) : '';
              const isAssistant = matchedMessage?.role === 'assistant';

              return (
                <button
                  key={`${chat.id}-${matchedMessage?.id || 'head'}`}
                  type="button"
                  id={`search-result-${chat.id}`}
                  onClick={() => {
                    onSelectChat(chat.id, matchedMessage?.id, trimmedQuery);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer flex items-start justify-between group"
                >
                  <div className="space-y-1.5 min-w-0 pr-3 flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {renderHighlightedText(chat.title, trimmedQuery)}
                      </span>
                      {chat.pinned && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium px-1.5 py-0.5 bg-amber-400/10 rounded-full border border-amber-400/20 shrink-0">
                          <Pin className="w-2.5 h-2.5 fill-amber-400" aria-hidden="true" />
                          Pinned
                        </span>
                      )}
                      {dateStr && (
                        <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {snippet && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                        {matchedMessage && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-white/5 px-1 py-0.2 rounded shrink-0">
                            {isAssistant ? (
                              <>
                                <Bot className="w-2.5 h-2.5 text-cyan-400" />
                                Genzio
                              </>
                            ) : (
                              <>
                                <User className="w-2.5 h-2.5 text-slate-400" />
                                You
                              </>
                            )}
                          </span>
                        )}
                        <p className="line-clamp-2 leading-relaxed">
                          {renderHighlightedText(snippet, trimmedQuery)}
                        </p>
                      </div>
                    )}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    aria-hidden="true"
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#0e1013] border-t border-white/5 text-[11px] text-slate-500 flex justify-between select-none shrink-0">
          <span>
            {searchResults.length} conversation{searchResults.length === 1 ? '' : 's'}
          </span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
