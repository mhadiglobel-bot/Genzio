import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Sun,
  Moon,
  Laptop,
  Check,
  Play,
  Square,
  Mic,
  MicOff,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Info,
  AlertCircle,
  FileText,
  Palette,
  MessageSquare,
  Languages,
  Eye,
  Keyboard,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Maximize2,
  VolumeX,
} from 'lucide-react';
import {
  AppSettings,
  ChatSession,
  LibraryFile,
  ThemeConfig,
  PersonalityPreset,
  ReasoningLevel,
} from '../../types';
import {
  PRESET_THEMES,
  WALLPAPER_PRESETS,
  ACCENT_PRESETS,
  FONT_OPTIONS,
  DEFAULT_THEME_CONFIG,
  applyThemeToDOM,
} from '../../services/themeService';
import { storageService, StorageUsageBreakdown } from '../../services/storageService';

export type SettingsCategory =
  | 'general'
  | 'personalization'
  | 'chat'
  | 'language'
  | 'voice'
  | 'accessibility';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (newSettings: AppSettings) => void;
  chats: ChatSession[];
  libraryFiles?: LibraryFile[];
  onClearAllChats: () => void;
  onClearCustomInstructions?: () => void;
  onClearLibraryFiles?: () => void;
  onImportChats?: (imported: ChatSession[]) => void;
  initialCategory?: SettingsCategory;
  themeConfig?: ThemeConfig;
  onUpdateTheme?: (newConfig: ThemeConfig) => void;
}

// Interface Language Definitions & UI Translations
const INTERFACE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', native: 'English', dir: 'ltr' },
  { code: 'en-GB', label: 'English (UK)', native: 'English (UK)', dir: 'ltr' },
  { code: 'es-ES', label: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'fr-FR', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'de-DE', label: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'ja-JP', label: 'Japanese', native: '日本語', dir: 'ltr' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', native: '简体中文', dir: 'ltr' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', native: 'Português', dir: 'ltr' },
  { code: 'it-IT', label: 'Italian', native: 'Italiano', dir: 'ltr' },
  { code: 'ur-PK', label: 'Urdu', native: 'اردو', dir: 'rtl' },
  { code: 'ar-SA', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
];

const RESPONSE_LANGUAGES = [
  { code: 'auto', label: 'Auto-detect / Match Prompt (Recommended)' },
  { code: 'en', label: 'Always English' },
  { code: 'es', label: 'Always Spanish (Español)' },
  { code: 'fr', label: 'Always French (Français)' },
  { code: 'de', label: 'Always German (Deutsch)' },
  { code: 'ja', label: 'Always Japanese (日本語)' },
  { code: 'zh', label: 'Always Chinese (中文)' },
  { code: 'ur', label: 'Always Urdu (اردو)' },
  { code: 'ar', label: 'Always Arabic (العربية)' },
  { code: 'hi', label: 'Always Hindi (हिन्दी)' },
];

