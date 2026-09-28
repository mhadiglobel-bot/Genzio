export type LibraryItem = LibraryFile;

export type ReasoningLevel = 'auto' | 'low' | 'medium' | 'high' | 'extra_high' | 'max';

export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
  content?: string;
  fileCategory?: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'text' | 'sheet' | 'csv';
  pageCount?: number;
  status?: 'uploading' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface WebSearchCitation {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

export interface GeneratedImageData {
  imageUrl: string;
  prompt: string;
  aspectRatio?: string;
  modelUsed?: string;
  revisedPrompt?: string;
  isSimulatedFallback?: boolean;
}

export interface PromptBlockData {
  title?: string;
  prompt: string;
  category?: 'image' | 'video' | 'general' | 'sora' | 'veo' | 'flow' | 'midjourney';
  targetModel?: string;
}

export type ExecutionPhase =
  | 'queued'
  | 'preparing'
  | 'reasoning'
  | 'processing_attachment'
  | 'reading_document'
  | 'analyzing_image'
  | 'searching_web'
  | 'reviewing_sources'
  | 'using_tool'
  | 'generating_image'
  | 'preparing_answer'
  | 'streaming'
  | 'complete'
  | 'stopped'
  | 'error';

export interface ExecutionActivityItem {
  id: string;
  type: ExecutionPhase;
  label: string;
  timestamp: number;
  details?: string;
  sourceCount?: number;
  status: 'active' | 'completed' | 'failed';
}

export interface ExecutionProgressData {
  phase: ExecutionPhase;
  startTime: number;
  endTime?: number;
  elapsedSeconds?: number;
  currentLabel: string;
  activities: ExecutionActivityItem[];
  sourceCount?: number;
  isComplete?: boolean;
  isStopped?: boolean;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number | string;
  attachments?: ChatAttachment[];
  model?: string;
  liked?: boolean | null;
  isStreaming?: boolean;
  toolStatus?: string;
  executionData?: ExecutionProgressData;
  isResearch?: boolean;
  error?: string;
  isReasoning?: boolean;
  reasoningContent?: string;
  reasoningDuration?: number;
  webSearch?: boolean;
  webSearchActive?: boolean;
  citations?: WebSearchCitation[];
  fallbackNotice?: string;
  generatedImage?: GeneratedImageData;
  promptData?: PromptBlockData;
  isPromptBlock?: boolean;
  promptType?: 'image' | 'video' | 'general' | 'flow' | 'sora' | 'veo' | 'midjourney';
  messageType?: 'text' | 'prompt' | 'code' | 'image' | 'file' | 'research' | 'error';
}

export interface CustomInstructions {
  aboutUser: string;
  responsePreferences: string;
  enabled: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  titleLocked?: boolean;
  icon?: string;
  iconCategory?: string;
  customIconLocked?: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model?: string;
  modelPreset?: string;
  reasoningLevel?: ReasoningLevel;
  isTemporary?: boolean;
  isArchived?: boolean;
}

export interface LibraryFile {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'prompt' | 'snippet';
  size: string;
  uploadedAt: string;
  content?: string;
  dataUrl?: string;
  description?: string;
  category?: string;
}

export interface ThemeConfig {
  mode: 'dark' | 'light' | 'system';
  accent: string;
  accentSecondary: string;
  bgImage?: string | null;
  bgOpacity: number;
  bgBlur: number;
  fontFamily: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  customThemeJson?: string | null;
  speechRate?: number;
  speechVoice?: string;
  autoReadSpeech?: boolean;
}

export type PersonalityPreset =
  | 'default'
  | 'professional'
  | 'friendly'
  | 'candid'
  | 'efficient'
  | 'creative'
  | 'academic';

export interface ResponseCharacteristics {
  warmth: 'reserved' | 'balanced' | 'warm';
  enthusiasm: 'measured' | 'balanced' | 'expressive';
  formatting: 'concise' | 'balanced' | 'detailed';
  emojiUsage: 'none' | 'minimal' | 'frequent';
}

export interface ChatBehaviorSettings {
  enterToSend: boolean;
  showTypingAnimation: boolean;
  autoScroll: boolean;
  confirmDelete: boolean;
  messageDensity: 'compact' | 'default' | 'spacious';
  showLineNumbers: boolean;
  showCopyButton: boolean;
  defaultModel: string;
  defaultReasoningLevel: ReasoningLevel;
}

export interface PersonalizationSettings {
  baseStyle: PersonalityPreset;
  customInstructions: CustomInstructions;
  responseCharacteristics: ResponseCharacteristics;
}

export interface VoiceSettings {
  speechVoice: string;
  voiceMode: 'standard' | 'live';
  language: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoReadSpeech: boolean;
}

export interface LanguageSettings {
  interfaceLanguage: string;
  responseLanguage: string;
  voiceLanguage: string;
  autoRtl: boolean;
}

export interface AccessibilitySettings {
  fontFamily: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  highVisibilityFocus: boolean;
  soundEffects: boolean;
  screenReaderOptimized: boolean;
}

export interface PresetThemeDefinition {
  id: string;
  name: string;
  description: string;
  mode: 'dark' | 'light';
  preview: {
    bg: string;
    sidebar: string;
    surface: string;
    accent: string;
    accentSecondary: string;
    border: string;
    text: string;
    glow: string;
  };
  styles: {
    appBg: string;
    bgPrimary: string;
    bgSecondary: string;
    sidebarBg: string;
    sidebarBgGlass: string;
    headerBg: string;
    headerBgGlass: string;
    surface: string;
    surfaceHover: string;
    surfaceSecondary: string;
    borderColor: string;
    inputBg: string;
    textColor: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentSecondary: string;
    glow: string;
  };
}

export interface WallpaperPresetDefinition {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  description: string;
}

export interface AppSettings {
  general: {
    mode: 'dark' | 'light' | 'system';
    themePresetId: string;
    accent: string;
    accentSecondary: string;
    language: string;
    fontSize: 'sm' | 'md' | 'lg' | 'xl';
    bgImage?: string | null;
    bgOpacity: number;
    bgBlur: number;
    bgDarkness: number;
    bgBrightness: number;
    bgPosition: 'center' | 'top' | 'bottom';
    fontFamily: string;
    defaultModel?: string;
    defaultReasoningLevel?: ReasoningLevel;
    customThemeJson?: string | null;
    chatBehavior: ChatBehaviorSettings;
  };
  personalization: PersonalizationSettings;
  chat: ChatBehaviorSettings;
  language: LanguageSettings;
  voice: VoiceSettings;
  accessibility: AccessibilitySettings;
}

export interface CustomThemeJson {
  name?: string;
  background?: string;
  surface?: string;
  surfaceSecondary?: string;
  text?: string;
  mutedText?: string;
  accent?: string;
  accentSecondary?: string;
  border?: string;
  radius?: string;
  fontFamily?: string;
  fontScale?: number;
}
