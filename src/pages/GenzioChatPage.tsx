import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ChatSession,
  ChatMessage,
  ChatAttachment,
  LibraryFile,
  ThemeConfig,
  CustomInstructions,
  AppSettings,
  ReasoningLevel,
} from '../types';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { ChatEmptyState } from '../components/chat/ChatEmptyState';
import { ChatComposer } from '../components/chat/ChatComposer';
import { GenzioLogo } from '../components/common/GenzioLogo';
import { ModelSelectorDropdown } from '../components/chat/ModelSelectorDropdown';
import { HeaderSearchChat } from '../components/chat/HeaderSearchChat';
import { ChatHeaderMoreMenu } from '../components/chat/ChatHeaderMoreMenu';
import { ReasoningLevelSelector } from '../components/chat/ReasoningLevelSelector';
import { CustomInstructionsModal } from '../components/chat/CustomInstructionsModal';
import { SearchModal } from '../components/chat/SearchModal';
import { LibraryModal } from '../components/chat/LibraryModal';
import { SettingsModal } from '../components/chat/SettingsModal';
import { ShareChatModal } from '../components/chat/ShareChatModal';
import { SnapshotModal } from '../components/chat/SnapshotModal';
import { StudentsModal } from '../components/chat/StudentsModal';
import { ImagesModal } from '../components/chat/ImagesModal';
import { NotebooksModal } from '../components/chat/NotebooksModal';
import { ScheduledModal } from '../components/chat/ScheduledModal';
import { ProjectsModal } from '../components/chat/ProjectsModal';
import { UpgradeModal } from '../components/chat/UpgradeModal';
import { DeleteConfirmModal } from '../components/chat/DeleteConfirmModal';
import { streamChatResponse } from '../services/chatStream';
import { storageService } from '../services/storageService';
import { loadSavedTheme, saveTheme, applyThemeToDOM, setupSystemThemeWatcher } from '../services/themeService';
import { exportChatToPrintablePdf, exportChatToMarkdown } from '../services/chatExportService';
import {
  createInitialExecutionData,
  updateExecutionOnToolStatus,
  updateExecutionOnCitations,
  updateExecutionOnChunk,
  updateExecutionOnComplete,
  updateExecutionOnStop,
  updateExecutionOnError,
} from '../services/executionProgressManager';

