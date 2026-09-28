import React, { useState, useEffect, useMemo, useRef } from 'react';

export const HERO_PHRASES: string[] = [
  'Ready to turn ideas into action',
  'Understanding what you need',
  'Designing smarter answers',
  'Connecting ideas that matter',
  'Turning questions into solutions',
  'Helping you think more clearly',
  'Building the answer around your goal',
  'Working through the details',
  'Finding the clearest path forward',
  'Making complex work feel simpler',
  'Ready when you are',
];

export interface AnimatedHeroTextProps {
  /** Optional custom phrases to rotate through */
  phrases?: string[];
  /** Typing speed in ms per character (55-70ms, default 62ms) */
  typingSpeed?: number;
  /** Visible duration for the full sentence before fading (default 7000ms) */
  holdDuration?: number;
  /** Duration of the soft fade out in ms (default 500ms) */
  fadeDuration?: number;
  /** Pause duration while faded out before typing next sentence (default 300ms) */
  blankDuration?: number;
  /** Extra container CSS classes */
  className?: string;
}

export const AnimatedHeroText: React.FC<AnimatedHeroTextProps> = ({
  phrases = HERO_PHRASES,
  typingSpeed = 62,
  holdDuration = 7000,
  fadeDuration = 500,
  blankDuration = 300,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'fading' | 'blank'>('typing');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const prevIndexRef = useRef(0);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  const currentSentence = useMemo(() => {
    if (!phrases || phrases.length === 0) return '';
    return phrases[currentIndex % phrases.length];
  }, [phrases, currentIndex]);

  // Helper to pick next sentence index without immediate repetition
  const getNextIndex = (current: number, total: number) => {
    if (total <= 1) return 0;
    // Sequential loop through the curated list
    return (current + 1) % total;
  };

  // State Machine for smooth, premium typewriter lifecycle:
  // typing -> holding (7s) -> fading (500ms) -> blank (300ms) -> typing next
  useEffect(() => {
    // If reduced motion is enabled, simply show full text with a calm 8-second cycle
    if (prefersReducedMotion) {
      setDisplayedCount(currentSentence.length);
      const timer = setTimeout(() => {
        setPhase('fading');
        setTimeout(() => {
          setCurrentIndex((prev) => getNextIndex(prev, phrases.length));
          setPhase('typing');
        }, fadeDuration);
      }, 7500);
      return () => clearTimeout(timer);
    }

    if (phase === 'typing') {
      if (displayedCount < currentSentence.length) {
        const timer = setTimeout(() => {
          setDisplayedCount((prev) => prev + 1);
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else {
        // Sentence fully typed; transition to 7-second hold
        setPhase('holding');
        return;
      }
    }

    if (phase === 'holding') {
      // Keep sentence visible for exactly 7 seconds
      const timer = setTimeout(() => {
        setPhase('fading');
      }, holdDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'fading') {
      // Softly fade out the complete sentence over 500ms
      const timer = setTimeout(() => {
        setPhase('blank');
      }, fadeDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'blank') {
      // Wait 300ms while blank before starting the next sentence
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = getNextIndex(prev, phrases.length);
          prevIndexRef.current = next;
          return next;
        });
        setDisplayedCount(0);
        setPhase('typing');
      }, blankDuration);
      return () => clearTimeout(timer);
    }
  }, [
    phase,
    displayedCount,
    currentSentence,
    phrases.length,
    typingSpeed,
    holdDuration,
    fadeDuration,
    blankDuration,
    prefersReducedMotion,
  ]);

  const visibleText = currentSentence.slice(0, displayedCount);
  const isFading = phase === 'fading' || phase === 'blank';

  return (
    <div
      className={`w-full max-w-[700px] mx-auto min-h-[56px] sm:min-h-[64px] flex items-center justify-center text-center select-none px-3 ${className}`}
      aria-live="polite"
      aria-label={currentSentence}
    >
      <h1
        className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-semibold text-[#f3f4f6] tracking-[-0.02em] leading-[1.25] text-center inline-flex items-center justify-center flex-wrap transition-opacity ease-in-out"
        style={{
          fontFamily: '"Inter", "Manrope", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          opacity: isFading ? 0 : 1,
          transitionDuration: `${fadeDuration}ms`,
        }}
      >
        <span>{visibleText}</span>

        {/* Elegant Thin Typewriter Cursor (Max 2px, subtle purple/blue glow, slow 900ms pulse) */}
        {!prefersReducedMotion && (
          <span
            className="inline-block w-[2px] h-[0.95em] ml-1.5 align-middle rounded-full bg-indigo-300"
            style={{
              boxShadow: '0 0 8px rgba(165, 180, 252, 0.65), 0 0 14px rgba(129, 140, 248, 0.35)',
              animation: 'heroCursorBlink 900ms ease-in-out infinite',
            }}
            aria-hidden="true"
          />
        )}
      </h1>
    </div>
  );
};
