import { ThemeConfig, CustomThemeJson, PresetThemeDefinition, WallpaperPresetDefinition, AppSettings } from '../types';

export const PRESET_THEMES: PresetThemeDefinition[] = [
  {
    id: 'genzio-dark',
    name: 'Genzio Dark',
    description: 'The signature dark futuristic Genzio experience with electric cyan glow.',
    mode: 'dark',
    preview: {
      bg: '#07080c',
      sidebar: '#0b0d13',
      surface: '#12151f',
      accent: '#00f0ff',
      accentSecondary: '#ec4899',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#f1f5f9',
      glow: 'rgba(0, 240, 255, 0.35)',
    },
    styles: {
      appBg: '#07080c',
      bgPrimary: '#07080c',
      bgSecondary: '#0c0e14',
      sidebarBg: '#0b0d13',
      sidebarBgGlass: 'rgba(11, 13, 19, 0.8)',
      headerBg: 'rgba(11, 13, 19, 0.75)',
      headerBgGlass: 'rgba(11, 13, 19, 0.65)',
      surface: '#12151f',
      surfaceHover: '#171b28',
      surfaceSecondary: '#151824',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#0e111a',
      textColor: '#f1f5f9',
      textMuted: '#94a3b8',
      accent: '#00f0ff',
      accentHover: '#38bdf8',
      accentSecondary: '#ec4899',
      glow: '0 0 25px rgba(0, 240, 255, 0.25)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep cobalt night sky with crisp electric sapphire accents.',
    mode: 'dark',
    preview: {
      bg: '#080b16',
      sidebar: '#0c1020',
      surface: '#141a30',
      accent: '#3b82f6',
      accentSecondary: '#8b5cf6',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#f8fafc',
      glow: 'rgba(59, 130, 246, 0.35)',
    },
    styles: {
      appBg: '#080b16',
      bgPrimary: '#080b16',
      bgSecondary: '#0d1222',
      sidebarBg: '#0c1020',
      sidebarBgGlass: 'rgba(12, 16, 32, 0.8)',
      headerBg: 'rgba(12, 16, 32, 0.75)',
      headerBgGlass: 'rgba(12, 16, 32, 0.65)',
      surface: '#141a30',
      surfaceHover: '#1a223e',
      surfaceSecondary: '#161d36',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#101528',
      textColor: '#f8fafc',
      textMuted: '#94a3b8',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      accentSecondary: '#8b5cf6',
      glow: '0 0 25px rgba(59, 130, 246, 0.25)',
    },
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Astronomical void black paired with glowing interstellar violet and ultraviolet.',
    mode: 'dark',
    preview: {
      bg: '#050508',
      sidebar: '#08080e',
      surface: '#11111b',
      accent: '#6366f1',
      accentSecondary: '#a855f7',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#f1f5f9',
      glow: 'rgba(99, 102, 241, 0.35)',
    },
    styles: {
      appBg: '#050508',
      bgPrimary: '#050508',
      bgSecondary: '#0a0a10',
      sidebarBg: '#08080e',
      sidebarBgGlass: 'rgba(8, 8, 14, 0.8)',
      headerBg: 'rgba(8, 8, 14, 0.75)',
      headerBgGlass: 'rgba(8, 8, 14, 0.65)',
      surface: '#11111b',
      surfaceHover: '#161624',
      surfaceSecondary: '#131320',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#0d0d16',
      textColor: '#f1f5f9',
      textMuted: '#94a3b8',
      accent: '#6366f1',
      accentHover: '#818cf8',
      accentSecondary: '#a855f7',
      glow: '0 0 25px rgba(99, 102, 241, 0.25)',
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Mystic Nordic borealis hues with vibrant emerald and luminous teal radiance.',
    mode: 'dark',
    preview: {
      bg: '#030c0b',
      sidebar: '#061210',
      surface: '#0a1d1a',
      accent: '#10b981',
      accentSecondary: '#06b6d4',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#ecfdf5',
      glow: 'rgba(16, 185, 129, 0.35)',
    },
    styles: {
      appBg: '#030c0b',
      bgPrimary: '#030c0b',
      bgSecondary: '#071513',
      sidebarBg: '#061210',
      sidebarBgGlass: 'rgba(6, 18, 16, 0.8)',
      headerBg: 'rgba(6, 18, 16, 0.75)',
      headerBgGlass: 'rgba(6, 18, 16, 0.65)',
      surface: '#0a1d1a',
      surfaceHover: '#0f2723',
      surfaceSecondary: '#0c221e',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#081715',
      textColor: '#ecfdf5',
      textMuted: '#6ee7b7',
      accent: '#10b981',
      accentHover: '#34d399',
      accentSecondary: '#06b6d4',
      glow: '0 0 25px rgba(16, 185, 129, 0.25)',
    },
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    description: 'Neon synthwave twilight drenched in electric amethyst and magenta.',
    mode: 'dark',
    preview: {
      bg: '#0a0713',
      sidebar: '#0e0a1b',
      surface: '#18122a',
      accent: '#a855f7',
      accentSecondary: '#ec4899',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#faf5ff',
      glow: 'rgba(168, 85, 247, 0.35)',
    },
    styles: {
      appBg: '#0a0713',
      bgPrimary: '#0a0713',
      bgSecondary: '#110d1f',
      sidebarBg: '#0e0a1b',
      sidebarBgGlass: 'rgba(14, 10, 27, 0.8)',
      headerBg: 'rgba(14, 10, 27, 0.75)',
      headerBgGlass: 'rgba(14, 10, 27, 0.65)',
      surface: '#18122a',
      surfaceHover: '#201838',
      surfaceSecondary: '#1b1430',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#130e23',
      textColor: '#faf5ff',
      textMuted: '#c084fc',
      accent: '#a855f7',
      accentHover: '#c084fc',
      accentSecondary: '#ec4899',
      glow: '0 0 25px rgba(168, 85, 247, 0.25)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Pelagic depths with bioluminescent azure and marine cyan accents.',
    mode: 'dark',
    preview: {
      bg: '#030e18',
      sidebar: '#051320',
      surface: '#091e32',
      accent: '#0284c7',
      accentSecondary: '#14b8a6',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#f0f9ff',
      glow: 'rgba(2, 132, 199, 0.35)',
    },
    styles: {
      appBg: '#030e18',
      bgPrimary: '#030e18',
      bgSecondary: '#061625',
      sidebarBg: '#051320',
      sidebarBgGlass: 'rgba(5, 19, 32, 0.8)',
      headerBg: 'rgba(5, 19, 32, 0.75)',
      headerBgGlass: 'rgba(5, 19, 32, 0.65)',
      surface: '#091e32',
      surfaceHover: '#0d2843',
      surfaceSecondary: '#0b223a',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#071828',
      textColor: '#f0f9ff',
      textMuted: '#7dd3fc',
      accent: '#0284c7',
      accentHover: '#38bdf8',
      accentSecondary: '#14b8a6',
      glow: '0 0 25px rgba(2, 132, 199, 0.25)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Dense coniferous woodland with moss green and luminous lime accents.',
    mode: 'dark',
    preview: {
      bg: '#040e07',
      sidebar: '#07140b',
      surface: '#0d2415',
      accent: '#22c55e',
      accentSecondary: '#84cc16',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#f0fdf4',
      glow: 'rgba(34, 197, 94, 0.35)',
    },
    styles: {
      appBg: '#040e07',
      bgPrimary: '#040e07',
      bgSecondary: '#08170d',
      sidebarBg: '#07140b',
      sidebarBgGlass: 'rgba(7, 20, 11, 0.8)',
      headerBg: 'rgba(7, 20, 11, 0.75)',
      headerBgGlass: 'rgba(7, 20, 11, 0.65)',
      surface: '#0d2415',
      surfaceHover: '#12301c',
      surfaceSecondary: '#0f2918',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#0a1c10',
      textColor: '#f0fdf4',
      textMuted: '#86efac',
      accent: '#22c55e',
      accentHover: '#4ade80',
      accentSecondary: '#84cc16',
      glow: '0 0 25px rgba(34, 197, 94, 0.25)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Golden hour twilight with warm crimson, fiery amber, and solar rose.',
    mode: 'dark',
    preview: {
      bg: '#110609',
      sidebar: '#17090d',
      surface: '#261017',
      accent: '#f43f5e',
      accentSecondary: '#f97316',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#fff1f2',
      glow: 'rgba(244, 63, 94, 0.35)',
    },
    styles: {
      appBg: '#110609',
      bgPrimary: '#110609',
      bgSecondary: '#1c0b0f',
      sidebarBg: '#17090d',
      sidebarBgGlass: 'rgba(23, 9, 13, 0.8)',
      headerBg: 'rgba(23, 9, 13, 0.75)',
      headerBgGlass: 'rgba(23, 9, 13, 0.65)',
      surface: '#261017',
      surfaceHover: '#331620',
      surfaceSecondary: '#2b121a',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      inputBg: '#1f0c13',
      textColor: '#fff1f2',
      textMuted: '#fda4af',
      accent: '#f43f5e',
      accentHover: '#fb7185',
      accentSecondary: '#f97316',
      glow: '0 0 25px rgba(244, 63, 94, 0.25)',
    },
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Bright, modern clean daylight theme with high readability and crisp contrast.',
    mode: 'light',
    preview: {
      bg: '#f6f8fb',
      sidebar: '#edf2f7',
      surface: '#ffffff',
      accent: '#0284c7',
      accentSecondary: '#6366f1',
      border: 'rgba(0, 0, 0, 0.06)',
      text: '#0f172a',
      glow: 'rgba(2, 132, 199, 0.15)',
    },
    styles: {
      appBg: '#f6f8fb',
      bgPrimary: '#f6f8fb',
      bgSecondary: '#ffffff',
      sidebarBg: '#edf2f7',
      sidebarBgGlass: 'rgba(237, 242, 247, 0.85)',
      headerBg: 'rgba(246, 248, 251, 0.85)',
      headerBgGlass: 'rgba(246, 248, 251, 0.75)',
      surface: '#ffffff',
      surfaceHover: '#f1f5f9',
      surfaceSecondary: '#e2e8f0',
      borderColor: 'rgba(0, 0, 0, 0.06)',
      inputBg: '#ffffff',
      textColor: '#0f172a',
      textMuted: '#64748b',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSecondary: '#6366f1',
      glow: '0 0 20px rgba(2, 132, 199, 0.12)',
    },
  },
  {
    id: 'pure-black',
    name: 'Pure Black / OLED',
    description: 'True pitch-black zero power OLED mode with ultra-high contrast monochrome lines.',
    mode: 'dark',
    preview: {
      bg: '#000000',
      sidebar: '#000000',
      surface: '#0a0a0a',
      accent: '#ffffff',
      accentSecondary: '#a1a1aa',
      border: 'rgba(255, 255, 255, 0.08)',
      text: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.25)',
    },
    styles: {
      appBg: '#000000',
      bgPrimary: '#000000',
      bgSecondary: '#040404',
      sidebarBg: '#050505',
      sidebarBgGlass: 'rgba(5, 5, 5, 0.85)',
      headerBg: 'rgba(0, 0, 0, 0.85)',
      headerBgGlass: 'rgba(0, 0, 0, 0.75)',
      surface: '#0a0a0a',
      surfaceHover: '#121212',
      surfaceSecondary: '#0d0d0d',
      borderColor: 'rgba(255, 255, 255, 0.06)',
      inputBg: '#040404',
      textColor: '#ffffff',
      textMuted: '#a1a1aa',
      accent: '#ffffff',
      accentHover: '#e4e4e7',
      accentSecondary: '#a1a1aa',
      glow: '0 0 20px rgba(255, 255, 255, 0.2)',
    },
  },
];

export const WALLPAPER_PRESETS: WallpaperPresetDefinition[] = [
  {
    id: 'cyber-nebula',
    name: 'Cyber Nebula',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=70&w=300&auto=format&fit=crop',
    description: 'Electric cosmic dust and interstellar cyan starfields.',
  },
  {
    id: 'cosmic-horizon',
    name: 'Cosmic Horizon',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=70&w=300&auto=format&fit=crop',
    description: 'Deep violet galactic core with brilliant stellar clusters.',
  },
  {
    id: 'dark-minimal',
    name: 'Dark Minimal',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=70&w=300&auto=format&fit=crop',
    description: 'Architectural shadows with curved fluid gradients.',
  },
  {
    id: 'aurora-glow',
    name: 'Aurora Borealis',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=70&w=300&auto=format&fit=crop',
    description: 'Luminescent waves of green and cyan atmospheric light.',
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyberpunk',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=70&w=300&auto=format&fit=crop',
    description: 'Futuristic city reflections in high-tech night rain.',
  },
  {
    id: 'oceanic-abyss',
    name: 'Oceanic Abyss',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=70&w=300&auto=format&fit=crop',
    description: 'Calm deep sea gradient with gentle underwater sun rays.',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=70&w=300&auto=format&fit=crop',
    description: 'Retro futuristic digital hardware and green phosphors.',
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=70&w=300&auto=format&fit=crop',
    description: 'Warm glowing amber horizon with radiant lens bokeh.',
  },
  {
    id: 'velvet-void',
    name: 'Velvet Void',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=70&w=300&auto=format&fit=crop',
    description: 'Smooth acrylic fluid waves in rich dark jewel tones.',
  },
  {
    id: 'starfield-geometry',
    name: 'Starfield Geometry',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=70&w=300&auto=format&fit=crop',
    description: 'Planetary satellite view with illuminated atmospheric limb.',
  },
];

export const ACCENT_PRESETS = [
  { id: 'cyan', name: 'Cyber Cyan', primary: '#00f0ff', secondary: '#ec4899' },
  { id: 'sapphire', name: 'Sapphire Blue', primary: '#3b82f6', secondary: '#8b5cf6' },
  { id: 'violet', name: 'Electric Violet', primary: '#a855f7', secondary: '#ec4899' },
  { id: 'emerald', name: 'Neon Emerald', primary: '#10b981', secondary: '#06b6d4' },
  { id: 'amber', name: 'Solar Amber', primary: '#f59e0b', secondary: '#ef4444' },
  { id: 'rose', name: 'Hot Rose', primary: '#f43f5e', secondary: '#f97316' },
  { id: 'monochrome', name: 'Monochrome', primary: '#ffffff', secondary: '#a1a1aa' },
];

export const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Default)', family: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech / Display)', family: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'Outfit', name: 'Outfit (Modern Geometric)', family: "'Outfit', system-ui, sans-serif" },
  { id: 'Inter', name: 'Inter (Clean Neutral)', family: "'Inter', system-ui, sans-serif" },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Developer)', family: "'JetBrains Mono', monospace" },
  { id: 'System', name: 'System Default Native', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: 'OpenDyslexic', name: 'OpenDyslexic / Legible Sans', family: "'Comic Sans MS', 'Trebuchet MS', system-ui, sans-serif" },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  accent: '#00f0ff',
  accentSecondary: '#ec4899',
  bgImage: null,
  bgOpacity: 0.2,
  bgBlur: 8,
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 'md',
  customThemeJson: null,
  speechRate: 1.0,
  speechVoice: '',
  autoReadSpeech: false,
};

