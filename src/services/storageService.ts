import { ChatSession, LibraryFile, CustomInstructions, AppSettings, ReasoningLevel } from '../types';
import { DEFAULT_CHATS, DEFAULT_LIBRARY_ITEMS } from '../data/defaultChats';

const CHATS_STORAGE_KEY = 'genzio_chat_sessions_v2';
const LIBRARY_STORAGE_KEY = 'genzio_library_files_v2';
const CUSTOM_INSTRUCTIONS_KEY = 'genzio_custom_instructions_v1';
const APP_SETTINGS_STORAGE_KEY = 'genzio_app_settings_v4';
const REASONING_PREFERENCE_KEY = 'genzio_reasoning_level_v1';
const MODEL_PREFERENCE_KEY = 'genzio_model_preference_v1';

export const DEFAULT_CUSTOM_INSTRUCTIONS: CustomInstructions = {
  aboutUser: 'Software Engineer & Designer looking for clean, production-ready TypeScript, React, and architectural insights.',
  responsePreferences: 'Provide concise, highly actionable code snippets with strong typing. Explain trade-offs directly without fluff.',
  enabled: true,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    mode: 'dark',
    themePresetId: 'genzio-dark',
    accent: '#00f0ff',
    accentSecondary: '#ec4899',
    language: 'en-US',
    fontSize: 'md',
    bgImage: null,
    bgOpacity: 0.2,
    bgBlur: 8,
    bgDarkness: 30,
    bgBrightness: 100,
    bgPosition: 'center',
    fontFamily: 'Plus Jakarta Sans',
    defaultModel: 'Genzio Advanced',
    defaultReasoningLevel: 'high',
    customThemeJson: null,
    chatBehavior: {
      enterToSend: true,
      showTypingAnimation: true,
      autoScroll: true,
      confirmDelete: true,
      messageDensity: 'default',
      showLineNumbers: true,
      showCopyButton: true,
      defaultModel: 'Genzio Advanced',
      defaultReasoningLevel: 'high',
    },
  },
  personalization: {
    baseStyle: 'default',
    customInstructions: DEFAULT_CUSTOM_INSTRUCTIONS,
    responseCharacteristics: {
      warmth: 'balanced',
      enthusiasm: 'balanced',
      formatting: 'balanced',
      emojiUsage: 'minimal',
    },
  },
  chat: {
    enterToSend: true,
    showTypingAnimation: true,
    autoScroll: true,
    confirmDelete: true,
    messageDensity: 'default',
    showLineNumbers: true,
    showCopyButton: true,
    defaultModel: 'Genzio Advanced',
    defaultReasoningLevel: 'high',
  },
  language: {
    interfaceLanguage: 'en-US',
    responseLanguage: 'auto',
    voiceLanguage: 'en-US',
    autoRtl: true,
  },
  voice: {
    speechVoice: '',
    voiceMode: 'standard',
    language: 'en-US',
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    autoReadSpeech: false,
  },
  accessibility: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 'md',
    highContrast: false,
    reducedMotion: false,
    highVisibilityFocus: false,
    soundEffects: true,
    screenReaderOptimized: false,
  },
};

export interface StorageUsageBreakdown {
  chatsBytes: number;
  libraryBytes: number;
  settingsBytes: number;
  totalBytes: number;
  totalKb: string;
  totalMb: string;
  quotaPercent: number; // based on typical 5MB limit
}

