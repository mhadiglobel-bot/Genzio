import React, { useRef, useEffect } from 'react';

export type AnimatedGLogoSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'hero'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'display'
  | number;

export interface AnimatedGLogoProps {
  /** Responsive size preset or numeric pixel value */
  size?: AnimatedGLogoSize;
  /** Whether the AI is actively generating or thinking */
  isThinking?: boolean;
  /** Whether the logo has interactive hover effects */
  interactive?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional extra Tailwind / CSS classes */
  className?: string;
  /** Accessible label / title */
  title?: string;
  /** Show subtle ambient outer glow (default: true) */
  showGlow?: boolean;
  /** Whether to render accompanying brand text (default: false) */
  showText?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 20,
  small: 32,
  sm: 32,
  medium: 48,
  md: 48,
  large: 96,
  lg: 96,
  hero: 140,
  display: 140,
  xl: 60,
};

/**
 * AnimatedGLogo
 *
 * Official AI chatbot logo:
 * - Uses the official uploaded fluid-orb video as the primary logo asset
 * - Infinite seamless loop (never stops or pauses after 1 playback)
 * - Zero player controls, completely behaves as a clean visual logo
 * - Responsive sizes (xs, small, medium, large, hero)
 * - Soft ambient outer glow halo
 * - GPU-friendly, high performance
 */
export const AnimatedGLogo: React.FC<AnimatedGLogoProps> = ({
  size = 'medium',
  isThinking = false,
  interactive = false,
  onClick,
  className = '',
  title = 'GENZIO AI',
  showGlow = true,
  showText = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pixelSize = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 48);

  // Guarantee continuous, unbreakable looping and autoplay across all browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback if browser requires interaction
        });
      }
    };

    playVideo();

    // Re-trigger play when tab returns to foreground
    const handleVisibilityChange = () => {
      if (!document.hidden && video.paused) {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Adjust playback rate subtly when thinking/generating
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = isThinking ? 1.25 : 1.0;
    }
  }, [isThinking]);

  return (
    <div
      className={`relative inline-flex items-center gap-2.5 select-none shrink-0 ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
      role="img"
      aria-label={title}
      title={title}
    >
      {/* Outer Sized Frame */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        {showGlow && (
          <div
            className={`absolute -inset-1.5 sm:-inset-2 rounded-full pointer-events-none transition-all duration-700 ${
              isThinking ? 'opacity-65 scale-105' : 'opacity-40 group-hover:opacity-60'
            }`}
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(236,72,153,0.35) 0%, rgba(168,85,247,0.30) 45%, rgba(99,102,241,0.15) 70%, transparent 85%)',
              filter: `blur(${Math.max(4, pixelSize * 0.15)}px)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Circular Logo Container (Clipped & Antialiased) */}
        <div
          className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center select-none shadow-lg shadow-purple-950/20 bg-[#1e1526] transition-transform duration-300 ${
            interactive ? 'group-hover:scale-105' : ''
          }`}
          style={{
            WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          }}
        >
          {/* Looped Video Logo with NO controls */}
          <video
            ref={videoRef}
            src="/logo.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
            tabIndex={-1}
            aria-hidden="true"
            className="logo-video w-full h-full object-cover rounded-full pointer-events-none select-none block scale-[1.01]"
            onEnded={(e) => {
              // Redundant loop guarantee: restart immediately if reached end
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
            onPause={(e) => {
              // Ensure video resumes if paused while page is visible
              if (!document.hidden) {
                e.currentTarget.play().catch(() => {});
              }
            }}
          >
            <source src="/logo.mp4" type="video/mp4" />
            <source src="/assets/logo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Optional Companion Text */}
      {showText && (
        <div className="flex flex-col select-none">
          <span className="font-bold tracking-tight text-white font-sans text-sm sm:text-base leading-none">
            GENZIO
          </span>
          <span className="text-[10px] font-medium text-purple-300 tracking-wider uppercase leading-tight mt-0.5">
            AI Assistant
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimatedGLogo;
