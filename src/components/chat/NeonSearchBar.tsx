import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

export interface NeonSearchBarProps {
  /** Optional child elements (e.g. ChatComposer or custom input row) */
  children?: React.ReactNode;
  /** Extra container classes */
  className?: string;
  /** Whether the neon RGB animation is active (default true) */
  active?: boolean;
  /** Placeholder for standalone search mode */
  placeholder?: string;
  /** Value for standalone search mode */
  value?: string;
  /** Change handler for standalone search mode */
  onChange?: (val: string) => void;
  /** Submit handler for standalone search mode */
  onSubmit?: (val: string) => void;
  /** Intensity preset: subtle (default), medium, vibrant */
  intensity?: 'subtle' | 'medium' | 'vibrant';
  /** Whether the input inside is currently focused */
  isFocused?: boolean;
}

/**
 * NeonSearchBar
 *
 * Provides a premium animated neon RGB / rainbow gradient aura and border:
 * - Subtle animated rainbow gradient moving slowly across red, pink, purple, blue, cyan, green, yellow
 * - Soft ambient pulse / breathing glow that never strobes or flashes harshly
 * - Dark, clean inner surface ensuring 100% readability and contrast for text input
 * - Can wrap existing composer or be used standalone
 * - Fully respects prefers-reduced-motion
 */
export const NeonSearchBar: React.FC<NeonSearchBarProps> = ({
  children,
  className = '',
  active = true,
  placeholder = 'Ask anything or search workflows...',
  value = '',
  onChange,
  onSubmit,
  intensity = 'subtle',
  isFocused = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [internalFocused, setInternalFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  const focused = isFocused || internalFocused;

  // Aura opacity based on intensity and focus
  const auraOpacity = (() => {
    if (!active) return 'opacity-0';
    if (prefersReducedMotion) return focused ? 'opacity-30' : 'opacity-20';
    if (focused) {
      return intensity === 'vibrant' ? 'opacity-70' : intensity === 'medium' ? 'opacity-55' : 'opacity-45';
    }
    return intensity === 'vibrant' ? 'opacity-50' : intensity === 'medium' ? 'opacity-38' : 'opacity-28';
  })();

  const handleStandaloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = (onChange ? value : internalValue).trim();
    if (query && onSubmit) {
      onSubmit(query);
    }
  };

  return (
    <div
      className={`relative group w-full transition-all duration-300 ${className}`}
      data-component="NeonSearchBar"
    >
      {/* 1. Ambient Background Aura with Soft Breathing Rainbow Pulse */}
      {active && (
        <div
          className={`absolute -inset-1 sm:-inset-1.5 rounded-2xl sm:rounded-3xl pointer-events-none transition-all duration-700 ${auraOpacity}`}
          style={{
            background:
              'linear-gradient(115deg, #ff2d55, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55)',
            backgroundSize: '300% 300%',
            animation: prefersReducedMotion
              ? 'none'
              : 'neonRainbowShift 10s ease infinite, neonAmbientBreath 7s ease-in-out infinite',
            filter: 'blur(22px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. Precision Animated Rainbow Gradient Border */}
      <div
        className={`relative transition-all duration-300 rounded-2xl sm:rounded-3xl ${
          active ? 'p-[1.5px]' : 'p-0'
        }`}
        style={
          active
            ? {
                background:
                  'linear-gradient(115deg, #ff2d55, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55)',
                backgroundSize: '300% 300%',
                animation: prefersReducedMotion
                  ? 'none'
                  : 'neonRainbowShift 10s ease infinite',
                boxShadow: focused
                  ? '0 0 25px -4px rgba(168, 85, 247, 0.35), 0 0 15px -2px rgba(6, 182, 212, 0.25)'
                  : '0 0 16px -4px rgba(168, 85, 247, 0.18)',
              }
            : undefined
        }
      >
        {/* If children are provided, render directly inside the neon border frame */}
        {children ? (
          children
        ) : (
          /* Standalone Search Bar Mode */
          <form
            onSubmit={handleStandaloneSubmit}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.5rem-1.5px)] bg-[#181a1e]/98 backdrop-blur-xl"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={onChange ? value : internalValue}
              onChange={(e) => {
                if (onChange) onChange(e.target.value);
                else setInternalValue(e.target.value);
              }}
              onFocus={() => setInternalFocused(true)}
              onBlur={() => setInternalFocused(false)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-0 text-slate-100 text-sm sm:text-base placeholder:text-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white text-slate-300 hover:text-black transition-all cursor-pointer shrink-0"
              title="Search"
              aria-label="Search"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