export const GenzioChatPage: React.FC = () => {
  // 1. Persistent Data & Settings State
  const [chats, setChats] = useState<ChatSession[]>(() => storageService.loadChats());
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>(() => storageService.loadLibrary());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => storageService.loadAppSettings());
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const s = storageService.loadAppSettings();
    return {
      mode: s.general.mode,
      accent: s.general.accent,
      accentSecondary: s.general.accentSecondary,
      bgImage: s.general.bgImage,
      bgOpacity: s.general.bgOpacity,
      bgBlur: s.general.bgBlur,
      fontFamily: 'Plus Jakarta Sans',
      fontSize: s.general.fontSize,
      customThemeJson: s.general.customThemeJson,
      speechRate: s.voice.speechRate,
      speechVoice: s.voice.speechVoice,
      autoReadSpeech: s.voice.autoReadSpeech,
    };
  });
  const [customInstructions, setCustomInstructions] = useState<CustomInstructions>(() =>
    storageService.loadCustomInstructions()
  );

  // 2. Active Session & Interaction State
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return chats.length > 0 ? chats[0].id : null;
  });
  const [reasoningLevel, setReasoningLevel] = useState<ReasoningLevel>(() => {
    const active = chats.length > 0 ? chats[0] : null;
    return active?.reasoningLevel || storageService.loadReasoningLevel();
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return storageService.loadModelPreference() || appSettings.general.defaultModel || 'Genzio Advanced';
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState<boolean>(false);

  const handleSelectModel = (modelName: string) => {
    setSelectedModel(modelName);
    storageService.saveModelPreference(modelName);
  };

  const handleSelectReasoningLevel = (level: ReasoningLevel) => {
    setReasoningLevel(level);
    storageService.saveReasoningLevel(level);
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, reasoningLevel: level } : c))
      );
    }
  };

  // 3. Layout & Sidebar State (3 distinct desktop states: collapsed | hover | pinned)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('genzio_desktop_sidebar_pinned');
    return saved === 'true'; // Default is false (collapsed)
  });
  const [desktopSidebarMode, setDesktopSidebarMode] = useState<'collapsed' | 'hover-preview' | 'pinned'>(() => {
    const saved = localStorage.getItem('genzio_desktop_sidebar_pinned');
    return saved === 'true' ? 'pinned' : 'collapsed';
  });

  const handlePinSidebarOpen = useCallback(() => {
    setIsPinnedOpen(true);
    localStorage.setItem('genzio_desktop_sidebar_pinned', 'true');
    setDesktopSidebarMode('pinned');
  }, []);

  const handleExplicitSidebarClose = useCallback(() => {
    setIsPinnedOpen(false);
    localStorage.setItem('genzio_desktop_sidebar_pinned', 'false');
    setDesktopSidebarMode('collapsed');
  }, []);

  const handleSidebarModeChange = useCallback((mode: 'collapsed' | 'hover-preview' | 'pinned') => {
    setDesktopSidebarMode(mode);
  }, []);

  const isSidebarVisuallyExpanded = desktopSidebarMode !== 'collapsed';

  // 4. Modals State
  const [isCustomInstructionsOpen, setIsCustomInstructionsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsCategory, setSettingsCategory] = useState<
    'general' | 'personalization' | 'chat' | 'language' | 'voice' | 'accessibility'
  >('general');
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [chatToShare, setChatToShare] = useState<ChatSession | null>(null);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState<boolean>(false);
  const [chatToSnapshot, setChatToSnapshot] = useState<ChatSession | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isStudentsOpen, setIsStudentsOpen] = useState<boolean>(false);
  const [isImagesOpen, setIsImagesOpen] = useState<boolean>(false);
  const [isNotebooksOpen, setIsNotebooksOpen] = useState<boolean>(false);
  const [isScheduledOpen, setIsScheduledOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);

  // Delete & Confirmation state
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingUserMessage, setEditingUserMessage] = useState<{ id: string; content: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // 5. Refs for Autoscroll & Streaming Abort
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeAbortRef = useRef<AbortController | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Apply Theme & General Settings to DOM
  useEffect(() => {
    const currentTheme: ThemeConfig = {
      mode: appSettings.general.mode,
      accent: appSettings.general.accent,
      accentSecondary: appSettings.general.accentSecondary,
      bgImage: appSettings.general.bgImage,
      bgOpacity: appSettings.general.bgOpacity,
      bgBlur: appSettings.general.bgBlur,
      fontFamily: appSettings.accessibility?.fontFamily || themeConfig.fontFamily || 'Plus Jakarta Sans',
      fontSize: appSettings.accessibility?.fontSize || appSettings.general.fontSize,
      customThemeJson: appSettings.general.customThemeJson,
      speechRate: appSettings.voice.speechRate,
      speechVoice: appSettings.voice.speechVoice,
      autoReadSpeech: appSettings.voice.autoReadSpeech,
    };
    setThemeConfig(currentTheme);
    applyThemeToDOM(currentTheme, appSettings);
  }, [appSettings.general, appSettings.voice, appSettings.accessibility, appSettings.language]);

  // Watch for OS theme changes when System mode is selected
  useEffect(() => {
    const cleanup = setupSystemThemeWatcher(() => {
      if (appSettings.general.mode === 'system') {
        applyThemeToDOM(themeConfig, appSettings);
      }
    });
    return cleanup;
  }, [appSettings, themeConfig]);

  // Persist Chats
  useEffect(() => {
    storageService.saveChats(chats);
  }, [chats]);

  // Save Custom Instructions
  const handleSaveCustomInstructions = (updated: CustomInstructions) => {
    setCustomInstructions(updated);
    storageService.saveCustomInstructions(updated);
  };

  // Save Library Files
  const handleSaveLibrary = (updated: LibraryFile[]) => {
    setLibraryFiles(updated);
    storageService.saveLibrary(updated);
  };

  // Keyboard Shortcuts (⌘K search, ⌘N new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Scroll behavior to enable/disable sticky autoscroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    userScrolledUpRef.current = !isAtBottom;
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Create New Conversation Session
  const handleNewChat = (temporary = false) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newChat: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      reasoningLevel,
      pinned: false,
      messages: [],
    };

    setIsTemporaryChat(temporary);
    if (!temporary) {
      setChats((prev) => [newChat, ...prev]);
    }
    setActiveChatId(newChat.id);
    setIsMobileSidebarOpen(false);
  };

  // Select Chat from Sidebar / Search
  const handleSelectChat = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setIsTemporaryChat(false);
    setActiveChatId(id);
    const target = chats.find((c) => c.id === id);
    if (target?.reasoningLevel) {
      setReasoningLevel(target.reasoningLevel);
    }
    setIsMobileSidebarOpen(false);
    userScrolledUpRef.current = false;
  };

  // Select Chat from Search with auto-scroll and highlight
  const handleSelectChatFromSearch = (chatId: string, messageId?: string, _term?: string) => {
    handleSelectChat(chatId);
    if (messageId) {
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        const el =
          document.getElementById(`message-${messageId}`) ||
          document.getElementById(`msg-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3500);
    }
  };

  // Toggle Pin on Chat Session
  const handleTogglePin = (id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Delete Chat Session
  const handleDeleteChat = (id: string) => {
    const targetChat = chats.find((c) => c.id === id);
    if (!targetChat) return;

    if (appSettings.general.chatBehavior.confirmDelete) {
      setChatToDelete(targetChat);
    } else {
      executeDeleteChat(id);
    }
  };

  const executeDeleteChat = (id: string) => {
    if (isStreaming && activeChatId === id) {
      handleStopStreaming();
    }

    const remaining = chats.filter((c) => c.id !== id);

    if (activeChatId === id) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
        if (remaining[0].reasoningLevel) {
          setReasoningLevel(remaining[0].reasoningLevel);
        }
      } else {
        const newChat: ChatSession = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: 'New chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: selectedModel,
          reasoningLevel,
          pinned: false,
          messages: [],
        };
        remaining.push(newChat);
        setActiveChatId(newChat.id);
      }
    }

    setChats(remaining);
    storageService.saveChats(remaining);
    setChatToDelete(null);
    showToast('Conversation deleted');
  };

  // Clear all chats
  const handleClearAllChats = () => {
    setIsConfirmClearAllOpen(true);
  };

  const executeClearAllChats = () => {
    const newChat: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      pinned: false,
      messages: [],
    };
    setChats([newChat]);
    setActiveChatId(newChat.id);
    setIsConfirmClearAllOpen(false);
    showToast('All conversations cleared');
  };

  // Delete Individual Message inside Active Chat
  const handleDeleteMessage = (messageId: string) => {
    if (!activeChatId) return;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: c.messages.filter((m) => m.id !== messageId),
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
    showToast('Message deleted');
  };

  // Rename Chat Session (Locks title against auto-renaming)
  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, titleLocked: true, updatedAt: Date.now() } : c))
    );
    showToast('Conversation renamed');
  };

  // Archive Chat Session
  const handleArchiveChat = (id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c))
    );
    showToast('Conversation archived');
  };

  // Change Chat Icon
  const handleChangeIcon = (id: string, iconValue: string | undefined, iconCategory?: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              icon: iconValue,
              iconCategory: iconCategory || c.iconCategory,
              customIconLocked: true,
            }
          : c
      )
    );
    showToast('Chat icon updated');
  };

  // Clear messages inside a specific chat
  const handleClearChatMessages = (id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
    showToast('Conversation messages cleared');
  };

  // Open settings with specific category tab
  const handleOpenSettingsWithCategory = (
    cat: 'general' | 'personalization' | 'chat' | 'language' | 'voice' | 'accessibility' = 'general'
  ) => {
    setSettingsCategory(cat);
    setIsSettingsOpen(true);
  };

  // Toggle temporary chat mode
  const handleToggleTemporaryChatMode = () => {
    setIsTemporaryChat((prev) => {
      const next = !prev;
      showToast(next ? 'Temporary chat enabled' : 'Temporary chat disabled');
      return next;
    });
  };

  // Open Share Modal
  const handleOpenShare = (chat: ChatSession) => {
    setChatToShare(chat);
    setIsShareOpen(true);
  };

  // Export Chat to PDF
  const handleExportPdf = (chat: ChatSession) => {
    try {
      const success = exportChatToPrintablePdf(chat);
      if (success) {
        showToast('Downloaded conversation as PDF (.pdf)');
      }
    } catch {
      showToast('Export failed: conversation has no messages.');
    }
  };

  // Export Chat to Markdown
  const handleExportMarkdown = (chat: ChatSession) => {
    try {
      const success = exportChatToMarkdown(chat);
      if (success) {
        showToast('Downloaded conversation as Markdown (.md)');
      }
    } catch {
      showToast('Export failed: conversation has no messages.');
    }
  };

  // Open Snapshot Modal
  const handleOpenSnapshot = (chat: ChatSession) => {
    setChatToSnapshot(chat);
    setIsSnapshotOpen(true);
  };

  // Stop Streaming Response
  const handleStopStreaming = () => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
    setIsStreaming(false);

    // Mark current streaming message as stopped with frozen elapsed timer
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.isStreaming
                  ? {
                      ...m,
                      isStreaming: false,
                      executionData: updateExecutionOnStop(m.executionData),
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    }
  };

    // Send User Message & Handle AI Stream
  const handleSendMessage = (
    content: string,
    attachments: ChatAttachment[] = [],
    options?: { webSearch?: boolean; reasoning?: boolean; research?: boolean }
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    // Handle Edit Mode submission
    if (editingUserMessage && activeChat) {
      const editIndex = activeChat.messages.findIndex((m) => m.id === editingUserMessage.id);
      if (editIndex !== -1) {
        setEditingUserMessage(null);
        handleEditUserMessage(editIndex, content);
        return;
      }
      setEditingUserMessage(null);
    }

    let targetChatId = activeChatId;
    let currentChat = activeChat;

    const userMessageId = `msg_${Date.now()}_u`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments,
      webSearch: options?.webSearch,
      isReasoning: options?.reasoning,
      isResearch: options?.research,
    };

    const assistantMsgId = `msg_${Date.now() + 1}_a`;
    const initialExecData = createInitialExecutionData(content, attachments, {
      webSearch: options?.webSearch,
      research: options?.research,
      reasoningLevel,
    });
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      model: selectedModel,
      isStreaming: true,
      webSearch: options?.webSearch,
      isReasoning: options?.reasoning,
      isResearch: options?.research,
      executionData: initialExecData,
    };

    const shouldUpdateTitle = !currentChat || currentChat.messages.length === 0 || currentChat.title === 'New chat';
    const computedTitle = shouldUpdateTitle
      ? content.trim().slice(0, 36) || 'Chat'
      : (currentChat?.title || 'Chat');

    // Auto-create chat if none exists
    if (!currentChat) {
      const newChat: ChatSession = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: computedTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        pinned: false,
        messages: [userMessage, assistantPlaceholder],
      };
      targetChatId = newChat.id;
      setActiveChatId(newChat.id);
      setChats((prev) => [newChat, ...prev]);
    } else {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return {
              ...c,
              title: computedTitle,
              updatedAt: Date.now(),
              messages: [...c.messages, userMessage, assistantPlaceholder],
            };
          }
          return c;
        })
      );
    }

    setIsStreaming(true);
    userScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 50);

    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    const historyMessages = currentChat ? [...currentChat.messages, userMessage] : [userMessage];

    // Call real Gemini API with fallback streaming
    streamChatResponse({
      messages: historyMessages,
      model: selectedModel,
      reasoningLevel: reasoningLevel,
      customInstructions: appSettings.personalization.customInstructions.enabled
        ? appSettings.personalization.customInstructions
        : customInstructions,
      personalization: appSettings.personalization,
      signal: abortController.signal,
      webSearch: options?.webSearch,
      reasoning: options?.reasoning,
      research: options?.research,
      onToolStatus: (status) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        toolStatus: status,
                        executionData: updateExecutionOnToolStatus(m.executionData, status),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onCitations: (citations) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === assistantMsgId) {
                    const existing = m.citations || [];
                    const merged = [...existing];
                    for (const cite of citations) {
                      if (!merged.some((e) => e.url === cite.url)) {
                        merged.push(cite);
                      }
                    }
                    return {
                      ...m,
                      citations: merged,
                      executionData: updateExecutionOnCitations(m.executionData, merged),
                    };
                  }
                  return m;
                }),
              };
            }
            return c;
          })
        );
      },
      onGeneratedImage: (img) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        generatedImage: img,
                        messageType: 'image',
                        toolStatus: '',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onPromptData: (pData) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        promptData: pData,
                        isPromptBlock: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onFallbackNotice: (notice) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        fallbackNotice: notice?.toModel ? `Backup: ${notice.toModel}` : 'Backup model',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onChunk: (accumulatedText) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accumulatedText,
                        toolStatus: '',
                        executionData: m.executionData?.phase !== 'streaming'
                          ? updateExecutionOnChunk(m.executionData)
                          : m.executionData,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        if (appSettings.general.chatBehavior.autoScroll) {
          scrollToBottom(false);
        }
      },
      onComplete: (fullText) => {
        const textToSave = fullText.trim();
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              // Determine auto icon category if not custom locked
              let autoCategory = c.iconCategory || 'chat';
              if (!c.customIconLocked) {
                const lowerP = content.toLowerCase();
                if (/\b(code|react|typescript|python|function|sql|bug|component|api)\b/i.test(lowerP)) {
                  autoCategory = 'coding';
                } else if (/\b(pdf|doc|contract|summary|report|document|csv|sheet)\b/i.test(lowerP) || attachments.length > 0) {
                  autoCategory = 'doc';
                } else if (/\b(image|draw|poster|logo|photo|design|illustration)\b/i.test(lowerP)) {
                  autoCategory = 'image';
                } else if (/\b(search|research|news|latest|find|verify)\b/i.test(lowerP)) {
                  autoCategory = 'research';
                }
              }

              return {
                ...c,
                updatedAt: Date.now(),
                iconCategory: autoCategory,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: textToSave || m.content,
                        isStreaming: false,
                        executionData: updateExecutionOnComplete(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;

        // Auto Generate Chat Title if title is not locked and is currently "New chat"
        const activeSession = chats.find((c) => c.id === targetChatId);
        if (activeSession && !activeSession.titleLocked && (activeSession.title === 'New chat' || !activeSession.title)) {
          fetch('/api/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: content,
              responseSnippet: textToSave.slice(0, 200),
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.title) {
                setChats((prev) =>
                  prev.map((c) =>
                    c.id === targetChatId ? { ...c, title: data.title } : c
                  )
                );
              }
            })
            .catch((err) => {
              console.warn('Auto title generation failed, using fallback:', err);
            });
        }

        // Auto read speech if enabled in Voice settings
        if (appSettings.voice.autoReadSpeech && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const cleanText = (textToSave || fullText).replace(/[*#`_~]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = appSettings.voice.speechRate || 1.0;
            utterance.lang = appSettings.voice.language || 'en-US';
            if (appSettings.voice.speechVoice) {
              const voices = window.speechSynthesis.getVoices();
              const matchedVoice = voices.find((v) => v.name === appSettings.voice.speechVoice);
              if (matchedVoice) utterance.voice = matchedVoice;
            }
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.warn('Speech synthesis error:', e);
          }
        }
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        error: err.message || 'Unable to connect to AI model.',
                        isStreaming: false,
                        executionData: updateExecutionOnError(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
    });
  };

  // Edit User Message & Branch/Regenerate
  const handleEditUserMessage = (index: number, newContent: string) => {
    if (!activeChat || isStreaming) return;

    const trimmed = newContent.trim();
    if (!trimmed) return;

    const previousMessages = activeChat.messages.slice(0, index);
    const editedUserMsg: ChatMessage = {
      ...activeChat.messages[index],
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantMsgId = `msg_${Date.now() + 1}_a`;
    const initialExecData = createInitialExecutionData(trimmed, [], {
      reasoningLevel,
    });
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      model: selectedModel,
      isStreaming: true,
      executionData: initialExecData,
    };

    const updatedMessages = [...previousMessages, editedUserMsg, assistantPlaceholder];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    userScrolledUpRef.current = false;
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    streamChatResponse({
      messages: [...previousMessages, editedUserMsg],
      model: selectedModel,
      reasoningLevel: activeChat.reasoningLevel || reasoningLevel,
      customInstructions: appSettings.personalization.customInstructions.enabled
        ? appSettings.personalization.customInstructions
        : customInstructions,
      personalization: appSettings.personalization,
      signal: abortController.signal,
      onFallbackNotice: (notice) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        fallbackNotice: notice?.toModel ? `Backup: ${notice.toModel}` : 'Backup model',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onChunk: (accumulatedText) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accumulatedText,
                        executionData: m.executionData?.phase !== 'streaming'
                          ? updateExecutionOnChunk(m.executionData)
                          : m.executionData,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        if (appSettings.general.chatBehavior.autoScroll) {
          scrollToBottom(false);
        }
      },
      onComplete: (fullText) => {
        const textToSave = fullText.trim();
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: textToSave || m.content,
                        isStreaming: false,
                        executionData: updateExecutionOnComplete(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        error: err.message || 'Unable to connect to AI model.',
                        isStreaming: false,
                        executionData: updateExecutionOnError(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
    });
  };

  // Regenerate Specific Assistant Message in-place
  const handleRegenerateAssistantMessage = (assistantMsgId: string) => {
    if (!activeChat || isStreaming) return;

    const assistantIdx = activeChat.messages.findIndex((m) => m.id === assistantMsgId);
    if (assistantIdx === -1) return;

    const messagesBefore = activeChat.messages.slice(0, assistantIdx);
    if (messagesBefore.length === 0) return;

    const newAssistantMsgId = `msg_${Date.now()}_a`;
    const initialExecData = createInitialExecutionData('Regenerating response', [], {
      reasoningLevel,
    });
    const assistantPlaceholder: ChatMessage = {
      id: newAssistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: selectedModel,
      isStreaming: true,
      executionData: initialExecData,
    };

    const updatedMessages = [...messagesBefore, assistantPlaceholder];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    userScrolledUpRef.current = false;
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    streamChatResponse({
      messages: messagesBefore,
      model: selectedModel,
      reasoningLevel: activeChat.reasoningLevel || reasoningLevel,
      customInstructions: appSettings.personalization.customInstructions.enabled
        ? appSettings.personalization.customInstructions
        : customInstructions,
      personalization: appSettings.personalization,
      signal: abortController.signal,
      onFallbackNotice: (notice) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        fallbackNotice: notice?.toModel ? `Backup: ${notice.toModel}` : 'Backup model',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onChunk: (accumulatedText) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        content: accumulatedText,
                        executionData: m.executionData?.phase !== 'streaming'
                          ? updateExecutionOnChunk(m.executionData)
                          : m.executionData,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        if (appSettings.general.chatBehavior.autoScroll) {
          scrollToBottom(false);
        }
      },
      onComplete: (fullText) => {
        const textToSave = fullText.trim();
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        content: textToSave || m.content,
                        isStreaming: false,
                        executionData: updateExecutionOnComplete(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
      onError: (err) => {
        console.error('Regeneration error:', err);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        error: err.message || 'Unable to connect to AI model.',
                        isStreaming: false,
                        executionData: updateExecutionOnError(m.executionData),
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
    });
  };

  // Regenerate from Specific User Message
  const handleRegenerateUserMessage = (userMsgId: string) => {
    if (!activeChat || isStreaming) return;

    const userIdx = activeChat.messages.findIndex((m) => m.id === userMsgId);
    if (userIdx === -1) return;

    const messagesUpToUser = activeChat.messages.slice(0, userIdx + 1);
    const newAssistantMsgId = `msg_${Date.now()}_a`;
    const assistantPlaceholder: ChatMessage = {
      id: newAssistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: selectedModel,
      isStreaming: true,
    };

    const updatedMessages = [...messagesUpToUser, assistantPlaceholder];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    userScrolledUpRef.current = false;
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    streamChatResponse({
      messages: messagesUpToUser,
      model: selectedModel,
      reasoningLevel: activeChat.reasoningLevel || reasoningLevel,
      customInstructions: appSettings.personalization.customInstructions.enabled
        ? appSettings.personalization.customInstructions
        : customInstructions,
      personalization: appSettings.personalization,
      signal: abortController.signal,
      onFallbackNotice: (notice) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        fallbackNotice: notice?.toModel ? `Backup: ${notice.toModel}` : 'Backup model',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onChunk: (accumulatedText) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId ? { ...m, content: accumulatedText } : m
                ),
              };
            }
            return c;
          })
        );
        if (appSettings.general.chatBehavior.autoScroll) {
          scrollToBottom(false);
        }
      },
      onComplete: (fullText) => {
        const textToSave = fullText.trim();
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? { ...m, content: textToSave || m.content, isStreaming: false }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
      onError: (err) => {
        console.error('Regeneration error:', err);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newAssistantMsgId
                    ? {
                        ...m,
                        error: err.message || 'Unable to connect to AI model.',
                        isStreaming: false,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
    });
  };

  // Direct Image Generation Action from PromptBlock or Image Card
  const handleDirectGenerateImage = (promptText: string) => {
    if (!promptText.trim()) return;
    const cleanPrompt = promptText.trim();
    showToast('Generating visual artwork...');
    handleSendMessage(`Create an image: ${cleanPrompt}`);
  };

  // Like / Dislike Message Feedback Handler
  const handleMessageFeedback = (messageId: string, liked: boolean | null) => {
    if (!activeChat) return;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            messages: c.messages.map((m) => (m.id === messageId ? { ...m, liked } : m)),
          };
        }
        return c;
      })
    );
  };

  // Regenerate Last Assistant Message
  const handleRegenerateLast = () => {
    if (!activeChat || activeChat.messages.length === 0 || isStreaming) return;

    let lastAssistantIdx = -1;
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === 'assistant') {
        lastAssistantIdx = i;
        break;
      }
    }
    if (lastAssistantIdx === -1) return;

    const messagesBefore = activeChat.messages.slice(0, lastAssistantIdx);
    const assistantMsgId = `msg_${Date.now()}_a`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: selectedModel,
      isStreaming: true,
    };

    const updatedMessages = [...messagesBefore, assistantPlaceholder];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    userScrolledUpRef.current = false;
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    streamChatResponse({
      messages: messagesBefore,
      model: selectedModel,
      reasoningLevel: activeChat.reasoningLevel || reasoningLevel,
      customInstructions: appSettings.personalization.customInstructions.enabled
        ? appSettings.personalization.customInstructions
        : customInstructions,
      personalization: appSettings.personalization,
      signal: abortController.signal,
      onFallbackNotice: (notice) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        fallbackNotice: notice?.toModel ? `Backup: ${notice.toModel}` : 'Backup model',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      },
      onChunk: (accumulatedText) => {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                ),
              };
            }
            return c;
          })
        );
        if (appSettings.general.chatBehavior.autoScroll) {
          scrollToBottom(false);
        }
      },
      onComplete: (fullText) => {
        const textToSave = fullText.trim();
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: textToSave || m.content, isStreaming: false }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
      onError: (err) => {
        console.error('Regeneration error:', err);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChat.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        error: err.message || 'Unable to connect to AI model.',
                        isStreaming: false,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsStreaming(false);
        activeAbortRef.current = null;
      },
    });
  };

  const isChatEmpty = !activeChat || activeChat.messages.length === 0;

  return (
    <div
      id="genzio-app-root"
      className="flex h-screen h-[100dvh] max-h-[100dvh] w-screen overflow-hidden text-[var(--text-primary)] antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        backgroundColor: 'var(--bg-primary)',
        fontFamily: `var(--font-sans, 'Plus Jakarta Sans', sans-serif)`,
      }}
    >
      {/* 1. Full Viewport Wallpaper Layer (behind everything) */}
      {themeConfig.bgImage && (
        <div
          id="genzio-custom-wallpaper-layer"
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-300 ease-out"
          style={{
            backgroundImage: `url(${themeConfig.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: appSettings.general.bgPosition || 'center',
            backgroundRepeat: 'no-repeat',
            opacity: appSettings.general.bgOpacity,
            filter: `blur(${appSettings.general.bgBlur}px) brightness(${appSettings.general.bgBrightness || 100}%)`,
          }}
        />
      )}

      {/* 2. Wallpaper Darkness & Readability Overlay Layer */}
      {themeConfig.bgImage && appSettings.general.bgDarkness > 0 && (
        <div
          id="genzio-wallpaper-overlay-layer"
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${appSettings.general.bgDarkness / 100})`,
          }}
        />
      )}

      {/* 3. Subtle Ambient Glow Accent Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% -20%, var(--accent-glow, rgba(0, 240, 255, 0.04)), transparent)`,
        }}
      />

      {/* Genzio Sidebar */}
      <ChatSidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isPinnedOpen={isPinnedOpen}
        onPinSidebarOpen={handlePinSidebarOpen}
        onExplicitSidebarClose={handleExplicitSidebarClose}
        onSidebarModeChange={handleSidebarModeChange}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={() => handleNewChat(false)}
        onTogglePin={handleTogglePin}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onArchiveChat={handleArchiveChat}
        onChangeIcon={handleChangeIcon}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCustomInstructions={() => setIsCustomInstructionsOpen(true)}
        onOpenShare={handleOpenShare}
        onExportPdf={(chat) => exportChatToPrintablePdf(chat)}
        onOpenImages={() => setIsImagesOpen(true)}
        onOpenScheduled={() => setIsScheduledOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onToggleTemporaryChat={() => handleNewChat(!isTemporaryChat)}
        isTemporaryChat={isTemporaryChat}
      />

      {/* Main Workspace */}
      <div
        id="genzio-main-workspace"
        className="flex-1 flex flex-col h-full overflow-hidden relative z-10 transition-colors duration-200"
        style={{
          backgroundColor: themeConfig.bgImage ? 'transparent' : 'var(--bg-primary)',
        }}
      >
        {/* Genzio Top Header Bar: Seamless tonal surface without hard divider line */}
        <header
          id="genzio-top-header"
          className="h-14 shrink-0 px-3 sm:px-4 flex items-center justify-between z-20 backdrop-blur-xl transition-all duration-200"
          style={{
            backgroundColor: 'var(--header-bg)',
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Left: Brand Area (Text only, NO sidebar toggle button, NO duplicate logo) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Brand Button (< sm): Tap text to open drawer */}
            <button
              type="button"
              id="header-mobile-brand"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="sm:hidden flex items-center py-1 px-1 rounded-lg text-left select-none group cursor-pointer"
              title="Genzio - Open menu"
            >
              <span className="font-bold text-[17px] tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Genzio
              </span>
            </button>

            {/* Desktop Brand Area (TEXT ONLY, NO LOGO, NO TOGGLE BUTTON): Visible ONLY when sidebar is collapsed */}
            <div
              className={`hidden sm:flex items-center transition-opacity duration-200 ${
                isSidebarVisuallyExpanded
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100 pointer-events-auto'
              }`}
            >
              <button
                type="button"
                id="header-desktop-brand"
                onClick={() => handleNewChat(false)}
                className="flex items-center py-1 px-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group select-none text-left"
                title="Genzio - Start new chat"
              >
                <span className="font-bold text-[17px] tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  Genzio
                </span>
              </button>
            </div>
          </div>

          {/* Right Header Controls: Search -> Model -> Settings -> More */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Search Chat */}
            <HeaderSearchChat
              chats={chats}
              onSelectChat={handleSelectChatFromSearch}
            />

            {/* 2. Model Selector */}
            <ModelSelectorDropdown
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
            />

            {/* 3. Settings */}
            <button
              type="button"
              id="header-settings-btn"
              onClick={() => handleOpenSettingsWithCategory('general')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all duration-200 cursor-pointer select-none shadow-xs"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* 4. More (⋯) */}
            <ChatHeaderMoreMenu
              activeChat={activeChat}
              onTogglePin={handleTogglePin}
              onOpenShare={handleOpenShare}
              onExportPdf={handleExportPdf}
              onExportMarkdown={handleExportMarkdown}
              onOpenSnapshot={handleOpenSnapshot}
              onDeleteChat={handleDeleteChat}
            />
          </div>
        </header>

        {/* Temporary Chat Info Bar */}
        {isTemporaryChat && (
          <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Temporary chat is on. Messages won&apos;t appear in history.</span>
            </div>
            <button
              type="button"
              onClick={() => handleNewChat(false)}
              className="text-amber-200 underline hover:text-white text-[11px] cursor-pointer"
            >
              Turn off
            </button>
          </div>
        )}

        {/* Main Conversation Viewport with Fixed Top Header, Scrollable Canvas, Edge Fades, and Fixed Bottom Composer */}
        <main
          id="main-chat-viewport"
          className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent"
        >
          {isChatEmpty ? (
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto flex flex-col justify-center relative scroll-smooth px-3 sm:px-4"
            >
              <ChatEmptyState
                onSendMessage={handleSendMessage}
                onStopStreaming={handleStopStreaming}
                isStreaming={isStreaming}
                onOpenLibrary={() => setIsLibraryOpen(true)}
                reasoningLevel={reasoningLevel}
                onSelectReasoningLevel={handleSelectReasoningLevel}
                enterToSend={appSettings.chat?.enterToSend ?? appSettings.general.chatBehavior.enterToSend}
              />
            </div>
          ) : (
            <>
              {/* Subtle Top Edge Gradient Mask */}
              <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10"
                style={{
                  background: 'linear-gradient(to bottom, var(--bg-primary), transparent)',
                }}
                aria-hidden="true"
              />

              {/* Scrollable Conversation Container */}
              <div
                ref={scrollContainerRef}
                id="chat-messages-container"
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative scroll-smooth px-3 sm:px-6 md:px-8 focus:outline-none"
                tabIndex={0}
                aria-label="Conversation messages"
              >
                {/* Comfortable responsive content width with user selectable density */}
                <div
                  id="messages-scroll-area"
                  className={`max-w-4xl lg:max-w-5xl mx-auto w-full pt-4 pb-36 sm:pb-40 ${
                    appSettings.chat?.messageDensity === 'compact'
                      ? 'space-y-0.5'
                      : appSettings.chat?.messageDensity === 'spacious'
                      ? 'space-y-3'
                      : 'space-y-1'
                  }`}
                >
                  {activeChat.messages.map((msg) => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isStreaming={msg.isStreaming}
                      isHighlighted={msg.id === highlightedMessageId}
                      onStop={handleStopStreaming}
                      onRegenerate={
                        msg.role === 'assistant'
                          ? () => handleRegenerateAssistantMessage(msg.id)
                          : () => handleRegenerateUserMessage(msg.id)
                      }
                      onShare={() => handleOpenShare(activeChat)}
                      onLike={(liked) => handleMessageFeedback(msg.id, liked)}
                      onEditUserMessage={
                        msg.role === 'user'
                          ? () => setEditingUserMessage({ id: msg.id, content: msg.content })
                          : undefined
                      }
                      onToast={showToast}
                      onGenerateImage={handleDirectGenerateImage}
                      onRegenerateImage={handleDirectGenerateImage}
                      onEditImage={(imageUrl, prompt) => {
                        showToast('Image prompt loaded for editing');
                        setEditingUserMessage({ id: `edit_${Date.now()}`, content: `Modify this image: ${prompt}` });
                      }}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              </div>

              {/* Subtle Bottom Edge Fade */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 z-10"
                style={{
                  background: 'linear-gradient(to top, var(--bg-primary), transparent)',
                }}
                aria-hidden="true"
              />

              {/* Fixed Bottom Composer Container */}
              <div
                id="fixed-bottom-composer"
                className="absolute bottom-0 left-0 right-0 z-20 pb-3 sm:pb-4 pt-1 pointer-events-none"
              >
                <div className="max-w-4xl lg:max-w-5xl mx-auto w-full px-3 sm:px-6 md:px-8 pointer-events-auto">
                  <ChatComposer
                    onSendMessage={handleSendMessage}
                    onStopStreaming={handleStopStreaming}
                    isStreaming={isStreaming}
                    onOpenLibrary={() => setIsLibraryOpen(true)}
                    reasoningLevel={reasoningLevel}
                    onSelectReasoningLevel={handleSelectReasoningLevel}
                    enterToSend={appSettings.chat?.enterToSend ?? appSettings.general.chatBehavior.enterToSend}
                    editingMessage={editingUserMessage}
                    onCancelEdit={() => setEditingUserMessage(null)}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Students Hub Modal */}
      <StudentsModal
        isOpen={isStudentsOpen}
        onClose={() => setIsStudentsOpen(false)}
        onSelectTopic={(prompt) => handleSendMessage(prompt)}
      />

      {/* Gemini Image Studio Modal */}
      <ImagesModal
        isOpen={isImagesOpen}
        onClose={() => setIsImagesOpen(false)}
        onGenerateImagePrompt={(prompt) => handleSendMessage(prompt)}
      />

      {/* Notebooks Modal */}
      <NotebooksModal
        isOpen={isNotebooksOpen}
        onClose={() => setIsNotebooksOpen(false)}
        onInsertToChat={(text) => handleSendMessage(text)}
      />

      {/* Scheduled Prompts & Reminders Modal */}
      <ScheduledModal
        isOpen={isScheduledOpen}
        onClose={() => setIsScheduledOpen(false)}
        onRunScheduledPrompt={(prompt) => handleSendMessage(prompt)}
      />

      {/* Projects Workspace Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSelectProjectTag={(projectName) => handleSendMessage(`Focus context on project: ${projectName}. What are our next milestones?`)}
      />

      {/* Upgrade Gemini Advanced Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />

      {/* Custom Instructions Modal */}
      <CustomInstructionsModal
        isOpen={isCustomInstructionsOpen}
        onClose={() => setIsCustomInstructionsOpen(false)}
        instructions={customInstructions}
        onSave={handleSaveCustomInstructions}
      />

      {/* Quick Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        chats={chats}
        onSelectChat={handleSelectChatFromSearch}
      />

      {/* File & Prompt Library Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        files={libraryFiles}
        onSaveFiles={handleSaveLibrary}
        onInsertPrompt={(prompt) => handleSendMessage(prompt)}
      />

      {/* Settings Modal (General, Personalization, Voice) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialCategory={settingsCategory}
        appSettings={appSettings}
        onUpdateAppSettings={(updated) => {
          setAppSettings(updated);
          storageService.saveAppSettings(updated);
        }}
        themeConfig={themeConfig}
        onUpdateTheme={(updated) => {
          setThemeConfig(updated);
          saveTheme(updated);
        }}
        chats={chats}
        libraryFiles={libraryFiles}
        onClearAllChats={handleClearAllChats}
        onClearCustomInstructions={() => {
          const resetInstr: CustomInstructions = { enabled: false, aboutUser: '', responsePreferences: '' };
          setCustomInstructions(resetInstr);
          storageService.saveCustomInstructions(resetInstr);
        }}
        onClearLibraryFiles={() => {
          setLibraryFiles([]);
          storageService.saveLibrary([]);
        }}
        onImportChats={(imported) => {
          setChats((prev) => [...imported, ...prev]);
        }}
      />

      {/* Share Chat Modal */}
      <ShareChatModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        session={chatToShare}
        onToast={showToast}
      />

      {/* Snapshot Modal (PNG capture) */}
      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        session={chatToSnapshot}
        onToast={showToast}
      />

      {/* Delete Single Chat Session Modal */}
      <DeleteConfirmModal
        isOpen={!!chatToDelete}
        onClose={() => setChatToDelete(null)}
        onConfirm={() => chatToDelete && executeDeleteChat(chatToDelete.id)}
        title="Delete Conversation"
        description={
          chatToDelete
            ? `Are you sure you want to delete "${chatToDelete.title}"? This conversation will be permanently removed.`
            : 'Are you sure you want to delete this conversation?'
        }
      />

      {/* Clear All Chats Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isConfirmClearAllOpen}
        onClose={() => setIsConfirmClearAllOpen(false)}
        onConfirm={executeClearAllChats}
        title="Clear All Conversations"
        description="Are you sure you want to permanently delete all conversation history? This action cannot be undone."
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1e1f20] border border-[#333538] text-slate-100 text-xs font-medium shadow-2xl flex items-center gap-2 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