const THEME_STORAGE_KEY = 'genzio_user_theme_v4';

// System Media Query Listener singleton
let systemThemeMediaQuery: MediaQueryList | null = null;

export function setupSystemThemeWatcher(onThemeChange: (isDark: boolean) => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  if (!systemThemeMediaQuery) {
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  const listener = (e: MediaQueryListEvent) => {
    onThemeChange(e.matches);
  };

  systemThemeMediaQuery.addEventListener('change', listener);
  return () => {
    systemThemeMediaQuery?.removeEventListener('change', listener);
  };
}

export function loadSavedTheme(): ThemeConfig {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('genzio_user_theme_v3');
    if (saved) {
      return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load theme settings:', e);
  }
  return DEFAULT_THEME_CONFIG;
}

export function saveTheme(config: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save theme settings:', e);
  }
}

/**
 * Applies all theme, accessibility, and preset styles to the HTML DOM.
 * Drives the centralized CSS variable system across the entire application.
 */
export function applyThemeToDOM(config: ThemeConfig, appSettings?: AppSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Determine Effective Dark/Light mode
  let isDark = true;
  if (config.mode === 'system') {
    isDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
  } else if (config.mode === 'light') {
    isDark = false;
  } else {
    isDark = true;
  }

  // Update classes for Tailwind dark: prefix
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light-theme');
  } else {
    root.classList.remove('dark');
    root.classList.add('light-theme');
  }

  // 2. Preset theme matching
  // If user selected 'light' mode explicitly but has a dark preset selected, fall back to minimal-light if needed
  let currentPresetId = appSettings?.general?.themePresetId || 'genzio-dark';
  if (!isDark && currentPresetId !== 'minimal-light') {
    // If in light mode, adopt minimal-light styles if current preset is purely dark
    const presetObj = PRESET_THEMES.find((p) => p.id === currentPresetId);
    if (presetObj?.mode === 'dark' && config.mode === 'light') {
      currentPresetId = 'minimal-light';
    }
  }

  const matchedPreset = PRESET_THEMES.find((p) => p.id === currentPresetId) || PRESET_THEMES[0];
  const styles = matchedPreset.styles;

  // 3. Centralized CSS Variables mapping
  root.style.setProperty('--bg-primary', styles.bgPrimary);
  root.style.setProperty('--bg-secondary', styles.bgSecondary);
  root.style.setProperty('--sidebar-bg', styles.sidebarBg);
  root.style.setProperty('--sidebar-bg-glass', styles.sidebarBgGlass);
  root.style.setProperty('--header-bg', styles.headerBg);
  root.style.setProperty('--header-bg-glass', styles.headerBgGlass);
  root.style.setProperty('--surface', styles.surface);
  root.style.setProperty('--surface-hover', styles.surfaceHover);
  root.style.setProperty('--surface-secondary', styles.surfaceSecondary);
  root.style.setProperty('--input-bg', styles.inputBg);
  root.style.setProperty('--border', styles.borderColor);
  root.style.setProperty('--border-color', styles.borderColor);
  root.style.setProperty('--text-primary', styles.textColor);
  root.style.setProperty('--text-secondary', styles.textMuted);
  root.style.setProperty('--text-color', styles.textColor);
  root.style.setProperty('--text-muted', styles.textMuted);

  // 4. Accent Overrides
  const activeAccent = config.accent || styles.accent;
  const activeAccentSecondary = config.accentSecondary || styles.accentSecondary;
  root.style.setProperty('--accent', activeAccent);
  root.style.setProperty('--accent-hover', styles.accentHover);
  root.style.setProperty('--accent-secondary', activeAccentSecondary);
  root.style.setProperty('--color-accent-primary', activeAccent);
  root.style.setProperty('--color-accent-secondary', activeAccentSecondary);
  root.style.setProperty('--accent-glow', styles.glow);

  // 5. Data theme attribute and theme-* classes
  root.dataset.theme = matchedPreset.id;
  PRESET_THEMES.forEach((p) => root.classList.remove(`theme-${p.id}`));
  root.classList.add(`theme-${matchedPreset.id}`);

  // 6. Wallpaper Active State
  const hasWallpaper = Boolean(appSettings?.general?.bgImage || config.bgImage);
  if (hasWallpaper) {
    root.classList.add('has-custom-wallpaper');
    root.style.setProperty('--wallpaper-active', '1');
  } else {
    root.classList.remove('has-custom-wallpaper');
    root.style.setProperty('--wallpaper-active', '0');
  }

  // 7. Typography Font Family
  const fontId = appSettings?.accessibility?.fontFamily || config.fontFamily || 'Plus Jakarta Sans';
  const selectedFont = FONT_OPTIONS.find((f) => f.id === fontId)?.family || fontId;
  root.style.setProperty('--font-sans', selectedFont);
  document.body.style.fontFamily = selectedFont;

  // 8. Font Scale
  const fontSize = appSettings?.accessibility?.fontSize || config.fontSize || 'md';
  let fontScale = '16px';
  if (fontSize === 'sm') fontScale = '14px';
  if (fontSize === 'md') fontScale = '16px';
  if (fontSize === 'lg') fontScale = '18px';
  if (fontSize === 'xl') fontScale = '20px';
  root.style.fontSize = fontScale;
  root.style.setProperty('--font-size-base', fontScale);

  // 9. Accessibility Toggles
  if (appSettings?.accessibility) {
    if (appSettings.accessibility.highContrast) {
      root.classList.add('genzio-high-contrast');
    } else {
      root.classList.remove('genzio-high-contrast');
    }

    if (appSettings.accessibility.reducedMotion) {
      root.classList.add('genzio-reduced-motion');
    } else {
      root.classList.remove('genzio-reduced-motion');
    }

    if (appSettings.accessibility.highVisibilityFocus) {
      root.classList.add('genzio-high-focus');
    } else {
      root.classList.remove('genzio-high-focus');
    }
  }

  // 10. RTL Direction support (Urdu & Arabic)
  const langCode = appSettings?.language?.interfaceLanguage || 'en-US';
  const isRtl =
    langCode.startsWith('ur') ||
    langCode.startsWith('ar') ||
    (appSettings?.language?.autoRtl && (langCode.startsWith('ur') || langCode.startsWith('ar')));
  if (isRtl) {
    root.setAttribute('dir', 'rtl');
  } else {
    root.setAttribute('dir', 'ltr');
  }

  // 11. Body base color updates
  document.body.style.backgroundColor = 'var(--bg-primary)';
  document.body.style.color = 'var(--text-primary)';

  // 12. Custom Theme JSON parsing (if supplied)
  if (config.customThemeJson) {
    try {
      const parsed: CustomThemeJson = JSON.parse(config.customThemeJson);
      if (parsed.background) root.style.setProperty('--bg-primary', parsed.background);
      if (parsed.surface) root.style.setProperty('--surface', parsed.surface);
      if (parsed.text) root.style.setProperty('--text-primary', parsed.text);
      if (parsed.accent) root.style.setProperty('--accent', parsed.accent);
      if (parsed.accentSecondary) root.style.setProperty('--accent-secondary', parsed.accentSecondary);
      if (parsed.border) root.style.setProperty('--border', parsed.border);
    } catch {
      // ignore
    }
  }
}

export function validateCustomThemeJson(jsonString: string): {
  isValid: boolean;
  error?: string;
  data?: CustomThemeJson;
} {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { isValid: false, error: 'Theme JSON must be an object with valid color key-value pairs.' };
    }

    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === 'string' &&
        (value.includes('<script') || value.includes('javascript:') || value.includes('url('))
      ) {
        return { isValid: false, error: `Invalid security property in key: ${key}` };
      }
    }

    return { isValid: true, data };
  } catch (err: any) {
    return { isValid: false, error: `JSON Parse Error: ${err.message}` };
  }
}