const VOICE_INPUT_LANGUAGES = [
  { code: 'en-US', label: 'English (United States)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'fr-FR', label: 'Français (France)' },
  { code: 'de-DE', label: 'Deutsch (Deutschland)' },
  { code: 'ja-JP', label: '日本語 (日本)' },
  { code: 'zh-CN', label: '中文 (普通话 - 中国)' },
  { code: 'ur-PK', label: 'اردو (پاکستان)' },
  { code: 'ar-SA', label: 'العربية (المملكة العربية السعودية)' },
  { code: 'hi-IN', label: 'हिन्दी (भारत)' },
];

const PERSONALITY_PRESETS_LIST: {
  id: PersonalityPreset;
  title: string;
  desc: string;
}[] = [
  {
    id: 'default',
    title: 'Default Genzio',
    desc: 'Balanced, articulate, and futuristic Genzio intelligence.',
  },
  {
    id: 'professional',
    title: 'Professional',
    desc: 'Formal, authoritative, highly structured, objective, and enterprise-grade.',
  },
  {
    id: 'friendly',
    title: 'Friendly',
    desc: 'Warm, welcoming, encouraging, empathetic, and conversational tone.',
  },
  {
    id: 'candid',
    title: 'Candid',
    desc: 'Direct, straightforward, pragmatic, and brutally honest with zero fluff.',
  },
  {
    id: 'efficient',
    title: 'Efficient',
    desc: 'Telegraphic, ultra-concise, rapid-fire bullet points, maximum density.',
  },
  {
    id: 'creative',
    title: 'Creative',
    desc: 'Expressive, narrative-rich, dynamic metaphors, and inventive thought.',
  },
  {
    id: 'academic',
    title: 'Academic',
    desc: 'Scholarly, citation-ready, comprehensive analysis with formal rigor.',
  },
];

const AI_MODELS_LIST = [
  { id: 'Genzio Advanced', name: 'Genzio Advanced (Fast & Versatile)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra-Low Latency)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Multimodal Context)' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Coding & Writing)' },
  { id: 'gpt-4o', name: 'GPT-4o (Omni Reasoning)' },
  { id: 'deepseek-r1', name: 'DeepSeek R1 (Math & Formal Logic)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  onUpdateAppSettings,
  chats,
  libraryFiles = [],
  onClearAllChats,
  onClearCustomInstructions,
  onImportChats,
  initialCategory = 'general',
  themeConfig,
  onUpdateTheme,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCategory);
  const [mobileDrilldownOpen, setMobileDrilldownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage breakdown state
  const [storageStats, setStorageStats] = useState<StorageUsageBreakdown>(() =>
    storageService.getStorageUsageBreakdown()
  );

  // Confirmation modals
  const [confirmClearChats, setConfirmClearChats] = useState(false);
  const [confirmClearInstructions, setConfirmClearInstructions] = useState(false);

  // Wallpaper upload ref
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);

  // Voice synthesis & recognition test states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);
  const [micStatus, setMicStatus] = useState<'idle' | 'checking' | 'active' | 'denied'>('idle');
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check speech recognition capability
  const isSpeechRecognitionSupported = useMemo(() => {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync active category with initialCategory when opened
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Recalculate storage stats when modal opens or chats change
  useEffect(() => {
    if (isOpen) {
      setStorageStats(storageService.getStorageUsageBreakdown());
    }
  }, [isOpen, chats.length, libraryFiles.length]);

  // Load available system TTS voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop Mic test cleanup
  const stopMicTest = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicStatus('idle');
    setMicAudioLevel(0);
  }, []);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopMicTest();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingTestVoice(false);
      setMobileDrilldownOpen(false);
    }
  }, [isOpen, stopMicTest]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (mobileDrilldownOpen) {
          setMobileDrilldownOpen(false);
        } else {
          stopMicTest();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mobileDrilldownOpen, onClose, stopMicTest]);

  // Master helper to update any portion of AppSettings
  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      const next = updater(appSettings);
      onUpdateAppSettings(next);
      storageService.saveAppSettings(next);

      // DOM Theme & CSS application
      const currentThemeConfig: ThemeConfig = {
        mode: next.general.mode,
        accent: next.general.accent,
        accentSecondary: next.general.accentSecondary,
        bgImage: next.general.bgImage,
        bgOpacity: next.general.bgOpacity,
        bgBlur: next.general.bgBlur,
        fontFamily: next.accessibility.fontFamily || next.general.fontFamily,
        fontSize: next.accessibility.fontSize || next.general.fontSize,
        customThemeJson: next.general.customThemeJson,
        speechRate: next.voice.speechRate,
        speechVoice: next.voice.speechVoice,
        autoReadSpeech: next.voice.autoReadSpeech,
      };

      if (onUpdateTheme) {
        onUpdateTheme(currentThemeConfig);
      }
      applyThemeToDOM(currentThemeConfig, next);
    },
    [appSettings, onUpdateAppSettings, onUpdateTheme]
  );

  // --- Voice Testing ---
  const handleTestVoiceToggle = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingTestVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingTestVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const testPhrase =
      appSettings.language.interfaceLanguage.startsWith('es')
        ? 'Hola, soy Genzio. Tu asistente de inteligencia artificial está listo.'
        : appSettings.language.interfaceLanguage.startsWith('fr')
        ? 'Bonjour, je suis Genzio. Votre système d’intelligence artificielle est actif.'
        : appSettings.language.interfaceLanguage.startsWith('de')
        ? 'Hallo, ich bin Genzio. Ihre künstliche Intelligenz ist bereit.'
        : appSettings.language.interfaceLanguage.startsWith('ur')
        ? 'ہیلو، میں جینزیو ہوں۔ آپ کا مصنوعی ذہانت کا معاون تیار ہے۔'
        : appSettings.language.interfaceLanguage.startsWith('ar')
        ? 'مرحباً، أنا جينزيو. مساعد الذكاء الاصطناعي جاهز لخدمتك.'
        : 'Hello, I am Genzio. Your futuristic intelligence workspace is configured and ready.';

    const utterance = new SpeechSynthesisUtterance(testPhrase);
    utterance.rate = appSettings.voice.speechRate;
    utterance.pitch = appSettings.voice.speechPitch;
    utterance.volume = appSettings.voice.speechVolume;

    if (appSettings.voice.speechVoice) {
      const match = availableVoices.find((v) => v.name === appSettings.voice.speechVoice);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => setIsPlayingTestVoice(false);
    utterance.onerror = () => setIsPlayingTestVoice(false);

    setIsPlayingTestVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  // --- Mic Level Testing ---
  const handleToggleMicTest = async () => {
    if (micStatus === 'active') {
      stopMicTest();
      showToast('Microphone test ended.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone access is not supported in this browser environment.');
      return;
    }

    try {
      setMicStatus('checking');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
      setMicStatus('active');
      showToast('Microphone active. Speak to test audio levels.');
    } catch (err) {
      console.warn('Mic access error:', err);
      setMicStatus('denied');
      showToast('Microphone permission denied or unavailable.');
    }
  };

  // --- Background Wallpaper Handlers ---
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image file too large (max 8MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateSettings((prev) => ({
          ...prev,
          general: { ...prev.general, bgImage: dataUrl },
        }));
        showToast('Custom wallpaper applied.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetWallpaper = () => {
    updateSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        bgImage: null,
        bgOpacity: 0.2,
        bgBlur: 8,
        bgDarkness: 30,
        bgBrightness: 100,
      },
    }));
    showToast('Wallpaper reset to default.');
  };

  if (!isOpen) return null;

  const currentPreset =
    PRESET_THEMES.find((t) => t.id === appSettings.general.themePresetId) || PRESET_THEMES[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Genzio Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 px-4 py-2.5 rounded-xl bg-[#1e2029] border border-cyan-500/40 text-slate-100 text-xs font-medium shadow-2xl flex items-center gap-2 animate-slideDown">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Settings Modal Card */}
      <div className="w-full h-full sm:h-[88vh] sm:max-h-[820px] sm:max-w-5xl bg-[#101217] sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        {/* ==================================================== */}
        {/* DESKTOP / TABLET: LEFT CATEGORY NAVIGATION (240px) */}
        {/* ==================================================== */}
        <aside className="hidden md:flex flex-col w-64 bg-[#0d0e13] border-r border-white/[0.08] shrink-0 p-3 justify-between">
          <div className="space-y-4">
            {/* Header Brand lockup */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Settings</h2>
                  <p className="text-[11px] text-slate-400">Genzio Intelligence</p>
                </div>
              </div>
            </div>

            {/* Category Navigation Items */}
            <nav className="space-y-1" aria-label="Settings Categories">
              {[
                {
                  id: 'general' as SettingsCategory,
                  label: 'General',
                  desc: 'Themes & Wallpapers',
                  icon: Palette,
                },
                {
                  id: 'personalization' as SettingsCategory,
                  label: 'Personalization',
                  desc: 'Custom instructions & tone',
                  icon: Sparkles,
                },
                {
                  id: 'chat' as SettingsCategory,
                  label: 'Chat',
                  desc: 'Behavior & models',
                  icon: MessageSquare,
                },
                {
                  id: 'language' as SettingsCategory,
                  label: 'Language',
                  desc: 'Interface, speech & RTL',
                  icon: Languages,
                },
                {
                  id: 'voice' as SettingsCategory,
                  label: 'Voice',
                  desc: 'Text-to-speech & mic',
                  icon: Volume2,
                },
                {
                  id: 'accessibility' as SettingsCategory,
                  label: 'Accessibility',
                  desc: 'Fonts, contrast & keys',
                  icon: Eye,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold tracking-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Footer */}
          <div className="p-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Theme:</span>
              <span className="text-slate-200 font-medium capitalize truncate max-w-[120px]">
                {currentPreset.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Storage:</span>
              <span className="text-cyan-400 font-medium">{storageStats.totalKb} KB</span>
            </div>
            <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, storageStats.quotaPercent)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ==================================================== */}
        {/* MOBILE TOP BAR OR MOBILE STACKED/DRILL-DOWN NAV */}
        {/* ==================================================== */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0d0e13] shrink-0">
          {mobileDrilldownOpen ? (
            <button
              type="button"
              onClick={() => setMobileDrilldownOpen(false)}
              className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Settings</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Settings</h2>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.05] cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Category Grid (when drill-down not active) */}
        {!mobileDrilldownOpen && (
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-2">
            {[
              {
                id: 'general' as SettingsCategory,
                label: 'General',
                desc: 'Appearance, 10 Themes & Wallpaper Controls',
                icon: Palette,
              },
              {
                id: 'personalization' as SettingsCategory,
                label: 'Personalization',
                desc: 'Custom Instructions, Personality Presets & Storage',
                icon: Sparkles,
              },
              {
                id: 'chat' as SettingsCategory,
                label: 'Chat',
                desc: 'Input Shortcuts, Default Models & Density',
                icon: MessageSquare,
              },
              {
                id: 'language' as SettingsCategory,
                label: 'Language',
                desc: 'Interface Display, AI Responses & RTL',
                icon: Languages,
              },
              {
                id: 'voice' as SettingsCategory,
                label: 'Voice',
                desc: 'Text-to-Speech Voices & Real Mic Test',
                icon: Volume2,
              },
              {
                id: 'accessibility' as SettingsCategory,
                label: 'Accessibility',
                desc: 'Fonts, Contrast, Motion & Keyboard Shortcuts',
                icon: Eye,
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setMobileDrilldownOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#16181f] border border-white/[0.08] text-left hover:border-cyan-500/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{cat.label}</div>
                      <div className="text-xs text-slate-400">{cat.desc}</div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-medium">›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ==================================================== */}
        {/* RIGHT PANEL: SCROLLABLE ACTIVE SETTINGS CONTENT */}
        {/* ==================================================== */}
        <section
          className={`flex-1 flex flex-col min-w-0 bg-[#12141a] overflow-hidden ${
            !mobileDrilldownOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Desktop Right Header */}
          <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#101217]/50">
            <div>
              <h3 className="text-base font-semibold text-white capitalize tracking-tight">
                {activeCategory} Settings
              </h3>
              <p className="text-xs text-slate-400">
                {activeCategory === 'general' && 'Themes, appearance mode, and canvas wallpapers.'}
                {activeCategory === 'personalization' && 'Tailor Genzio intelligence, custom instructions, and data.'}
                {activeCategory === 'chat' && 'Composer behavior, model defaults, and message density.'}
                {activeCategory === 'language' && 'Display language, AI output language, and RTL text direction.'}
                {activeCategory === 'voice' && 'Live text-to-speech engine and real microphone audio tester.'}
                {activeCategory === 'accessibility' && 'Typography scale, high contrast, and accessibility switches.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Category Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth focus:outline-none">
            {/* ============================================== */}
            {/* 1. GENERAL SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'general' && (
              <div className="space-y-8 animate-fadeIn">
                {/* 1A. APPEARANCE & THEME MODE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Appearance Mode</h4>
                      <p className="text-xs text-slate-400">
                        Choose Light, Dark, or System mode that dynamically tracks OS preferences.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            mode: 'dark',
                            themePresetId: 'genzio-dark',
                            accent: '#00f0ff',
                            accentSecondary: '#ec4899',
                            bgImage: null,
                            bgOpacity: 0.2,
                            bgBlur: 8,
                            bgDarkness: 30,
                            bgBrightness: 100,
                            fontFamily: 'Plus Jakarta Sans',
                            fontSize: 'md',
                            customThemeJson: null,
                          },
                          accessibility: {
                            ...prev.accessibility,
                            fontFamily: 'Plus Jakarta Sans',
                            fontSize: 'md',
                            highContrast: false,
                            reducedMotion: false,
                            highVisibilityFocus: false,
                          },
                        }));
                        showToast('Appearance restored to default.');
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 cursor-pointer transition-colors"
                      title="Reset all appearance options to defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reset Appearance</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', label: 'Dark', icon: Moon, desc: 'Signature deep dark space' },
                      { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp bright daylight' },
                      { id: 'system', label: 'System', icon: Laptop, desc: 'Syncs with OS automatically' },
                    ].map((modeOption) => {
                      const Icon = modeOption.icon;
                      const isSelected = appSettings.general.mode === modeOption.id;
                      return (
                        <button
                          key={modeOption.id}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              general: { ...prev.general, mode: modeOption.id as any },
                            }));
                            showToast(`Appearance mode set to ${modeOption.label}.`);
                          }}
                          className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-400/50 shadow-xs'
                              : 'bg-[#171922] border-white/[0.08] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? 'text-cyan-400' : 'text-slate-400'
                              }`}
                            />
                            {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{modeOption.label}</div>
                            <div className="text-[11px] text-slate-400 leading-tight">
                              {modeOption.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1B. BUILT-IN THEMES GALLERY (10 PRESETS) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Built-in Themes</h4>
                      <p className="text-xs text-slate-400">
                        10 professionally curated palettes altering background, surfaces, borders, and glows.
                      </p>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-medium">Live Preview</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {PRESET_THEMES.map((preset) => {
                      const isSelected = appSettings.general.themePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                themePresetId: preset.id,
                                accent: preset.styles.accent,
                                accentSecondary: preset.styles.accentSecondary,
                              },
                            }));
                            showToast(`Applied theme: ${preset.name}`);
                          }}
                          className={`group relative p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-md bg-[#161922]'
                              : 'border-white/[0.08] hover:border-white/25 bg-[#14161f]'
                          }`}
                        >
                          {/* Visual Theme Card Swatch Preview */}
                          <div
                            className="w-full h-16 rounded-lg relative overflow-hidden flex flex-col justify-between p-2 border border-white/10"
                            style={{ backgroundColor: preset.preview.bg }}
                          >
                            <div className="flex items-center justify-between">
                              {/* Sidebar miniature pill */}
                              <div
                                className="w-2.5 h-6 rounded-sm"
                                style={{ backgroundColor: preset.preview.sidebar }}
                              />
                              {/* Glowing accent circle */}
                              <div
                                className="w-3.5 h-3.5 rounded-full"
                                style={{
                                  backgroundColor: preset.preview.accent,
                                  boxShadow: preset.preview.glow,
                                }}
                              />
                            </div>
                            {/* Surface line */}
                            <div
                              className="h-2 rounded-xs w-3/4 opacity-80"
                              style={{ backgroundColor: preset.preview.surface }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">
                              {preset.name}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1C. ACCENT COLORS QUICK SELECTOR */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Accent Glow Hue</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {ACCENT_PRESETS.map((acc) => {
                      const isSelected = appSettings.general.accent === acc.primary;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                accent: acc.primary,
                                accentSecondary: acc.secondary,
                              },
                            }));
                            showToast(`Accent color updated to ${acc.name}.`);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'border-white/40 bg-white/10 text-white'
                              : 'border-white/[0.08] bg-[#161822] text-slate-300 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: acc.primary }}
                          />
                          <span>{acc.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1D. BACKGROUND / WALLPAPER THEMES GALLERY (10 PRESETS) */}
                <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Chat Background & Wallpapers</h4>
                      <p className="text-xs text-slate-400">
                        Select from 10 atmospheric presets or upload your own wallpaper image.
                      </p>
                    </div>
                    {appSettings.general.bgImage && (
                      <button
                        type="button"
                        onClick={handleResetWallpaper}
                        className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Remove Wallpaper
                      </button>
                    )}
                  </div>

                  {/* Wallpaper Thumbnail Gallery */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* None / Pure Surface option */}
                    <button
                      type="button"
                      onClick={handleResetWallpaper}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-2 cursor-pointer transition-all ${
                        !appSettings.general.bgImage
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : 'border-white/[0.08] bg-[#161822] hover:border-white/20'
                      }`}
                    >
                      <div className="w-full h-16 rounded-lg bg-[#0e1017] border border-white/10 flex items-center justify-center text-slate-400 text-xs font-medium">
                        None (Clean)
                      </div>
                      <span className="text-xs text-slate-300 truncate">Default Dark</span>
                    </button>

                    {/* 10 Visual Presets */}
                    {WALLPAPER_PRESETS.map((wp) => {
                      const isSelected = appSettings.general.bgImage === wp.url;
                      return (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              general: { ...prev.general, bgImage: wp.url },
                            }));
                            showToast(`Wallpaper applied: ${wp.name}`);
                          }}
                          className={`group p-2 rounded-xl border text-left flex flex-col gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-[#181a24]'
                              : 'border-white/[0.08] bg-[#14161f] hover:border-white/25'
                          }`}
                        >
                          <div className="w-full h-16 rounded-lg overflow-hidden relative border border-white/10">
                            <img
                              src={wp.thumbnailUrl}
                              alt={wp.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center">
                                <Check className="w-5 h-5 text-cyan-300" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-white truncate">{wp.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Upload or Custom URL */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <input
                      ref={bgImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBgImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bgImageInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload Custom Image</span>
                    </button>

                    <div className="flex-1 min-w-[200px] flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste image URL (https://...)"
                        defaultValue={
                          appSettings.general.bgImage?.startsWith('http')
                            ? appSettings.general.bgImage
                            : ''
                        }
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== appSettings.general.bgImage) {
                            updateSettings((prev) => ({
                              ...prev,
                              general: { ...prev.general, bgImage: val },
                            }));
                            showToast('Custom wallpaper URL applied.');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#161822] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Wallpaper Fine-Tuning Sliders */}
                  {appSettings.general.bgImage && (
                    <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] space-y-4 mt-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span>Wallpaper Adjustments</span>
                        <span className="text-cyan-400 text-[11px]">Real-time DOM filters</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Opacity Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>Opacity</span>
                            <span className="font-mono text-cyan-400">
                              {Math.round(appSettings.general.bgOpacity * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={appSettings.general.bgOpacity}
                            onChange={(e) =>
                              updateSettings((prev) => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  bgOpacity: parseFloat(e.target.value),
                                },
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        {/* Blur Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>Blur</span>
                            <span className="font-mono text-cyan-400">
                              {appSettings.general.bgBlur}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="1"
                            value={appSettings.general.bgBlur}
                            onChange={(e) =>
                              updateSettings((prev) => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  bgBlur: parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        {/* Overlay Darkness Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>Overlay Darkness</span>
                            <span className="font-mono text-cyan-400">
                              {appSettings.general.bgDarkness}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={appSettings.general.bgDarkness}
                            onChange={(e) =>
                              updateSettings((prev) => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  bgDarkness: parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* 2. PERSONALIZATION SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'personalization' && (
              <div className="space-y-8 animate-fadeIn">
                {/* 2A. CUSTOM INSTRUCTIONS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Custom Instructions</h4>
                      <p className="text-xs text-slate-400">
                        Teach Genzio about you and specify exact formatting guidelines for every conversation.
                      </p>
                    </div>
                    {/* Toggle Enabled */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-slate-300">
                        {appSettings.personalization.customInstructions.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <input
                        type="checkbox"
                        checked={appSettings.personalization.customInstructions.enabled}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          updateSettings((prev) => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              customInstructions: {
                                ...prev.personalization.customInstructions,
                                enabled: nextVal,
                              },
                            },
                          }));
                          showToast(nextVal ? 'Custom instructions enabled.' : 'Custom instructions disabled.');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative" />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {/* Question 1 */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-200">
                        What should Genzio know about you to provide better responses?
                      </label>
                      <textarea
                        rows={3}
                        value={appSettings.personalization.customInstructions.aboutUser}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSettings((prev) => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              customInstructions: {
                                ...prev.personalization.customInstructions,
                                aboutUser: val,
                              },
                            },
                          }));
                        }}
                        placeholder="E.g., Software architect working in React, TypeScript, and high-performance frontend systems..."
                        className="w-full px-3 py-2 rounded-xl bg-[#161822] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>

                    {/* Question 2 */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-200">
                        How would you like Genzio to respond?
                      </label>
                      <textarea
                        rows={3}
                        value={appSettings.personalization.customInstructions.responsePreferences}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSettings((prev) => ({
                            ...prev,
                            personalization: {
                              ...prev.personalization,
                              customInstructions: {
                                ...prev.personalization.customInstructions,
                                responsePreferences: val,
                              },
                            },
                          }));
                        }}
                        placeholder="E.g., Be concise, direct, include code snippets first, and avoid pleasantries..."
                        className="w-full px-3 py-2 rounded-xl bg-[#161822] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>

                    {onClearCustomInstructions && (
                      <div className="flex justify-end pt-1">
                        {confirmClearInstructions ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-400">Clear custom text?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onClearCustomInstructions();
                                setConfirmClearInstructions(false);
                                showToast('Custom instructions cleared.');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-medium cursor-pointer"
                            >
                              Yes, Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmClearInstructions(false)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmClearInstructions(true)}
                            className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer"
                          >
                            Reset Instructions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2B. AI BASE STYLE / PERSONALITY PRESET */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Personality & Tone Style</h4>
                    <p className="text-xs text-slate-400">
                      Preset persona applied to new answers and system instructions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERSONALITY_PRESETS_LIST.map((style) => {
                      const isSelected = appSettings.personalization.baseStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              personalization: { ...prev.personalization, baseStyle: style.id },
                            }));
                            showToast(`Base personality changed to ${style.title}.`);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-400 text-white'
                              : 'bg-[#161822] border-white/[0.08] text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{style.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {style.desc}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2C. RESPONSE CHARACTERISTICS */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <h4 className="text-sm font-semibold text-white">Fine-grained Tone Characteristics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Warmth */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold text-white">Warmth</span>
                        <span className="capitalize text-cyan-400 font-mono">
                          {appSettings.personalization.responseCharacteristics.warmth}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101217] p-1 rounded-lg">
                        {(['reserved', 'balanced', 'warm'] as const).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() =>
                              updateSettings((prev) => ({
                                ...prev,
                                personalization: {
                                  ...prev.personalization,
                                  responseCharacteristics: {
                                    ...prev.personalization.responseCharacteristics,
                                    warmth: w,
                                  },
                                },
                              }))
                            }
                            className={`py-1 text-[11px] font-medium rounded capitalize cursor-pointer transition-colors ${
                              appSettings.personalization.responseCharacteristics.warmth === w
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enthusiasm */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold text-white">Enthusiasm</span>
                        <span className="capitalize text-cyan-400 font-mono">
                          {appSettings.personalization.responseCharacteristics.enthusiasm}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101217] p-1 rounded-lg">
                        {(['measured', 'balanced', 'expressive'] as const).map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() =>
                              updateSettings((prev) => ({
                                ...prev,
                                personalization: {
                                  ...prev.personalization,
                                  responseCharacteristics: {
                                    ...prev.personalization.responseCharacteristics,
                                    enthusiasm: e,
                                  },
                                },
                              }))
                            }
                            className={`py-1 text-[11px] font-medium rounded capitalize cursor-pointer transition-colors ${
                              appSettings.personalization.responseCharacteristics.enthusiasm === e
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formatting */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold text-white">Formatting Depth</span>
                        <span className="capitalize text-cyan-400 font-mono">
                          {appSettings.personalization.responseCharacteristics.formatting}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101217] p-1 rounded-lg">
                        {(['concise', 'balanced', 'detailed'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              updateSettings((prev) => ({
                                ...prev,
                                personalization: {
                                  ...prev.personalization,
                                  responseCharacteristics: {
                                    ...prev.personalization.responseCharacteristics,
                                    formatting: f,
                                  },
                                },
                              }))
                            }
                            className={`py-1 text-[11px] font-medium rounded capitalize cursor-pointer transition-colors ${
                              appSettings.personalization.responseCharacteristics.formatting === f
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emoji Usage */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold text-white">Emoji Usage</span>
                        <span className="capitalize text-cyan-400 font-mono">
                          {appSettings.personalization.responseCharacteristics.emojiUsage}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101217] p-1 rounded-lg">
                        {(['none', 'minimal', 'frequent'] as const).map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() =>
                              updateSettings((prev) => ({
                                ...prev,
                                personalization: {
                                  ...prev.personalization,
                                  responseCharacteristics: {
                                    ...prev.personalization.responseCharacteristics,
                                    emojiUsage: em,
                                  },
                                },
                              }))
                            }
                            className={`py-1 text-[11px] font-medium rounded capitalize cursor-pointer transition-colors ${
                              appSettings.personalization.responseCharacteristics.emojiUsage === em
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2D. DATA & STORAGE MANAGEMENT */}
                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Data & Storage Management</h4>
                    <p className="text-xs text-slate-400">
                      Export backup archives, import past chats, and inspect local storage utilization.
                    </p>
                  </div>

                  {/* Storage Usage Card */}
                  <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Local Browser Storage</span>
                      <span className="text-cyan-400 font-mono font-medium">
                        {storageStats.totalKb} KB used ({storageStats.quotaPercent}% of safe limit)
                      </span>
                    </div>
                    <div className="w-full bg-[#101217] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full"
                        style={{ width: `${Math.max(3, storageStats.quotaPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Chats: {chats.length} active sessions</span>
                      <span>Library: {libraryFiles.length} files</span>
                    </div>
                  </div>

                  {/* Action Buttons: Export JSON, Markdown, Plain Text, Import */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        storageService.exportAllAsJson(chats, libraryFiles);
                        showToast('Exported complete data archive (.json)');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export JSON Backup</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        storageService.exportAllAsMarkdown(chats);
                        showToast('Exported readable chat history (.md)');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-pink-400" />
                      <span>Export Markdown</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        storageService.exportAllAsPlainText(chats);
                        showToast('Exported plain text transcripts (.txt)');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                      <span>Export Plain Text</span>
                    </button>

                    <input
                      ref={backupImportRef}
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && onImportChats) {
                          try {
                            const res = await storageService.importFromJson(file);
                            if (res.chats && res.chats.length > 0) {
                              onImportChats(res.chats);
                              showToast(`Successfully imported ${res.chats.length} chat sessions.`);
                            } else {
                              showToast('No chat sessions found in backup.');
                            }
                          } catch (err: any) {
                            showToast(`Import error: ${err.message}`);
                          }
                        }
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => backupImportRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/10 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Import Backup (.json)</span>
                    </button>
                  </div>

                  {/* Danger Zone: Clear Chats */}
                  <div className="pt-2">
                    {confirmClearChats ? (
                      <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-red-200">Delete all chat history?</div>
                          <div className="text-[11px] text-red-300/80">
                            This permanently wipes all conversations from your device.
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClearAllChats();
                              setConfirmClearChats(false);
                              showToast('All chat history cleared.');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            Permanently Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearChats(false)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearChats(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-red-500/20 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All Conversations</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* 3. CHAT SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'chat' && (
              <div className="space-y-6 animate-fadeIn">
                {/* 3A. COMPOSER BEHAVIOR */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Composer & Sending Behavior</h4>

                  <div className="space-y-2.5">
                    {/* Enter to Send Toggle */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Send Shortcut</div>
                        <div className="text-[11px] text-slate-400">
                          {appSettings.chat.enterToSend
                            ? 'Press Enter to send (Shift+Enter for newline)'
                            : 'Press Ctrl/Cmd+Enter to send (Enter for newline)'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.chat.enterToSend}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              chat: { ...prev.chat, enterToSend: val },
                              general: {
                                ...prev.general,
                                chatBehavior: { ...prev.general.chatBehavior, enterToSend: val },
                              },
                            }));
                            showToast(val ? 'Enter sends message.' : 'Shift+Enter sends message.');
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>

                    {/* Auto-Scroll Toggle */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Sticky Auto-scroll</div>
                        <div className="text-[11px] text-slate-400">
                          Smoothly track the bottom of the conversation while AI responses stream in.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.chat.autoScroll}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              chat: { ...prev.chat, autoScroll: val },
                              general: {
                                ...prev.general,
                                chatBehavior: { ...prev.general.chatBehavior, autoScroll: val },
                              },
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>

                    {/* Confirm Delete Toggle */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          Confirm Before Deleting Conversations
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Show a confirmation dialog before deleting an individual chat session.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.chat.confirmDelete}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              chat: { ...prev.chat, confirmDelete: val },
                              general: {
                                ...prev.general,
                                chatBehavior: { ...prev.general.chatBehavior, confirmDelete: val },
                              },
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3B. DEFAULT MODEL & REASONING PREFERENCE */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <h4 className="text-sm font-semibold text-white">Default Model & Thinking Level</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Default Model Selector */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-1.5">
                      <label className="text-xs font-semibold text-white">Default AI Engine</label>
                      <select
                        value={appSettings.chat.defaultModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSettings((prev) => ({
                            ...prev,
                            chat: { ...prev.chat, defaultModel: val },
                            general: { ...prev.general, defaultModel: val },
                          }));
                          storageService.saveModelPreference(val);
                          showToast(`Default model set to ${val}.`);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#101217] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        {AI_MODELS_LIST.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Default Reasoning Level */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-1.5">
                      <label className="text-xs font-semibold text-white">
                        Default Reasoning / Thinking Level
                      </label>
                      <select
                        value={appSettings.chat.defaultReasoningLevel}
                        onChange={(e) => {
                          const val = e.target.value as ReasoningLevel;
                          updateSettings((prev) => ({
                            ...prev,
                            chat: { ...prev.chat, defaultReasoningLevel: val },
                            general: { ...prev.general, defaultReasoningLevel: val },
                          }));
                          storageService.saveReasoningLevel(val);
                          showToast(`Default reasoning level set to ${val}.`);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#101217] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
                      >
                        {(['low', 'medium', 'high', 'extra_high', 'max'] as ReasoningLevel[]).map((r) => (
                          <option key={r} value={r}>
                            {r.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3C. MESSAGE DENSITY & CODE BLOCKS */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <h4 className="text-sm font-semibold text-white">Visual Layout & Code Formatting</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Density */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2">
                      <div className="text-xs font-semibold text-white">Message Spacing Density</div>
                      <div className="grid grid-cols-3 gap-1 bg-[#101217] p-1 rounded-lg">
                        {(['compact', 'default', 'spacious'] as const).map((density) => (
                          <button
                            key={density}
                            type="button"
                            onClick={() => {
                              updateSettings((prev) => ({
                                ...prev,
                                chat: { ...prev.chat, messageDensity: density },
                              }));
                              showToast(`Spacing density: ${density}`);
                            }}
                            className={`py-1 text-[11px] font-medium rounded capitalize cursor-pointer transition-colors ${
                              appSettings.chat.messageDensity === density
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {density}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code Blocks */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Code Block Line Numbers</div>
                        <div className="text-[11px] text-slate-400">
                          Show line numbering inside syntax-highlighted code.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.chat.showLineNumbers}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              chat: { ...prev.chat, showLineNumbers: val },
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* 4. LANGUAGE SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'language' && (
              <div className="space-y-6 animate-fadeIn">
                {/* 4A. INTERFACE DISPLAY LANGUAGE */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Interface Display Language</h4>
                    <p className="text-xs text-slate-400">
                      Configures button text, menu titles, system notifications, and navigation labels.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {INTERFACE_LANGUAGES.map((lang) => {
                      const isSelected = appSettings.language.interfaceLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            updateSettings((prev) => ({
                              ...prev,
                              language: { ...prev.language, interfaceLanguage: lang.code },
                              general: { ...prev.general, language: lang.code },
                            }));
                            showToast(`Language set to ${lang.label}.`);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-xs'
                              : 'bg-[#161822] border-white/[0.08] text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{lang.native}</div>
                            <div className="text-[11px] text-slate-400">{lang.label}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4B. AI RESPONSE LANGUAGE */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">AI Response Language</h4>
                    <p className="text-xs text-slate-400">
                      Determine which language the AI answers in by default across all conversations.
                    </p>
                  </div>

                  <select
                    value={appSettings.language.responseLanguage}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSettings((prev) => ({
                        ...prev,
                        language: { ...prev.language, responseLanguage: val },
                      }));
                      showToast('AI response language preference updated.');
                    }}
                    className="w-full sm:w-80 px-3 py-2.5 rounded-xl bg-[#161822] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {RESPONSE_LANGUAGES.map((rl) => (
                      <option key={rl.code} value={rl.code}>
                        {rl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4C. VOICE INPUT (SPEECH-TO-TEXT) LANGUAGE & RTL */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Voice Recognition Input Language</h4>
                    <p className="text-xs text-slate-400">
                      The language used by your browser microphone for speech-to-text dictation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={appSettings.language.voiceLanguage}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSettings((prev) => ({
                          ...prev,
                          language: { ...prev.language, voiceLanguage: val },
                          voice: { ...prev.voice, language: val },
                        }));
                        showToast(`Voice recognition set to ${val}.`);
                      }}
                      className="w-full sm:w-80 px-3 py-2.5 rounded-xl bg-[#161822] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      {VOICE_INPUT_LANGUAGES.map((vl) => (
                        <option key={vl.code} value={vl.code}>
                          {vl.label}
                        </option>
                      ))}
                    </select>

                    {/* Web Speech API browser status indicator badge */}
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                        isSpeechRecognitionSupported
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSpeechRecognitionSupported ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {isSpeechRecognitionSupported
                          ? 'Browser Speech Recognition Available'
                          : 'Speech Recognition Not Supported in this browser'}
                      </span>
                    </div>
                  </div>

                  {/* Auto-RTL toggle */}
                  <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between mt-2">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Automatic RTL (Right-to-Left) Layout
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Automatically flips document orientation for Urdu and Arabic text.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.language.autoRtl}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateSettings((prev) => ({
                            ...prev,
                            language: { ...prev.language, autoRtl: val },
                          }));
                          showToast(val ? 'Automatic RTL enabled.' : 'Automatic RTL disabled.');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* 5. VOICE SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'voice' && (
              <div className="space-y-6 animate-fadeIn">
                {/* 5A. TEXT-TO-SPEECH (TTS) VOICES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Text-to-Speech Engine</h4>
                      <p className="text-xs text-slate-400">
                        Reads assistant replies aloud using real browser synthesis voices.
                      </p>
                    </div>

                    {/* Live Test Voice Button */}
                    <button
                      type="button"
                      onClick={handleTestVoiceToggle}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                        isPlayingTestVoice
                          ? 'bg-amber-500 text-black animate-pulse'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {isPlayingTestVoice ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-black" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>Test Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Voice Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      System TTS Voice ({availableVoices.length} detected)
                    </label>
                    <select
                      value={appSettings.voice.speechVoice}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSettings((prev) => ({
                          ...prev,
                          voice: { ...prev.voice, speechVoice: val },
                        }));
                        showToast('Voice updated.');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#161822] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Default System Natural Voice</option>
                      {availableVoices.map((v, i) => (
                        <option key={`${v.name}-${i}`} value={v.name}>
                          {v.name} ({v.lang}) {v.default ? '— Default' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate, Pitch, Volume Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#161822] border border-white/[0.08]">
                    {/* Speed / Rate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Speed (Rate)</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {appSettings.voice.speechRate.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={appSettings.voice.speechRate}
                        onChange={(e) =>
                          updateSettings((prev) => ({
                            ...prev,
                            voice: {
                              ...prev.voice,
                              speechRate: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Pitch */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Pitch</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {appSettings.voice.speechPitch.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={appSettings.voice.speechPitch}
                        onChange={(e) =>
                          updateSettings((prev) => ({
                            ...prev,
                            voice: {
                              ...prev.voice,
                              speechPitch: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Volume */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Volume</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {Math.round(appSettings.voice.speechVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={appSettings.voice.speechVolume}
                        onChange={(e) =>
                          updateSettings((prev) => ({
                            ...prev,
                            voice: {
                              ...prev.voice,
                              speechVolume: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Auto-Read Incoming Messages aloud */}
                  <div className="p-3.5 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-read Responses Aloud</div>
                      <div className="text-[11px] text-slate-400">
                        Automatically speak assistant responses as soon as streaming completes.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.voice.autoReadSpeech}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateSettings((prev) => ({
                            ...prev,
                            voice: { ...prev.voice, autoReadSpeech: val },
                          }));
                          showToast(val ? 'Auto-read enabled.' : 'Auto-read disabled.');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                    </label>
                  </div>
                </div>

                {/* 5B. REAL MICROPHONE HARDWARE TEST WITH LIVE AUDIO METER */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Hardware Microphone Test</h4>
                      <p className="text-xs text-slate-400">
                        Tests microphone input levels live using Web Audio API frequency analyzers.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleMicTest}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                        micStatus === 'active'
                          ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                          : 'bg-white/[0.08] hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      {micStatus === 'active' ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Mic Test</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Test Microphone</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real Live VU Audio Meter */}
                  <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Input Signal Level</span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          micAudioLevel > 60
                            ? 'text-red-400'
                            : micAudioLevel > 25
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {micStatus === 'active' ? `${micAudioLevel}%` : 'Standby'}
                      </span>
                    </div>

                    {/* Segmented VU Level Bar */}
                    <div className="w-full bg-[#101217] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 flex items-center gap-0.5">
                      {Array.from({ length: 24 }).map((_, idx) => {
                        const threshold = (idx + 1) * (100 / 24);
                        const isLit = micStatus === 'active' && micAudioLevel >= threshold;
                        const isHigh = idx >= 19;
                        const isMid = idx >= 12;

                        return (
                          <div
                            key={idx}
                            className={`flex-1 h-full rounded-xs transition-colors duration-75 ${
                              isLit
                                ? isHigh
                                  ? 'bg-rose-500'
                                  : isMid
                                  ? 'bg-amber-400'
                                  : 'bg-cyan-400'
                                : 'bg-white/[0.04]'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {micStatus === 'active'
                        ? 'Microphone is streaming audio frames. Green, amber, and red bars reflect your voice intensity.'
                        : 'Click "Test Microphone" to request browser permissions and check your recording level.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* 6. ACCESSIBILITY SETTINGS */}
            {/* ============================================== */}
            {activeCategory === 'accessibility' && (
              <div className="space-y-6 animate-fadeIn">
                {/* 6A. TYPOGRAPHY & FONT SCALE */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Typography & Sizing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Font Family */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-1.5">
                      <label className="text-xs font-semibold text-white">Font Family</label>
                      <select
                        value={appSettings.accessibility.fontFamily}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSettings((prev) => ({
                            ...prev,
                            accessibility: { ...prev.accessibility, fontFamily: val },
                            general: { ...prev.general, fontFamily: val },
                          }));
                          showToast(`Font family changed to ${val}.`);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#101217] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Scale */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] space-y-1.5">
                      <label className="text-xs font-semibold text-white">Font Scale</label>
                      <div className="grid grid-cols-4 gap-1 bg-[#101217] p-1 rounded-lg">
                        {[
                          { id: 'sm', label: 'Small' },
                          { id: 'md', label: 'Default' },
                          { id: 'lg', label: 'Large' },
                          { id: 'xl', label: 'XL' },
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => {
                              updateSettings((prev) => ({
                                ...prev,
                                accessibility: { ...prev.accessibility, fontSize: sz.id as any },
                                general: { ...prev.general, fontSize: sz.id as any },
                              }));
                              showToast(`Font size: ${sz.label}`);
                            }}
                            className={`py-1 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                              appSettings.accessibility.fontSize === sz.id
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6B. CONTRAST & MOTION ACCESSIBILITY SWITCHES */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <h4 className="text-sm font-semibold text-white">Visual Accessibility</h4>

                  <div className="space-y-2.5">
                    {/* High Contrast Mode */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">High Contrast Mode</div>
                        <div className="text-[11px] text-slate-400">
                          Increases border thickness and maximizes contrast ratios for enhanced legibility.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.accessibility.highContrast}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              accessibility: { ...prev.accessibility, highContrast: val },
                            }));
                            showToast(val ? 'High contrast enabled.' : 'High contrast disabled.');
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>

                    {/* Reduced Motion */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Reduce Motion</div>
                        <div className="text-[11px] text-slate-400">
                          Disables decorative keyframe animations, bouncing badges, and pulsing glows.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.accessibility.reducedMotion}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              accessibility: { ...prev.accessibility, reducedMotion: val },
                            }));
                            showToast(val ? 'Reduced motion enabled.' : 'Animations restored.');
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>

                    {/* High Visibility Focus Indicators */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          High Visibility Keyboard Focus Rings
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Renders prominent glowing cyan focus rings around interactive elements when using Tab key.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.accessibility.highVisibilityFocus}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              accessibility: { ...prev.accessibility, highVisibilityFocus: val },
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>

                    {/* Sound Effects */}
                    <div className="p-3 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Interface Audio Cues</div>
                        <div className="text-[11px] text-slate-400">
                          Subtle audible tones when sending messages and receiving responses.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.accessibility.soundEffects}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSettings((prev) => ({
                              ...prev,
                              accessibility: { ...prev.accessibility, soundEffects: val },
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252834] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 6C. COMPLETE KEYBOARD SHORTCUTS REFERENCE TABLE */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">Keyboard Navigation Shortcuts</h4>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#161822]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#101217] text-slate-400 border-b border-white/[0.06]">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Action</th>
                          <th className="px-4 py-2.5 font-medium text-right">Key Combination</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-200">
                        <tr>
                          <td className="px-4 py-2">Search all conversations</td>
                          <td className="px-4 py-2 text-right">
                            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">⌘ K</kbd> or <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">Ctrl K</kbd>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Start new conversation</td>
                          <td className="px-4 py-2 text-right">
                            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">⌘ N</kbd> or <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">Ctrl N</kbd>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Send message in composer</td>
                          <td className="px-4 py-2 text-right">
                            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">
                              {appSettings.chat.enterToSend ? 'Enter' : '⌘ Enter'}
                            </kbd>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Close active dialog or modal</td>
                          <td className="px-4 py-2 text-right">
                            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono">Esc</kbd>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Bottom Action Bar */}
          <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0d0e13] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Changes apply live & persist across browser sessions.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