function cleanOldStorageKeys(): void {
  const keysToRemove = [
    'genzio_chat_sessions_v1',
    'genzio_app_settings_v1',
    'genzio_app_settings_v2',
    'genzio_app_settings_v3',
    'genzio_library_files_v1',
  ];
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

function sanitizeMessageForStorage(msg: any, keepBase64: boolean): any {
  const cleanMsg = { ...msg };
  delete cleanMsg.isStreaming;
  delete cleanMsg.toolStatus;
  delete cleanMsg.webSearchActive;

  if (cleanMsg.attachments && Array.isArray(cleanMsg.attachments)) {
    cleanMsg.attachments = cleanMsg.attachments.map((att: any) => {
      const copy = { ...att };
      // If base64 is large (> 50KB) and keepBase64 is false, remove dataUrl
      if (!keepBase64 && copy.dataUrl && copy.dataUrl.length > 50000) {
        delete copy.dataUrl;
      }
      // Truncate huge extracted text content if > 50KB
      if (copy.content && copy.content.length > 50000) {
        copy.content = copy.content.slice(0, 50000) + '\n\n[Content truncated for storage]';
      }
      return copy;
    });
  }

  // Handle generated image base64 if huge
  if (cleanMsg.generatedImage && cleanMsg.generatedImage.imageUrl) {
    if (!keepBase64 && cleanMsg.generatedImage.imageUrl.length > 50000) {
      cleanMsg.generatedImage = {
        ...cleanMsg.generatedImage,
        imageUrl: '',
      };
    }
  }

  return cleanMsg;
}

function prepareChatsForStorage(chats: ChatSession[], level: number): ChatSession[] {
  const persistable = chats.filter((c) => !c.isTemporary);

  if (level === 0) {
    // Level 0: Clean runtime flags, preserve base64 for recent 3 messages of the active session
    return persistable.map((session, sIdx) => ({
      ...session,
      messages: session.messages.map((msg, mIdx) => {
        const isRecentMsgInActiveSession = sIdx === 0 && mIdx >= session.messages.length - 3;
        return sanitizeMessageForStorage(msg, isRecentMsgInActiveSession);
      }),
    }));
  }

  if (level === 1) {
    // Level 1: Omit heavy base64 strings (> 50KB) from all messages
    return persistable.map((session) => ({
      ...session,
      messages: session.messages.map((msg) => sanitizeMessageForStorage(msg, false)),
    }));
  }

  if (level === 2) {
    // Level 2: Limit total chat sessions to 30 most recent
    const recentSessions = persistable.slice(0, 30);
    return recentSessions.map((session) => ({
      ...session,
      messages: session.messages.map((msg) => sanitizeMessageForStorage(msg, false)),
    }));
  }

  if (level === 3) {
    // Level 3: Limit total sessions to 15, max 25 messages per session
    const recentSessions = persistable.slice(0, 15);
    return recentSessions.map((session) => ({
      ...session,
      messages: session.messages.slice(-25).map((msg) => sanitizeMessageForStorage(msg, false)),
    }));
  }

  // Level 4: Emergency - Keep 10 most recent sessions with last 15 messages each
  const recentSessions = persistable.slice(0, 10);
  return recentSessions.map((session) => ({
    ...session,
    messages: session.messages.slice(-15).map((msg) => sanitizeMessageForStorage(msg, false)),
  }));
}

export const storageService = {
  loadAppSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(APP_SETTINGS_STORAGE_KEY) || localStorage.getItem('genzio_app_settings_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        const generalChatBehavior = {
          ...DEFAULT_APP_SETTINGS.general.chatBehavior,
          ...(parsed.general?.chatBehavior || {}),
          ...(parsed.chat || {}),
        };

        return {
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          general: {
            ...DEFAULT_APP_SETTINGS.general,
            ...(parsed.general || {}),
            chatBehavior: generalChatBehavior,
          },
          personalization: {
            ...DEFAULT_APP_SETTINGS.personalization,
            ...(parsed.personalization || {}),
            customInstructions: {
              ...DEFAULT_APP_SETTINGS.personalization.customInstructions,
              ...(parsed.personalization?.customInstructions || {}),
            },
            responseCharacteristics: {
              ...DEFAULT_APP_SETTINGS.personalization.responseCharacteristics,
              ...(parsed.personalization?.responseCharacteristics || {}),
            },
          },
          chat: {
            ...DEFAULT_APP_SETTINGS.chat,
            ...(parsed.chat || {}),
            ...generalChatBehavior,
          },
          language: {
            ...DEFAULT_APP_SETTINGS.language,
            ...(parsed.language || {}),
            interfaceLanguage: parsed.language?.interfaceLanguage || parsed.general?.language || DEFAULT_APP_SETTINGS.language.interfaceLanguage,
          },
          voice: {
            ...DEFAULT_APP_SETTINGS.voice,
            ...(parsed.voice || {}),
          },
          accessibility: {
            ...DEFAULT_APP_SETTINGS.accessibility,
            ...(parsed.accessibility || {}),
            fontFamily: parsed.accessibility?.fontFamily || parsed.general?.fontFamily || DEFAULT_APP_SETTINGS.accessibility.fontFamily,
            fontSize: parsed.accessibility?.fontSize || parsed.general?.fontSize || DEFAULT_APP_SETTINGS.accessibility.fontSize,
          },
        };
      }
    } catch (e) {
      console.error('Failed to load app settings:', e);
    }
    return DEFAULT_APP_SETTINGS;
  },

  saveAppSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save app settings:', e);
    }
  },

  loadCustomInstructions(): CustomInstructions {
    try {
      const saved = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load custom instructions:', e);
    }
    return DEFAULT_CUSTOM_INSTRUCTIONS;
  },

  saveCustomInstructions(instructions: CustomInstructions): void {
    try {
      localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(instructions));
    } catch (e) {
      console.error('Failed to save custom instructions:', e);
    }
  },

  loadReasoningLevel(): ReasoningLevel {
    try {
      const saved = localStorage.getItem(REASONING_PREFERENCE_KEY);
      if (
        saved === 'auto' ||
        saved === 'low' ||
        saved === 'medium' ||
        saved === 'high' ||
        saved === 'extra_high' ||
        saved === 'max'
      ) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load reasoning level:', e);
    }
    return 'auto';
  },

  saveReasoningLevel(level: ReasoningLevel): void {
    try {
      localStorage.setItem(REASONING_PREFERENCE_KEY, level);
    } catch (e) {
      console.error('Failed to save reasoning level:', e);
    }
  },

  loadModelPreference(): string {
    try {
      const saved = localStorage.getItem(MODEL_PREFERENCE_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error('Failed to load model preference:', e);
    }
    return 'Genzio Advanced';
  },

  saveModelPreference(modelName: string): void {
    try {
      localStorage.setItem(MODEL_PREFERENCE_KEY, modelName);
    } catch (e) {
      console.error('Failed to save model preference:', e);
    }
  },

  loadChats(): ChatSession[] {
    try {
      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
    return DEFAULT_CHATS;
  },

  saveChats(chats: ChatSession[]): void {
    cleanOldStorageKeys();

    for (let level = 0; level <= 4; level++) {
      try {
        const sanitized = prepareChatsForStorage(chats, level);
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(sanitized));
        return; // Persisted successfully!
      } catch (e: any) {
        console.warn(`[storageService] Quota exceeded at level ${level}, trying level ${level + 1}...`);
      }
    }
    console.error('Failed to persist chats after all compression levels.');
  },

  loadLibrary(): LibraryFile[] {
    try {
      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load library items:', e);
    }
    return DEFAULT_LIBRARY_ITEMS;
  },

  saveLibrary(items: LibraryFile[]): void {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist library files with dataUrls, stripping large base64s...');
      try {
        const sanitized = items.map((item) => ({
          ...item,
          dataUrl: item.dataUrl && item.dataUrl.length > 100000 ? undefined : item.dataUrl,
        }));
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(sanitized));
      } catch (err) {
        console.error('Failed to persist library files:', err);
      }
    }
  },

  saveLibraryItem(item: Omit<LibraryFile, 'id'> & { id?: string }): void {
    try {
      const current = this.loadLibrary();
      const newItem: LibraryFile = {
        id: item.id || `lib_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        type: item.type,
        size: item.size,
        uploadedAt: item.uploadedAt,
        dataUrl: item.dataUrl,
        description: item.description,
        category: item.category,
      };
      this.saveLibrary([newItem, ...current]);
    } catch (e) {
      console.error('Failed to save library item:', e);
    }
  },

  getStorageUsageBreakdown(): StorageUsageBreakdown {
    try {
      const chatsStr = localStorage.getItem(CHATS_STORAGE_KEY) || '';
      const libStr = localStorage.getItem(LIBRARY_STORAGE_KEY) || '';
      const settingsStr = localStorage.getItem(APP_SETTINGS_STORAGE_KEY) || '';

      const chatsBytes = new Blob([chatsStr]).size;
      const libraryBytes = new Blob([libStr]).size;
      const settingsBytes = new Blob([settingsStr]).size;
      const totalBytes = chatsBytes + libraryBytes + settingsBytes;

      const totalKb = (totalBytes / 1024).toFixed(1);
      const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
      const quotaPercent = Math.min(100, Math.round((totalBytes / (5 * 1024 * 1024)) * 100));

      return {
        chatsBytes,
        libraryBytes,
        settingsBytes,
        totalBytes,
        totalKb,
        totalMb,
        quotaPercent,
      };
    } catch {
      return {
        chatsBytes: 0,
        libraryBytes: 0,
        settingsBytes: 0,
        totalBytes: 0,
        totalKb: '0',
        totalMb: '0.00',
        quotaPercent: 0,
      };
    }
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(CHATS_STORAGE_KEY);
      localStorage.removeItem(LIBRARY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear data:', e);
    }
  },

  exportAllAsJson(chats: ChatSession[], library: LibraryFile[]): void {
    const backup = {
      exportVersion: '3.0',
      exportedAt: new Date().toISOString(),
      chats: chats.filter((c) => !c.isTemporary),
      library,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genzio-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportAllAsMarkdown(chats: ChatSession[]): void {
    let md = `# Genzio Chat History Export\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
    const persistable = chats.filter((c) => !c.isTemporary);
    persistable.forEach((chat) => {
      md += `## ${chat.title}\n`;
      md += `*Date: ${new Date(chat.createdAt).toLocaleString()} | Model: ${chat.model || 'Genzio'}*\n\n`;
      chat.messages.forEach((msg) => {
        md += `### ${msg.role === 'user' ? 'User' : 'Genzio Assistant'}\n`;
        md += `${msg.content}\n\n`;
      });
      md += `---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genzio-history-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportAllAsPlainText(chats: ChatSession[]): void {
    let txt = `GENZIO CHAT BACKUP\nDate: ${new Date().toLocaleString()}\n\n`;
    const persistable = chats.filter((c) => !c.isTemporary);
    persistable.forEach((chat, idx) => {
      txt += `==============================================\n`;
      txt += `CONVERSATION ${idx + 1}: ${chat.title}\n`;
      txt += `Date: ${new Date(chat.createdAt).toLocaleString()}\n`;
      txt += `==============================================\n\n`;
      chat.messages.forEach((msg) => {
        txt += `[${msg.role === 'user' ? 'YOU' : 'GENZIO'}]:\n${msg.content}\n\n`;
      });
      txt += `\n`;
    });
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genzio-history-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importFromJson(file: File): Promise<{ chats?: ChatSession[]; library?: LibraryFile[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            resolve({ chats: parsed });
          } else if (parsed && typeof parsed === 'object') {
            resolve({
              chats: Array.isArray(parsed.chats) ? parsed.chats : undefined,
              library: Array.isArray(parsed.library) ? parsed.library : undefined,
            });
          } else {
            reject(new Error('Invalid backup file format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
